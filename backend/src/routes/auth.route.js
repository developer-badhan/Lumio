import express from "express"
import {
  register,
  verifyOtp,
  otpResend,
  login,
  logout,
  refreshToken,
  getMe,
  getAllUsers,
  changeProfilePic,
  changePassword,
} from "../controllers/auth.controller.js"
import { upload } from "../middleware/upload.middleware.js"
import authenticateRoute from "../middleware/auth.middleware.js"

// Initialize the router
const router = express.Router()

// Public Routes
router.post("/register", upload.single("profilePic"), register)
router.post("/verify-otp", verifyOtp)
router.post("/otp-resend", otpResend)
router.post("/login", login)
router.post("/logout", logout)
router.post("/refresh-token", refreshToken)

// Protected Routes
router.get("/me", authenticateRoute, getMe)
router.get("/users", authenticateRoute, getAllUsers)
router.patch("/change-profile-pic", authenticateRoute, upload.single("profilePic"), changeProfilePic)
router.patch("/change-password", authenticateRoute, changePassword)

export default router
