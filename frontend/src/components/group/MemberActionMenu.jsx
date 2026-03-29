import React, { useRef, useEffect } from 'react';
import {
  Shield, ShieldOff, UserMinus, Crown, User
} from 'lucide-react';

/**
 * MemberActionMenu
 * ─────────────────
 * Role-aware context menu rendered relative to the ⋮ button on a member row.
 *
 * Visibility rules (mirror the backend middleware chain):
 *   Promote   → caller is admin/super_admin, target is 'member'
 *   Demote    → caller is super_admin, target is 'admin'
 *             OR caller is admin/super_admin, target is 'admin' (for regular admins — backend guards this further)
 *   Remove    → caller is admin+, target is not super_admin and not self
 *   Transfer  → caller is super_admin, target is member/admin (not self)
 */
const MemberActionMenu = ({
  member,         // { _id, name, role }
  myRole,         // 'super_admin' | 'admin' | 'member'
  currentUserId,
  onPromote,
  onDemote,
  onRemove,
  onTransfer,
  onClose,
  alignRight = false,
}) => {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler, true);
    return () => document.removeEventListener('mousedown', handler, true);
  }, [onClose]);

  const isSelf         = member._id === currentUserId;
  const isSA           = myRole === 'super_admin';
  const isCallerAdmin  = myRole === 'admin' || myRole === 'super_admin';
  const targetIsOwner  = member.role === 'super_admin';
  const targetIsAdmin  = member.role === 'admin';
  const targetIsMember = member.role === 'member';

  const actions = [
    // Promote to admin: any admin can promote a regular member
    isCallerAdmin && !isSelf && targetIsMember && {
      icon: Shield,
      label: 'Make admin',
      action: onPromote,
      cls: 'text-blue-300',
    },
    // Demote: only super admin can demote another admin
    isSA && !isSelf && targetIsAdmin && {
      icon: ShieldOff,
      label: 'Remove admin',
      action: onDemote,
      cls: 'text-amber-300',
    },
    // Transfer ownership: super admin only, not to self, not to another super admin
    isSA && !isSelf && !targetIsOwner && {
      icon: Crown,
      label: 'Transfer ownership',
      action: onTransfer,
      cls: 'text-purple-300',
    },
    // Remove: any admin can remove non-super-admin non-self members
    isCallerAdmin && !isSelf && !targetIsOwner && {
      icon: UserMinus,
      label: 'Remove from group',
      action: onRemove,
      cls: 'text-red-400',
    },
  ].filter(Boolean);

  if (!actions.length) return null;

  return (
    <div
      ref={ref}
      className={`absolute top-full mt-1 z-50 w-48
        bg-[#1c1830] border border-purple-500/20 rounded-2xl shadow-2xl overflow-hidden
        ${alignRight ? 'right-0' : 'left-0'}`}
    >
      {actions.map(({ icon: Icon, label, action, cls }) => (
        <button
          key={label}
          onClick={() => { action(); onClose(); }}
          className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm
            font-medium hover:bg-white/5 active:bg-white/10 transition-colors ${cls}`}
        >
          <Icon size={14} />
          {label}
        </button>
      ))}
    </div>
  );
};

export default MemberActionMenu;