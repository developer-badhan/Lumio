import Conversation from "../models/conversation.model.js"
import Message from "../models/message.model.js"


// Create or Get Private Conversation Controller
export const getOrCreatePrivateConversation = async (req, res, next) => {
  try {
    const { receiverId } = req.body
    const senderId = req.user.id

    let conversation = await Conversation.findOne({
      type: "private",
      participants: { $all: [senderId, receiverId] },
      $expr: { $eq: [{ $size: "$participants" }, 2] }
    })

    if (!conversation) {
      conversation = await Conversation.create({
        type: "private",
        participants: [senderId, receiverId]
      })
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
    const { groupName, members } = req.body
    const adminId = req.user.id

    const conversation = await Conversation.create({
      type: "group",
      participants: [adminId, ...members],
      groupName,
      groupAdmin: adminId
    })

    res.status(201).json({
      success: true,
      conversation
    })

  } catch (error) {
    next(error)
  }
}


// Get User Conversations
export const getUserConversations = async (req, res, next) => {
  try {
    const userId = req.user.id

    const conversations = await Conversation.find({
      participants: userId
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