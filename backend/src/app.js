import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"
import errorHandler from "./middleware/errorMiddleware.js"

// Import the  Routes
import authRouter from "./routes/auth.route.js"

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


// Error Handling Middleware
app.use(errorHandler)


export default app