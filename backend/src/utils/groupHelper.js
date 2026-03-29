import jwt from "jsonwebtoken"
import mongoose from "mongoose"

// ─────────────────────────────────────────────────────────────────────────────
//  Constants
// ─────────────────────────────────────────────────────────────────────────────

export const GROUP_ROLES = Object.freeze({
  SUPER_ADMIN: "super_admin",   // Original creator / current owner
  ADMIN: "admin",               // Promoted admin
  MEMBER: "member"              // Regular participant
})

/** Socket event names — keep in sync with frontend listeners */
export const GROUP_EVENTS = Object.freeze({
  CREATED:               "group:created",
  INFO_UPDATED:          "group:info-updated",
  MEMBER_ADDED:          "group:member-added",
  MEMBER_REMOVED:        "group:member-removed",
  ADMIN_PROMOTED:        "group:admin-promoted",
  ADMIN_DEMOTED:         "group:admin-demoted",
  RESTRICTION_TOGGLED:   "group:restriction-toggled",
  OWNERSHIP_TRANSFERRED: "group:ownership-transferred",
  MEMBER_LEFT:           "group:member-left",
  DELETED:               "group:deleted"
})

export const MAX_GROUP_MEMBERS    = 256
export const MAX_GROUP_NAME_LEN   = 100
export const INVITE_TOKEN_EXPIRY  = "7d"

// ─────────────────────────────────────────────────────────────────────────────
//  Role Predicates
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns true if userId is listed in conversation.participants.
 * Works with both ObjectId[] and populated objects.
 */
export const isGroupMember = (conversation, userId) => {
  const id = userId.toString()
  return conversation.participants.some(p => p._id?.toString() === id || p.toString() === id)
}

/**
 * Returns true if userId is in conversation.admins (includes super admin).
 */
export const isGroupAdmin = (conversation, userId) => {
  const id = userId.toString()
  return conversation.admins.some(a => a._id?.toString() === id || a.toString() === id)
}

/**
 * Returns true if userId matches conversation.groupAdmin (the single owner/creator).
 */
export const isGroupSuperAdmin = (conversation, userId) => {
  if (!conversation.groupAdmin) return false
  const gid = conversation.groupAdmin._id?.toString() ?? conversation.groupAdmin.toString()
  return gid === userId.toString()
}

/** Returns true when the user is allowed to post messages in the group. */
export const canSendMessage = (conversation, userId) => {
  if (!conversation.isRestricted) return true
  return isGroupAdmin(conversation, userId)
}

/** Derives a user's display role for the group. */
export const getUserRole = (conversation, userId) => {
  if (isGroupSuperAdmin(conversation, userId)) return GROUP_ROLES.SUPER_ADMIN
  if (isGroupAdmin(conversation, userId))      return GROUP_ROLES.ADMIN
  return GROUP_ROLES.MEMBER
}

// ─────────────────────────────────────────────────────────────────────────────
//  Response Formatters
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Formats a single populated participant with their group role.
 * @param {object} member     - Populated User document
 * @param {object} conversation - Conversation document (may be un-populated)
 */
export const formatMemberWithRole = (member, conversation) => {
  const memberId = member._id.toString()
  return {
    _id:        member._id,
    name:       member.name,
    email:      member.email,
    profilePic: member.profilePic,
    bio:        member.bio,
    isOnline:   member.isOnline,
    lastSeen:   member.lastSeen,
    role:       getUserRole(conversation, memberId)
  }
}

/**
 * Builds a group summary object tailored to the requesting user's permissions.
 * @param {object} conversation   - Mongoose Conversation document
 * @param {string|ObjectId} requestingUserId
 */
export const formatGroupDetails = (conversation, requestingUserId) => {
  const uid = requestingUserId.toString()
  return {
    _id:              conversation._id,
    groupName:        conversation.groupName,
    groupIcon:        conversation.groupIcon,
    isRestricted:     conversation.isRestricted,
    type:             conversation.type,
    participantCount: conversation.participants.length,
    lastMessage:      conversation.lastMessage ?? null,
    myRole:           getUserRole(conversation, uid),
    isAdmin:          isGroupAdmin(conversation, uid),
    isSuperAdmin:     isGroupSuperAdmin(conversation, uid),
    canSend:          canSendMessage(conversation, uid),
    createdAt:        conversation.createdAt,
    updatedAt:        conversation.updatedAt
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  @Mention Utilities
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extracts all @mention tokens from a message string.
 * Supports alphanumeric names with dots: @john, @john.doe
 * Returns a deduplicated lowercase array.
 */
export const parseMentions = (content) => {
  if (!content) return []
  const regex = /@([\w.]+)/g
  const hits  = []
  let m
  while ((m = regex.exec(content)) !== null) {
    hits.push(m[1].toLowerCase())
  }
  return [...new Set(hits)]
}

/**
 * Maps @mention tokens in content to matching participant user IDs.
 * Matching is fuzzy: "john.doe", "johndoe", or a prefix match.
 *
 * @param {string}   content      - Raw message content
 * @param {object[]} participants - Populated User objects with `name` and `_id`
 * @returns {ObjectId[]} Array of matched user IDs
 */
export const resolveMentionedUsers = (content, participants) => {
  const tokens = parseMentions(content)
  if (!tokens.length) return []

  return participants
    .filter(p => {
      const flatDot  = p.name.toLowerCase().replace(/\s+/g, ".")
      const flatNone = p.name.toLowerCase().replace(/\s+/g, "")
      const plain    = p.name.toLowerCase()
      return tokens.some(t =>
        flatDot  === t ||
        flatNone === t ||
        plain    === t ||
        flatDot.startsWith(t) ||
        plain.startsWith(t)
      )
    })
    .map(p => p._id)
}

// ─────────────────────────────────────────────────────────────────────────────
//  Invite-Link Utilities (JWT-based, no model change needed)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a signed JWT that encodes the group ID.
 * Uses ACCESS_TOKEN secret so no extra env var is needed.
 */
export const generateGroupInviteToken = (groupId) => {
  return jwt.sign(
    { groupId: groupId.toString(), type: "group_invite" },
    process.env.ACCESS_TOKEN,
    { expiresIn: INVITE_TOKEN_EXPIRY }
  )
}

/**
 * Verifies and decodes a group invite JWT.
 * Throws if invalid, expired, or wrong type.
 * @returns {string} groupId
 */
export const verifyGroupInviteToken = (token) => {
  const decoded = jwt.verify(token, process.env.ACCESS_TOKEN)
  if (decoded.type !== "group_invite") {
    throw new Error("Token is not a valid group invite")
  }
  return decoded.groupId
}

// ─────────────────────────────────────────────────────────────────────────────
//  Validation Utilities
// ─────────────────────────────────────────────────────────────────────────────

/** Returns true only if every id in the array is a valid Mongo ObjectId. */
export const validateObjectIds = (ids) =>
  ids.every(id => mongoose.Types.ObjectId.isValid(id))

/** Trims and collapses internal whitespace in a group name. */
export const sanitizeGroupName = (name) =>
  name?.trim().replace(/\s+/g, " ") ?? ""

// ─────────────────────────────────────────────────────────────────────────────
//  Socket Emission Helper
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Emits a socket event to every participant in the group.
 * Each user is assumed to have joined a room with their own userId string.
 *
 * @param {Server|null} io          - Socket.io Server instance (may be null)
 * @param {Array}       participants - Array of ObjectIds or { _id } objects
 * @param {string}      event       - Event name (use GROUP_EVENTS constants)
 * @param {object}      payload     - Data to emit
 */
export const emitToGroupMembers = (io, participants, event, payload) => {
  if (!io) return
  participants.forEach(p => {
    const roomId = p._id?.toString() ?? p.toString()
    io.to(roomId).emit(event, payload)
  })
}