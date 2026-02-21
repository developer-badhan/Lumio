import jwt from "jsonwebtoken" 
import User from "../models/user.model.js" 


// Check authentication via middleware
const authenticateRoute = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken 

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: "Unauthorized access, token is missing" 
      }) 
    }

    // Must match the key used in generateToken.js
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN) 
    
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