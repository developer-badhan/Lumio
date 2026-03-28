import express from "express"
import authMiddleware from "../middleware/auth.middleware.js"
import {
  getCallHistory,
  getMyCallHistory,
  getCallById
} from "../controllers/call.controller.js"

const router = express.Router()

// Protected routes
router.get("/", authMiddleware, getMyCallHistory)
router.get("/:callId", authMiddleware, getCallById)
router.get("/conversation/:conversationId", authMiddleware, getCallHistory)

export default router