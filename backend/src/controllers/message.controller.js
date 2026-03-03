import Message from "../models/message.model.js"
import Conversation from "../models/conversation.model.js"


// Message Sender Controller
export const sendMessage = async (req, res, next) => {
  try {
    const { conversationId, content, messageType } = req.body
    const senderId = req.user.id

    const message = await Message.create({
      conversation: conversationId,
      sender: senderId,
      content,
      messageType
    })

    message.readBy.push(senderId)
    await message.save()

    const conversation = await Conversation.findById(conversationId)

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found"
      })
    }

    conversation.participants.forEach(userId => {
      const id = userId.toString()

      if (id !== senderId.toString()) {
        const current = conversation.unreadCounts.get(id) || 0
        conversation.unreadCounts.set(id, current + 1)
      }
    })

    conversation.lastMessage = message._id

    await conversation.save()

    res.status(201).json({
      success: true,
      message
    })

  } catch (error) {
    next(error)
  }
}


// Message Receiver Controller
export const getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params

    const messages = await Message.find({
      conversation: conversationId
    })
      .populate("sender", "name profilePic")
      .sort({ createdAt: 1 })

    res.status(200).json({
      success: true,
      messages
    })

  } catch (error) {
    next(error)
  }
}