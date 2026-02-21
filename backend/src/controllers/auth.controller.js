import User from "../models/user.model.js"
import { uploadProfileImg } from "../services/cloudinary.service.js"
import { generateTokens } from "../utils/generateToken.js"
import fs from "fs"


// Registration Controller
export const register = async (req, res) => {
    try {
        const { name, email, password, confirmPassword } = req.body

        // Validation
        if (!name || !email || !password || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Please fill all fields"
            })
        }

        // Check if passwords match
        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match"
            })
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email })
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Email already registered"
            })
        }

        // Handle optional profile picture upload
        let profilePic = ""
        if (req.file) {
            try {
                // We don't have _id yet, so use email as temp identifier
                const tempId = email.replace(/[^a-zA-Z0-9]/g, "_")
                const { url } = await uploadProfileImg(req.file.path, tempId)
                profilePic = url
            } catch (uploadError) {
                return res.status(500).json({
                    success: false,
                    message: "Image upload failed: " + uploadError.message
                })
            } finally {
                // Always delete the temp file from local disk
                fs.unlink(req.file.path, () => {})
            }
        }

        // Create new user
        const user = new User({ name, email, password, profilePic })

        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                isVerified: user.isVerified,
                profilePic: user.profilePic
            }
        })

    } catch (error) {
        // Cleanup temp file if error occurs after multer but before response
        if (req.file) fs.unlink(req.file.path, () => {})

        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error"
        })
    }
}



// Login Controller
export const login = async (req, res) => {
    try {
        const { email, password } = req.body

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please fill all fields"
            })
        }

        // Find user
        const user = await User.findOne({ email }).select("+password")
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            })
        }

        // Compare password
        const isMatch = await user.comparePassword(password)
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            })
        }

        // Generate tokens (FIXED TYPO)
        const { accessToken, refreshToken } = generateTokens(user._id)

        // Send refresh token via httpOnly cookie
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: false, // true in production
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        })

        return res.status(200).json({
            success: true,
            message: "Login successful",
            accessToken,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                isVerified: user.isVerified,
                profilePic: user.profilePic
            }
        })

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error"
        })
    }
}


// Logout Controller
export const logout = async (req, res) => {

  try {
    res.clearCookie("accessToken")
    res.clearCookie("refreshToken")

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}


