import Conversation from "../models/conversation.model.js"
import {
  isGroupMember,
  isGroupAdmin,
  isGroupSuperAdmin
} from "../utils/groupHelper.js"

// ─────────────────────────────────────────────────────────────────────────────
//  requireGroupExists
//  Fetches the conversation by :groupId, confirms it is a group, and attaches
//  it to req.group.  All subsequent group middlewares depend on this running
//  first in the chain.
// ─────────────────────────────────────────────────────────────────────────────
export const requireGroupExists = async (req, res, next) => {
  try {
    const { groupId } = req.params

    if (!groupId) {
      return res.status(400).json({ success: false, message: "Group ID is required" })
    }

    const group = await Conversation.findById(groupId)

    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found" })
    }

    if (group.type !== "group") {
      return res.status(400).json({
        success: false,
        message: "This conversation is not a group"
      })
    }

    req.group = group
    next()
  } catch (error) {
    // Invalid ObjectId format falls here
    if (error.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid group ID format" })
    }
    return res.status(500).json({ success: false, message: error.message || "Internal server error" })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  requireGroupMember
//  Ensures the authenticated user is a participant of the group.
//  Must run after requireGroupExists (relies on req.group).
// ─────────────────────────────────────────────────────────────────────────────
export const requireGroupMember = (req, res, next) => {
  if (!isGroupMember(req.group, req.user._id)) {
    return res.status(403).json({
      success: false,
      message: "You are not a member of this group"
    })
  }
  next()
}

// ─────────────────────────────────────────────────────────────────────────────
//  requireGroupAdmin
//  Ensures the authenticated user is an admin (or super admin) of the group.
//  Must run after requireGroupMember.
// ─────────────────────────────────────────────────────────────────────────────
export const requireGroupAdmin = (req, res, next) => {
  if (!isGroupAdmin(req.group, req.user._id)) {
    return res.status(403).json({
      success: false,
      message: "Only group admins can perform this action"
    })
  }
  next()
}

// ─────────────────────────────────────────────────────────────────────────────
//  requireGroupSuperAdmin
//  Ensures the authenticated user is the current group owner (super admin).
//  Must run after requireGroupMember.
// ─────────────────────────────────────────────────────────────────────────────
export const requireGroupSuperAdmin = (req, res, next) => {
  if (!isGroupSuperAdmin(req.group, req.user._id)) {
    return res.status(403).json({
      success: false,
      message: "Only the group owner can perform this action"
    })
  }
  next()
}

// ─────────────────────────────────────────────────────────────────────────────
//  requireTargetIsMember
//  Verifies that the :userId route param refers to an existing group member.
//  Must run after requireGroupExists.
// ─────────────────────────────────────────────────────────────────────────────
export const requireTargetIsMember = (req, res, next) => {
  const { userId } = req.params

  if (!userId) {
    return res.status(400).json({ success: false, message: "Target user ID is required" })
  }

  if (!isGroupMember(req.group, userId)) {
    return res.status(404).json({
      success: false,
      message: "Target user is not a member of this group"
    })
  }

  next()
}

// ─────────────────────────────────────────────────────────────────────────────
//  protectSuperAdmin
//  Prevents any action (remove, promote, demote) from targeting the group
//  owner.  Placed before controllers that act on a :userId param.
// ─────────────────────────────────────────────────────────────────────────────
export const protectSuperAdmin = (req, res, next) => {
  const { userId } = req.params

  if (isGroupSuperAdmin(req.group, userId)) {
    return res.status(403).json({
      success: false,
      message: "Cannot perform this action on the group owner"
    })
  }

  next()
}

// ─────────────────────────────────────────────────────────────────────────────
//  preventSelfAction
//  Blocks an actor from applying a :userId action to themselves.
//  Use on routes where self-targeting makes no sense (e.g. remove, demote).
// ─────────────────────────────────────────────────────────────────────────────
export const preventSelfAction = (req, res, next) => {
  const { userId } = req.params

  if (userId === req.user._id.toString()) {
    return res.status(400).json({
      success: false,
      message: "You cannot perform this action on yourself"
    })
  }

  next()
}

// ─────────────────────────────────────────────────────────────────────────────
//  canActOnAdmin
//  A regular admin may NOT act on another admin (only the super admin can).
//  This middleware enforces that constraint on routes that target :userId.
//  Must run after requireGroupExists.
// ─────────────────────────────────────────────────────────────────────────────
export const canActOnAdmin = (req, res, next) => {
  const { userId } = req.params
  const actorId    = req.user._id

  // If the target is an admin and the actor is NOT the super admin → deny
  if (
    isGroupAdmin(req.group, userId) &&
    !isGroupSuperAdmin(req.group, actorId)
  ) {
    return res.status(403).json({
      success: false,
      message: "Only the group owner can perform this action on another admin"
    })
  }

  next()
}