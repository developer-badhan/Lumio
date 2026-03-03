import mongoose from "mongoose"

const mediaSchema = new mongoose.Schema({
  url: {
    type: String
  },
  publicId: {
    type: String
  },
  format: {
    type: String
  },
  size: {
    type: Number
  },
  duration: {
    type: Number
  },
  width: {
    type: Number
  },
  height: {
    type: Number
  }
}, { _id: false })


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
    trim: true,
    required: function () {
      return this.messageType === "text"
    }
  },
  messageType: {
    type: String,
    enum: ["text", "image", "audio", "video", "voice"],
    default: "text"
  },
  media: {
    type: mediaSchema,
    default: null
  },
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  deliveredTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date,
    default: null
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  }

}, { timestamps: true })


// Performance Index
messageSchema.index({ conversation: 1, createdAt: -1 })

export default mongoose.model("Message", messageSchema)