import fs from "fs"
import Message from "../models/message.model.js"
import Conversation from "../models/conversation.model.js"
import Notification from "../models/notification.model.js"
import { getIO, getOnlineUsers } from "../config/socket.js"
import { uploadMedia, deleteMedia } from "../services/cloudinary.service.js"

// Per-type size limits
const SIZE_LIMITS = { image: 5 * 1024 * 1024, audio: 15 * 1024 * 1024, video: 50 * 1024 * 1024 }
const SIZE_LABELS = { image: "5MB", audio: "15MB", video: "50MB" }

// Remove temp file safely after upload or on error
const cleanupFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath)
}


// Send Message Controller
export const sendMessage = async (req, res, next) => {
  try {
    const { conversationId, content } = req.body
    const senderId = req.user._id.toString()
    const file = req.file

    if (!conversationId) {
      return res.status(400).json({ success: false, message: "conversationId is required" })
    }

    if (!file && (!content || !content.trim())) {
      return res.status(400).json({ success: false, message: "Message must have text content or a media file" })
    }

    const conversation = await Conversation.findById(conversationId)

    if (!conversation) {
      cleanupFile(file?.path)
      return res.status(404).json({ success: false, message: "Conversation not found" })
    }

    if (!conversation.participants.some(p => p.toString() === senderId)) {
      cleanupFile(file?.path)
      return res.status(403).json({ success: false, message: "You are not part of this conversation" })
    }

    // Restore conversation if sender had soft-deleted it
    conversation.deletedFor = conversation.deletedFor.filter(id => id.toString() !== senderId)

    // Media handling
    let messageType = "text"
    let mediaData = null

    if (file) {
      const { mimetype, size } = file

      const mediaCategory = mimetype.startsWith("image/") ? "image"
                          : mimetype.startsWith("audio/") ? "audio"
                          : mimetype.startsWith("video/") ? "video"
                          : null

      if (!mediaCategory) {
        cleanupFile(file.path)
        return res.status(400).json({ success: false, message: "Unsupported file type" })
      }

      if (size > SIZE_LIMITS[mediaCategory]) {
        cleanupFile(file.path)
        return res.status(400).json({
          success: false,
          message: `${mediaCategory.charAt(0).toUpperCase() + mediaCategory.slice(1)} max size is ${SIZE_LABELS[mediaCategory]}`
        })
      }

      // uploadMedia internally cleans up the temp file after upload
      mediaData = await uploadMedia(file, senderId)

      messageType = mediaCategory === "image" ? "image"
                  : mediaCategory === "video" ? "video"
                  : (mediaData.duration && mediaData.duration <= 60) ? "voice" : "audio"
    }

    const message = await Message.create({
      conversation: conversationId,
      sender: senderId,
      content: messageType === "text" ? content.trim() : undefined,
      messageType,
      media: mediaData,
      readBy: [senderId],
      deliveredTo: [senderId]
    })

    // Increment unread count for every participant except sender
    const otherParticipants = conversation.participants.filter(p => p.toString() !== senderId)

    otherParticipants.forEach(userId => {
      const id = userId.toString()
      conversation.unreadCounts.set(id, (conversation.unreadCounts.get(id) || 0) + 1)
    })

    conversation.lastMessage = message._id
    await conversation.save()

    // Bulk create one notification per recipient
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

    const populatedMessage = await Message.findById(message._id).populate("sender", "name profilePic")

    // Socket events
    try {
      const io = getIO()
      const onlineUsers = getOnlineUsers()

      // Broadcast to everyone currently in the conversation room
      io.to(conversationId).emit("new-message", populatedMessage)

      const deliveredToIds = []

      for (const userId of otherParticipants) {
        const id = userId.toString()
        const userSockets = onlineUsers.get(id)

        if (userSockets?.size > 0) {
          deliveredToIds.push(id)

          // Push unread badge + notification to each of the user's active sockets
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

      // One bulk DB write for delivery tracking
      if (deliveredToIds.length > 0) {
        await Message.findByIdAndUpdate(
          message._id,
          { $addToSet: { deliveredTo: { $each: deliveredToIds } } }
        )
      }

      io.to(conversationId).emit("message-delivered", {
        messageId: message._id,
        deliveredTo: [...message.deliveredTo, ...deliveredToIds]
      })

    } catch (socketError) {
      // Socket failure must never kill the HTTP response
      console.error("Socket emission failed:", socketError.message)
    }

    return res.status(201).json({ success: true, message: populatedMessage })

  } catch (error) {
    cleanupFile(req.file?.path)
    next(error)
  }
}


// Get Messages Controller
export const getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params
    const { cursor, limit = 20 } = req.query
    const userId = req.user._id.toString()

    const conversation = await Conversation.findById(conversationId)

    if (!conversation) {
      return res.status(404).json({ success: false, message: "Conversation not found" })
    }

    if (!conversation.participants.some(p => p.toString() === userId)) {
      return res.status(403).json({ success: false, message: "You are not part of this conversation" })
    }

    const query = { conversation: conversationId }
    if (cursor) query.createdAt = { $lt: new Date(cursor) }

    const messages = await Message.find(query)
      .populate("sender", "name profilePic")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))

    const hasMore = messages.length === parseInt(limit)

    res.status(200).json({
      success: true,
      messages: messages.reverse(), // return in chronological order for UI
      nextCursor: hasMore ? messages[messages.length - 1].createdAt : null,
      hasMore
    })

  } catch (error) {
    next(error)
  }
}


// Edit Text Message Controller
export const editMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params
    const { newContent } = req.body
    const userId = req.user._id.toString()

    const message = await Message.findById(messageId)

    if (!message) return res.status(404).json({ success: false, message: "Message not found" })
    if (message.sender.toString() !== userId) return res.status(403).json({ success: false, message: "You can only edit your own message" })
    if (message.isDeleted) return res.status(400).json({ success: false, message: "Cannot edit deleted message" })
    if (message.messageType !== "text") return res.status(400).json({ success: false, message: "Only text messages can be edited" })
    if (!newContent?.trim()) return res.status(400).json({ success: false, message: "Edited content cannot be empty" })

    message.content  = newContent.trim()
    message.isEdited = true
    message.editedAt = new Date()
    await message.save()

    getIO().to(message.conversation.toString()).emit("message-edited", message)

    res.status(200).json({ success: true, message })

  } catch (error) {
    next(error)
  }
}


// Soft Delete Message Controller
export const deleteMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params
    const userId = req.user._id.toString()

    const message = await Message.findById(messageId)

    if (!message) return res.status(404).json({ success: false, message: "Message not found" })
    if (message.sender.toString() !== userId) return res.status(403).json({ success: false, message: "You can only delete your own message" })
    if (message.isDeleted) return res.status(400).json({ success: false, message: "Message already deleted" })

    // Remove media asset from Cloudinary before soft-deleting
    if (message.media?.publicId) {
      // Cloudinary uses "video" resource_type for audio and video files
      const resourceType = ["audio", "voice", "video"].includes(message.messageType) ? "video" : "auto"
      await deleteMedia(message.media.publicId, resourceType)
      message.media = null
    }

    message.content   = "This message was deleted"
    message.isDeleted = true
    message.deletedAt = new Date()
    await message.save()

    getIO().to(message.conversation.toString()).emit("message-deleted", message)

    res.status(200).json({ success: true, message: "Message deleted successfully" })

  } catch (error) {
    next(error)
  }
}