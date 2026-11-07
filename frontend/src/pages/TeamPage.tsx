import React, { useState } from 'react';
import { Users, UserPlus, Mail, Shield, Check, Trash2, ArrowRight } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext.js';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { Button } from '../components/common/Button.js';
import { Modal } from '../components/common/Modal.js';
import { Avatar } from '../components/common/Avatar.js';

export const TeamPage: React.FC = () => {
  const { currentWorkspace, members, inviteMember, refreshMembers } = useWorkspace();
  const { user, switchDemoUser } = useAuth();

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member' | 'viewer'>('member');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteError, setInviteError] = useState('');

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setIsSubmitting(true);
    setInviteError('');

    try {
      await inviteMember(inviteEmail.trim(), inviteRole);
      setInviteEmail('');
      setIsInviteModalOpen(false);
      refreshMembers();
    } catch (err: any) {
      setInviteError(err.message || 'Failed to invite team member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (userId: string) => {
    if (!currentWorkspace) return;
    if (window.confirm('Remove this member from the workspace?')) {
      try {
        await api.removeMember(currentWorkspace._id, userId);
        refreshMembers();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const getRoleBadge = (role: string) => {
    const configs: Record<string, string> = {
      owner: 'bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-300 border-primary-200',
      admin: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200',
      member: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border-teal-200',
      viewer: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200',
    };
    return configs[role] || configs.member;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Team Workspace Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            {members.length} team members collaborating in {currentWorkspace?.name}.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          leftIcon={<UserPlus className="w-4 h-4" />}
          onClick={() => {
            setInviteError('');
            setIsInviteModalOpen(true);
          }}
        >
          Invite Member
        </Button>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {members.map((member) => {
          const userObj = member.userDetails || (typeof member.user !== 'string' ? member.user : null);
          if (!userObj) return null;

          const isCurrentUser = user?._id === userObj._id;

          return (
            <div
              key={member._id}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-card transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <Avatar
                    src={userObj.avatar}
                    name={userObj.name}
                    size="lg"
                    showStatus
                  />
                  <span
                    className={`px-2.5 py-1 text-xs font-semibold rounded-full border uppercase tracking-wider ${getRoleBadge(
                      member.role
                    )}`}
                  >
                    {member.role}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {userObj.name} {isCurrentUser && <span className="text-xs text-primary font-medium">(You)</span>}
                </h3>
                <p className="text-xs font-semibold text-primary mt-0.5">{userObj.role}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                  {userObj.bio || 'Product builder delivering smooth software experiences.'}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[130px]">{userObj.email}</span>
                </span>

                <div className="flex items-center gap-1">
                  {!isCurrentUser && (
                    <button
                      type="button"
                      onClick={() => switchDemoUser(userObj._id)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-primary hover:text-white dark:bg-slate-800 dark:hover:bg-primary transition-colors text-slate-700 dark:text-slate-300"
                      title="Switch active user to this persona"
                    >
                      View Persona
                    </button>
                  )}
                  {!isCurrentUser && member.role !== 'owner' && (
                    <button
                      type="button"
                      onClick={() => handleRemove(userObj._id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                      title="Remove member"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Invite Member Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invite Team Member"
        subtitle="Invite an existing registered user to this workspace."
        maxWidth="md"
      >
        <form onSubmit={handleInvite} className="space-y-4">
          {inviteError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-400">
              {inviteError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Member Email *
            </label>
            <input
              type="email"
              required
              placeholder="e.g. maya@taskflow.dev"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Workspace Role
            </label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as any)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="admin">Admin (Manage projects & members)</option>
              <option value="member">Member (Create and edit tasks)</option>
              <option value="viewer">Viewer (Read only)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsInviteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              Send Invitation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
