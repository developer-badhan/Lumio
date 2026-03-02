import dotenv from "dotenv"
import http from "http"
import { Server } from "socket.io"
import app from "./src/app.js"
import connectDB from "./src/config/db.js"
import User from "./src/models/user.model.js"

// Load environment variables
dotenv.config()

// Connect Database
connectDB()

// Use PORT from environment or fallback
const PORT = process.env.PORT || 5000

// Create HTTP server
const server = http.createServer(app)

// Setup Socket.io
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true
  }
})

// Store online users in memory
const onlineUsers = new Map()

io.on("connection", (socket) => {
  console.log("New socket connected:", socket.id)

  socket.on("user-online", async (userId) => {
    onlineUsers.set(userId, socket.id)

    await User.findByIdAndUpdate(userId, {
      isOnline: true
    })

    io.emit("user-status-change", {
      userId,
      isOnline: true
    })
  })

  socket.on("disconnect", async () => {
    const userEntry = [...onlineUsers.entries()]
      .find(([_, socketId]) => socketId === socket.id)

    if (userEntry) {
      const [userId] = userEntry

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

    console.log("Socket disconnected:", socket.id)
  })
})

// Start server
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
})
