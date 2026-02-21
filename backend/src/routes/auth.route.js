import express from "express"
import {
  register,
  login
} from "../controllers/auth.controller.js"
import { upload } from "../middleware/upload.middleware.js"

// Initialize the router
const router = express.Router()

// Use routers
router.post("/register", upload.single("profilePic"), register)
router.post("/login", login)



export default router