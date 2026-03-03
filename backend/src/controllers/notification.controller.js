import Notification from "../models/notification.model.js"

// Get Notification Controller
export const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id

    const notifications = await Notification.find({
      recipient: userId
    })
      .populate("sender", "name profilePic")
      .populate("conversation")
      .populate("message")
      .sort({ createdAt: -1 })
      .limit(50)

    res.status(200).json({
      success: true,
      notifications
    })

  } catch (error) {
    next(error)
  }
}