import express from "express"
import {
  register,
  verifyOtp,
  login,
  logout,
} from "../controllers/auth.controller.js"

const router = express.Router()

router.post("/register", register)
router.post("/verify-otp", verifyOtp)
router.post("/login", login)
router.post("/logout", logout)

export default router