import express from "express"
import {
  getOrCreatePrivateConversation,
  createGroupConversation,
  getUserConversations,
  markConversationAsRead,
  softDeleteConversation
} from "../controllers/conversation.controller.js"
import authMiddleware from "../middleware/auth.middleware.js"

// Initialize the router
const router = express.Router()

// Protected Routes
router.post("/private", authMiddleware, getOrCreatePrivateConversation)
router.post("/group", authMiddleware, createGroupConversation)
router.get("/", authMiddleware, getUserConversations)
router.patch("/read/:conversationId", authMiddleware, markConversationAsRead)
router.delete("/:conversationId", authMiddleware, softDeleteConversation)

export default router