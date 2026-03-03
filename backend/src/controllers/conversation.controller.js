import Conversation from "../models/conversation.model.js"
import Message from "../models/message.model.js"
import { getIO } from "../config/socket.js"


// Create or Get Private Conversation Controller
export const getOrCreatePrivateConversation = async (req, res, next) => {
  try {
    const { receiverId } = req.body
    const senderId = req.user.id

    if (!receiverId) {
      return res.status(400).json({
        success: false,
        message: "Receiver ID is required"
      })
    }

    if (receiverId === senderId) {
      return res.status(400).json({
        success: false,
        message: "Cannot create conversation with yourself"
      })
    }

    let conversation = await Conversation.findOne({
      type: "private",
      participants: { $all: [senderId, receiverId] },
      $expr: { $eq: [{ $size: "$participants" }, 2] }
    })

    if (!conversation) {
      conversation = await Conversation.create({
        type: "private",
        participants: [senderId, receiverId],
        unreadCounts: {
          [senderId]: 0,
          [receiverId]: 0
        }
      })
    } else {
      // Restore if soft deleted for sender
      if (conversation.deletedFor.includes(senderId)) {
        conversation.deletedFor = conversation.deletedFor.filter(
          id => id.toString() !== senderId.toString()
        )
        await conversation.save()
      }
    }

    res.status(200).json({
      success: true,
      conversation
    })

  } catch (error) {
    next(error)
  }
}


// Create Group Conversation Controller
export const createGroupConversation = async (req, res, next) => {
  try {
    const { groupName, members = [] } = req.body
    const adminId = req.user.id

    if (!groupName || members.length < 1) {
      return res.status(400).json({
        success: false,
        message: "Group name and at least one member required"
      })
    }

    // Remove duplicates and ensure admin included
    const uniqueMembers = [...new Set([adminId, ...members])]

    const unreadCounts = {}
    uniqueMembers.forEach(id => {
      unreadCounts[id] = 0
    })

    const conversation = await Conversation.create({
      type: "group",
      participants: uniqueMembers,
      groupName,
      groupAdmin: adminId,
      unreadCounts
    })

    res.status(201).json({
      success: true,
      conversation
    })

  } catch (error) {
    next(error)
  }
}


// Get User Conversations Controller
export const getUserConversations = async (req, res, next) => {
  try {
    const userId = req.user.id

    const conversations = await Conversation.find({
      participants: userId,
      deletedFor: { $ne: userId }
    })
      .populate("participants", "name email profilePic isOnline")
      .populate("lastMessage")
      .sort({ updatedAt: -1 })

    res.status(200).json({
      success: true,
      conversations
    })

  } catch (error) {
    next(error)
  }
}


// Mark Conversation Read Controller
export const markConversationAsRead = async (req, res, next) => {
  try {
    const { conversationId } = req.params
    const userId = req.user.id

    const conversation = await Conversation.findById(conversationId)

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found"
      })
    }

    if (!conversation.participants.some(p => p.toString() === userId.toString())) {
      return res.status(403).json({
        success: false,
        message: "You are not part of this conversation"
      })
    }

    const currentUnread = conversation.unreadCounts.get(userId) || 0

    if (currentUnread > 0) {
      conversation.unreadCounts.set(userId, 0)
      await conversation.save()
    }

    await Message.updateMany(
      {
        conversation: conversationId,
        isDeleted: false,
        readBy: { $ne: userId }
      },
      {
        $addToSet: { readBy: userId }
      }
    )

    try {
      const io = getIO()

      io.to(conversationId).emit("message-read-update", {
        conversationId,
        userId
      })

    } catch (socketError) {
      console.error("Socket emission failed:", socketError.message)
    }

    res.status(200).json({
      success: true,
      message: "Conversation marked as read"
    })

  } catch (error) {
    next(error)
  }
}

// Conversation Soft Delete Controller
export const softDeleteConversation = async (req, res, next) => {
  try {
    const { conversationId } = req.params
    const userId = req.user.id

    const conversation = await Conversation.findById(conversationId)

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found"
      })
    }

    if (!conversation.participants.includes(userId)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized"
      })
    }

    if (!conversation.deletedFor.includes(userId)) {
      conversation.deletedFor.push(userId)
      await conversation.save()
    }

    res.status(200).json({
      success: true,
      message: "Conversation deleted for you"
    })

  } catch (error) {
    next(error)
  }
}

