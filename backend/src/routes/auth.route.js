import express from "express"
import {
  register,
} from "../controllers/auth.controller.js"

// Initialize the router
const router = express.Router()

// Use routers
router.post("/register", register)



export default router