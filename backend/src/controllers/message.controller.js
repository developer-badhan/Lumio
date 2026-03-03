import Message from "../models/message.model.js"
import Conversation from "../models/conversation.model.js"
import { getIO, getOnlineUsers } from "../config/socket.js"


// Message Sender Controller
export const sendMessage = async (req, res, next) => {
  try {
    const { conversationId, content, messageType } = req.body
    const senderId = req.user.id

    const conversation = await Conversation.findById(conversationId)
    conversation.deletedFor = []

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found"
      })
    }

    if (!conversation.participants.includes(senderId)) {
      return res.status(403).json({
        success: false,
        message: "You are not part of this conversation"
      })
    }

    const message = await Message.create({
      conversation: conversationId,
      sender: senderId,
      content,
      messageType
    })

    // Mark sender as read
    message.readBy.push(senderId)
    message.deliveredTo.push(senderId)
    await message.save()

    conversation.participants.forEach(userId => {
      const id = userId.toString()

      if (id !== senderId.toString()) {
        const current = conversation.unreadCounts.get(id) || 0
        conversation.unreadCounts.set(id, current + 1)
      }
    })

    conversation.lastMessage = message._id
    await conversation.save()

    const populatedMessage = await Message.findById(message._id)
      .populate("sender", "username profilePic")

    try {
      const io = getIO()
      const onlineUsers = getOnlineUsers()

      // Emit to conversation room
      io.to(conversationId).emit("new-message", message)

      // Delivery tracking
      for (const userId of conversation.participants) {
        const id = userId.toString()

        if (id !== senderId.toString()) {
          const userSockets = onlineUsers.get(id)

          if (userSockets) {
            // Mark delivered
            message.deliveredTo.push(id)

            userSockets.forEach(socketId => {
              io.to(socketId).emit("unread-update", {
                conversationId,
                unreadCount: conversation.unreadCounts.get(id)
              })
            })
          }
        }
      }
      await message.save()

      // Emit delivery update
      io.to(conversationId).emit("message-delivered", {
        messageId: message._id,
        deliveredTo: message.deliveredTo
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

    const query = {
      conversation: conversationId
    }

    // If cursor provided, fetch older messages
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
      messages: messages.reverse(), // send ascending for UI
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
