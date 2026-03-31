import React from 'react';
import {
  X, UserPlus, Link2, Settings, LogOut,
  Lock, Crown, Shield, Camera, Users, Sparkles
} from 'lucide-react';
import { useGroup } from '../../hooks/useGroup';
import { useChat } from '../../hooks/useChat';
import Avatar from '../ui/Avatar';
import GroupMemberList from './GroupMemberList';
import AddMembersModal from './AddMembersModal';
import GroupInviteModal from './GroupInviteModal';
import GroupSettingsModal from './GroupSettingsModal';


/** * Panel for displaying group information, members, and quick actions. Shows group icon, name, member count, and status badges.
 * Provides buttons for adding members, viewing invite link, accessing settings, and leaving the group. Only shows admin actions to admins.
 * Opens modals for adding members, viewing invite link, and changing settings. Allows leaving the group with confirmation.
 * Props: none (uses context)
 * State: none (uses context)
 */


const GroupInfoPanel = () => {
  const {
    groupDetails, members, isAdmin, isSuperAdmin,
    isRestricted, myRole, isLoadingGroup,
    showInfoPanel, setShowInfoPanel,
    showSettings,  setShowSettings,
    showAddMembers, setShowAddMembers,
    showInvite,    setShowInvite,
    handleLeaveGroup,
  } = useGroup();
  const { selectConversation } = useChat();

  if (!showInfoPanel) return null;

  const handleLeave = async () => {
    try {
      await handleLeaveGroup();
      selectConversation(null);
      setShowInfoPanel(false);
    } catch {}
  };

// Detect if this is the Lumio AI group (used for the AI assistant conversation)
const isAIGroup = (group) => group?.groupName === 'Lumio AI';
const isAI = isAIGroup(groupDetails);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-30 bg-black/30 backdrop-blur-[1px]"
        onClick={() => setShowInfoPanel(false)}
      />

      {/* Panel */}
      <div className="fixed top-0 right-0 h-full z-40 w-80
        bg-[#0d0c1a] border-l border-gray-800/70 flex flex-col shadow-2xl
        animate-in slide-in-from-right duration-200">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800/70 shrink-0">
          <h2 className="text-white font-semibold text-sm">Group Info</h2>
          <button
            onClick={() => setShowInfoPanel(false)}
            className="p-1.5 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            <X size={17} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">

          {/* Group identity */}
          <div className="flex flex-col items-center py-6 px-4 gap-3 border-b border-gray-800/50">
            <div className="relative">

              {isAI ? (
                <div className="relative shrink-0">
                  
                  {/* subtle glow (not overkill) */}
                  <div className="absolute inset-0 rounded-full bg-teal-500/10 blur-md" />

                  <div className="relative w-20 h-20 rounded-full 
                    bg-teal-600/20 border border-teal-500/30 
                    flex items-center justify-center
                    shadow-[0_0_20px_rgba(20,184,166,0.15)]">

                    <Sparkles size={30} className="text-teal-400" />
                  </div>

                  {/* online dot */}
                  <span className="absolute bottom-1 right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-black" />
                </div>
              ) : groupDetails?.groupIcon ? (
                <img
                  src={groupDetails.groupIcon}
                  alt={groupDetails.groupName}
                  className="w-20 h-20 rounded-full object-cover ring-2 ring-purple-500/30"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-purple-600/20 flex items-center justify-center
                  ring-2 ring-purple-500/20">
                  <Users size={32} className="text-purple-400/60" />
                </div>
              )}

              {isAdmin && (
                <button
                  onClick={() => { setShowSettings(true); setShowInfoPanel(false); }}
                  className="absolute -bottom-1 -right-1 p-1.5 bg-[#0f0e1a] border border-gray-700
                    rounded-full text-gray-400 hover:text-purple-300 hover:border-purple-500/40
                    transition-colors"
                >
                  <Camera size={13} />
                </button>
              )}
            </div>

            <div className="text-center">
              <h3 className="text-white font-bold text-base">{groupDetails?.groupName}</h3>
              <p className="text-xs text-gray-600 mt-0.5">
                {groupDetails?.participantCount ?? members.length} members
              </p>
            </div>

            {/* Status badges */}
            <div className="flex gap-2 flex-wrap justify-center">
              {isRestricted && (
                <span className="flex items-center gap-1 text-[10px] font-semibold
                  text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full">
                  <Lock size={9} /> Restricted
                </span>
              )}
              {myRole === 'super_admin' && (
                <span className="flex items-center gap-1 text-[10px] font-semibold
                  text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full">
                  <Crown size={9} /> Owner
                </span>
              )}
              {myRole === 'admin' && (
                <span className="flex items-center gap-1 text-[10px] font-semibold
                  text-blue-400 bg-blue-400/10 border border-blue-400/20 px-2 py-0.5 rounded-full">
                  <Shield size={9} /> Admin
                </span>
              )}
            </div>
          </div>

          {/* Quick actions */}
          <div className="px-4 py-4 border-b border-gray-800/50">
            <div className="grid grid-cols-3 gap-2">
              {isAdmin && (
                <ActionBtn
                  icon={UserPlus}
                  label="Add Members"
                  onClick={() => setShowAddMembers(true)}
                />
              )}
              {isAdmin && (
                <ActionBtn
                  icon={Link2}
                  label="Invite Link"
                  onClick={() => setShowInvite(true)}
                />
              )}
              {(isAdmin) && (
                <ActionBtn
                  icon={Settings}
                  label="Settings"
                  onClick={() => { setShowSettings(true); setShowInfoPanel(false); }}
                />
              )}
              <ActionBtn
                icon={LogOut}
                label="Leave"
                onClick={handleLeave}
                danger
              />
            </div>
          </div>

          {/* Members */}
          <div className="px-4 py-4">
            <GroupMemberList compact />
          </div>

        </div>

      </div>

      {/* Modals triggered from this panel */}
      {showAddMembers && <AddMembersModal onClose={() => setShowAddMembers(false)} />}
      {showInvite     && <GroupInviteModal  onClose={() => setShowInvite(false)} />}
      {showSettings   && <GroupSettingsModal onClose={() => setShowSettings(false)} />}
    </>
  );
};

const ActionBtn = ({ icon: Icon, label, onClick, danger = false }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border
      transition-colors text-center
      ${danger
        ? 'border-red-500/20 hover:bg-red-500/8 text-red-400'
        : 'border-gray-800 hover:bg-white/4 text-gray-400 hover:text-white'
      }`}
  >
    <Icon size={17} />
    <span className="text-[10px] font-medium leading-tight">{label}</span>
  </button>
);

export default GroupInfoPanel;