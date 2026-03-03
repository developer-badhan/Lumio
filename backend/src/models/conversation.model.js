import mongoose from "mongoose"

const conversationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["private", "group", "ai"],
    required: true
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }],
  groupName: {
    type: String,
    default: null
  },
  groupAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message",
    default: null
  },
  unreadCounts: {
    type: Map,
    of: Number,
    default: {}
  },
  deletedFor: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }]

}, { timestamps: true })

// Improve Schema for Performance
conversationSchema.index({ participants: 1 })

export default mongoose.model("Conversation", conversationSchema)