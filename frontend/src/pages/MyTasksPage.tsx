import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckSquare,
  Calendar,
  AlertCircle,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useWorkspace } from '../context/WorkspaceContext.js';
import { api } from '../services/api.js';
import { Task, TaskPriority } from '../types/index.js';
import { PriorityBadge, TagBadge } from '../components/common/Badge.js';
import { TaskModal } from '../components/kanban/TaskModal.js';
import { Avatar } from '../components/common/Avatar.js';

export const MyTasksPage: React.FC = () => {
  const { user } = useAuth();
  const { currentWorkspace, projects } = useWorkspace();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const loadMyTasks = async () => {
    if (!user || !currentWorkspace) return;
    try {
      const data = await api.getTasks({
        workspaceId: currentWorkspace._id,
        assignee: user._id,
      });
      setTasks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMyTasks();
  }, [user?._id, currentWorkspace?._id]);

  const handleToggleComplete = async (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    try {
      const updated = await api.moveTask(task._id, newStatus);
      setTasks((prev) => prev.map((t) => (t._id === task._id ? updated : t)));

      if (newStatus === 'done') {
        confetti({
          particleCount: 75,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#5B5BD6', '#20B8A6', '#10B981', '#F59E0B'],
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Group tasks
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filteredTasks = tasks.filter((t) => {
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    return true;
  });

  const dueSoonTasks = filteredTasks.filter((t) => {
    if (t.status === 'done' || !t.dueDate) return false;
    const due = new Date(t.dueDate);
    due.setHours(0, 0, 0, 0);
    const diff = (due.getTime() - today.getTime()) / (1000 * 3600 * 24);
    return diff <= 2;
  });

  const upcomingTasks = filteredTasks.filter((t) => {
    if (t.status === 'done') return false;
    if (!t.dueDate) return true; // tasks without due date placed in upcoming
    const due = new Date(t.dueDate);
    due.setHours(0, 0, 0, 0);
    const diff = (due.getTime() - today.getTime()) / (1000 * 3600 * 24);
    return diff > 2;
  });

  const completedTasks = filteredTasks.filter((t) => t.status === 'done');

  const renderTaskRow = (task: Task) => {
    const projectObj = projects.find((p) => p._id === task.project);
    const isDone = task.status === 'done';

    return (
      <div
        key={task._id}
        onClick={() => {
          setSelectedTask(task);
          setIsTaskModalOpen(true);
        }}
        className={`group flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-primary/40 hover:shadow-xs cursor-pointer transition-all ${
          isDone ? 'opacity-65' : ''
        }`}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Complete Checkbox */}
          <button
            type="button"
            onClick={(e) => handleToggleComplete(e, task)}
            className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors flex-shrink-0 ${
              isDone
                ? 'bg-emerald-500 border-emerald-500 text-white'
                : 'border-slate-300 dark:border-slate-600 hover:border-primary'
            }`}
          >
            {isDone && <CheckCircle2 className="w-3.5 h-3.5" />}
          </button>

          <div className="truncate min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`text-xs sm:text-sm font-semibold truncate text-slate-800 dark:text-slate-100 ${
                  isDone ? 'line-through text-slate-400 dark:text-slate-500' : ''
                }`}
              >
                {task.title}
              </span>
              {projectObj && (
                <span
                  className="px-2 py-0.5 rounded-md text-[10px] font-medium hidden sm:inline-block"
                  style={{
                    backgroundColor: `${projectObj.color}15`,
                    color: projectObj.color,
                  }}
                >
                  {projectObj.name}
                </span>
              )}
            </div>

            {task.description && (
              <p className="text-[11px] text-slate-400 truncate mt-0.5 max-w-xl">
                {task.description}
              </p>
            )}
          </div>
        </div>

        {/* Right meta */}
        <div className="flex items-center gap-3 flex-shrink-0 ml-3">
          <PriorityBadge priority={task.priority} size="sm" />

          {task.dueDate && (
            <span className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {new Date(task.dueDate).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            My Assigned Tasks
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Personal checklist for {user?.name}. Check off tasks as you finish them!
          </p>
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
          <Filter className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none pr-2"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center">
          <div className="inline-block w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Section 1: Due Today & Overdue */}
          {dueSoonTasks.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <AlertCircle className="w-4 h-4 text-orange-500" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Needs Attention ({dueSoonTasks.length})
                </h3>
              </div>
              <div className="space-y-2">{dueSoonTasks.map(renderTaskRow)}</div>
            </div>
          )}

          {/* Section 2: Upcoming */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <Clock className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Upcoming & In Progress ({upcomingTasks.length})
              </h3>
            </div>
            {upcomingTasks.length === 0 ? (
              <p className="text-xs text-slate-400 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center">
                No upcoming tasks remaining. Great job!
              </p>
            ) : (
              <div className="space-y-2">{upcomingTasks.map(renderTaskRow)}</div>
            )}
          </div>

          {/* Section 3: Completed */}
          {completedTasks.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-2 px-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Completed ({completedTasks.length})
                </h3>
              </div>
              <div className="space-y-2">{completedTasks.map(renderTaskRow)}</div>
            </div>
          )}
        </div>
      )}

      {/* Task Modal */}
      <TaskModal
        taskId={selectedTask?._id || null}
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setSelectedTask(null);
        }}
        onTaskUpdated={(updated) => {
          setTasks((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
        }}
        onTaskDeleted={(deletedId) => {
          setTasks((prev) => prev.filter((t) => t._id !== deletedId));
        }}
      />
    </div>
  );
};
