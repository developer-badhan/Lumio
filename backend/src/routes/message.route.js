import express from "express"
import {
  sendMessage,
  getMessages,
  editMessage,
  deleteMessage
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

export default router