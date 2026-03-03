import express from "express"
import authMiddleware from "../middleware/auth.middleware.js"
import {
  getNotifications,
  markNotificationAsRead
} from "../controllers/notification.controller.js"

// Initialize the router
const router = express.Router()

// Protected Routes
router.get("/", authMiddleware, getNotifications)
router.patch("/:notificationId", authMiddleware, markNotificationAsRead)

export default router