import User from "../models/user.model.js"
import { uploadProfileImg, deleteProfileImg } from "../services/cloudinary.service.js"
import { sendOtpEmail, sendWelcomeEmail, sendLoginNotificationEmail, sendPasswordChangeNotificationEmail  } from "../services/email.service.js"
import { generateTokens, generateAccessToken, generateVerifyToken } from "../utils/generateToken.js"
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

        const otp = generateOtp()

        const user = new User({
            name,
            email,
            password,
            otp,
            otpExpire: Date.now() + 10 * 60 * 1000,
            profilePic,
            profilePicPublicId
        })

        await user.save()

        await sendOtpEmail(user.email, user.name, otp)

        const verifyToken = generateVerifyToken(user._id)

        return res.status(201).json({
            success: true,
            message: "User registered successfully. Please verify the OTP sent to your email.",
            verifyToken
        })

    } catch (error) {
        if (req.file) fs.unlink(req.file.path, () => {})

        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error"
        })
    }
}


// OTP Verification Controller (Token-Based)
export const verifyOtp = async (req, res) => {
    try {
        const authHeader = req.headers.authorization

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Verification token missing or invalid"
            })
        }

        const token = authHeader.split(" ")[1]

        let decoded
        try {
            decoded = jwt.verify(token, process.env.VERIFY_TOKEN)
        } catch (err) {
            return res.status(401).json({
                success: false,
                message: "Verification session expired. Please register again."
            })
        }

        const { otp } = req.body

        if (!otp) {
            return res.status(400).json({
                success: false,
                message: "OTP is required"
            })
        }

        const user = await User.findById(decoded.userId).select("+otp")

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
                message: "OTP has expired. Please resend a new one."
            })
        }

        const isOtpValid = await user.compareOtp(otp)

        if (!isOtpValid) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP"
            })
        }

        user.isVerified = true
        user.otp = null
        user.otpExpire = null
        await user.save()

        await sendWelcomeEmail(user.email, user.name)

        return res.status(200).json({
            success: true,
            message: "Account verified successfully!"
        })

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error"
        })
    }
}


// OTP Resend Controller
export const otpResend = async (req, res) => {
    try {
        const authHeader = req.headers.authorization

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Verification token missing or invalid"
            })
        }

        const token = authHeader.split(" ")[1]

        let decoded
        try {
            decoded = jwt.verify(token, process.env.VERIFY_TOKEN)
        } catch (err) {
            return res.status(401).json({
                success: false,
                message: "Verification session expired. Please register again."
            })
        }

        const user = await User.findById(decoded.userId)

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

        // Generate new OTP
        const otp = generateOtp()

        user.otp = otp
        user.otpExpire = Date.now() + 10 * 60 * 1000

        await user.save()

        await sendOtpEmail(user.email, user.name, otp)

        const newVerifyToken = generateVerifyToken(user._id)

        return res.status(200).json({
            success: true,
            message: "New OTP sent to your email.",
            verifyToken: newVerifyToken
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
        await sendLoginNotificationEmail(user.email, user.name)

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
            message: "Invalid or expired refresh token. Please login again."
        })
    }
}


// Logout Controller
export const logout = async (req, res) => {
    try {
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: false,
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


// Change Password Controller
export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmNewPassword } = req.body

        if (!currentPassword || !newPassword || !confirmNewPassword) {
            return res.status(400).json({
                success: false,
                message: "Please fill all fields"
            })
        }

        if (newPassword !== confirmNewPassword) {
            return res.status(400).json({
                success: false,
                message: "New passwords do not match"
            })
        }

        const user = await User.findById(req.user._id).select("+password")

        const isMatch = await user.comparePassword(currentPassword)
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Current password is incorrect"
            })
        }

        user.password = newPassword
        await user.save()   // pre-save hook will hash it

        await sendPasswordChangeNotificationEmail(user.email, user.name);

        return res.status(200).json({
            success: true,
            message: "Password changed successfully"
        })

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error"
        })
    }
}