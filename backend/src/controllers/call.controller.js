import Call from "../models/call.model.js"
import Conversation from "../models/conversation.model.js"


// Get Call History for a Conversation
export const getCallHistory = async (req, res, next) => {
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

    const calls = await Call.find(query)
      .populate("initiator", "name profilePic")
      .populate("participants.user", "name profilePic")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))

    const hasMore = calls.length === parseInt(limit)

    return res.status(200).json({
      success: true,
      calls: calls.reverse(),
      nextCursor: hasMore ? calls[calls.length - 1].createdAt : null,
      hasMore
    })

  } catch (error) {
    next(error)
  }
}


// Get All Call History for Current User (across all conversations)
export const getMyCallHistory = async (req, res, next) => {
  try {
    const { cursor, limit = 20 } = req.query
    const userId = req.user._id.toString()

    const query = {
      $or: [
        { initiator: userId },
        { "participants.user": userId }
      ]
    }
    if (cursor) query.createdAt = { $lt: new Date(cursor) }

    const calls = await Call.find(query)
      .populate("initiator", "name profilePic")
      .populate("participants.user", "name profilePic")
      .populate("conversation", "type groupName participants")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))

    const hasMore = calls.length === parseInt(limit)

    return res.status(200).json({
      success: true,
      calls,
      nextCursor: hasMore ? calls[calls.length - 1].createdAt : null,
      hasMore
    })

  } catch (error) {
    next(error)
  }
}


// Get a Single Call by ID
export const getCallById = async (req, res, next) => {
  try {
    const { callId } = req.params
    const userId = req.user._id.toString()

    const call = await Call.findById(callId)
      .populate("initiator", "name profilePic")
      .populate("participants.user", "name profilePic")
      .populate("conversation", "type groupName")

    if (!call) {
      return res.status(404).json({ success: false, message: "Call not found" })
    }

    const isMember =
      call.initiator._id.toString() === userId ||
      call.participants.some(p => p.user._id.toString() === userId)

    if (!isMember) {
      return res.status(403).json({ success: false, message: "Not authorized" })
    }

    return res.status(200).json({ success: true, call })

  } catch (error) {
    next(error)
  }
}