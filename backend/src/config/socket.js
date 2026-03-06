import { Server } from "socket.io"
import jwt from "jsonwebtoken"
import User from "../models/user.model.js"

// Store online users in memory
const onlineUsers = new Map()

let io

// Initialize the socket 
export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true
    }
  })

  // SOCKET AUTH MIDDLEWARE
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token

      if (!token) {
        return next(new Error("Authentication token missing"))
      }

      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN)

      const user = await User.findById(decoded.userId)

      if (!user) {
        return next(new Error("User not found"))
      }

      socket.user = {
        _id: user._id.toString(),
        name: user.name
      }

      next()
    } catch (error) {
      return next(new Error("Authentication failed"))
    }
  })

  io.on("connection", async (socket) => {
    const userId = socket.user._id

    // REGISTER USER ONLINE SECURELY
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set())
    }

    onlineUsers.get(userId).add(socket.id)

    await User.findByIdAndUpdate(userId, { isOnline: true })

    // Tell everyone else this user is online (Optimized to broadcast)
    socket.broadcast.emit("user-status-change", {
      userId,
      isOnline: true
    })

    // NEW: Send the currently online users to this specific user immediately on connection
    const currentlyOnline = Array.from(onlineUsers.keys());
    socket.emit("initial-online-users", currentlyOnline);

    // JOIN CONVERSATION ROOM
    socket.on("join-conversation", (conversationId) => {
      socket.join(conversationId)
    })

    socket.on("leave-conversation", (conversationId) => {
      socket.leave(conversationId)
    })

    // TYPING INDICATOR (SECURE)
    socket.on("typing", ({ conversationId }) => {
      socket.to(conversationId).emit("user-typing", {
        conversationId,
        userId
      })
    })

    socket.on("stop-typing", ({ conversationId }) => {
      socket.to(conversationId).emit("user-stop-typing", {
        conversationId,
        userId
      })
    })

    // DISCONNECT
    socket.on("disconnect", async () => {
      const sockets = onlineUsers.get(userId)

      if (sockets) {
        sockets.delete(socket.id)

        if (sockets.size === 0) {
          onlineUsers.delete(userId)

          await User.findByIdAndUpdate(userId, {
            isOnline: false,
            lastSeen: new Date()
          })

          // Notify others that this user went offline
          io.emit("user-status-change", {
            userId,
            isOnline: false
          })
        }
      }
    })
  })

  return io
}

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized")
  }
  return io
}

export const getOnlineUsers = () => onlineUsers