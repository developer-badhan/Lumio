import express from "express"
import {
  register,
  verifyOtp,
  login,
  logout,
} from "../controllers/auth.controller.js"
import authorized from "../middleware/auth.middleware.js"


const router = express.Router()

router.post("/register", authorized, register)
router.post("/verify-otp", authorized, verifyOtp)
router.post("/login", authorized, login)
router.post("/logout", logout)

export default router