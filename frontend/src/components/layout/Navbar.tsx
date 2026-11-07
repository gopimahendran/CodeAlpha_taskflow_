import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  Search,
  Plus,
  Bell,
  Sun,
  Moon,
  ChevronDown,
  UserCheck,
  Check,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useWorkspace } from '../../context/WorkspaceContext.js';
import { useTheme } from '../../context/ThemeContext.js';
import { api } from '../../services/api.js';
import { socketService } from '../../services/socket.js';
import { Notification, Task, User } from '../../types/index.js';
import { Avatar } from '../common/Avatar.js';
import { Button } from '../common/Button.js';
import { Modal } from '../common/Modal.js';
import { useNavigate } from 'react-router-dom';

interface NavbarProps {
  onOpenSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenSidebar }) => {
  const { user, switchDemoUser, logout } = useAuth();
  const { currentWorkspace, projects } = useWorkspace();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<{ tasks: Task[]; projects: any[] }>({
    tasks: [],
    projects: [],
  });
  const searchRef = useRef<HTMLDivElement>(null);

  // Notification state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Demo user switcher state
  const [isUserSwitcherOpen, setIsUserSwitcherOpen] = useState(false);
  const userSwitcherRef = useRef<HTMLDivElement>(null);

  // Quick Create Task Modal state
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskProjectId, setTaskProjectId] = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskStatus, setTaskStatus] = useState('todo');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);

  // Fetch notifications
  const loadNotifications = async () => {
    if (!user) return;
    try {
      const data = await api.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadNotifications();
    const socket = socketService.getSocket();
    if (socket) {
      socket.on('notification:new', (notif: Notification) => {
        setNotifications((prev) => [notif, ...prev]);
      });
    }
    return () => {
      if (socket) socket.off('notification:new');
    };
  }, [user?._id]);

  // Click outside listeners
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
      if (userSwitcherRef.current && !userSwitcherRef.current.contains(e.target as Node)) {
        setIsUserSwitcherOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Live search handler
  useEffect(() => {
    if (!searchQuery.trim() || !currentWorkspace) {
      setSearchResults({ tasks: [], projects: [] });
      return;
    }
    const timeout = setTimeout(async () => {
      try {
        const tasks = await api.getTasks({
          workspaceId: currentWorkspace._id,
          search: searchQuery,
        });
        const matchedProjects = projects.filter(
          (p) =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.description.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setSearchResults({ tasks: tasks.slice(0, 5), projects: matchedProjects.slice(0, 3) });
      } catch (err) {
        console.error(err);
      }
    }, 200);
    return () => clearTimeout(timeout);
  }, [searchQuery, currentWorkspace, projects]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = async () => {
    await api.markAllNotificationsAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleMarkOneRead = async (id: string, link?: string) => {
    await api.markNotificationAsRead(id);
    setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
    if (link) {
      navigate(link);
      setIsNotifOpen(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !currentWorkspace) return;
    const targetProject = taskProjectId || (projects[0] ? projects[0]._id : '');
    if (!targetProject) return;

    setIsSubmittingTask(true);
    try {
      await api.createTask({
        title: taskTitle.trim(),
        description: taskDescription,
        projectId: targetProject,
        workspaceId: currentWorkspace._id,
        status: taskStatus,
        priority: taskPriority,
        dueDate: taskDueDate || undefined,
      });
      setTaskTitle('');
      setTaskDescription('');
      setTaskDueDate('');
      setIsCreateTaskModalOpen(false);
      navigate(`/projects/${targetProject}`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingTask(false);
    }
  };

  const demoUsers = [
    { id: 'usr_sarah_1', name: 'Sarah Connor', role: 'Lead PM & Designer' },
    { id: 'usr_alex_2', name: 'Alex Rivera', role: 'Full-Stack Engineer' },
    { id: 'usr_david_3', name: 'David Chen', role: 'Cloud Architect' },
    { id: 'usr_elena_4', name: 'Elena Rostova', role: 'UI/UX Design Systems' },
    { id: 'usr_maya_5', name: 'Maya Lin', role: 'QA & Growth' },
  ];

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      {/* Left: Hamburger & Workspace crumb */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {currentWorkspace?.name || 'Workspace'}
          </span>
          <span>/</span>
          <span className="text-slate-400">Team Workspace</span>
        </div>
      </div>

      {/* Center: Global Search Bar */}
      <div ref={searchRef} className="relative flex-1 max-w-md mx-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search tasks, projects, tags... (Ctrl + K)"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:bg-white dark:focus:bg-slate-900 transition-all"
          />
        </div>

        {/* Search Results Dropdown */}
        {isSearchOpen && searchQuery.trim() && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-elevated p-2 z-50 animate-in fade-in zoom-in-95">
            {searchResults.tasks.length === 0 && searchResults.projects.length === 0 ? (
              <p className="p-3 text-xs text-center text-slate-500">No matching tasks or projects found</p>
            ) : (
              <div className="space-y-3">
                {searchResults.projects.length > 0 && (
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2">
                      Projects
                    </span>
                    <div className="mt-1 space-y-0.5">
                      {searchResults.projects.map((proj) => (
                        <div
                          key={proj._id}
                          onClick={() => {
                            navigate(`/projects/${proj._id}`);
                            setIsSearchOpen(false);
                            setSearchQuery('');
                          }}
                          className="flex items-center gap-2 p-2 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: proj.color }}
                          />
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {proj.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {searchResults.tasks.length > 0 && (
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2">
                      Tasks
                    </span>
                    <div className="mt-1 space-y-0.5">
                      {searchResults.tasks.map((task) => (
                        <div
                          key={task._id}
                          onClick={() => {
                            navigate(`/projects/${task.project}?task=${task._id}`);
                            setIsSearchOpen(false);
                            setSearchQuery('');
                          }}
                          className="flex items-center justify-between p-2 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                            {task.title}
                          </span>
                          <span className="text-[10px] text-slate-400 uppercase">
                            {task.status.replace('_', ' ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: Quick actions, notifications, demo user switch, theme toggle */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Quick + Create Task Button */}
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => {
            if (projects.length > 0 && !taskProjectId) {
              setTaskProjectId(projects[0]._id);
            }
            setIsCreateTaskModalOpen(true);
          }}
          className="hidden sm:inline-flex"
        >
          Create Task
        </Button>

        {/* Demo User Switcher Dropdown */}
        <div ref={userSwitcherRef} className="relative">
          <button
            type="button"
            onClick={() => setIsUserSwitcherOpen(!isUserSwitcherOpen)}
            title="Switch Demo Persona"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <UserCheck className="w-3.5 h-3.5 text-primary" />
            <span className="hidden md:inline font-sans">Role: {user?.name.split(' ')[0]}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isUserSwitcherOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-60 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-elevated p-1.5 z-50 animate-in fade-in zoom-in-95">
              <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Switch Demo Persona
              </div>
              <div className="space-y-0.5">
                {demoUsers.map((du) => (
                  <button
                    key={du.id}
                    onClick={() => {
                      switchDemoUser(du.id);
                      setIsUserSwitcherOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-xs text-left transition-colors ${
                      user?._id === du.id
                        ? 'bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 font-medium'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div>
                      <p className="font-medium">{du.name}</p>
                      <p className="text-[10px] text-slate-400">{du.role}</p>
                    </div>
                    {user?._id === du.id && <Check className="w-4 h-4 text-primary" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle (Light / Dark) */}
        <button
          type="button"
          onClick={toggleTheme}
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
        </button>

        {/* Notifications Bell */}
        <div ref={notifRef} className="relative">
          <button
            type="button"
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900 animate-pulse-subtle" />
            )}
          </button>

          {/* Notifications Drawer */}
          {isNotifOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-modal z-50 animate-in fade-in zoom-in-95 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                    Notifications
                  </span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-primary text-white">
                      {unreadCount}
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-primary hover:underline font-medium"
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    <CheckCircle2 className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    All caught up! No notifications.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      onClick={() => handleMarkOneRead(n._id, n.link)}
                      className={`p-3.5 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors ${
                        !n.read ? 'bg-primary-50/40 dark:bg-primary-950/20' : ''
                      }`}
                    >
                      <Avatar src={n.sender?.avatar} name={n.sender?.name || 'User'} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                          {n.title}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                          {n.message}
                        </p>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-primary mt-1 flex-shrink-0" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar trigger */}
        <div
          onClick={() => navigate('/profile')}
          className="cursor-pointer hover:ring-2 hover:ring-primary/40 rounded-full transition-all"
        >
          <Avatar src={user?.avatar} name={user?.name || 'User'} size="sm" />
        </div>
      </div>

      {/* Quick Create Task Modal */}
      <Modal
        isOpen={isCreateTaskModalOpen}
        onClose={() => setIsCreateTaskModalOpen(false)}
        title="Create New Task"
        subtitle="Quickly add a task card to your project board."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Task Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Audit checkout flow for high latency"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Project *
              </label>
              <select
                value={taskProjectId}
                onChange={(e) => setTaskProjectId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Board Column
              </label>
              <select
                value={taskStatus}
                onChange={(e) => setTaskStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="backlog">Backlog</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="in_review">In Review</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Priority
              </label>
              <select
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={taskDueDate}
                onChange={(e) => setTaskDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Add key context, requirements, or links..."
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCreateTaskModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmittingTask}>
              Create Task
            </Button>
          </div>
        </form>
      </Modal>
    </header>
  );
};
