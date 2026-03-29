import React, { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import * as groupService from '../../services/group';
import Avatar from '../ui/Avatar';

/**
 * MentionSuggestions
 * ──────────────────
 * Floating panel rendered inside the MessageInput container.
 * Appears when the user types `@query` in a group conversation.
 *
 * Props:
 *   query      — string after `@` (may be empty to show all members)
 *   groupId    — current group conversation id
 *   onSelect   — called with member object when user picks a suggestion
 *   onClose    — called when dismissed (Escape or clicking outside)
 */
const MentionSuggestions = ({ query, groupId, onSelect, onClose }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [cursor,      setCursor]      = useState(0);
  const listRef = useRef(null);

  // Fetch suggestions whenever query changes (debounced 150ms)
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const { data } = await groupService.getMentionSuggestions(groupId, query);
        if (!cancelled) {
          setSuggestions(data.suggestions ?? []);
          setCursor(0);
        }
      } catch {
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 150);

    return () => { cancelled = true; clearTimeout(timer); };
  }, [query, groupId]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e) => {
      if (!suggestions.length) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setCursor(c => Math.min(c + 1, suggestions.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setCursor(c => Math.max(c - 1, 0));
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        onSelect(suggestions[cursor]);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey, true);
    return () => window.removeEventListener('keydown', handleKey, true);
  }, [suggestions, cursor, onSelect, onClose]);

  // Auto-scroll active item into view
  useEffect(() => {
    const active = listRef.current?.children[cursor];
    active?.scrollIntoView({ block: 'nearest' });
  }, [cursor]);

  if (!loading && !suggestions.length) return null;

  return (
    <div className="absolute bottom-full left-0 right-0 mb-1 z-50
      bg-[#1c1830] border border-purple-500/20 rounded-xl shadow-2xl overflow-hidden
      max-h-52 overflow-y-auto custom-scrollbar">

      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 size={16} className="text-purple-400 animate-spin" />
        </div>
      ) : (
        <div ref={listRef}>
          {suggestions.map((m, i) => (
            <button
              key={m._id}
              onMouseDown={(e) => { e.preventDefault(); onSelect(m); }}
              onMouseEnter={() => setCursor(i)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors
                ${i === cursor ? 'bg-purple-500/15' : 'hover:bg-white/4'}`}
            >
              <Avatar src={m.profilePic} name={m.name} size="xs" online={m.isOnline} />
              <div className="min-w-0">
                <p className="text-sm text-white font-medium truncate">{m.name}</p>
                <p className="text-[10px] text-gray-600 truncate font-mono">{m.handle}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MentionSuggestions;