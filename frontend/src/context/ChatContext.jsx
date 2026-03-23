import React, { createContext, useState, useEffect, useCallback, useRef } from "react";
import { useSocket } from "../hooks/useSocket";
import { useAuth } from "./AuthContext";
import * as chatService from "../services/chat";

const ChatContext = createContext();

const getOptimisticType = (file) => {
  if (!file) return "text";
  const { type } = file;
  if (type.startsWith("image/")) return "image";
  if (type.startsWith("video/")) return "video";
  if (type.startsWith("audio/")) return "voice";
  return "text";
};

export const ChatProvider = ({ children }) => {
  const { socket }                        = useSocket();
  // FIX: destructure updateUser — needed in blockUser/unblockUser deps
  const { user: currentUser, updateUser } = useAuth();

  const [conversations,        setConversations]        = useState([]);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [activeConversation,   setActiveConversation]   = useState(null);
  const [messages,             setMessages]             = useState([]);
  const [messagesLoading,      setMessagesLoading]      = useState(false);
  const [nextCursor,           setNextCursor]           = useState(null);
  const [hasMore,              setHasMore]              = useState(false);
  const [replyingTo,           setReplyingTo]           = useState(null);
  const [notifications,        setNotifications]        = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notifNextCursor,      setNotifNextCursor]      = useState(null);
  const [notifHasMore,         setNotifHasMore]         = useState(false);
  const [typingUsers,          setTypingUsers]          = useState({});

  const activeConversationRef = useRef(null);
  useEffect(() => {
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);

  useEffect(() => {
    setReplyingTo(null);
  }, [activeConversation?._id]);

  // CONVERSATIONS
  const loadConversations = useCallback(async () => {
    setConversationsLoading(true);
    try {
      const { data } = await chatService.fetchConversations();
      setConversations(data.conversations);
    } catch (err) { console.error("Failed to load conversations:", err); }
    finally { setConversationsLoading(false); }
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  const openPrivateConversation = useCallback(async (receiverId) => {
    try {
      const { data } = await chatService.getOrCreatePrivateConversation(receiverId);
      const conversation = data.conversation;
      setConversations(prev => {
        const exists = prev.some(c => c._id === conversation._id);
        return exists ? prev : [conversation, ...prev];
      });
      selectConversation(conversation);
      return conversation;
    } catch (err) { console.error("Failed to open private conversation:", err); }
  }, []);

  const createGroup = useCallback(async (groupName, members) => {
    try {
      const { data } = await chatService.createGroupConversation(groupName, members);
      setConversations(prev => [data.conversation, ...prev]);
      return data.conversation;
    } catch (err) { console.error("Failed to create group:", err); throw err; }
  }, []);

  const removeConversation = useCallback(async (conversationId) => {
    try {
      await chatService.deleteConversation(conversationId);
      setConversations(prev => prev.filter(c => c._id !== conversationId));
      if (activeConversationRef.current?._id === conversationId) {
        setActiveConversation(null);
        setMessages([]);
      }
    } catch (err) { console.error("Failed to delete conversation:", err); }
  }, []);

  // ACTIVE CONVERSATION SELECTION
  const selectConversation = useCallback(async (conversation) => {
    if (activeConversationRef.current?._id && socket) {
      socket.emit("leave-conversation", activeConversationRef.current._id);
    }
    setActiveConversation(conversation);
    setMessages([]);
    setNextCursor(null);
    setHasMore(false);
    setReplyingTo(null);
    if (!conversation) return;
    if (socket) socket.emit("join-conversation", conversation._id);
    await loadMessages(conversation._id);
    try {
      await chatService.markConversationAsRead(conversation._id);
      setConversations(prev =>
        prev.map(c =>
          c._id === conversation._id
            ? { ...c, unreadCounts: { ...c.unreadCounts, [currentUser?._id]: 0 } }
            : c
        )
      );
    } catch (err) { console.error("Failed to mark as read:", err); }
  }, [socket, currentUser]);

  // MESSAGES
  const loadMessages = useCallback(async (conversationId, cursor = null) => {
    setMessagesLoading(true);
    try {
      const { data } = await chatService.fetchMessages(conversationId, cursor);
      setMessages(prev => cursor ? [...data.messages, ...prev] : data.messages);
      setNextCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch (err) { console.error("Failed to load messages:", err); }
    finally { setMessagesLoading(false); }
  }, []);

  const loadMoreMessages = useCallback(() => {
    if (!hasMore || !nextCursor || !activeConversationRef.current) return;
    loadMessages(activeConversationRef.current._id, nextCursor);
  }, [hasMore, nextCursor, loadMessages]);

  const sendMessage = useCallback(async (content, file = null, replyToId = null) => {
    const conversation = activeConversationRef.current;
    if (!conversation) return;
    if (!file && !content?.trim()) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticMsg = {
      _id:          tempId,
      conversation: conversation._id,
      content:      content?.trim() || "",
      messageType:  getOptimisticType(file),
      sender:       { _id: currentUser?._id, name: currentUser?.name, profilePic: currentUser?.profilePic },
      replyTo:      replyToId ? (replyingTo ?? null) : null,
      reactions:    [],
      createdAt:    new Date().toISOString(),
      isOptimistic: true,
    };

    setMessages(prev => [...prev, optimisticMsg]);
    setReplyingTo(null);

    try {
      await chatService.sendMessage(conversation._id, content, file, replyToId);
    } catch (err) {
      setMessages(prev => prev.filter(m => m._id !== tempId));
      setReplyingTo(replyingTo);
      console.error("Failed to send message:", err);
      throw err;
    }
  }, [currentUser, replyingTo]);

  const updateMessage = useCallback(async (messageId, newContent) => {
    try { await chatService.editMessage(messageId, newContent); }
    catch (err) { console.error("Failed to edit message:", err); throw err; }
  }, []);

  const removeMessage = useCallback(async (messageId) => {
    try { await chatService.deleteMessage(messageId); }
    catch (err) { console.error("Failed to delete message:", err); throw err; }
  }, []);

  const reactMessage = useCallback(async (messageId, emoji) => {
    const userId = currentUser?._id;
    setMessages(prev => prev.map(m => {
      if (m._id !== messageId) return m;
      const reactions = m.reactions ? [...m.reactions.map(r => ({ ...r, users: [...r.users] }))] : [];
      const existing  = reactions.find(r => r.emoji === emoji);
      if (existing) {
        const alreadyIn = existing.users.some(u =>
          (typeof u === "string" ? u : u._id?.toString() ?? String(u)) === userId
        );
        if (alreadyIn) {
          existing.users = existing.users.filter(u =>
            (typeof u === "string" ? u : u._id?.toString() ?? String(u)) !== userId
          );
          return {
            ...m,
            reactions: existing.users.length === 0
              ? reactions.filter(r => r.emoji !== emoji)
              : reactions.map(r => r.emoji === emoji ? existing : r),
          };
        } else {
          existing.users.push(userId);
          return { ...m, reactions: reactions.map(r => r.emoji === emoji ? existing : r) };
        }
      } else {
        return { ...m, reactions: [...reactions, { emoji, users: [userId] }] };
      }
    }));
    try { await chatService.reactToMessage(messageId, emoji); }
    catch (err) { console.error("Failed to react:", err); }
  }, [currentUser]);

  // F1: non-destructive clear — sets clearedAt timestamp on conversation for this user only
  const clearChat = useCallback(async (conversationId) => {
    try {
      await chatService.clearChat(conversationId);
      // UI cleared via socket "chat-cleared" event below
    } catch (err) {
      console.error("Failed to clear chat:", err);
      throw err;  // re-throw so ChatWindow can show error banner
    }
  }, []);

  // F3: block user — FIX: added updateUser to deps (was missing, stale closure risk)
  const blockUser = useCallback(async (userId) => {
    try {
      await chatService.blockUser(userId);
      updateUser({ ...currentUser, blockedUsers: [...(currentUser?.blockedUsers ?? []), userId] });
    } catch (err) {
      console.error("Failed to block user:", err);
      throw err;  // re-throw so ChatWindow can show error banner
    }
  }, [currentUser, updateUser]); // FIX: updateUser added

  // F3: unblock user — FIX: added updateUser to deps
  const unblockUser = useCallback(async (userId) => {
    try {
      await chatService.unblockUser(userId);
      updateUser({ ...currentUser, blockedUsers: (currentUser?.blockedUsers ?? []).filter(id => id !== userId) });
    } catch (err) {
      console.error("Failed to unblock user:", err);
      throw err;  // re-throw so ChatWindow can show error banner
    }
  }, [currentUser, updateUser]); // FIX: updateUser added

  // NOTIFICATIONS
  const loadNotifications = useCallback(async (cursor = null) => {
    setNotificationsLoading(true);
    try {
      const { data } = await chatService.fetchNotifications(cursor);
      setNotifications(prev => cursor ? [...prev, ...data.notifications] : data.notifications);
      setNotifNextCursor(data.nextCursor);
      setNotifHasMore(data.hasMore);
    } catch (err) { console.error("Failed to load notifications:", err); }
    finally { setNotificationsLoading(false); }
  }, []);

  const readNotification = useCallback(async (notificationId) => {
    try {
      await chatService.markNotificationAsRead(notificationId);
      setNotifications(prev => prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n));
    } catch (err) { console.error("Failed to mark notification as read:", err); }
  }, []);

  const unreadNotificationCount = notifications.filter(n => !n.isRead).length;

  // TYPING
  const emitTyping     = useCallback((id) => { socket?.emit("typing",      { conversationId: id }); }, [socket]);
  const emitStopTyping = useCallback((id) => { socket?.emit("stop-typing", { conversationId: id }); }, [socket]);

  // SOCKET LISTENERS
  useEffect(() => {
    if (!socket) return;

    const onNewMessage = (message) => {
      const activeId = activeConversationRef.current?._id;
      if (message.conversation === activeId) {
        setMessages(prev => {
          let removed = false;
          const afterTypeMatch = prev.filter(m => {
            if (!removed && m.isOptimistic && m.messageType === message.messageType) {
              removed = true; return false;
            }
            return true;
          });
          if (!removed) {
            let fallbackDone = false;
            const afterFallback = afterTypeMatch.filter(m => {
              if (!fallbackDone && m.isOptimistic) { fallbackDone = true; return false; }
              return true;
            });
            const exists = afterFallback.some(m => m._id === message._id);
            return exists ? afterFallback : [...afterFallback, message];
          }
          const exists = afterTypeMatch.some(m => m._id === message._id);
          return exists ? afterTypeMatch : [...afterTypeMatch, message];
        });
      }
      setConversations(prev =>
        prev.map(c =>
          c._id === message.conversation
            ? { ...c, lastMessage: message, updatedAt: message.createdAt }
            : c
        ).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      );
    };

    const onUnreadUpdate = ({ conversationId, unreadCount }) =>
      setConversations(prev =>
        prev.map(c =>
          c._id === conversationId
            ? { ...c, unreadCounts: { ...c.unreadCounts, [currentUser?._id]: unreadCount } }
            : c
        )
      );

    const onMessageDelivered  = ({ messageId, deliveredTo }) =>
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, deliveredTo } : m));

    const onMessageReadUpdate = ({ conversationId, userId }) => {
      if (conversationId === activeConversationRef.current?._id) {
        setMessages(prev =>
          prev.map(m => ({
            ...m,
            readBy: m.readBy?.includes(userId) ? m.readBy : [...(m.readBy || []), userId]
          }))
        );
      }
    };

    const onMessageEdited   = (msg) => setMessages(prev => prev.map(m => m._id === msg._id ? msg : m));
    const onMessageDeleted  = (msg) => setMessages(prev => prev.map(m => m._id === msg._id ? msg : m));
    const onMessageReaction = (msg) => setMessages(prev => prev.map(m => m._id === msg._id ? msg : m));

    // F1: only clears messages for the user who triggered it — non-destructive
    const onChatCleared = ({ conversationId, userId }) => {
      if (
        conversationId === activeConversationRef.current?._id &&
        userId === currentUser?._id
      ) {
        setMessages([]);
      }
    };

    const onUserTyping = ({ conversationId, userId }) =>
      setTypingUsers(prev => ({
        ...prev,
        [conversationId]: new Set([...(prev[conversationId] || []), userId])
      }));

    const onUserStopTyping = ({ conversationId, userId }) =>
      setTypingUsers(prev => {
        const updated = new Set(prev[conversationId] || []);
        updated.delete(userId);
        return { ...prev, [conversationId]: updated };
      });

    const onNewNotification  = (n) => setNotifications(prev => [n, ...prev]);
    const onNotificationRead = ({ notificationId }) =>
      setNotifications(prev => prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n));

    socket.on("new-message",         onNewMessage);
    socket.on("unread-update",       onUnreadUpdate);
    socket.on("message-delivered",   onMessageDelivered);
    socket.on("message-read-update", onMessageReadUpdate);
    socket.on("message-edited",      onMessageEdited);
    socket.on("message-deleted",     onMessageDeleted);
    socket.on("message-reaction",    onMessageReaction);
    socket.on("chat-cleared",        onChatCleared);
    socket.on("user-typing",         onUserTyping);
    socket.on("user-stop-typing",    onUserStopTyping);
    socket.on("new-notification",    onNewNotification);
    socket.on("notification-read",   onNotificationRead);

    return () => {
      socket.off("new-message",         onNewMessage);
      socket.off("unread-update",       onUnreadUpdate);
      socket.off("message-delivered",   onMessageDelivered);
      socket.off("message-read-update", onMessageReadUpdate);
      socket.off("message-edited",      onMessageEdited);
      socket.off("message-deleted",     onMessageDeleted);
      socket.off("message-reaction",    onMessageReaction);
      socket.off("chat-cleared",        onChatCleared);
      socket.off("user-typing",         onUserTyping);
      socket.off("user-stop-typing",    onUserStopTyping);
      socket.off("new-notification",    onNewNotification);
      socket.off("notification-read",   onNotificationRead);
    };
  }, [socket, currentUser]);

  const value = {
    conversations, conversationsLoading, loadConversations,
    openPrivateConversation, createGroup, removeConversation,
    activeConversation, selectConversation,
    messages, messagesLoading, hasMore, loadMoreMessages,
    sendMessage, updateMessage, removeMessage,
    reactMessage, clearChat, blockUser, unblockUser,
    replyingTo, setReplyingTo,
    notifications, notificationsLoading, notifHasMore,
    unreadNotificationCount, loadNotifications, readNotification,
    loadMoreNotifications: () => notifHasMore && loadNotifications(notifNextCursor),
    typingUsers, emitTyping, emitStopTyping,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export default ChatContext;