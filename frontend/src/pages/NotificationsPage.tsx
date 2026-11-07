import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import { api } from '../services/api.js';
import { Notification } from '../types/index.js';
import { Button } from '../components/common/Button.js';
import { Avatar } from '../components/common/Avatar.js';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const loadNotifications = async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    await api.markAllNotificationsAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleMarkOne = async (n: Notification) => {
    if (!n.read) {
      await api.markNotificationAsRead(n._id);
      setNotifications((prev) => prev.map((item) => (item._id === n._id ? { ...item, read: true } : item)));
    }
    if (n.link) {
      navigate(n.link);
    }
  };

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'comment_added':
        return <MessageSquare className="w-4 h-4 text-primary" />;
      case 'task_assigned':
        return <CheckCircle2 className="w-4 h-4 text-accent" />;
      case 'deadline_approaching':
        return <Calendar className="w-4 h-4 text-orange-500" />;
      default:
        return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Notification Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Real-time updates on assignments, comments, mentions, and due dates.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            leftIcon={<CheckCheck className="w-4 h-4" />}
            onClick={handleMarkAllRead}
          >
            Mark all as read
          </Button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors ${
            filter === 'all'
              ? 'bg-primary text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('unread')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors ${
            filter === 'unread'
              ? 'bg-primary text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Bell className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-500">No notifications to display</p>
          </div>
        ) : (
          filtered.map((n) => (
            <div
              key={n._id}
              onClick={() => handleMarkOne(n)}
              className={`p-4 sm:p-5 flex items-start gap-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors ${
                !n.read ? 'bg-primary-50/30 dark:bg-primary-950/20' : ''
              }`}
            >
              <div className="relative flex-shrink-0">
                <Avatar src={n.sender?.avatar} name={n.sender?.name || 'User'} size="md" />
                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                  {getTypeIcon(n.type)}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    {n.title}
                  </h4>
                  <span className="text-[11px] text-slate-400 flex-shrink-0">
                    {new Date(n.createdAt).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  {n.message}
                </p>
                {n.link && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-semibold mt-2">
                    <span>View Task</span>
                    <ExternalLink className="w-3 h-3" />
                  </span>
                )}
              </div>

              {!n.read && (
                <span className="w-2.5 h-2.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
