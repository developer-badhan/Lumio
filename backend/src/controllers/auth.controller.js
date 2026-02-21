import User from "../models/user.model.js"
import { uploadProfileImg } from "../services/cloudinary.service.js"
import { generateTokens, generateAccessToken } from "../utils/generateToken.js"
import jwt from "jsonwebtoken"
import fs from "fs"


// Registration Controller
export const register = async (req, res) => {
    try {
        const { name, email, password, confirmPassword } = req.body

        if (!name || !email || !password || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Please fill all fields"
            })
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match"
            })
        }

        const existingUser = await User.findOne({ email })
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Email already registered"
            })
        }

        let profilePic = ""
        if (req.file) {
            try {
                const tempId = email.replace(/[^a-zA-Z0-9]/g, "_")
                const { url } = await uploadProfileImg(req.file.path, tempId)
                profilePic = url
            } catch (uploadError) {
                return res.status(500).json({
                    success: false,
                    message: "Image upload failed: " + uploadError.message
                })
            } finally {
                fs.unlink(req.file.path, () => {})
            }
        }

        const user = new User({ name, email, password, profilePic })
        await user.save() 

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

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please fill all fields"
            })
        }

        const user = await User.findOne({ email }).select("+password")
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            })
        }

        const isMatch = await user.comparePassword(password)
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            })
        }

        const { accessToken, refreshToken } = generateTokens(user._id)

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: false, // set true in production
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
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


// Refresh Token Controller
export const refreshToken = async (req, res) => {
    try {
        const token = req.cookies.refreshToken

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Refresh token missing, please login again"
            })
        }

        const decoded = jwt.verify(token, process.env.REFRESH_TOKEN)

        const user = await User.findById(decoded.userId)
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User no longer exists"
            })
        }

        const newAccessToken = generateAccessToken(user._id)

        return res.status(200).json({
            success: true,
            accessToken: newAccessToken
        })

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired refresh token, please login again"
        })
    }
}


// Logout Controller
export const logout = async (req, res) => {
    try {
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: false, // match the same options used when setting it
            sameSite: "strict"
        })

        return res.status(200).json({
            success: true,
            message: "Logged out successfully"
        })

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}


