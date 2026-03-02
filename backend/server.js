import dotenv from "dotenv"
import http from "http"
import app from "./src/app.js"
import connectDB from "./src/config/db.js"
import { initializeSocket } from "./src/config/socket.js"

// Load environment variables
dotenv.config()

// Connect Database
connectDB()

// Use PORT from environment or fallback
const PORT = process.env.PORT || 5000

// Server is created 
const server = http.createServer(app)

// Initialize socket
initializeSocket(server)


// Start server
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
})
