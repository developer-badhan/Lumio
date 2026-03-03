import mongoose from "mongoose"

const messageSchema = new mongoose.Schema({
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Conversation",
    required: true
  },

  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  content: {
    type: String,
    required: true
  },

  messageType: {
    type: String,
    enum: ["text", "image", "audio"],
    default: "text"
  },

  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],

  isEdited: {
    type: Boolean,
    default: false
  }

}, { timestamps: true })

// Improve Schema for Performance
messageSchema.index({ conversation: 1, createdAt: -1 })

export default mongoose.model("Message", messageSchema)
