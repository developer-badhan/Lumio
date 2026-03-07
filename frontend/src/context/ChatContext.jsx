import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useSocket } from "../hooks/useSocket";
import * as chatService from "../services/chat";

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { socket } = useSocket();

  // ─── Conversations ──────────────────────────────────────────────────────────
  const [conversations, setConversations]               = useState([]);
  const [conversationsLoading, setConversationsLoading] = useState(false);

  // ─── Active Conversation ────────────────────────────────────────────────────
  const [activeConversation, setActiveConversation] = useState(null);

  // ─── Messages ───────────────────────────────────────────────────────────────
  const [messages, setMessages]           = useState([]);       // current conversation messages
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [nextCursor, setNextCursor]       = useState(null);     // for "load older" pagination
  const [hasMore, setHasMore]             = useState(false);

  // ─── Notifications ──────────────────────────────────────────────────────────
  const [notifications, setNotifications]               = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notifNextCursor, setNotifNextCursor]           = useState(null);
  const [notifHasMore, setNotifHasMore]                 = useState(false);

  // ─── Typing Indicators ──────────────────────────────────────────────────────
  // Map of conversationId → Set of userIds currently typing
  const [typingUsers, setTypingUsers] = useState({});

  // Ref keeps activeConversation accessible inside socket callbacks without
  // adding it as a dependency (avoids stale closure without re-subscribing)
  const activeConversationRef = useRef(null);
  useEffect(() => {
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);


  // ═══════════════════════════════════════════════════════════════════════════
  // CONVERSATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  const loadConversations = useCallback(async () => {
    setConversationsLoading(true);
    try {
      const { data } = await chatService.fetchConversations();
      setConversations(data.conversations);
    } catch (err) {
      console.error("Failed to load conversations:", err);
    } finally {
      setConversationsLoading(false);
    }
  }, []);

  // Load conversations once on mount
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Open a private conversation with another user.
  // Backend finds an existing one or creates a new one.
  const openPrivateConversation = useCallback(async (receiverId) => {
    try {
      const { data } = await chatService.getOrCreatePrivateConversation(receiverId);
      const conversation = data.conversation;

      // Add to list if not already present
      setConversations(prev => {
        const exists = prev.some(c => c._id === conversation._id);
        return exists ? prev : [conversation, ...prev];
      });

      selectConversation(conversation);
      return conversation;
    } catch (err) {
      console.error("Failed to open private conversation:", err);
    }
  }, []);

  const createGroup = useCallback(async (groupName, members) => {
    try {
      const { data } = await chatService.createGroupConversation(groupName, members);
      setConversations(prev => [data.conversation, ...prev]);
      return data.conversation;
    } catch (err) {
      console.error("Failed to create group:", err);
    }
  }, []);

  const removeConversation = useCallback(async (conversationId) => {
    try {
      await chatService.deleteConversation(conversationId);
      setConversations(prev => prev.filter(c => c._id !== conversationId));

      // If the deleted conversation was active, deselect it
      if (activeConversationRef.current?._id === conversationId) {
        setActiveConversation(null);
        setMessages([]);
      }
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    }
  }, []);


  // ═══════════════════════════════════════════════════════════════════════════
  // ACTIVE CONVERSATION SELECTION
  // ═══════════════════════════════════════════════════════════════════════════

  const selectConversation = useCallback(async (conversation) => {
    // Leave previous conversation's socket room
    if (activeConversationRef.current?._id && socket) {
      socket.emit("leave-conversation", activeConversationRef.current._id);
    }

    setActiveConversation(conversation);
    setMessages([]);
    setNextCursor(null);
    setHasMore(false);

    if (!conversation) return;

    // Join new conversation's socket room to receive real-time events
    if (socket) socket.emit("join-conversation", conversation._id);

    // Load initial messages
    await loadMessages(conversation._id);

    // Mark as read — clears unread badge
    try {
      await chatService.markConversationAsRead(conversation._id);
      setConversations(prev =>
        prev.map(c =>
          c._id === conversation._id
            ? { ...c, unreadCounts: { ...c.unreadCounts, [conversation._id]: 0 } }
            : c
        )
      );
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  }, [socket]);


  // ═══════════════════════════════════════════════════════════════════════════
  // MESSAGES
  // ═══════════════════════════════════════════════════════════════════════════

  const loadMessages = useCallback(async (conversationId, cursor = null) => {
    setMessagesLoading(true);
    try {
      const { data } = await chatService.fetchMessages(conversationId, cursor);

      setMessages(prev =>
        // Prepend older messages (cursor = loading older) or replace (initial load)
        cursor ? [...data.messages, ...prev] : data.messages
      );
      setNextCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch (err) {
      console.error("Failed to load messages:", err);
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  // Load next page of older messages
  const loadMoreMessages = useCallback(() => {
    if (!hasMore || !nextCursor || !activeConversationRef.current) return;
    loadMessages(activeConversationRef.current._id, nextCursor);
  }, [hasMore, nextCursor, loadMessages]);

  // Send a message — optimistic update with rollback on failure
  const sendMessage = useCallback(async (content, file = null) => {
    const conversation = activeConversationRef.current;
    if (!conversation) return;
    if (!file && !content?.trim()) return;

    // ── Optimistic update ──────────────────────────────────────────────────
    // Add a temporary message immediately so the UI feels instant.
    // We use a temp _id prefixed with "temp-" to identify it later.
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg = {
      _id: tempId,
      conversation: conversation._id,
      content: content?.trim() || "",
      messageType: file ? "image" : "text", // best guess, server corrects it
      sender: { _id: "me" }, // replaced by socket "new-message" event
      createdAt: new Date().toISOString(),
      isOptimistic: true // flag so UI can style it differently if needed
    };

    setMessages(prev => [...prev, optimisticMsg]);

    try {
      await chatService.sendMessage(conversation._id, content, file);
      // Server will broadcast via socket "new-message" — that event replaces
      // the optimistic message, so we don't manually update state here.
    } catch (err) {
      // Rollback: remove the optimistic message on failure
      setMessages(prev => prev.filter(m => m._id !== tempId));
      console.error("Failed to send message:", err);
      throw err; // let the UI component show an error if needed
    }
  }, []);

  const updateMessage = useCallback(async (messageId, newContent) => {
    try {
      await chatService.editMessage(messageId, newContent);
      // Socket "message-edited" event will update the UI
    } catch (err) {
      console.error("Failed to edit message:", err);
      throw err;
    }
  }, []);

  const removeMessage = useCallback(async (messageId) => {
    try {
      await chatService.deleteMessage(messageId);
      // Socket "message-deleted" event will update the UI
    } catch (err) {
      console.error("Failed to delete message:", err);
      throw err;
    }
  }, []);


  // ═══════════════════════════════════════════════════════════════════════════
  // NOTIFICATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  const loadNotifications = useCallback(async (cursor = null) => {
    setNotificationsLoading(true);
    try {
      const { data } = await chatService.fetchNotifications(cursor);
      setNotifications(prev =>
        cursor ? [...prev, ...data.notifications] : data.notifications
      );
      setNotifNextCursor(data.nextCursor);
      setNotifHasMore(data.hasMore);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setNotificationsLoading(false);
    }
  }, []);

  const readNotification = useCallback(async (notificationId) => {
    try {
      await chatService.markNotificationAsRead(notificationId);
      // Socket "notification-read" will also fire — handled below
      setNotifications(prev =>
        prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
      );
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  }, []);

  // Unread notification count derived from state — no extra API call needed
  const unreadNotificationCount = notifications.filter(n => !n.isRead).length;


  // ═══════════════════════════════════════════════════════════════════════════
  // TYPING INDICATORS
  // ═══════════════════════════════════════════════════════════════════════════

  const emitTyping = useCallback((conversationId) => {
    socket?.emit("typing", { conversationId });
  }, [socket]);

  const emitStopTyping = useCallback((conversationId) => {
    socket?.emit("stop-typing", { conversationId });
  }, [socket]);


  // ═══════════════════════════════════════════════════════════════════════════
  // SOCKET EVENT LISTENERS
  // ═══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    if (!socket) return;

    // ── new-message ───────────────────────────────────────────────────────────
    // Arrives for every participant in the conversation room.
    // If the conversation is active: append message + remove matching optimistic.
    // If not active: increment unread count on the conversation in the list.
    const onNewMessage = (message) => {
      const activeId = activeConversationRef.current?._id;

      if (message.conversation === activeId) {
        setMessages(prev => {
          // Remove optimistic placeholder (same content, flagged isOptimistic)
          const withoutOptimistic = prev.filter(
            m => !(m.isOptimistic && m.content === message.content)
          );
          // Guard against duplicate socket events
          const alreadyExists = withoutOptimistic.some(m => m._id === message._id);
          return alreadyExists ? withoutOptimistic : [...withoutOptimistic, message];
        });
      }

      // Always update lastMessage + bubble conversation to top of list
      setConversations(prev =>
        prev.map(c =>
          c._id === message.conversation
            ? { ...c, lastMessage: message, updatedAt: message.createdAt }
            : c
        ).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      );
    };

    // ── unread-update ─────────────────────────────────────────────────────────
    // Backend sends this only to the recipient's personal sockets when a new
    // message arrives in a conversation they're NOT currently viewing.
    const onUnreadUpdate = ({ conversationId, unreadCount }) => {
      setConversations(prev =>
        prev.map(c =>
          c._id === conversationId
            ? { ...c, unreadCounts: { ...c.unreadCounts, unreadCount } }
            : c
        )
      );
    };

    // ── message-delivered ─────────────────────────────────────────────────────
    const onMessageDelivered = ({ messageId, deliveredTo }) => {
      setMessages(prev =>
        prev.map(m => m._id === messageId ? { ...m, deliveredTo } : m)
      );
    };

    // ── message-read-update ───────────────────────────────────────────────────
    // Another participant opened the conversation and read all messages.
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

    // ── message-edited ────────────────────────────────────────────────────────
    const onMessageEdited = (updatedMessage) => {
      setMessages(prev =>
        prev.map(m => m._id === updatedMessage._id ? updatedMessage : m)
      );
    };

    // ── message-deleted ───────────────────────────────────────────────────────
    const onMessageDeleted = (deletedMessage) => {
      setMessages(prev =>
        prev.map(m => m._id === deletedMessage._id ? deletedMessage : m)
      );
    };

    // ── user-typing / user-stop-typing ────────────────────────────────────────
    const onUserTyping = ({ conversationId, userId }) => {
      setTypingUsers(prev => ({
        ...prev,
        [conversationId]: new Set([...(prev[conversationId] || []), userId])
      }));
    };

    const onUserStopTyping = ({ conversationId, userId }) => {
      setTypingUsers(prev => {
        const updated = new Set(prev[conversationId] || []);
        updated.delete(userId);
        return { ...prev, [conversationId]: updated };
      });
    };

    // ── new-notification ──────────────────────────────────────────────────────
    const onNewNotification = (notification) => {
      setNotifications(prev => [notification, ...prev]);
    };

    // ── notification-read ─────────────────────────────────────────────────────
    // Backend emits this via io.to(userId) — user's personal room
    const onNotificationRead = ({ notificationId }) => {
      setNotifications(prev =>
        prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
      );
    };

    // Register all listeners
    socket.on("new-message",         onNewMessage);
    socket.on("unread-update",        onUnreadUpdate);
    socket.on("message-delivered",    onMessageDelivered);
    socket.on("message-read-update",  onMessageReadUpdate);
    socket.on("message-edited",       onMessageEdited);
    socket.on("message-deleted",      onMessageDeleted);
    socket.on("user-typing",          onUserTyping);
    socket.on("user-stop-typing",     onUserStopTyping);
    socket.on("new-notification",     onNewNotification);
    socket.on("notification-read",    onNotificationRead);

    return () => {
      socket.off("new-message",         onNewMessage);
      socket.off("unread-update",        onUnreadUpdate);
      socket.off("message-delivered",    onMessageDelivered);
      socket.off("message-read-update",  onMessageReadUpdate);
      socket.off("message-edited",       onMessageEdited);
      socket.off("message-deleted",      onMessageDeleted);
      socket.off("user-typing",          onUserTyping);
      socket.off("user-stop-typing",     onUserStopTyping);
      socket.off("new-notification",     onNewNotification);
      socket.off("notification-read",    onNotificationRead);
    };
  }, [socket]);


  // ═══════════════════════════════════════════════════════════════════════════
  // CONTEXT VALUE
  // ═══════════════════════════════════════════════════════════════════════════

  const value = {
    // Conversations
    conversations,
    conversationsLoading,
    loadConversations,
    openPrivateConversation,
    createGroup,
    removeConversation,

    // Active conversation
    activeConversation,
    selectConversation,

    // Messages
    messages,
    messagesLoading,
    hasMore,
    loadMoreMessages,
    sendMessage,
    updateMessage,
    removeMessage,

    // Notifications
    notifications,
    notificationsLoading,
    notifHasMore,
    unreadNotificationCount,
    loadNotifications,
    readNotification,
    loadMoreNotifications: () => notifHasMore && loadNotifications(notifNextCursor),

    // Typing
    typingUsers,
    emitTyping,
    emitStopTyping,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export default ChatContext;