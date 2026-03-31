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
  admins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  groupIcon: {
    type: String,
    default: ""
  },
  groupIconPublicId: {
    type: String,
    default: ""
  },
  isRestricted: {
    type: Boolean,
    default: false
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
  }],
  clearedFor: [{
    user:      { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    clearedAt: { type: Date }
  }],
  aiSummary: {
    type: String,
    default: ""
  }

}, { timestamps: true })

// Improve Schema for Performance
conversationSchema.index({ participants: 1 })

export default mongoose.model("Conversation", conversationSchema)