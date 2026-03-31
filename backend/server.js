import dotenv from "dotenv"
import http from "http"
import app from "./src/app.js"
import connectDB from "./src/config/db.js"
import { initializeSocket } from "./src/config/socket.js"
import User from "./src/models/user.model.js"

// Load environment variables
dotenv.config()

// Use PORT from environment or fallback
const PORT = process.env.PORT || 3000

// Server is created 
const server = http.createServer(app)

// Initialize socket and retain instance
const io = initializeSocket(server)

// Create AI User
const createAIUserIfNotExists = async () => {
  const existing = await User.findOne({
    email: process.env.AI_SYSTEM_EMAIL
  })

  if (!existing) {
    await User.create({
      name: "Lumio AI",
      email: process.env.AI_SYSTEM_EMAIL,
      password: "AI_SYSTEM_PASSWORD",
      isVerified: true,
      role: "ai",
      isSystem: true
    })
    console.log("AI system user created")
  } else {
    console.log("AI system user already exists")
  }
}

// Start server
const startServer = async () => {
  try {
    await connectDB()
    await createAIUserIfNotExists()
    server.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`)
    })
  } catch (error) {
    console.error("Server startup failed:", error)
  }
}

startServer()