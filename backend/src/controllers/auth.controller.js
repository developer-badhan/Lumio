import User from "../models/user.model.js"
import { uploadProfileImg, deleteProfileImg } from "../services/cloudinary.service.js"
// import { sendOtpEmail, sendWelcomeEmail, sendLoginNotificationEmail } from "../services/email.service.js"
import { generateTokens, generateAccessToken } from "../utils/generateToken.js"
import { generateOtp } from "../utils/generateOtp.js"
import jwt from "jsonwebtoken"
import fs from "fs"


// Registeration Controller
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

        // Handle optional profile picture upload
        let profilePic = ""
        let profilePicPublicId = ""

        if (req.file) {
            try {
                const tempId = email.replace(/[^a-zA-Z0-9]/g, "_")
                const { url, publicId } = await uploadProfileImg(req.file.path, tempId)
                profilePic = url
                profilePicPublicId = publicId
            } catch (uploadError) {
                return res.status(500).json({
                    success: false,
                    message: "Image upload failed: " + uploadError.message
                })
            } finally {
                fs.unlink(req.file.path, () => {})
            }
        }

        // Generate plain OTP — model pre-save hook will hash it before storing
        const otp = generateOtp()

        const user = new User({
            name,
            email,
            password,
            otp,                                        // will be hashed by pre-save hook
            otpExpire: Date.now() + 10 * 60 * 1000,    // expires in 10 minutes
            profilePic,
            profilePicPublicId
        })

        await user.save()

        // Send OTP to user's email using the plain OTP (before it got hashed in DB)
        // await sendOtpEmail(user.email, user.name, otp)

        return res.status(201).json({
            success: true,
            message: "User registered successfully. Please verify the OTP sent to your email.",
        })

    } catch (error) {
        if (req.file) fs.unlink(req.file.path, () => {})

        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error"
        })
    }
}


// OTP Verifiction controller
export const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: "Email and OTP are required"
            })
        }

        // Select +otp so we can compare (it's select:false by default)
        const user = await User.findOne({ email }).select("+otp")

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            })
        }

        if (user.isVerified) {
            return res.status(400).json({
                success: false,
                message: "Account is already verified"
            })
        }

        if (!user.otp || user.otpExpire < Date.now()) {
            return res.status(400).json({
                success: false,
                message: "OTP has expired. Please request a new one."
            })
        }

        // Compare entered OTP with the hashed OTP stored in DB
        const isOtpValid = await user.compareOtp(otp)
        if (!isOtpValid) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP"
            })
        }

        // Mark account as verified and clear OTP fields
        user.isVerified = true
        user.otp = null
        user.otpExpire = null
        await user.save()

        // Send welcome email after successful verification
        // await sendWelcomeEmail(user.email, user.name)

        return res.status(200).json({
            success: true,
            message: "Account verified successfully. Welcome to Lumio!",
        })

    } catch (error) {
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

        if (!user.isVerified) {
            return res.status(403).json({
                success: false,
                message: "Please verify your account before logging in"
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
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000    // 7 days
        })

        // Notify user of new login via email
        // await sendLoginNotificationEmail(user.email, user.name)

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
                message: "Refresh token missing. Please login again."
            })
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRETE)

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
            message: "Invalid or expired refresh token. Please login again."
        })
    }
}


// Logout Controller
export const logout = async (req, res) => {
    try {
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict"
        })

        return res.status(200).json({
            success: true,
            message: "Logged out successfully"
        })

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error"
        })
    }
}


// Get Current User Controller
export const getMe = async (req, res) => {
    return res.status(200).json({
        success: true,
        user: req.user,
    })
}


// Get All Users
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({ _id: { $ne: req.user._id } })
            .select("-password -otp -otpExpire")

        return res.status(200).json({
            success: true,
            users,
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error"
        })
    }
}


//  Change Profile Picture Controller
export const changeProfilePic = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)

        // Delete the existing picture from Cloudinary if one is stored
        if (user.profilePicPublicId) {
            await deleteProfileImg(user.profilePicPublicId)
            user.profilePic = ""
            user.profilePicPublicId = ""
        }

        // If a new file was provided, upload it
        if (req.file) {
            try {
                const { url, publicId } = await uploadProfileImg(req.file.path, user._id.toString())
                user.profilePic = url
                user.profilePicPublicId = publicId
            } catch (uploadError) {
                return res.status(500).json({
                    success: false,
                    message: "Image upload failed: " + uploadError.message
                })
            } finally {
                fs.unlink(req.file.path, () => {})
            }
        }

        await user.save()

        return res.status(200).json({
            success: true,
            message: req.file
                ? "Profile picture updated successfully"
                : "Profile picture removed successfully",
            profilePic: user.profilePic
        })

    } catch (error) {
        if (req.file) fs.unlink(req.file.path, () => {})

        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error"
        })
    }
}

