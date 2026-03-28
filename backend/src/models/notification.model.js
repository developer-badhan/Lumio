import mongoose from "mongoose"

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  type: {
    type: String,
    enum: ["message", "group-add", "mention", "call"],
    required: true
  },
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Conversation"
  },
  message: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message"
  },
  isRead: {
    type: Boolean,
    default: false
  }

}, { timestamps: true })

// Improve Schema for Performance
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 })

export default mongoose.model("Notification", notificationSchema)