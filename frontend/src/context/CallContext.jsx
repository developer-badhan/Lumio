import React, {
  createContext,
  useContext,
  useReducer,
  useRef,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { SocketContext } from './SocketContext.jsx';
import { useAuth } from './AuthContext.jsx';

// Central state manager for the entire calling system. Responsibilities:
//   1. WebRTC — peer connection lifecycle, offer/answer/ICE exchange
//   2. Socket signaling — all call:* socket events are listened to here
//   3. Media — getUserMedia, local stream start/stop, mute/camera toggle
//   4. State — exposes callStatus, incomingCall, activeCall, streams to UI
//
// Architecture:
//   SocketContext  →  CallContext  →  useCall hook  →  UI components
//
// For 1-to-1 calls: one RTCPeerConnection keyed 'remote' (then re-keyed to userId)
// For group calls:  one RTCPeerConnection per remote peer, keyed by userId (mesh)

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};



// ── Call state shape ──────────────────────────────────────────────────────────
//
// callStatus:    'idle' | 'incoming' | 'calling' | 'active'
// incomingCall:  null | { callId, callType, conversationId, conversationType,
//                         groupName, caller: { _id, name, profilePic }, offer }
// activeCall:    null | { callId, callType, conversationType, conversationId }
// remoteStreams: { [userId: string]: MediaStream }
// isMuted:       local audio track disabled
// isCameraOff:   local video track disabled
// ─────────────────────────────────────────────────────────────────────────────

const initialState = {
  callStatus:    'idle',
  incomingCall:  null,
  activeCall:    null,
  remoteStreams: {},
  isMuted:       false,
  isCameraOff:   false,
};

function callReducer(state, action) {
  switch (action.type) {

    case 'INCOMING_CALL':
      return { ...state, callStatus: 'incoming', incomingCall: action.payload };

    case 'OUTGOING_CALL':
      return {
        ...state,
        callStatus:   'calling',
        activeCall:   action.payload,
        incomingCall: null,
      };

    // ── Bug 3 Fix (previous session) ─────────────────────────────────────────
    // BEFORE: activeCall: action.payload ?? state.activeCall  ← full REPLACE
    //         onAccepted dispatches only { callId } so callType / conversationId
    //         / conversationType were wiped → caller rendered audio UI on video.
    // AFTER:  Merge payload into existing activeCall — absent fields preserved.
    // ─────────────────────────────────────────────────────────────────────────
    case 'CALL_ACTIVE':
      return {
        ...state,
        callStatus:   'active',
        activeCall:   action.payload
          ? { ...state.activeCall, ...action.payload }
          : state.activeCall,
        incomingCall: null,
      };

    case 'REMOTE_STREAM_ADDED':
      return {
        ...state,
        remoteStreams: { ...state.remoteStreams, [action.userId]: action.stream },
      };

    case 'REMOTE_STREAM_REMOVED': {
      const { [action.userId]: _dropped, ...remaining } = state.remoteStreams;
      return { ...state, remoteStreams: remaining };
    }

    case 'TOGGLE_MUTE':
      return { ...state, isMuted: !state.isMuted };

    case 'TOGGLE_CAMERA':
      return { ...state, isCameraOff: !state.isCameraOff };

    case 'RESET':
      return { ...initialState };

    default:
      return state;
  }
}

export const CallContext = createContext();

export const CallProvider = ({ children }) => {
  const { socket }            = useContext(SocketContext);
  const { user: currentUser } = useAuth();

  const [state, dispatch] = useReducer(callReducer, initialState);

  // localStream in both state (re-renders JSX) and ref (stable inside callbacks)
  const [localStream, setLocalStream] = useState(null);
  const localStreamRef                = useRef(null);

  // One RTCPeerConnection per remote peer.
  // Key = userId (or 'remote' placeholder for outgoing 1-to-1 before callee answers)
  const peerConnectionsRef = useRef(new Map());

  // ICE candidates buffered before setRemoteDescription is applied.
  const pendingCandidatesRef = useRef(new Map());

  // Stable ref to the latest callId — socket handlers read this without going stale.
  const activeCallIdRef = useRef(null);

  // Stable ref to callStatus — used in the onIncoming busy-guard.
  const callStatusRef = useRef('idle');
  useEffect(() => {
    callStatusRef.current = state.callStatus;
  }, [state.callStatus]);

  // ── Private helpers ───────────────────────────────────────────────────────

  const acquireLocalStream = async (callType) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: callType === 'video',
    });
    localStreamRef.current = stream;
    setLocalStream(stream);
    return stream;
  };

  const releaseLocalStream = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    }
  }, []);

  const createPeerConnection = useCallback((callId, targetUserId) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = ({ candidate }) => {
      if (candidate && socket) {
        socket.emit('call:ice-candidate', {
          callId,
          targetUserId,
          candidate: candidate.toJSON(),
        });
      }
    };

    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (remoteStream) {
        dispatch({ type: 'REMOTE_STREAM_ADDED', userId: targetUserId, stream: remoteStream });
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`[Call] ICE (${targetUserId}): ${pc.iceConnectionState}`);
    };

    peerConnectionsRef.current.set(targetUserId, pc);
    return pc;
  }, [socket]);

  const closePeerConnection = useCallback((userId) => {
    const pc = peerConnectionsRef.current.get(userId);
    if (pc) {
      pc.onicecandidate = null;
      pc.ontrack        = null;
      pc.close();
      peerConnectionsRef.current.delete(userId);
      dispatch({ type: 'REMOTE_STREAM_REMOVED', userId });
    }
  }, []);

  const teardownCall = useCallback(() => {
    [...peerConnectionsRef.current.keys()].forEach((uid) => closePeerConnection(uid));
    releaseLocalStream();
    pendingCandidatesRef.current.clear();
    activeCallIdRef.current = null;
    dispatch({ type: 'RESET' });
  }, [closePeerConnection, releaseLocalStream]);

  // ── Public call actions ───────────────────────────────────────────────────

  const initiateCall = useCallback(async (conversationId, callType) => {
    if (!socket || callStatusRef.current !== 'idle') return;

    try {
      const stream = await acquireLocalStream(callType);

      // Placeholder key 'remote' — onicecandidate and ontrack are both replaced
      // with real values in onAccepted once the callee answers (Bug 2 / Bug 6 fixes).
      const pc = createPeerConnection('pending', 'remote');
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit('call:initiate', { conversationId, callType, offer: pc.localDescription });

      dispatch({
        type:    'OUTGOING_CALL',
        payload: { conversationId, callType, conversationType: 'private' },
      });

    } catch (err) {
      console.error('[Call] initiateCall failed:', err.message);
      teardownCall();
    }
  }, [socket, createPeerConnection, teardownCall]);

  // ── Bug 1 Fix (previous session) ─────────────────────────────────────────
  // acquireLocalStream is isolated in its own try/catch. On media failure we
  // emit call:reject so the caller sees a clean rejection, then bail early.
  // ─────────────────────────────────────────────────────────────────────────
  const acceptCall = useCallback(async () => {
    const incoming = state.incomingCall;
    if (!incoming || !socket) return;

    const { callId, callType, offer, caller, conversationId, conversationType } = incoming;

    let stream;
    try {
      stream = await acquireLocalStream(callType);
    } catch (err) {
      console.error('[Call] Media access denied — cannot accept call:', err.message);
      socket.emit('call:reject', { callId });
      teardownCall();
      return;
    }

    try {
      activeCallIdRef.current = callId;

      const pc = createPeerConnection(callId, caller._id);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      const buffered = pendingCandidatesRef.current.get(caller._id) ?? [];
      for (const c of buffered) {
        try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch (_) {}
      }
      pendingCandidatesRef.current.delete(caller._id);

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('call:answer', { callId, answer: pc.localDescription });

      dispatch({
        type:    'CALL_ACTIVE',
        payload: { callId, callType, conversationType, conversationId },
      });

    } catch (err) {
      console.error('[Call] acceptCall WebRTC setup failed:', err.message);
      teardownCall();
    }
  }, [state.incomingCall, socket, createPeerConnection, teardownCall]);

  const rejectCall = useCallback(() => {
    const incoming = state.incomingCall;
    if (!incoming || !socket) return;
    socket.emit('call:reject', { callId: incoming.callId });
    teardownCall();
  }, [state.incomingCall, socket, teardownCall]);

  const endCall = useCallback(() => {
    const callId =
      activeCallIdRef.current ||
      state.activeCall?.callId ||
      state.incomingCall?.callId;
    if (callId && socket) socket.emit('call:end', { callId });
    teardownCall();
  }, [state.activeCall, state.incomingCall, socket, teardownCall]);

  const toggleMic = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) return;
    audioTrack.enabled = !audioTrack.enabled;
    dispatch({ type: 'TOGGLE_MUTE' });
    const callId = activeCallIdRef.current || state.activeCall?.callId;
    if (callId && socket) socket.emit('call:toggle-media', { callId, audio: audioTrack.enabled });
  }, [state.activeCall, socket]);

  const toggleCamera = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) return;
    videoTrack.enabled = !videoTrack.enabled;
    dispatch({ type: 'TOGGLE_CAMERA' });
    const callId = activeCallIdRef.current || state.activeCall?.callId;
    if (callId && socket) socket.emit('call:toggle-media', { callId, video: videoTrack.enabled });
  }, [state.activeCall, socket]);

  // ── Socket event listeners ────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const drainCandidates = async (userId, pc) => {
      const queue = pendingCandidatesRef.current.get(userId) ?? [];
      for (const candidate of queue) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn(`[Call] Buffered ICE failed (${userId}):`, e.message);
        }
      }
      pendingCandidatesRef.current.delete(userId);
    };

    const bufferCandidate = (userId, candidate) => {
      if (!pendingCandidatesRef.current.has(userId)) {
        pendingCandidatesRef.current.set(userId, []);
      }
      pendingCandidatesRef.current.get(userId).push(candidate);
    };

    const onInitiated = ({ callId, call }) => {
      activeCallIdRef.current = callId;
      dispatch({
        type:    'OUTGOING_CALL',
        payload: {
          callId,
          callType:         call.callType,
          conversationType: call.conversationType,
          conversationId:   call.conversation,
        },
      });
    };

    const onIncoming = (data) => {
      if (callStatusRef.current !== 'idle') {
        socket.emit('call:busy', { callId: data.callId });
        return;
      }
      dispatch({ type: 'INCOMING_CALL', payload: data });
    };

    // ── Bug 2 Fix (previous session) + Bug 6 Fix (this session) ──────────────
    //
    // Bug 2 (previous):
    //   onicecandidate closed over callId='pending' and targetUserId='remote'.
    //   Every ICE candidate the caller generated was emitted with
    //   { targetUserId: 'remote' }. The server dropped them all.
    //   Fix: replace onicecandidate with real callId + answeredBy.
    //
    // Bug 6 (this session):
    //   ontrack was NOT replaced alongside onicecandidate. It still closed over
    //   targetUserId='remote'. When the callee's tracks arrived, the dispatch was
    //   REMOTE_STREAM_ADDED with userId:'remote'. On teardown, closePeerConnection
    //   runs for the key answeredBy (the re-keyed PC) and dispatches
    //   REMOTE_STREAM_REMOVED for answeredBy — but remoteStreams still has the
    //   entry under key 'remote'. The stale 'remote' entry is never cleaned up.
    //   On the NEXT call, callStatusRef reads 'idle' (RESET ran), but if the
    //   component re-renders with stale remoteStreams, hasRemote is still true
    //   and isVideo logic can misfire. More critically, for video calls the wrong
    //   userId key causes downstream display issues when the component tries to
    //   match streams to peer info.
    //   Fix: replace BOTH onicecandidate AND ontrack immediately after re-keying.
    // ─────────────────────────────────────────────────────────────────────────
    const onAccepted = async ({ callId, answer, answeredBy }) => {
      try {
        const pc = peerConnectionsRef.current.get('remote');
        if (!pc) return;

        // Re-key: placeholder 'remote' → real callee userId
        peerConnectionsRef.current.delete('remote');
        peerConnectionsRef.current.set(answeredBy, pc);

        // ── Bug 2 Fix: replace stale onicecandidate closure ──────────────────
        pc.onicecandidate = ({ candidate }) => {
          if (candidate && socket) {
            socket.emit('call:ice-candidate', {
              callId,
              targetUserId: answeredBy,
              candidate: candidate.toJSON(),
            });
          }
        };

        // ── Bug 6 Fix: replace stale ontrack closure ──────────────────────────
        // Without this, REMOTE_STREAM_ADDED dispatches userId:'remote' instead
        // of the real answeredBy. teardownCall then removes answeredBy from
        // remoteStreams but leaves the 'remote' entry, causing stale state that
        // makes the NEXT incoming video call appear to be blocked (busy guard
        // fires because a prior stale stream entry makes hasRemote truthy, and
        // some render paths derived from it remain active).
        pc.ontrack = (event) => {
          const [remoteStream] = event.streams;
          if (remoteStream) {
            dispatch({ type: 'REMOTE_STREAM_ADDED', userId: answeredBy, stream: remoteStream });
          }
        };

        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        await drainCandidates(answeredBy, pc);

        activeCallIdRef.current = callId;

        // callType etc. preserved by Bug 3 Fix (CALL_ACTIVE merges, not replaces)
        dispatch({ type: 'CALL_ACTIVE', payload: { callId } });

      } catch (err) {
        console.error('[Call] onAccepted error:', err.message);
      }
    };

    const onRejected = ({ rejectedBy }) => {
      console.log(`[Call] Declined by ${rejectedBy}`);
      teardownCall();
    };

    const onEnded = ({ endedBy, duration }) => {
      console.log(`[Call] Ended by ${endedBy} (${duration}s)`);
      teardownCall();
    };

    const onMissed = ({ reason }) => {
      console.log('[Call] Missed —', reason);
      teardownCall();
    };

    const onBusy = ({ busyUserId }) => {
      console.log(`[Call] ${busyUserId} is busy`);
      teardownCall();
    };

    const onIceCandidate = async ({ candidate, fromUserId }) => {
      const pc =
        peerConnectionsRef.current.get(fromUserId) ??
        peerConnectionsRef.current.get('remote');

      if (pc?.remoteDescription) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn('[Call] addIceCandidate failed:', e.message);
        }
      } else {
        bufferCandidate(fromUserId, candidate);
      }
    };

    const onOffer = async ({ callId, offer, fromUserId }) => {
      try {
        const pc = createPeerConnection(callId, fromUserId);
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach((track) =>
            pc.addTrack(track, localStreamRef.current)
          );
        }
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        await drainCandidates(fromUserId, pc);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('call:answer-sdp', {
          callId,
          targetUserId: fromUserId,
          answer: pc.localDescription,
        });
      } catch (err) {
        console.error('[Call] onOffer (group) error:', err.message);
      }
    };

    const onAnswerSdp = async ({ callId, answer, fromUserId }) => {
      try {
        const pc = peerConnectionsRef.current.get(fromUserId);
        if (!pc) return;
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        await drainCandidates(fromUserId, pc);
      } catch (err) {
        console.error('[Call] onAnswerSdp error:', err.message);
      }
    };

    const onUserJoined = async ({ callId, userId: newPeerId }) => {
      if (newPeerId === currentUser?._id) return;
      try {
        const pc = createPeerConnection(callId, newPeerId);
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach((track) =>
            pc.addTrack(track, localStreamRef.current)
          );
        }
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('call:offer', {
          callId,
          targetUserId: newPeerId,
          offer: pc.localDescription,
        });
      } catch (err) {
        console.error('[Call] onUserJoined error:', err.message);
      }
    };

    const onMediaToggled = ({ userId, audio, video }) => {
      console.log(`[Call] ${userId} — audio:${audio} video:${video}`);
    };

    const onError = ({ message }) => {
      console.error('[Call] Server error:', message);
      teardownCall();
    };

    socket.on('call:initiated',      onInitiated);
    socket.on('call:incoming',       onIncoming);
    socket.on('call:accepted',       onAccepted);
    socket.on('call:rejected',       onRejected);
    socket.on('call:ended',          onEnded);
    socket.on('call:missed',         onMissed);
    socket.on('call:busy',           onBusy);
    socket.on('call:ice-candidate',  onIceCandidate);
    socket.on('call:offer',          onOffer);
    socket.on('call:answer-sdp',     onAnswerSdp);
    socket.on('call:user-joined',    onUserJoined);
    socket.on('call:media-toggled',  onMediaToggled);
    socket.on('call:error',          onError);

    return () => {
      socket.off('call:initiated',     onInitiated);
      socket.off('call:incoming',      onIncoming);
      socket.off('call:accepted',      onAccepted);
      socket.off('call:rejected',      onRejected);
      socket.off('call:ended',         onEnded);
      socket.off('call:missed',        onMissed);
      socket.off('call:busy',          onBusy);
      socket.off('call:ice-candidate', onIceCandidate);
      socket.off('call:offer',         onOffer);
      socket.off('call:answer-sdp',    onAnswerSdp);
      socket.off('call:user-joined',   onUserJoined);
      socket.off('call:media-toggled', onMediaToggled);
      socket.off('call:error',         onError);
    };
  }, [socket, createPeerConnection, teardownCall, currentUser]);

  const value = {
    callStatus:    state.callStatus,
    incomingCall:  state.incomingCall,
    activeCall:    state.activeCall,
    remoteStreams: state.remoteStreams,
    isMuted:       state.isMuted,
    isCameraOff:   state.isCameraOff,
    localStream,
    localStreamRef,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMic,
    toggleCamera,
  };

  return (
    <CallContext.Provider value={value}>
      {children}
    </CallContext.Provider>
  );
};