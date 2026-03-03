import fs from "fs"
import Message from "../models/message.model.js"
import Conversation from "../models/conversation.model.js"
import Notification from "../models/notification.model.js"
import { getIO, getOnlineUsers } from "../config/socket.js"
import { uploadMedia } from "../services/cloudinary.service.js"

// Per-type size limits
const SIZE_LIMITS = {
  image: 5  * 1024 * 1024,  // 5MB
  audio: 15 * 1024 * 1024,  // 15MB
  video: 50 * 1024 * 1024,  // 50MB
}

const SIZE_LABELS = {
  image: "5MB",
  audio: "15MB",
  video: "50MB",
}

// Safe temp file cleanup
const cleanupFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
  }
}

// Message Sender Controller
export const sendMessage = async (req, res, next) => {
  try {
    const { conversationId, content } = req.body
    const senderId = req.user.id
    const file = req.file

    // Fail fast — validate input before any DB call 
    if (!conversationId) {
      return res.status(400).json({
        success: false,
        message: "conversationId is required"
      })
    }

    if (!file && (!content || !content.trim())) {
      return res.status(400).json({
        success: false,
        message: "Message must have text content or a media file"
      })
    }

    // Fetch and validate conversation
    const conversation = await Conversation.findById(conversationId)

    if (!conversation) {
      cleanupFile(file?.path)
      return res.status(404).json({
        success: false,
        message: "Conversation not found"
      })
    }

    // Authorization — sender must be a participant
    const isParticipant = conversation.participants
      .some(p => p.toString() === senderId.toString())

    if (!isParticipant) {
      cleanupFile(file?.path)
      return res.status(403).json({
        success: false,
        message: "You are not part of this conversation"
      })
    }

    // Restore soft-deleted conversation for sender 
    conversation.deletedFor = conversation.deletedFor.filter(
      id => id.toString() !== senderId.toString()
    )

    // Media handling 
    let messageType = "text"
    let mediaData = null

    if (file) {
      const { mimetype, size } = file

      // Derive category once — reuse everywhere
      const mediaCategory = mimetype.startsWith("image/") ? "image"
                          : mimetype.startsWith("audio/") ? "audio"
                          : mimetype.startsWith("video/") ? "video"
                          : null

      // Second line of defense after middleware
      if (!mediaCategory) {
        cleanupFile(file.path)
        return res.status(400).json({
          success: false,
          message: "Unsupported file type"
        })
      }

      // Per-type size check — before Cloudinary upload
      if (size > SIZE_LIMITS[mediaCategory]) {
        cleanupFile(file.path)
        return res.status(400).json({
          success: false,
          message: `${mediaCategory.charAt(0).toUpperCase() + mediaCategory.slice(1)} max size is ${SIZE_LABELS[mediaCategory]}`
        })
      }

      // Upload — cloudinary.service internally calls unlinkSync after upload
      mediaData = await uploadMedia(file, senderId)

      // Determine message type
      if (mediaCategory === "image") {
        messageType = "image"
      } else if (mediaCategory === "audio") {
        // Voice = short audio ≤ 60s
        messageType = (mediaData.duration && mediaData.duration <= 60)
          ? "voice"
          : "audio"
      } else if (mediaCategory === "video") {
        messageType = "video"
      }
    }

    //  Create message 
    const message = await Message.create({
      conversation: conversationId,
      sender: senderId,
      content: messageType === "text" ? content.trim() : undefined,
      messageType,
      media: mediaData,
      readBy: [senderId],
      deliveredTo: [senderId]
    })

    // Update unread counts and lastMessage
    const otherParticipants = conversation.participants
      .filter(userId => userId.toString() !== senderId.toString())

    otherParticipants.forEach(userId => {
      const id = userId.toString()
      const current = conversation.unreadCounts.get(id) || 0
      conversation.unreadCounts.set(id, current + 1)
    })

    conversation.lastMessage = message._id
    await conversation.save()

    // Notifications — one bulk write, not N sequential writes 
    if (otherParticipants.length > 0) {
      await Notification.insertMany(
        otherParticipants.map(userId => ({
          recipient: userId.toString(),
          sender: senderId,
          type: "message",
          conversation: conversationId,
          message: message._id
        }))
      )
    }

    // Populate message for response and socket 
    const populatedMessage = await Message.findById(message._id)
      .populate("sender", "name profilePic")

    // Socket emission 
    try {
      const io = getIO()
      const onlineUsers = getOnlineUsers()

      // Broadcast new message to everyone in conversation room
      io.to(conversationId).emit("new-message", populatedMessage)

      // Per-user events + track who received delivery
      const deliveredToIds = []

      for (const userId of otherParticipants) {
        const id = userId.toString()
        const userSockets = onlineUsers.get(id)

        if (userSockets && userSockets.size > 0) {
          deliveredToIds.push(id)

          userSockets.forEach(socketId => {
            io.to(socketId).emit("unread-update", {
              conversationId,
              unreadCount: conversation.unreadCounts.get(id)
            })

            io.to(socketId).emit("new-notification", {
              type: "message",
              conversationId,
              messageId: message._id
            })
          })
        }
      }

      // One bulk $addToSet — not one write per user
      if (deliveredToIds.length > 0) {
        await Message.findByIdAndUpdate(
          message._id,
          { $addToSet: { deliveredTo: { $each: deliveredToIds } } }
        )
      }

      // Delivery confirmation — composed locally, no extra DB read
      io.to(conversationId).emit("message-delivered", {
        messageId: message._id,
        deliveredTo: [...message.deliveredTo, ...deliveredToIds]
      })

    } catch (socketError) {
      // Socket failure must never kill the HTTP response
      console.error("Socket emission failed:", socketError.message)
    }

    return res.status(201).json({
      success: true,
      message: populatedMessage
    })

  } catch (error) {
    // Catch-all: cleanup if uploadMedia threw before its own unlinkSync
    cleanupFile(req.file?.path)
    next(error)
  }
}


// Message Receiver Controller
export const getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params
    const { cursor, limit = 20 } = req.query
    const userId = req.user.id

    const conversation = await Conversation.findById(conversationId)

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found"
      })
    }

    // Ensure user is participant
    if (!conversation.participants.some(p => p.toString() === userId.toString())) {
      return res.status(403).json({
        success: false,
        message: "You are not part of this conversation"
      })
    }

    const query = {
      conversation: conversationId
    }

    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) }
    }

    const messages = await Message.find(query)
      .populate("sender", "name profilePic")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))

    const hasMore = messages.length === parseInt(limit)

    res.status(200).json({
      success: true,
      messages: messages.reverse(),
      nextCursor: hasMore ? messages[messages.length - 1].createdAt : null,
      hasMore
    })

  } catch (error) {
    next(error)
  }
}


// Message Editor Controller
export const editMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params
    const { newContent } = req.body
    const userId = req.user.id
    const message = await Message.findById(messageId)

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found"
      })
    }

    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only edit your own message"
      })
    }

    if (message.isDeleted) {
      return res.status(400).json({
        success: false,
        message: "Cannot edit deleted message"
      })
    }

    // Restrict editing to text messages only
    if (message.messageType !== "text") {
      return res.status(400).json({
        success: false,
        message: "Only text messages can be edited"
      })
    }

    if (!newContent || !newContent.trim()) {
      return res.status(400).json({
        success: false,
        message: "Edited content cannot be empty"
      })
    }

    message.content = newContent.trim()
    message.isEdited = true
    message.editedAt = new Date()

    await message.save()

    const io = getIO()
    io.to(message.conversation.toString()).emit("message-edited", message)

    res.status(200).json({
      success: true,
      message
    })

  } catch (error) {
    next(error)
  }
}


// Message Deletor Controller (Soft Delete)
export const deleteMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params
    const userId = req.user.id

    const message = await Message.findById(messageId)

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found"
      })
    }

    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own message"
      })
    }

    if (message.isDeleted) {
      return res.status(400).json({
        success: false,
        message: "Message already deleted"
      })
    }

    // Media cleanup 
    if (message.media && message.media.publicId) {
      let resourceType = "auto"

      if (message.messageType === "audio" || message.messageType === "voice" || message.messageType === "video") {
        resourceType = "video"
      }

      await deleteMedia(message.media.publicId, resourceType)

      // Clear media metadata after deletion
      message.media = null
    }

    // Soft delete
    message.content = "This message was deleted"
    message.isDeleted = true
    message.deletedAt = new Date()

    await message.save()

    const io = getIO()
    io.to(message.conversation.toString()).emit("message-deleted", message)

    res.status(200).json({
      success: true,
      message: "Message deleted successfully"
    })

  } catch (error) {
    next(error)
  }
}