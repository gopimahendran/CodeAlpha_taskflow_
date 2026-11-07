import React from 'react';
import { Task } from '../../types/index.js';

interface TaskCompletionChartProps {
  tasks: Task[];
}

export const TaskCompletionChart: React.FC<TaskCompletionChartProps> = ({ tasks }) => {
  const total = tasks.length;
  const counts = {
    backlog: tasks.filter((t) => t.status === 'backlog').length,
    todo: tasks.filter((t) => t.status === 'todo').length,
    in_progress: tasks.filter((t) => t.status === 'in_progress').length,
    in_review: tasks.filter((t) => t.status === 'in_review').length,
    done: tasks.filter((t) => t.status === 'done').length,
  };

  const completionRate = total === 0 ? 0 : Math.round((counts.done / total) * 100);

  const columnConfig = [
    { label: 'Backlog', count: counts.backlog, color: '#64748B', bg: 'bg-slate-500' },
    { label: 'To Do', count: counts.todo, color: '#5B5BD6', bg: 'bg-primary' },
    { label: 'In Progress', count: counts.in_progress, color: '#F59E0B', bg: 'bg-amber-500' },
    { label: 'In Review', count: counts.in_review, color: '#8B5CF6', bg: 'bg-purple-500' },
    { label: 'Done', count: counts.done, color: '#10B981', bg: 'bg-emerald-500' },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Workflow Status Distribution
          </h3>
          <p className="text-xs text-slate-500">Live health of all active workspace tasks</p>
        </div>
        <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
          {completionRate}% Completed
        </span>
      </div>

      {/* Multi-segment stacked progress bar */}
      <div className="mb-6">
        <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 flex overflow-hidden">
          {columnConfig.map((col) => {
            if (col.count === 0 || total === 0) return null;
            const pct = (col.count / total) * 100;
            return (
              <div
                key={col.label}
                title={`${col.label}: ${col.count} tasks (${Math.round(pct)}%)`}
                style={{ width: `${pct}%`, backgroundColor: col.color }}
                className="h-full transition-all duration-300"
              />
            );
          })}
        </div>
      </div>

      {/* Individual status pill breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
        {columnConfig.map((col) => {
          const pct = total === 0 ? 0 : Math.round((col.count / total) * 100);
          return (
            <div key={col.label} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
              <div className="flex items-center gap-1.5 mb-1">
                <span className={`w-2 h-2 rounded-full ${col.bg}`} />
                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 truncate">
                  {col.label}
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {col.count}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold">{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
