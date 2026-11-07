import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  FolderKanban,
  Calendar,
  Users,
  Bell,
  Settings,
  Plus,
  ChevronDown,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { Avatar } from '../common/Avatar.js';
import { Modal } from '../common/Modal.js';
import { Button } from '../common/Button.js';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { workspaces, currentWorkspace, setCurrentWorkspace, createWorkspace, projects } = useWorkspace();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [isWorkspaceDropdownOpen, setIsWorkspaceDropdownOpen] = useState(false);
  const [isNewWorkspaceModalOpen, setIsNewWorkspaceModalOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceDesc, setNewWorkspaceDesc] = useState('');
  const [isCreatingWs, setIsCreatingWs] = useState(false);

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'My Tasks', path: '/my-tasks', icon: CheckSquare },
    { label: 'Projects', path: '/projects', icon: FolderKanban },
    { label: 'Calendar', path: '/calendar', icon: Calendar },
    { label: 'Team Members', path: '/team', icon: Users },
    { label: 'Notifications', path: '/notifications', icon: Bell },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    setIsCreatingWs(true);
    try {
      await createWorkspace(newWorkspaceName, newWorkspaceDesc);
      setNewWorkspaceName('');
      setNewWorkspaceDesc('');
      setIsNewWorkspaceModalOpen(false);
      setIsWorkspaceDropdownOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreatingWs(false);
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-indigo-500 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-slate-900 dark:text-white tracking-tight text-base font-sans">
                TaskFlow
              </span>
              <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Team Workspace
              </span>
            </div>
          </div>
        </div>

        {/* Workspace Switcher Selector */}
        <div className="px-3 pt-3 pb-2 relative">
          <button
            type="button"
            onClick={() => setIsWorkspaceDropdownOpen(!isWorkspaceDropdownOpen)}
            className="w-full flex items-center justify-between p-2 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all text-left bg-slate-50/50 dark:bg-slate-800/30"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-primary-100 dark:bg-primary-950 text-primary-600 dark:text-primary-400 font-bold text-xs flex items-center justify-center flex-shrink-0">
                {currentWorkspace?.name ? currentWorkspace.name[0].toUpperCase() : 'W'}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {currentWorkspace?.name || 'Select Workspace'}
                </p>
                <p className="text-[10px] text-slate-600 dark:text-slate-400">Team Workspace</p>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-600 flex-shrink-0" />
          </button>

          {/* Workspace Switcher Dropdown */}
          {isWorkspaceDropdownOpen && (
            <div className="absolute top-full left-3 right-3 z-50 mt-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-elevated p-1.5 animate-in fade-in zoom-in-95">
              <div className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider px-2.5 py-1">
                Workspaces
              </div>
              <div className="max-h-48 overflow-y-auto space-y-0.5">
                {workspaces.map((ws) => (
                  <button
                    key={ws._id}
                    onClick={() => {
                      setCurrentWorkspace(ws);
                      setIsWorkspaceDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-lg text-left transition-colors ${
                      currentWorkspace?._id === ws._id
                        ? 'bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 font-medium'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[10px] flex items-center justify-center">
                      {ws.name[0]}
                    </span>
                    <span className="truncate flex-1">{ws.name}</span>
                  </button>
                ))}
              </div>
              <div className="border-t border-slate-100 dark:border-slate-800 mt-1 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsNewWorkspaceModalOpen(true);
                    setIsWorkspaceDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-lg text-primary hover:bg-primary-50 dark:hover:bg-primary-950/40 font-medium transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Workspace</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Main Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <div className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider px-3 py-1">
            Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}

          {/* Active Project Boards quick shortcut */}
          <div className="pt-4">
            <div className="flex items-center justify-between px-3 py-1">
              <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Active Projects
              </span>
              <button
                type="button"
                onClick={() => navigate('/projects')}
                className="text-[11px] text-primary hover:underline font-medium"
              >
                All
              </button>
            </div>
            <div className="mt-1 space-y-0.5">
              {projects.slice(0, 4).map((p) => (
                <NavLink
                  key={p._id}
                  to={`/projects/${p._id}`}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                      isActive
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-medium'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-900'
                    }`
                  }
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: p.color || '#5B5BD6' }}
                  />
                  <span className="truncate">{p.name}</span>
                </NavLink>
              ))}
            </div>
          </div>
        </div>

        {/* User Profile Footer */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center justify-between">
            <div
              className="flex items-center gap-2.5 min-w-0 cursor-pointer hover:opacity-85 transition-opacity"
              onClick={() => navigate('/profile')}
            >
              <Avatar
                src={user?.avatar}
                name={user?.name || 'User'}
                size="sm"
                showStatus
              />
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {user?.name || 'Guest User'}
                </p>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 truncate">
                  {user?.role || 'Team Member'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={logout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* New Workspace Modal */}
      <Modal
        isOpen={isNewWorkspaceModalOpen}
        onClose={() => setIsNewWorkspaceModalOpen(false)}
        title="Create Team Workspace"
        subtitle="A collaborative workspace for your team projects and tasks."
        maxWidth="md"
      >
        <form onSubmit={handleCreateWorkspace} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Workspace Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Acme Product Studio"
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="What is this workspace for?"
              value={newWorkspaceDesc}
              onChange={(e) => setNewWorkspaceDesc(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsNewWorkspaceModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isCreatingWs}>
              Create Workspace
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};
