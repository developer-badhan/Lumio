import mongoose from "mongoose"

const participantSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected", "missed", "busy"],
    default: "pending"
  },
  joinedAt: {
    type: Date,
    default: null
  },
  leftAt: {
    type: Date,
    default: null
  }
}, { _id: false })

const callSchema = new mongoose.Schema({
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Conversation",
    required: true
  },
  initiator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  callType: {
    type: String,
    enum: ["audio", "video"],
    required: true
  },
  conversationType: {
    type: String,
    enum: ["private", "group"],
    required: true
  },
  status: {
    type: String,
    enum: ["initiated", "ongoing", "ended", "missed", "rejected", "busy"],
    default: "initiated"
  },
  participants: [participantSchema],
  startedAt: {
    type: Date,
    default: null
  },
  endedAt: {
    type: Date,
    default: null
  },
  duration: {
    type: Number,    // seconds
    default: 0
  }
}, { timestamps: true })

// Index for fetching call history per conversation quickly
callSchema.index({ conversation: 1, createdAt: -1 })
callSchema.index({ initiator: 1, createdAt: -1 })

export default mongoose.model("Call", callSchema)