import fs from "fs"
import Message from "../models/message.model.js"
import Conversation from "../models/conversation.model.js"
import Notification from "../models/notification.model.js"
import { getIO, getOnlineUsers } from "../config/socket.js"
import { uploadMedia } from "../services/cloudinary.service.js"


// Message Sender Controller
export const sendMessage = async (req, res, next) => {
  try {
    const { conversationId, content } = req.body
    const senderId = req.user.id
    const file = req.file

    const conversation = await Conversation.findById(conversationId)

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found"
      })
    }

    if (!conversation.participants.some(p => p.toString() === senderId.toString())) {
      return res.status(403).json({
        success: false,
        message: "You are not part of this conversation"
      })
    }

    // Restore soft-deleted conversation for sender
    conversation.deletedFor = conversation.deletedFor.filter(
      id => id.toString() !== senderId.toString()
    )

    let messageType = "text"
    let mediaData = null

    // Media handling part
    if (file) {
      const { mimetype, size } = file

      // Size validation
      if (mimetype.startsWith("image/") && size > 5 * 1024 * 1024) {
        fs.unlinkSync(file.path)
        return res.status(400).json({ success: false, message: "Image max size 5MB" })
      }

      if (mimetype.startsWith("audio/") && size > 15 * 1024 * 1024) {
        fs.unlinkSync(file.path)
        return res.status(400).json({ success: false, message: "Audio max size 15MB" })
      }

      if (mimetype.startsWith("video/") && size > 50 * 1024 * 1024) {
        fs.unlinkSync(file.path)
        return res.status(400).json({ success: false, message: "Video max size 50MB" })
      }

      mediaData = await uploadMedia(file, senderId)

      if (mimetype.startsWith("image/")) messageType = "image"
      else if (mimetype.startsWith("audio/")) messageType = "audio"
      else if (mimetype.startsWith("video/")) messageType = "video"

    } else {
      if (!content || !content.trim()) {
        return res.status(400).json({
          success: false,
          message: "Text message content required"
        })
      }
    }

    // Message creation 
    const message = await Message.create({
      conversation: conversationId,
      sender: senderId,
      content: messageType === "text" ? content : undefined,
      messageType,
      media: mediaData,
      readBy: [senderId],
      deliveredTo: [senderId]
    })

    // Unread count
    conversation.participants.forEach(userId => {
      const id = userId.toString()
      if (id !== senderId.toString()) {
        const current = conversation.unreadCounts.get(id) || 0
        conversation.unreadCounts.set(id, current + 1)
      }
    })

    conversation.lastMessage = message._id
    await conversation.save()

    // Notification part
    for (const userId of conversation.participants) {
      const id = userId.toString()
      if (id !== senderId.toString()) {
        await Notification.create({
          recipient: id,
          sender: senderId,
          type: "message",
          conversation: conversationId,
          message: message._id
        })
      }
    }

    const populatedMessage = await Message.findById(message._id)
      .populate("sender", "name profilePic")

    // Socket emission
    try {
      const io = getIO()
      const onlineUsers = getOnlineUsers()

      io.to(conversationId).emit("new-message", populatedMessage)

      for (const userId of conversation.participants) {
        const id = userId.toString()

        if (id !== senderId.toString()) {
          const userSockets = onlineUsers.get(id)

          if (userSockets && userSockets.size > 0) {
            await Message.findByIdAndUpdate(
              message._id,
              { $addToSet: { deliveredTo: id } }
            )

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
      }

      // Update the message
      const updatedMessage = await Message.findById(message._id)

      io.to(conversationId).emit("message-delivered", {
        messageId: message._id,
        deliveredTo: updatedMessage.deliveredTo
      })

    } catch (socketError) {
      console.error("Socket emission failed:", socketError.message)
    }

    res.status(201).json({
      success: true,
      message: populatedMessage
    })

  } catch (error) {
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

    message.content = newContent
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

    message.content = "This message was deleted"
    message.isDeleted = true
    message.deletedAt = new Date()

    await message.save()

    const io = getIO()
    io.to(message.conversation.toString()).emit("message-deleted", message)

    res.status(200).json({
      success: true,
      message: "Message deleted"
    })

  } catch (error) {
    next(error)
  }
}
