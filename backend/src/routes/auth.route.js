import express from "express"
import {
  register,
  login,
  logout
} from "../controllers/auth.controller.js"
import authenticateRoute from "../middleware/auth.middleware.js"
import { upload } from "../middleware/upload.middleware.js"

// Initialize the router
const router = express.Router()

// Use routers
router.post("/register", upload.single("profilePic"), register)
router.post("/login", login)
router.post("/logout", authenticateRoute, logout)


export default router