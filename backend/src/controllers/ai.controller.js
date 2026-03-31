import Conversation from "../models/conversation.model.js"
import Message from "../models/message.model.js"
import Notification from "../models/notification.model.js"
import User from "../models/user.model.js"
import { generateAIResponse } from "../services/ai.service.js"
import { isPromptSafe } from "../utils/promptFilter.js"
import { buildPrompt } from "../utils/promptBuilder.js"
import { getIO, getOnlineUsers } from "../config/socket.js"



// Controller to handle AI responses in a conversation
export const respondWithAI = async (req, res, next) => {
  try {
    const { conversationId } = req.params
    const { message } = req.body
    const userId = req.user._id.toString()

    if (!message || message.trim() === "") {
      return res.status(400).json({ success: false, message: "Message is required." })
    }

    if (!isPromptSafe(message)) {
      return res.status(400).json({ success: false, message: "Unsafe prompt detected." })
    }

    const conversation = await Conversation.findById(conversationId)
    if (!conversation) {
      return res.status(404).json({ success: false, message: "Conversation not found." })
    }

    const isParticipant = conversation.participants.some(p => p.toString() === userId)
    if (!isParticipant) {
      return res.status(403).json({ success: false, message: "You are not a participant of this conversation." })
    }

    const aiUser = await User.findOne({ email: process.env.AI_SYSTEM_EMAIL })
    if (!aiUser) {
      return res.status(500).json({ success: false, message: "AI system user not configured." })
    }

    const recentMessages = await Message.find({ conversation: conversationId, isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(15)
      .populate("sender", "name")
      .lean()

    const formattedMessages = recentMessages.reverse().map(msg => ({
      senderName: msg.sender?.name || "Unknown",
      content: msg.content || ""
    }))

    const prompt = buildPrompt({
      summary: conversation.aiSummary,
      recentMessages: formattedMessages,
      userMessage: message
    })

    const io = getIO()
    const onlineUsers = getOnlineUsers()

    io.to(conversationId).emit("ai-typing", { conversationId })
    const aiText = await generateAIResponse(prompt)
    io.to(conversationId).emit("ai-stop-typing", { conversationId })

    if (!aiText || !aiText.trim()) {
      return res.status(500).json({ success: false, message: "AI returned an empty response." })
    }

    // Get human participants (exclude AI itself)
    const humanParticipants = conversation.participants.filter(
      p => p.toString() !== aiUser._id.toString()
    )

    const aiMessage = await Message.create({
      conversation: conversationId,
      sender: aiUser._id,
      content: aiText,
      readBy: [aiUser._id],
      deliveredTo: [aiUser._id],
    })

    // Populate sender before emitting — frontend needs name + profilePic
    const populatedAiMessage = await Message.findById(aiMessage._id)
      .populate("sender", "name profilePic")

    // Update unread counts for all human participants
    humanParticipants.forEach(userId => {
      const id = userId.toString()
      conversation.unreadCounts.set(id, (conversation.unreadCounts.get(id) || 0) + 1)
    })

    conversation.lastMessage = aiMessage._id
    await conversation.save()

    // Create notifications for human participants
    if (humanParticipants.length > 0) {
      await Notification.insertMany(
        humanParticipants.map(uid => ({
          recipient: uid.toString(),
          sender: aiUser._id,
          type: "message",
          conversation: conversationId,
          message: aiMessage._id
        }))
      )
    }

    // Consider emitting a separate event for AI messages if frontend needs to handle them differently
    io.to(conversationId).emit("new-message", populatedAiMessage)

    for (const uid of humanParticipants) {
      const id = uid.toString()
      const userSockets = onlineUsers.get(id)
      if (userSockets?.size > 0) {
        userSockets.forEach(socketId => {
          io.to(socketId).emit("unread-update", {
            conversationId,
            unreadCount: conversation.unreadCounts.get(id)
          })
          io.to(socketId).emit("new-notification", {
            type: "message",
            conversationId,
            messageId: aiMessage._id
          })
        })
      }
    }

    res.status(200).json({ success: true, data: populatedAiMessage })

  } catch (error) {
    next(error)
  }
}