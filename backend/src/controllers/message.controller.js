import fs from "fs"
import User from "../models/user.model.js"
import Message from "../models/message.model.js"
import Conversation from "../models/conversation.model.js"
import Notification from "../models/notification.model.js"
import { getIO, getOnlineUsers } from "../config/socket.js"
import { uploadMedia, deleteMedia } from "../services/cloudinary.service.js"
import { generateAIResponse } from "../services/ai.service.js"      
import { buildPrompt } from "../utils/promptBuilder.js"              
import { isPromptSafe } from "../utils/promptFilter.js"              


// Media size limits (5MB for images, 15MB for audio, 50MB for video)
const SIZE_LIMITS = { image: 5 * 1024 * 1024, audio: 15 * 1024 * 1024, video: 50 * 1024 * 1024 }
const SIZE_LABELS = { image: "5MB", audio: "15MB", video: "50MB" }


// Helper to clean up uploaded file on validation failure or errors
const cleanupFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath)
}

// Fires an AI reply based on the user's message and conversation context
const triggerAIReply = async ({ conversation, userMessage, conversationId }) => {
  try {
    // Safety check on the user's message before passing to AI
    if (!userMessage || !isPromptSafe(userMessage)) return

    const io = getIO()
    const onlineUsers = getOnlineUsers()

    const aiUser = await User.findOne({ email: process.env.AI_SYSTEM_EMAIL })
    if (!aiUser) return

    // Build context from recent messages
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
      userMessage
    })

    // Signal typing to the room
    io.to(conversationId).emit("ai-typing", { conversationId })

    const aiText = await generateAIResponse(prompt)

    io.to(conversationId).emit("ai-stop-typing", { conversationId })

    if (!aiText || !aiText.trim()) return

    const aiMessage = await Message.create({
      conversation: conversationId,
      sender: aiUser._id,
      content: aiText,
      readBy: [aiUser._id],
      deliveredTo: [aiUser._id],
    })

    // Populate before emitting so frontend gets name + profilePic
    const populatedAiMessage = await Message.findById(aiMessage._id)
      .populate("sender", "name profilePic")

    // Update unread counts for all human participants
    const humanParticipants = conversation.participants.filter(
      p => p.toString() !== aiUser._id.toString()
    )

    humanParticipants.forEach(uid => {
      const id = uid.toString()
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

    // Emit new message + per-socket unread/notification events
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

  } catch (err) {
    // AI errors are non-fatal — don't crash the original message flow
    console.error("AI reply failed:", err.message)
  }
}

// Message Sending Controller
export const sendMessage = async (req, res, next) => {
  try {
    const { conversationId, content, replyTo } = req.body
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

    conversation.deletedFor = conversation.deletedFor.filter(id => id.toString() !== senderId)

    let messageType = "text"
    let mediaData = null

    if (file) {
      const { mimetype, size } = file

      const mediaCategory =
        mimetype.startsWith("image/") ? "image" :
        mimetype.startsWith("audio/") ? "audio" :
        mimetype.startsWith("video/") ? "video" :
        null

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

      mediaData = await uploadMedia(file, senderId)

      messageType =
        mediaCategory === "image" ? "image" :
        mediaCategory === "video" ? "video" :
        (mediaData.duration && mediaData.duration <= 60) ? "voice" : "audio"
    }

    const message = await Message.create({
      conversation: conversationId,
      sender: senderId,
      content: messageType === "text" ? content.trim() : undefined,
      messageType,
      media: mediaData,
      readBy: [senderId],
      deliveredTo: [senderId],
      replyTo: replyTo || null,
    })

    const otherParticipants = conversation.participants.filter(
      p => p.toString() !== senderId
    )

    // Block check (unchanged)
    if (otherParticipants.length > 0) {
      const blockedBySomeone = await User.exists({
        _id: { $in: otherParticipants },
        blockedUsers: senderId
      })

      if (blockedBySomeone) {
        await Message.findByIdAndDelete(message._id)

        if (mediaData?.publicId) {
          const resourceType = ["audio", "voice", "video"].includes(messageType) ? "video" : "image"
          await deleteMedia(mediaData.publicId, resourceType)
        }

        cleanupFile(file?.path)

        return res.status(403).json({ success: false, message: "You cannot send messages to this user" })
      }
    }

    otherParticipants.forEach(userId => {
      const id = userId.toString()
      conversation.unreadCounts.set(id, (conversation.unreadCounts.get(id) || 0) + 1)
    })

    conversation.lastMessage = message._id
    await conversation.save()

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

    const populatedMessage = await Message.findById(message._id)
      .populate("sender", "name profilePic")
      .populate({
        path: "replyTo",
        select: "content messageType sender isDeleted",
        populate: { path: "sender", select: "name" }
      })

    try {
      const io = getIO()
      const onlineUsers = getOnlineUsers()

      io.to(conversationId).emit("new-message", populatedMessage)

      const deliveredToIds = []

      for (const userId of otherParticipants) {
        const id = userId.toString()
        const userSockets = onlineUsers.get(id)

        if (userSockets?.size > 0) {
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
      console.error("Socket emission failed:", socketError.message)
    }

    // Case 1: Private chat with AI system user
    //    — any text message sent to the AI user triggers a reply
    if (messageType === "text" && conversation.type === "private") {
      const aiSystemUser = await User.findOne({
        email: process.env.AI_SYSTEM_EMAIL,
        isSystem: true
      }).lean()

      const isAIConversation = aiSystemUser &&
        otherParticipants.some(p => p.toString() === aiSystemUser._id.toString())

      if (isAIConversation) {
        // Fire-and-forget — don't await so the HTTP response already went out
        triggerAIReply({
          conversation,
          userMessage: content.trim(),
          conversationId
        })
      }
    }

    // Case 2: Group chat with @Lumio mention
    //    — any text message containing "@Lumio" (case-insensitive) triggers a reply
    if (messageType === "text" && conversation.type === "group") {
      const mentionsAI = /(@lumio\b)/i.test(content)

      if (mentionsAI) {
        // Strip the @Lumio mention itself before passing as the prompt
        const cleanedMessage = content.replace(/@lumio\b/gi, "").trim()

        triggerAIReply({
          conversation,
          userMessage: cleanedMessage || content.trim(),
          conversationId
        })
      }
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
    const { conversationId }    = req.params
    const { cursor, limit = 20 } = req.query
    const userId                = req.user._id.toString()

    const conversation = await Conversation.findById(conversationId)

    if (!conversation) {
      return res.status(404).json({ success: false, message: "Conversation not found" })
    }

    if (!conversation.participants.some(p => p.toString() === userId)) {
      return res.status(403).json({ success: false, message: "You are not part of this conversation" })
    }

    const query = { conversation: conversationId }
    if (cursor) query.createdAt = { $lt: new Date(cursor) }

    // F1: filter out messages before this user's clearedAt timestamp
    const clearedEntry = conversation.clearedFor?.find(c => c.user.toString() === userId)
    if (clearedEntry?.clearedAt) {
      query.createdAt = {
        ...(query.createdAt || {}),
        $gt: clearedEntry.clearedAt
      }
    }

    const messages = await Message.find(query)
      .populate("sender", "name profilePic")
      .populate({
        path:     "replyTo",
        select:   "content messageType sender isDeleted",
        populate: { path: "sender", select: "name" }
      })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))

    const hasMore = messages.length === parseInt(limit)

    res.status(200).json({
      success:    true,
      messages:   messages.reverse(),
      nextCursor: hasMore ? messages[messages.length - 1].createdAt : null,
      hasMore
    })

  } catch (error) {
    next(error)
  }
}


// Edit Message Controller
export const editMessage = async (req, res, next) => {
  try {
    const { messageId }  = req.params
    const { newContent } = req.body
    const userId         = req.user._id.toString()

    const message = await Message.findById(messageId)

    if (!message)                                    return res.status(404).json({ success: false, message: "Message not found" })
    if (message.sender.toString() !== userId)        return res.status(403).json({ success: false, message: "You can only edit your own message" })
    if (message.isDeleted)                           return res.status(400).json({ success: false, message: "Cannot edit deleted message" })
    if (message.messageType !== "text")              return res.status(400).json({ success: false, message: "Only text messages can be edited" })
    if (!newContent?.trim())                         return res.status(400).json({ success: false, message: "Edited content cannot be empty" })

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


// Delete Message (soft) Controller
export const deleteMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params
    const userId        = req.user._id.toString()

    const message = await Message.findById(messageId)

    if (!message)                             return res.status(404).json({ success: false, message: "Message not found" })
    if (message.sender.toString() !== userId) return res.status(403).json({ success: false, message: "You can only delete your own message" })
    if (message.isDeleted)                    return res.status(400).json({ success: false, message: "Message already deleted" })

    if (message.media?.publicId) {
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


// React to Message Controller
export const reactToMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params
    const { emoji }     = req.body
    const userId        = req.user._id.toString()

    if (!emoji) {
      return res.status(400).json({ success: false, message: "Emoji is required" })
    }

    const message = await Message.findById(messageId)
    if (!message)          return res.status(404).json({ success: false, message: "Message not found" })
    if (message.isDeleted) return res.status(400).json({ success: false, message: "Cannot react to a deleted message" })

    const existing = message.reactions.find(r => r.emoji === emoji)

    if (existing) {
      const alreadyIn = existing.users.some(u => u.toString() === userId)
      if (alreadyIn) {
        existing.users = existing.users.filter(u => u.toString() !== userId)
        if (existing.users.length === 0) {
          message.reactions = message.reactions.filter(r => r.emoji !== emoji)
        }
      } else {
        existing.users.push(userId)
      }
    } else {
      message.reactions.push({ emoji, users: [userId] })
    }

    await message.save()

    const populated = await Message.findById(messageId)
      .populate("sender", "name profilePic")
      .populate({
        path:     "replyTo",
        select:   "content messageType sender isDeleted",
        populate: { path: "sender", select: "name" }
      })

    getIO().to(message.conversation.toString()).emit("message-reaction", populated)
    return res.status(200).json({ success: true, message: populated })

  } catch (error) {
    next(error)
  }
}