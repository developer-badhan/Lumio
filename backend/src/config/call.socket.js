import Call from "../models/call.model.js"
import Conversation from "../models/conversation.model.js"
import Notification from "../models/notification.model.js"

const emitToUser = (io, onlineUsers, targetId, event, data) => {
  const sockets = onlineUsers.get(targetId.toString())
  if (sockets) sockets.forEach(sid => io.to(sid).emit(event, data))
}

export const registerCallHandlers = (socket, io, onlineUsers) => {
  // ── BUG 1 FIX ──────────────────────────────────────────────────────────────
  // socket.js auth middleware stores the user as socket.user = { _id, name }
  // so the correct property is socket.user._id — NOT socket.userId.
  // socket.userId was never set, so it was undefined, which caused the
  // participant guard inside call:initiate to always return early, preventing
  // call:incoming from ever being emitted to the callee.
  // ── BUG 2 FIX ──────────────────────────────────────────────────────────────
  // The diagnostic console.log and duplicate "const userId = socket.userId"
  // were accidentally pasted inside the call:initiate handler instead of here.
  // Both have been removed — all handlers now use the single correct userId below.
  const userId = socket.user._id   


  // ── call:initiate ─────────────────────────────────────────────────────────
  // Payload: { conversationId, callType: "audio"|"video", offer }
  socket.on("call:initiate", async (data) => {
    try {
      const { conversationId, callType, offer } = data
      if (!conversationId || !callType || !offer) return

      const conversation = await Conversation.findById(conversationId)
        .populate("participants", "name profilePic")
      if (!conversation) return

      if (!conversation.participants.some(p => p._id.toString() === userId)) return

      const others = conversation.participants.filter(p => p._id.toString() !== userId)

      const call = await Call.create({
        conversation,
        initiator:        userId,
        callType,
        conversationType: conversation.type === "group" ? "group" : "private",
        status:           "initiated",
        participants:     others.map(p => ({ user: p._id, status: "pending" }))
      })

      const populated = await Call.findById(call._id)
        .populate("initiator", "name profilePic")
        .populate("participants.user", "name profilePic")

      const offlineIds = []

      for (const peer of others) {
        const pid = peer._id.toString()
        const peerSockets = onlineUsers.get(pid)

        if (peerSockets?.size > 0) {
          peerSockets.forEach(sid =>
            io.to(sid).emit("call:incoming", {
              callId: call._id,
              callType,
              conversationId,
              conversationType: conversation.type,
              groupName: conversation.groupName || null,
              caller: {
                _id:        userId,
                name:       populated.initiator.name,
                profilePic: populated.initiator.profilePic
              },
              offer
            })
          )
        } else {
          offlineIds.push(pid)
        }
      }

      // Private call, callee offline → immediate missed
      if (conversation.type === "private" && offlineIds.length > 0) {
        await Call.findByIdAndUpdate(call._id, {
          status: "missed",
          endedAt: new Date()
        })
        await Notification.insertMany(
          offlineIds.map(id => ({
            recipient: id, sender: userId, type: "call", conversation: conversationId
          }))
        )
        return socket.emit("call:missed", { callId: call._id, reason: "User is offline" })
      }

      socket.emit("call:initiated", { callId: call._id, call: populated })

    } catch (err) {
      console.error("call:initiate:", err.message)
      socket.emit("call:error", { message: "Failed to initiate call" })
    }
  })


  // ── call:answer ────────────────────────────────────────────────────────────
  // Payload: { callId, answer }
  socket.on("call:answer", async ({ callId, answer } = {}) => {
    try {
      if (!callId || !answer) return

      const call = await Call.findById(callId)
      if (!call) return

      const entry = call.participants.find(p => p.user.toString() === userId)
      if (!entry) return

      entry.status   = "accepted"
      entry.joinedAt = new Date()
      if (call.status === "initiated") {
        call.status    = "ongoing"
        call.startedAt = new Date()
      }
      await call.save()

      emitToUser(io, onlineUsers, call.initiator.toString(), "call:accepted", {
        callId, answer, answeredBy: userId
      })

      // Group: tell other accepted peers that this user joined
      if (call.conversationType === "group") {
        const peers = call.participants.filter(
          p => p.status === "accepted" && p.user.toString() !== userId
        )
        peers.forEach(p =>
          emitToUser(io, onlineUsers, p.user.toString(), "call:user-joined", { callId, userId })
        )
      }

    } catch (err) {
      console.error("call:answer:", err.message)
    }
  })


  // ── call:reject ────────────────────────────────────────────────────────────
  // Payload: { callId }
  socket.on("call:reject", async ({ callId } = {}) => {
    try {
      if (!callId) return
      const call = await Call.findById(callId)
      if (!call) return

      const entry = call.participants.find(p => p.user.toString() === userId)
      if (entry) entry.status = "rejected"

      if (call.conversationType === "private") {
        call.status  = "rejected"
        call.endedAt = new Date()
      } else if (call.participants.every(p => p.status === "rejected")) {
        call.status  = "missed"
        call.endedAt = new Date()
      }
      await call.save()

      emitToUser(io, onlineUsers, call.initiator.toString(), "call:rejected", {
        callId, rejectedBy: userId
      })
    } catch (err) {
      console.error("call:reject:", err.message)
    }
  })


  // ── call:end ───────────────────────────────────────────────────────────────
  // Payload: { callId }
  socket.on("call:end", async ({ callId } = {}) => {
    try {
      if (!callId) return
      const call = await Call.findById(callId)
      if (!call) return

      const isInitiator = call.initiator.toString() === userId
      const entry = call.participants.find(p => p.user.toString() === userId)
      const now = new Date()

      if (entry) entry.leftAt = now

      if (call.conversationType === "private" || isInitiator) {
        call.status  = "ended"
        call.endedAt = now
        if (call.startedAt) call.duration = Math.round((now - call.startedAt) / 1000)
        call.participants.forEach(p => { if (p.status === "pending") p.status = "missed" })
      }
      await call.save()

      const allPeerIds = [
        call.initiator.toString(),
        ...call.participants.map(p => p.user.toString())
      ].filter(id => id !== userId)

      allPeerIds.forEach(pid =>
        emitToUser(io, onlineUsers, pid, "call:ended", {
          callId, endedBy: userId, duration: call.duration
        })
      )
    } catch (err) {
      console.error("call:end:", err.message)
    }
  })


  // ── call:ice-candidate ─────────────────────────────────────────────────────
  // Payload: { callId, targetUserId, candidate }
  socket.on("call:ice-candidate", ({ callId, targetUserId, candidate } = {}) => {
    if (!callId || !targetUserId || !candidate) return
    emitToUser(io, onlineUsers, targetUserId, "call:ice-candidate", {
      callId, candidate, fromUserId: userId
    })
  })


  // ── call:offer (group mesh) ────────────────────────────────────────────────
  // Payload: { callId, targetUserId, offer }
  socket.on("call:offer", ({ callId, targetUserId, offer } = {}) => {
    if (!callId || !targetUserId || !offer) return
    emitToUser(io, onlineUsers, targetUserId, "call:offer", {
      callId, offer, fromUserId: userId
    })
  })


  // ── call:answer-sdp (group mesh) ───────────────────────────────────────────
  // Payload: { callId, targetUserId, answer }
  socket.on("call:answer-sdp", ({ callId, targetUserId, answer } = {}) => {
    if (!callId || !targetUserId || !answer) return
    emitToUser(io, onlineUsers, targetUserId, "call:answer-sdp", {
      callId, answer, fromUserId: userId
    })
  })


  // ── call:busy ──────────────────────────────────────────────────────────────
  // Payload: { callId }
  socket.on("call:busy", async ({ callId } = {}) => {
    try {
      if (!callId) return
      const call = await Call.findById(callId)
      if (!call) return

      const entry = call.participants.find(p => p.user.toString() === userId)
      if (entry) { entry.status = "busy"; await call.save() }

      emitToUser(io, onlineUsers, call.initiator.toString(), "call:busy", {
        callId, busyUserId: userId
      })
    } catch (err) {
      console.error("call:busy:", err.message)
    }
  })


  // ── call:toggle-media ──────────────────────────────────────────────────────
  // No DB write — real-time UI sync only.
  // Payload: { callId, audio?: boolean, video?: boolean }
  socket.on("call:toggle-media", async ({ callId, audio, video } = {}) => {
    try {
      if (!callId) return
      const call = await Call.findById(callId).select("initiator participants")
      if (!call) return

      const peers = [
        call.initiator.toString(),
        ...call.participants.map(p => p.user.toString())
      ].filter(id => id !== userId)

      peers.forEach(pid =>
        emitToUser(io, onlineUsers, pid, "call:media-toggled", {
          callId, userId, audio, video
        })
      )
    } catch (err) {
      console.error("call:toggle-media:", err.message)
    }
  })
}