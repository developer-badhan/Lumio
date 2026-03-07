import Notification from "../models/notification.model.js"
import { getIO } from "../config/socket.js"


// Get Notification Controller
export const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user._id
    const { cursor, limit = 20 } = req.query

    const query = { recipient: userId }
    if (cursor) query.createdAt = { $lt: new Date(cursor) }

    const notifications = await Notification.find(query)
      .populate("sender", "name profilePic")
      .populate("conversation")
      .populate("message")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))

    const hasMore = notifications.length === parseInt(limit)

    res.status(200).json({
      success: true,
      notifications,
      nextCursor: hasMore ? notifications[notifications.length - 1].createdAt : null,
      hasMore
    })

  } catch (error) {
    next(error)
  }
}


// Mark Notification Read Controller
export const markNotificationAsRead = async (req, res, next) => {
  try {
    const { notificationId } = req.params
    const userId = req.user._id.toString()

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { isRead: true },
      { new: true }
    )

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" })
    }

    try {
      getIO().to(userId).emit("notification-read", { notificationId })
    } catch (socketError) {
      console.error("Socket emission failed:", socketError.message)
    }

    res.status(200).json({ success: true, message: "Notification marked as read" })

  } catch (error) {
    next(error)
  }
}