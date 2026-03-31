import React, { useState, useEffect } from 'react';
import { X, Link2, Copy, Check, Loader2, RefreshCw } from 'lucide-react';
import { useGroup } from '../../hooks/useGroup';

/**
 * Modal for generating and sharing group invite links.
 * @param {*} param0 
 * @returns 
 * Features:
 * - Fetches invite link on mount and allows regenerating it.
 * - Shows loading state while fetching and error messages if generation fails.
 * - Provides a button to copy the invite link to clipboard with feedback.
 * - Closes on backdrop click or Escape key press.
 * Props:
 * - onClose: function to call when the modal should be closed
 * State:
 * - inviteUrl: the generated invite URL to display and copy
 * - loading: whether the invite link is currently being fetched
 * - error: any error message to display if fetching fails
 * - copied: whether the invite link has been recently copied (for UI feedback)
 */


const GroupInviteModal = ({ onClose }) => {
  const { handleGenerateInvite, groupDetails } = useGroup();

  const [inviteUrl, setInviteUrl] = useState('');
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [copied,    setCopied]    = useState(false);

  const fetchLink = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await handleGenerateInvite();
      setInviteUrl(data?.inviteUrl ?? '');
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Failed to generate invite link');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLink(); }, []);

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#0f0e1a] border border-purple-500/20 rounded-2xl shadow-2xl w-full max-w-sm">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800/70">
          <div className="flex items-center gap-2">
            <Link2 size={17} className="text-purple-400" />
            <h2 className="text-white font-semibold">Invite Link</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <p className="text-xs text-gray-500 leading-relaxed">
            Share this link to invite people to{' '}
            <span className="text-purple-400 font-medium">{groupDetails?.groupName}</span>.
            The link expires in 7 days.
          </p>

          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 size={22} className="text-purple-400 animate-spin" />
            </div>
          ) : error ? (
            <div className="px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-xs text-red-400">{error}</p>
            </div>
          ) : (
            <>
              {/* URL display */}
              <div className="flex items-center gap-2 bg-[#1a1827] border border-gray-800 rounded-xl px-3 py-2.5">
                <p className="flex-1 text-xs text-gray-400 truncate font-mono">{inviteUrl}</p>
              </div>

              {/* Copy button */}
              <button
                onClick={handleCopy}
                className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl
                  font-semibold text-sm transition-all
                  ${copied
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                  }`}
              >
                {copied
                  ? <><Check size={15} /> Copied!</>
                  : <><Copy size={15} /> Copy Link</>
                }
              </button>

              <button
                onClick={fetchLink}
                className="flex items-center justify-center gap-1.5 text-xs text-gray-600
                  hover:text-gray-400 transition-colors mx-auto"
              >
                <RefreshCw size={11} /> Generate new link
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
};

export default GroupInviteModal;