import Conversation from "../models/conversation.model.js"
import User          from "../models/user.model.js"
import Message       from "../models/message.model.js"
import Notification  from "../models/notification.model.js"
import {
  uploadProfileImg as uploadToCloudinary,
  deleteProfileImg as deleteFromCloudinary
} from "../services/cloudinary.service.js"
import {
  sendGroupPromotionEmail,
  sendGroupDemotionEmail
} from "../services/email.service.js"
import {
  isGroupMember,
  isGroupAdmin,
  isGroupSuperAdmin,
  canSendMessage,
  resolveMentionedUsers,
  generateGroupInviteToken,
  verifyGroupInviteToken,
  formatMemberWithRole,
  formatGroupDetails,
  emitToGroupMembers,
  validateObjectIds,
  sanitizeGroupName,
  MAX_GROUP_MEMBERS,
  MAX_GROUP_NAME_LEN,
  GROUP_EVENTS
} from "../utils/groupHelper.js"
import { getIO } from "../config/socket.js"
import fs from "fs"


//  Internal helpers: 
/*
Silently returns the Socket.io instance; never throws.
*/
const safeGetIO = () => {
  try { return getIO() } catch { return null }
}

/**
 * Creates Notification documents for every recipient except the sender.
 * Uses insertMany for a single round-trip.
 */
const bulkCreateNotifications = async (recipientIds, senderId, type, conversationId) => {
  const docs = recipientIds
    .map(id => id.toString())
    .filter(id => id !== senderId.toString())
    .map(recipientId => ({
      recipient:    recipientId,
      sender:       senderId,
      type,
      conversation: conversationId
    }))

  if (docs.length) await Notification.insertMany(docs, { ordered: false })
}

/**
 * Generates a unique Cloudinary public-id for group icons.
 * Format: group_icon_<groupId>
 */
const groupIconPublicId = (groupId) => `group_icon_${groupId}`


// Group Creation Controller
export const createGroup = async (req, res) => {
  try {
    const { groupName, memberIds = [] } = req.body
    const creatorId = req.user._id

    // Validate group name 
    const cleanName = sanitizeGroupName(groupName)
    if (!cleanName) {
      return res.status(400).json({ success: false, message: "Group name is required" })
    }
    if (cleanName.length > MAX_GROUP_NAME_LEN) {
      return res.status(400).json({
        success: false,
        message: `Group name cannot exceed ${MAX_GROUP_NAME_LEN} characters`
      })
    }

    // ── Normalise member list 
    const rawIds = Array.isArray(memberIds)
      ? memberIds
      : String(memberIds).split(",").map(s => s.trim()).filter(Boolean)

    if (!validateObjectIds(rawIds.filter(Boolean))) {
      return res.status(400).json({ success: false, message: "One or more member IDs are invalid" })
    }

    // De-duplicate, strip the creator (auto-added)
    const uniqueMemberIds = [
      ...new Set(rawIds.map(id => id.toString()))
    ].filter(id => id !== creatorId.toString())

    // Enforce max group size
    if (uniqueMemberIds.length + 1 > MAX_GROUP_MEMBERS) {
      return res.status(400).json({
        success: false,
        message: `A group cannot exceed ${MAX_GROUP_MEMBERS} members`
      })
    }

    // Ensure every supplied member ID actually exists in the DB
    if (uniqueMemberIds.length) {
      const found = await User.find({ _id: { $in: uniqueMemberIds } }).select("_id")
      if (found.length !== uniqueMemberIds.length) {
        return res.status(404).json({ success: false, message: "One or more users were not found" })
      }
    }

    // ── Handle group icon upload 
    let groupIcon          = ""
    let groupIconPublicIdVal = ""

    if (req.file) {
      try {
        // We use a placeholder public-id until we have the group _id.
        // A second Cloudinary rename would be ideal but this is acceptable for
        // production without it.
        const tempPublicId     = `group_icon_tmp_${Date.now()}`
        const { url, publicId } = await uploadToCloudinary(req.file.path, tempPublicId)
        groupIcon              = url
        groupIconPublicIdVal   = publicId
      } catch (uploadErr) {
        return res.status(500).json({
          success: false,
          message: "Icon upload failed: " + uploadErr.message
        })
      } finally {
        fs.unlink(req.file.path, () => {})
      }
    }

    // ── Persist the group 
    const allParticipants = [creatorId, ...uniqueMemberIds]

    const group = await Conversation.create({
      type:              "group",
      groupName:         cleanName,
      groupAdmin:        creatorId,
      admins:            [creatorId],
      participants:      allParticipants,
      groupIcon,
      groupIconPublicId: groupIconPublicIdVal,
      isRestricted:      false
    })

    const populated = await Conversation.findById(group._id)
      .populate("participants",  "name email profilePic bio isOnline lastSeen")
      .populate("groupAdmin",    "name email profilePic")
      .populate("admins",        "name email profilePic")
      .lean()

    // ── Real-time: notify every participant 
    const io = safeGetIO()
    emitToGroupMembers(io, allParticipants, GROUP_EVENTS.CREATED, {
      group: formatGroupDetails(populated, creatorId)
    })

    // ── Persist notifications for new members (not creator) 
    await bulkCreateNotifications(uniqueMemberIds, creatorId, "group-add", group._id)

    return res.status(201).json({
      success: true,
      message: "Group created successfully",
      group:   populated
    })

  } catch (error) {
    if (req.file) fs.unlink(req.file.path, () => {})
    return res.status(500).json({ success: false, message: error.message || "Internal server error" })
  }
}


// Group Details Controller
export const getGroupDetails = async (req, res) => {
  try {
    const populated = await Conversation.findById(req.params.groupId)
      .populate("participants", "name email profilePic bio isOnline lastSeen")
      .populate("groupAdmin",   "name email profilePic")
      .populate("admins",       "name email profilePic")
      .populate({
        path:     "lastMessage",
        populate: { path: "sender", select: "name profilePic" }
      })

    const members = populated.participants.map(p => formatMemberWithRole(p, populated))

    // Sort by role: super_admin → admin → member
    const roleOrder = { super_admin: 0, admin: 1, member: 2 }
    members.sort((a, b) => roleOrder[a.role] - roleOrder[b.role])

    return res.status(200).json({
      success: true,
      group: {
        ...formatGroupDetails(populated, req.user._id),
        members
      }
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Internal server error" })
  }
}


// Group Info Update Controller
export const updateGroupInfo = async (req, res) => {
  try {
    const group      = req.group
    const { groupName, removeIcon } = req.body
    let   updated    = false

    // ── Group name 
    if (groupName !== undefined) {
      const cleanName = sanitizeGroupName(groupName)
      if (!cleanName) {
        return res.status(400).json({ success: false, message: "Group name cannot be empty" })
      }
      if (cleanName.length > MAX_GROUP_NAME_LEN) {
        return res.status(400).json({
          success: false,
          message: `Group name cannot exceed ${MAX_GROUP_NAME_LEN} characters`
        })
      }
      group.groupName = cleanName
      updated = true
    }

    // ── Remove existing icon 
    const shouldRemove = removeIcon === "true" || removeIcon === true
    if (shouldRemove && group.groupIconPublicId) {
      await deleteFromCloudinary(group.groupIconPublicId).catch(console.error)
      group.groupIcon          = ""
      group.groupIconPublicId  = ""
      updated = true
    }

    // ── Upload new icon 
    if (req.file) {
      // Delete old icon from Cloudinary first
      if (group.groupIconPublicId) {
        await deleteFromCloudinary(group.groupIconPublicId).catch(console.error)
      }
      try {
        const { url, publicId } = await uploadToCloudinary(
          req.file.path,
          groupIconPublicId(group._id)
        )
        group.groupIcon         = url
        group.groupIconPublicId = publicId
        updated = true
      } catch (uploadErr) {
        return res.status(500).json({
          success: false,
          message: "Icon upload failed: " + uploadErr.message
        })
      } finally {
        fs.unlink(req.file.path, () => {})
      }
    }

    if (!updated) {
      return res.status(400).json({ success: false, message: "No changes were provided" })
    }

    await group.save()

    const io = safeGetIO()
    emitToGroupMembers(io, group.participants, GROUP_EVENTS.INFO_UPDATED, {
      groupId:   group._id,
      groupName: group.groupName,
      groupIcon: group.groupIcon,
      updatedBy: { _id: req.user._id, name: req.user.name }
    })

    return res.status(200).json({
      success: true,
      message: "Group info updated successfully",
      group: {
        _id:       group._id,
        groupName: group.groupName,
        groupIcon: group.groupIcon
      }
    })
  } catch (error) {
    if (req.file) fs.unlink(req.file.path, () => {})
    return res.status(500).json({ success: false, message: error.message || "Internal server error" })
  }
}


// Get Group Members Controller
export const getGroupMembers = async (req, res) => {
  try {
    const { search } = req.query
    const group      = req.group

    const populated = await Conversation.findById(group._id)
      .populate("participants", "name email profilePic bio isOnline lastSeen")

    let members = populated.participants.map(p => formatMemberWithRole(p, group))

    if (search) {
      const q = search.toLowerCase()
      members = members.filter(
        m => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
      )
    }

    const roleOrder = { super_admin: 0, admin: 1, member: 2 }
    members.sort((a, b) => roleOrder[a.role] - roleOrder[b.role])

    return res.status(200).json({ success: true, members, total: members.length })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Internal server error" })
  }
}


// Add a Member Controller
export const addMembers = async (req, res) => {
  try {
    const group = req.group
    let { memberIds = [] } = req.body

    if (!Array.isArray(memberIds)) {
      memberIds = String(memberIds).split(",").map(s => s.trim()).filter(Boolean)
    }

    if (!memberIds.length) {
      return res.status(400).json({ success: false, message: "No member IDs provided" })
    }

    if (!validateObjectIds(memberIds)) {
      return res.status(400).json({ success: false, message: "One or more member IDs are invalid" })
    }

    // Filter out already-present participants
    const existingIds   = group.participants.map(p => p.toString())
    const uniqueNew     = [...new Set(memberIds.map(id => id.toString()))]
      .filter(id => !existingIds.includes(id))

    if (!uniqueNew.length) {
      return res.status(400).json({ success: false, message: "All provided users are already members" })
    }

    // Check max group size
    if (group.participants.length + uniqueNew.length > MAX_GROUP_MEMBERS) {
      return res.status(400).json({
        success: false,
        message: `Adding these users would exceed the ${MAX_GROUP_MEMBERS}-member limit`
      })
    }

    // Verify every new user exists
    const validUsers = await User.find({ _id: { $in: uniqueNew } }).select("_id name profilePic")
    if (validUsers.length !== uniqueNew.length) {
      return res.status(404).json({ success: false, message: "One or more users were not found" })
    }

    await Conversation.findByIdAndUpdate(group._id, {
      $addToSet: { participants: { $each: uniqueNew } }
    })

    // Get updated participant list for socket emission
    const updated = await Conversation.findById(group._id).select("participants")
    const io      = safeGetIO()

    emitToGroupMembers(io, updated.participants, GROUP_EVENTS.MEMBER_ADDED, {
      groupId:       group._id,
      groupName:     group.groupName,
      addedMembers:  validUsers,
      addedBy:       { _id: req.user._id, name: req.user.name },
      totalMembers:  updated.participants.length
    })

    // Notification for new members
    await bulkCreateNotifications(uniqueNew, req.user._id, "group-add", group._id)

    return res.status(200).json({
      success:      true,
      message:      `${uniqueNew.length} member(s) added successfully`,
      addedCount:   uniqueNew.length,
      skippedCount: memberIds.length - uniqueNew.length,
      totalMembers: updated.participants.length
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Internal server error" })
  }
}


// Remove Member Controller
export const removeMember = async (req, res) => {
  try {
    const { userId: targetId } = req.params
    const group                = req.group
    const actorId              = req.user._id.toString()

    // Self-removal via this route is not allowed — use leaveGroup
    if (targetId === actorId) {
      return res.status(400).json({
        success: false,
        message: "Use the leave group endpoint to remove yourself"
      })
    }

    // Only the super admin can remove another admin
    if (isGroupAdmin(group, targetId) && !isGroupSuperAdmin(group, actorId)) {
      return res.status(403).json({
        success: false,
        message: "Only the group owner can remove another admin"
      })
    }

    await Conversation.findByIdAndUpdate(group._id, {
      $pull: { participants: targetId, admins: targetId }
    })

    const io = safeGetIO()

    // Tell the removed user they were kicked
    io?.to(targetId).emit(GROUP_EVENTS.MEMBER_REMOVED, {
      groupId:   group._id,
      groupName: group.groupName,
      removedBy: { _id: req.user._id, name: req.user.name },
      self:      true
    })

    // Tell remaining members
    const remaining = group.participants.filter(p => p.toString() !== targetId)
    emitToGroupMembers(io, remaining, GROUP_EVENTS.MEMBER_REMOVED, {
      groupId:       group._id,
      removedUserId: targetId,
      removedBy:     { _id: req.user._id, name: req.user.name }
    })
    return res.status(200).json({ success: true, message: "Member removed from the group" })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Internal server error" })
  }
}



// Promote Member To Admin Controller
export const promoteToAdmin = async (req, res) => {
  try {
    const { userId: targetId } = req.params
    const group                = req.group

    if (isGroupAdmin(group, targetId)) {
      return res.status(400).json({ success: false, message: "User is already an admin" })
    }

    await Conversation.findByIdAndUpdate(group._id, {
      $addToSet: { admins: targetId }
    })

    const targetUser = await User.findById(targetId).select("name email")

    const io = safeGetIO()
    emitToGroupMembers(io, group.participants, GROUP_EVENTS.ADMIN_PROMOTED, {
      groupId:         group._id,
      promotedUserId:  targetId,
      promotedBy:      { _id: req.user._id, name: req.user.name }
    })

    // Non-blocking email notification
    sendGroupPromotionEmail(targetUser.email, targetUser.name, group.groupName)
      .catch(err => console.error("Promotion email failed:", err))

    return res.status(200).json({
      success: true,
      message: `${targetUser.name} has been promoted to admin`
    })

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Internal server error" })
  }
}


// Demote Admin To Member Controller
export const demoteAdmin = async (req, res) => {
  try {
    const { userId: targetId } = req.params
    const group                = req.group

    if (!isGroupAdmin(group, targetId)) {
      return res.status(400).json({ success: false, message: "User is not an admin" })
    }

    await Conversation.findByIdAndUpdate(group._id, {
      $pull: { admins: targetId }
    })

    const targetUser = await User.findById(targetId).select("name email")

    const io = safeGetIO()
    emitToGroupMembers(io, group.participants, GROUP_EVENTS.ADMIN_DEMOTED, {
      groupId:       group._id,
      demotedUserId: targetId,
      demotedBy:     { _id: req.user._id, name: req.user.name }
    })

    // Non-blocking email notification
    sendGroupDemotionEmail(targetUser.email, targetUser.name, group.groupName)
      .catch(err => console.error("Demotion email failed:", err))

    return res.status(200).json({
      success: true,
      message: `${targetUser.name} has been demoted to member`
    })

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Internal server error" })
  }
}


// Toggle Message Restriction Controller
export const toggleRestriction = async (req, res) => {
  try {
    const group    = req.group
    const newState = !group.isRestricted

    await Conversation.findByIdAndUpdate(group._id, { isRestricted: newState })

    const io = safeGetIO()
    emitToGroupMembers(io, group.participants, GROUP_EVENTS.RESTRICTION_TOGGLED, {
      groupId:      group._id,
      isRestricted: newState,
      changedBy:    { _id: req.user._id, name: req.user.name }
    })

    return res.status(200).json({
      success:      true,
      isRestricted: newState,
      message:      newState
        ? "Group is now restricted — only admins can send messages"
        : "Group restriction lifted — all members can send messages"
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Internal server error" })
  }
}


// Group Leave Controller
export const leaveGroup = async (req, res) => {
  try {
    const group             = req.group
    const userId            = req.user._id.toString()
    const isSA              = isGroupSuperAdmin(group, userId)
    const remainingMembers  = group.participants.filter(p => p.toString() !== userId)

    // ── Last member: delete the group 
    if (!remainingMembers.length) {
      if (group.groupIconPublicId) {
        await deleteFromCloudinary(group.groupIconPublicId).catch(console.error)
      }
      await Promise.all([
        Message.deleteMany({ conversation: group._id }),
        Notification.deleteMany({ conversation: group._id }),
        Conversation.findByIdAndDelete(group._id)
      ])
      return res.status(200).json({
        success: true,
        message: "You left. The group was deleted as you were the last member."
      })
    }

    // ── Super admin leaving: transfer ownership 
    if (isSA) {
      const remainingAdmins = group.admins
        .map(a => a.toString())
        .filter(id => id !== userId)

      const newOwnerId = remainingAdmins.length
        ? remainingAdmins[0]
        : remainingMembers[0].toString()

      await Conversation.findByIdAndUpdate(group._id, {
        groupAdmin:        newOwnerId,
        $addToSet: { admins: newOwnerId },
        $pull:     { participants: userId, admins: userId }
      })

      // Notify the new owner
      const newOwner = await User.findById(newOwnerId).select("name email")
      sendGroupPromotionEmail(newOwner.email, newOwner.name, group.groupName)
        .catch(console.error)

    } else {
      // ── Regular member / admin leaving 
      await Conversation.findByIdAndUpdate(group._id, {
        $pull: { participants: userId, admins: userId }
      })
    }

    const io = safeGetIO()
    emitToGroupMembers(io, remainingMembers, GROUP_EVENTS.MEMBER_LEFT, {
      groupId:  group._id,
      leftUser: { _id: req.user._id, name: req.user.name }
    })

    return res.status(200).json({ success: true, message: "You have left the group" })

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Internal server error" })
  }
}


// Ownership Transform Controller
export const transferOwnership = async (req, res) => {
  try {
    const { userId: targetId } = req.body
    const group                = req.group
    const actorId              = req.user._id.toString()

    if (!targetId) {
      return res.status(400).json({ success: false, message: "Target user ID is required" })
    }

    if (targetId === actorId) {
      return res.status(400).json({ success: false, message: "You are already the group owner" })
    }

    if (!isGroupMember(group, targetId)) {
      return res.status(400).json({ success: false, message: "Target user is not a group member" })
    }

    // Make the target an admin too (owner must also be an admin)
    await Conversation.findByIdAndUpdate(group._id, {
      groupAdmin:        targetId,
      $addToSet: { admins: targetId }
    })

    const targetUser = await User.findById(targetId).select("name email")

    const io = safeGetIO()
    emitToGroupMembers(io, group.participants, GROUP_EVENTS.OWNERSHIP_TRANSFERRED, {
      groupId:        group._id,
      newOwner:       { _id: targetId,        name: targetUser.name },
      previousOwner:  { _id: req.user._id,    name: req.user.name }
    })

    sendGroupPromotionEmail(targetUser.email, targetUser.name, group.groupName)
      .catch(console.error)

    return res.status(200).json({
      success: true,
      message: `Group ownership transferred to ${targetUser.name}`
    })

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Internal server error" })
  }
}


// Group Delete Controller
export const deleteGroup = async (req, res) => {
  try {
    const group = req.group

    // Emit BEFORE deletion so we still know who the participants are
    const io = safeGetIO()
    emitToGroupMembers(io, group.participants, GROUP_EVENTS.DELETED, {
      groupId:   group._id,
      groupName: group.groupName,
      deletedBy: { _id: req.user._id, name: req.user.name }
    })

    // Cloudinary icon cleanup
    if (group.groupIconPublicId) {
      await deleteFromCloudinary(group.groupIconPublicId).catch(console.error)
    }

    // Cascade delete — run in parallel for speed
    await Promise.all([
      Message.deleteMany({ conversation: group._id }),
      Notification.deleteMany({ conversation: group._id }),
      Conversation.findByIdAndDelete(group._id)
    ])
    return res.status(200).json({ success: true, message: "Group deleted successfully" })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Internal server error" })
  }
}


// Invite Link Generator Controller
export const generateInviteLink = async (req, res) => {
  try {
    const group = req.group
    const token = generateGroupInviteToken(group._id)

    // Derive the client base URL from .env; fall back to localhost for dev
    const baseUrl   = (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "")
    const inviteUrl = `${baseUrl}/join-group?token=${token}`

    return res.status(200).json({
      success:   true,
      inviteUrl,
      token,
      expiresIn: "7 days",
      groupName: group.groupName
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Internal server error" })
  }
}


// Join Via Invite Link Controller
export const joinViaInvite = async (req, res) => {
  try {
    const { token }  = req.params
    const userId     = req.user._id

    // Decode and validate the invite token
    let groupId
    try {
      groupId = verifyGroupInviteToken(token)
    } catch {
      return res.status(400).json({ success: false, message: "Invalid or expired invite link" })
    }

    const group = await Conversation.findById(groupId)
    if (!group || group.type !== "group") {
      return res.status(404).json({ success: false, message: "Group not found" })
    }

    if (isGroupMember(group, userId)) {
      return res.status(400).json({ success: false, message: "You are already a member of this group" })
    }

    if (group.participants.length >= MAX_GROUP_MEMBERS) {
      return res.status(400).json({ success: false, message: "This group is full" })
    }

    await Conversation.findByIdAndUpdate(groupId, {
      $addToSet: { participants: userId }
    })

    const io             = safeGetIO()
    const allParticipants = [...group.participants.map(p => p.toString()), userId.toString()]

    emitToGroupMembers(io, allParticipants, GROUP_EVENTS.MEMBER_ADDED, {
      groupId,
      groupName:     group.groupName,
      addedMembers:  [{ _id: userId, name: req.user.name, profilePic: req.user.profilePic }],
      addedBy:       { _id: userId, name: req.user.name },
      joinedViaInvite: true
    })
    return res.status(200).json({
      success:   true,
      message:   `You have joined "${group.groupName}"`,
      groupId:   group._id,
      groupName: group.groupName
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Internal server error" })
  }
}


// User Mentioned Controller
export const getMentionSuggestions = async (req, res) => {
  try {
    const { query = "" } = req.query
    const group          = req.group
    const populated = await Conversation.findById(group._id)
      .populate("participants", "name profilePic isOnline")

    // Exclude the requesting user from their own mention list
    let members = populated.participants
      .filter(p => p._id.toString() !== req.user._id.toString())
      .map(p => ({
        _id:        p._id,
        name:       p.name,
        profilePic: p.profilePic,
        isOnline:   p.isOnline,
        // The handle a user would type: @first.last
        handle:     `@${p.name.trim().replace(/\s+/g, ".")}`
      }))

    if (query) {
      const q = query.toLowerCase()
      members = members.filter(
        m => m.name.toLowerCase().includes(q) || m.handle.toLowerCase().includes(q)
      )
    }
    return res.status(200).json({ success: true, suggestions: members })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Internal server error" })
  }
}


// Check Send Permission Controller
export const checkSendPermission = async (req, res) => {
  try {
    const group   = req.group
    const allowed = canSendMessage(group, req.user._id)
    return res.status(200).json({
      success:      true,
      canSend:      allowed,
      isRestricted: group.isRestricted,
      reason:       allowed ? null : "Only admins can send messages in this group"
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Internal server error" })
  }
}