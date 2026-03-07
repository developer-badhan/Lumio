import { Server } from "socket.io"
import jwt from "jsonwebtoken"
import User from "../models/user.model.js"

// In-memory map: userId → Set of socketIds (supports multiple tabs/devices)
const onlineUsers = new Map()

let io

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: { origin: "http://localhost:5173", credentials: true }
  })

  // Auth Middleware for validation
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token

      if (!token) return next(new Error("Authentication token missing"))

      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN)
      const user    = await User.findById(decoded.userId)

      if (!user) return next(new Error("User not found"))

      socket.user = { _id: user._id.toString(), name: user.name }
      next()
    } catch (error) {
      return next(new Error("Authentication failed"))
    }
  })

  // Connection established
  io.on("connection", async (socket) => {
    const userId = socket.user._id

    // Track all active sockets for this user (multi-tab / multi-device)
    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set())
    onlineUsers.get(userId).add(socket.id)

    // Join a personal room keyed to userId so that io.to(userId) works.
    // notification.controller uses io.to(userId) to push "notification-read"
    // events directly to a specific user. Without this join that room is empty
    // and the emit silently goes nowhere.
    socket.join(userId)

    await User.findByIdAndUpdate(userId, { isOnline: true })

    // Notify all other connected clients this user came online
    socket.broadcast.emit("user-status-change", { userId, isOnline: true })

    // Send the current online user list to the newly connected client only
    socket.emit("initial-online-users", Array.from(onlineUsers.keys()))

    // Conversation Rooms 
    // Client joins/leaves a room when opening/closing a conversation.
    // Room = conversationId string — all socket events scoped to that room.
    socket.on("join-conversation",  (conversationId) => socket.join(conversationId))
    socket.on("leave-conversation", (conversationId) => socket.leave(conversationId))

    // Typing Indicators 
    // userId is taken from socket.user (server-verified) not the client payload
    socket.on("typing",      ({ conversationId }) => socket.to(conversationId).emit("user-typing",      { conversationId, userId }))
    socket.on("stop-typing", ({ conversationId }) => socket.to(conversationId).emit("user-stop-typing", { conversationId, userId }))

    // Disconnect
    socket.on("disconnect", async () => {
      const sockets = onlineUsers.get(userId)

      if (sockets) {
        sockets.delete(socket.id)

        // Only mark offline when ALL tabs/devices have disconnected
        if (sockets.size === 0) {
          onlineUsers.delete(userId)

          await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() })

          io.emit("user-status-change", { userId, isOnline: false })
        }
      }
    })
  })

  return io
}

export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized")
  return io
}

export const getOnlineUsers = () => onlineUsers