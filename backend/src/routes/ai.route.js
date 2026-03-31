import express from "express"
import authMiddleware from "../middleware/auth.middleware.js"
import { aiRateLimiter } from "../middleware/aiRateLimit.middleware.js"
import { respondWithAI } from "../controllers/ai.controller.js"


// Initialize the router
const router = express.Router()

// Define the route for AI response
router.post("/respond/:conversationId",authMiddleware,
aiRateLimiter,respondWithAI)

export default router