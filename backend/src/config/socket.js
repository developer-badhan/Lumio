import { Server } from "socket.io"
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

  io.on("connection", (socket) => {

    socket.on("user-online", async (userId) => {
      if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, new Set())
      }

      onlineUsers.get(userId).add(socket.id)

      await User.findByIdAndUpdate(userId, { isOnline: true })

      io.emit("user-status-change", {
        userId,
        isOnline: true
      })
    })

    socket.on("disconnect", async () => {
      for (const [userId, sockets] of onlineUsers.entries()) {
        if (sockets.has(socket.id)) {
          sockets.delete(socket.id)

          if (sockets.size === 0) {
            onlineUsers.delete(userId)

            await User.findByIdAndUpdate(userId, {
              isOnline: false,
              lastSeen: new Date()
            })

            io.emit("user-status-change", {
              userId,
              isOnline: false
            })
          }
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