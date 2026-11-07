import React from 'react';
import { Calendar, AlertCircle, Clock, ChevronRight } from 'lucide-react';
import { Task } from '../../types/index.js';
import { PriorityBadge } from '../common/Badge.js';
import { Avatar } from '../common/Avatar.js';

interface UpcomingDeadlinesProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

export const UpcomingDeadlines: React.FC<UpcomingDeadlinesProps> = ({ tasks, onTaskClick }) => {
  // Filter incomplete tasks with due dates and sort ascending
  const upcomingTasks = tasks
    .filter((t) => t.status !== 'done' && t.dueDate)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 5);

  const getUrgency = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dateStr);
    due.setHours(0, 0, 0, 0);
    const diff = Math.round((due.getTime() - today.getTime()) / (1000 * 3600 * 24));

    if (diff < 0) {
      return { label: 'Overdue', color: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 font-bold' };
    }
    if (diff === 0) {
      return { label: 'Due Today', color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 font-bold' };
    }
    if (diff === 1) {
      return { label: 'Tomorrow', color: 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 font-semibold' };
    }
    return {
      label: `In ${diff} days`,
      color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    };
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Upcoming Deadlines
          </h3>
        </div>
        <span className="text-xs text-slate-400 font-medium">{upcomingTasks.length} pending</span>
      </div>

      <div className="space-y-2 flex-1">
        {upcomingTasks.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8">
            🎉 No upcoming deadlines for this week!
          </p>
        ) : (
          upcomingTasks.map((t) => {
            const urgency = getUrgency(t.dueDate!);
            return (
              <div
                key={t._id}
                onClick={() => onTaskClick(t)}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer border border-transparent hover:border-slate-200/60 dark:hover:border-slate-700 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Avatar src={t.assignee?.avatar} name={t.assignee?.name || 'User'} size="xs" />
                  <div className="truncate">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {t.title}
                    </p>
                    <span className="text-[10px] text-slate-400">
                      {new Date(t.dueDate!).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${urgency.color}`}>
                    {urgency.label}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
