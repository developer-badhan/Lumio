import express from "express"
import {
  sendMessage,
  getMessages,
  editMessage,
  deleteMessage,
  reactToMessage, 
} from "../controllers/message.controller.js"
import authMiddleware from "../middleware/auth.middleware.js"
import { chatMediaUpload } from "../middleware/upload.middleware.js"

// Initialize the router
const router = express.Router()

// Protected Routes
router.post("/", authMiddleware, chatMediaUpload, sendMessage)
router.get("/:conversationId", authMiddleware, getMessages)
router.patch("/edit/:messageId", authMiddleware, editMessage)
router.delete("/delete/:messageId", authMiddleware, deleteMessage)
router.post("/:messageId/react",authMiddleware, reactToMessage)

export default router