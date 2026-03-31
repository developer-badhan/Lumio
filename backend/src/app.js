import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"
import errorHandler from "./middleware/error.middleware.js"

// Import the  Routes
import authRouter from "./routes/auth.route.js"
import conversationRouter from "./routes/conversation.route.js"
import messageRouter from "./routes/message.route.js"
import notificationRouter from "./routes/notification.route.js"
import callRouter from "./routes/call.route.js"
import groupRouter from "./routes/group.route.js"
import aiRoutes from "./routes/ai.route.js"

// Initialize Express App
const app = express()

// Resource Sharing Middleware
app.use(cors({
    origin: "http://localhost:5173", // frontend URL
    credentials: true,
  })
)

// Built-in Middleware
app.use(express.json())
app.use(cookieParser())


// Use the  Routes
app.use("/api/auth", authRouter)
app.use("/api/conversations", conversationRouter)
app.use("/api/messages", messageRouter)
app.use("/api/notifications", notificationRouter)
app.use("/api/calls", callRouter)
app.use("/api/groups", groupRouter)
app.use("/api/ai", aiRoutes)

// Error Handling Middleware
app.use(errorHandler)


export default app


