import dotenv from "dotenv"
import app from "./src/app.js"
import connectDB from "./src/config/db.js"


// Load environment variables
dotenv.config()

// Connect Database
connectDB()

// Use PORT from environment or fallback
const PORT = process.env.PORT || 5000

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running at: http://localhost:${PORT}`)
});