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

    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: message._id
    })

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