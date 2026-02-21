import jwt from "jsonwebtoken"
import User from "../models/user.model.js"

const authenticateRoute = async (req, res, next) => {

  try {
    // Access token comes from Authorization header, not cookies
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access, token is missing"
      })
    }

    const token = authHeader.split(" ")[1] // Extract token from "Bearer <token>"

    // Verify with ACCESS_TOKEN secret
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN)

    const user = await User.findById(decoded.userId).select("-password")

    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" })
    }

    req.user = user
    next()
  } catch (error) {
    console.error("Auth Middleware Error:", error.message)
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token"
    })
  }
}

export default authenticateRoute
