import express from "express"
import cookieParser from "cookie-parser"

// Import the  Routes


// Initialize Express App
const app = express()

// Built-in Middleware
app.use(express.json())
app.use(cookieParser())

// Use the  Routes




export default app;