import express from "express"
import authMiddleware        from "../middleware/auth.middleware.js"
import { profileMediaUpload } from "../middleware/upload.middleware.js"
import {
  requireGroupExists,
  requireGroupMember,
  requireGroupAdmin,
  requireGroupSuperAdmin,
  requireTargetIsMember,
  protectSuperAdmin,
  preventSelfAction,
  canActOnAdmin
} from "../middleware/group.middleware.js"
import {
  createGroup,
  getGroupDetails,
  updateGroupInfo,
  getGroupMembers,
  addMembers,
  removeMember,
  promoteToAdmin,
  demoteAdmin,
  toggleRestriction,
  leaveGroup,
  transferOwnership,
  deleteGroup,
  generateInviteLink,
  joinViaInvite,
  getMentionSuggestions,
  checkSendPermission
} from "../controllers/group.controller.js"

// Initialize the router
const router = express.Router()

// Global auth guard 
router.use(authMiddleware)

// Shorthand aliases (purely for readable route declarations) 
const GE   = requireGroupExists
const M    = requireGroupMember
const A    = requireGroupAdmin
const SA   = requireGroupSuperAdmin
const TM   = requireTargetIsMember
const PSA  = protectSuperAdmin
const CAOA = canActOnAdmin
const NS   = preventSelfAction

// Protected Routes
router.post("/", profileMediaUpload, createGroup)
router.post("/join/:token", joinViaInvite)
router.get("/:groupId",           GE, M, getGroupDetails)
router.get("/:groupId/members",   GE, M, getGroupMembers)
router.get("/:groupId/mentions",  GE, M, getMentionSuggestions)
router.get("/:groupId/can-send",  GE, M, checkSendPermission)
router.get("/:groupId/invite",    GE, M, A, generateInviteLink)
router.post("/:groupId/leave",    GE, M, leaveGroup)
router.patch("/:groupId/info",    GE, M, A, profileMediaUpload, updateGroupInfo)
router.post("/:groupId/members",  GE, M, A, addMembers)
router.patch("/:groupId/restrict",GE, M, A, toggleRestriction)
router.delete("/:groupId/members/:userId",GE, M, A, NS, TM, PSA, CAOA,removeMember)
router.patch("/:groupId/members/:userId/promote",GE, M, A, NS, TM, PSA,promoteToAdmin)
router.patch("/:groupId/members/:userId/demote", GE, M, A, NS, TM, PSA, demoteAdmin)
router.patch("/:groupId/transfer", GE, M, SA, transferOwnership)
router.delete("/:groupId", GE, M, SA, deleteGroup)

export default router