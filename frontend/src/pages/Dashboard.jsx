import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Settings,
  Phone,
  Video,
  Info,
  ChevronLeft,
} from "lucide-react";

import ChatBubble from "../components/chat/ChatBubble.jsx";
import MessageInput from "../components/chat/MessageInput.jsx";
import TypingIndicator from "../components/chat/TypingIndicator.jsx";
import Avatar from "../components/ui/Avatar.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";

const mockConversations = [
  { id: 1, name: "Alex Rivera", status: "online", lastMessage: "Will do, catch you later!" },
  { id: 2, name: "Sophia Lee", status: "offline", lastMessage: "Let's review the design tomorrow." },
  { id: 3, name: "Daniel Kim", status: "online", lastMessage: "AI integration looks insane 🚀" },
  { id: 4, name: "Maya Patel", status: "away", lastMessage: "I'll be there in 10 mins" },
];

const formatTime = () =>
  new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeChat, setActiveChat] = useState(mockConversations[0]);
  const [conversations, setConversations] = useState(mockConversations);
  const [search, setSearch] = useState("");

  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hey! Have you seen the updated design system?",
      attachments: [],
      isMe: false,
      timestamp: "10:00 AM",
    },
    {
      id: 2,
      text: "It's looking incredible!",
      attachments: [],
      isMe: true,
      timestamp: "10:02 AM",
      status: "read",
    },
  ]);

  const [isTyping, setIsTyping] = useState(false);

  const messagesRef = useRef(null);

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 1024px)");
    setSidebarOpen(!mql.matches);
  }, []);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTo({
        top: messagesRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  const normalizeFiles = (files) => {
    return files.map((file) => {
      if (file instanceof Blob && !(file instanceof File)) {
        return new File([file], "voice-message.webm", {
          type: file.type || "audio/webm",
        });
      }
      return file;
    });
  };

  const handleSendMessage = (data) => {
    const normalizedFiles = normalizeFiles(data.files || []);

    const newMessage = {
      id: Date.now(),
      text: data.text || "",
      attachments: normalizedFiles,
      isMe: true,
      timestamp: formatTime(),
      status: "sent",
    };

    setMessages((prev) => [...prev, newMessage]);

    const previewText =
      data.text ||
      (normalizedFiles.length > 0
        ? normalizedFiles[0].type.startsWith("image/")
          ? "📷 Image"
          : normalizedFiles[0].type.startsWith("audio/")
          ? "🎙 Voice message"
          : "📎 Attachment"
        : "");

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeChat.id ? { ...c, lastMessage: previewText } : c
      )
    );

    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);

      const replyMessage = {
        id: Date.now() + 1,
        text: "Got it 👍",
        attachments: [],
        isMe: false,
        timestamp: formatTime(),
      };

      setMessages((prev) => [...prev, replyMessage]);
    }, 2000);

    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === newMessage.id ? { ...m, status: "delivered" } : m
        )
      );
    }, 1000);

    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === newMessage.id ? { ...m, status: "read" } : m
        )
      );
    }, 2500);
  };

  const filtered = conversations.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(search.toLowerCase())
  );

  const renderAttachments = (attachments) => {
    return attachments.map((file, index) => {
      const url = URL.createObjectURL(file);

      if (file.type.startsWith("image/")) {
        return (
          <img
            key={index}
            src={url}
            alt="attachment"
            className="mt-2 rounded-2xl max-w-xs border border-purple-500/20 shadow-lg"
          />
        );
      }

      if (file.type.startsWith("audio/")) {
        return (
          <audio key={index} controls src={url} className="mt-2 w-64" />
        );
      }

      return (
        <a
          key={index}
          href={url}
          download={file.name}
          className="mt-2 inline-block text-sm text-purple-400 underline"
        >
          📎 {file.name}
        </a>
      );
    });
  };

  return (
    <div className="h-screen w-screen flex bg-[#0f0b1f] text-white relative overflow-hidden">

      {/* Animated background like Telegram */}
      <div className="absolute inset-0 bg-linear-to-br from-purple-900/10 via-black to-purple-800/10 animate-pulse opacity-40" />

      {/* Sidebar */}
      <aside
        className={`bg-[#151129] border-r border-purple-500/10 transition-all duration-300 z-30
        ${sidebarOpen ? "w-80" : "w-0 lg:w-80 overflow-hidden"}`}
      >
        <div className="flex flex-col h-full">

          {/* Header with icon + Lumio */}
          <div className="px-5 py-5 border-b border-purple-500/10 flex items-center justify-between">

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-linear-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-900/40">
                <svg viewBox="0 0 24 24" className="w-6 h-6" fill="white">
                  <path d="M12 3C6.477 3 2 6.94 2 11.5c0 2.63 1.4 4.98 3.6 6.5L4 22l4.3-2.3c1.14.32 2.36.5 3.7.5 5.523 0 10-3.94 10-8.5S17.523 3 12 3z" />
                </svg>
              </div>
              <h2 className="font-bold text-xl tracking-wide">Lumio</h2>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-purple-700/10 rounded-lg transition"
              >
                <ChevronLeft size={18} />
              </button>
              <Link to="/settings" className="p-2 hover:bg-purple-700/10 rounded-lg transition">
                <Settings size={18} />
              </Link>
            </div>
          </div>

          {/* Search */}
          <div className="p-4">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-3 text-purple-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search conversations"
                className="w-full bg-[#1d1736] text-white placeholder-purple-300/50 border border-purple-500/20 focus:border-purple-500 focus:ring-2 focus:ring-purple-600/30 transition rounded-xl py-2 pl-10 pr-4 outline-none"
              />
            </div>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto px-3 space-y-2">
            {filtered.length === 0 && (
              <EmptyState
                title="No conversations"
                description="Start chatting to see messages here."
              />
            )}

            {filtered.map((chat) => (
              <button
                key={chat.id}
                onClick={() => setActiveChat(chat)}
                className={`w-full flex gap-3 items-center p-3 rounded-2xl transition
                ${activeChat.id === chat.id
                    ? "bg-purple-700/20 border border-purple-500/20"
                    : "hover:bg-purple-700/10"
                  }`}
              >
                <Avatar name={chat.name} size="sm" status={chat.status} />
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <p className="font-semibold text-sm">{chat.name}</p>
                    {chat.status === "online" && (
                      <span className="text-[11px] font-bold text-emerald-400">
                        Now
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-purple-300/60 truncate">
                    {chat.lastMessage}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Chat */}
      <main className="flex-1 flex flex-col relative z-10">

        <header className="h-16 flex items-center justify-between px-6 border-b border-purple-500/10 bg-[#151129]">
          <div className="flex items-center gap-3">
            <Avatar name={activeChat.name} size="sm" status={activeChat.status} />
            <div>
              <p className="font-semibold">{activeChat.name}</p>
              <span className="text-xs text-purple-300/60">
                {activeChat.status === "online" ? "Active Now" : activeChat.status}
              </span>
            </div>
          </div>
        </header>

        <div ref={messagesRef} className="flex-1 overflow-y-auto px-6 py-6 relative">
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className="animate-fadeIn">
                {msg.text && (
                  <ChatBubble
                    message={msg.text}
                    isMe={msg.isMe}
                    timestamp={msg.timestamp}
                    status={msg.status}
                    username={!msg.isMe ? activeChat.name : undefined}
                    avatar={!msg.isMe ? `https://i.pravatar.cc/150?u=${activeChat.id}` : undefined}
                  />
                )}

                {msg.attachments?.length > 0 && (
                  <div className={`${msg.isMe ? "flex justify-end" : ""}`}>
                    <div className="max-w-xs">
                      {renderAttachments(msg.attachments)}
                    </div>
                  </div>
                )}
              </div>
            ))}
            <TypingIndicator
              username={activeChat.name}
              isActive={isTyping}
            />
          </div>
        </div>

        <footer className="p-4 border-t border-purple-500/10 bg-[#151129]">
          <div className="max-w-3xl mx-auto flex items-center">
            <MessageInput onSendMessage={handleSendMessage} />
          </div>
          <p className="text-center text-xs text-purple-300/50 mt-2">
            End-to-end encrypted · Messages are private
          </p>
        </footer>

      </main>
    </div>
  );
};

export default Dashboard;