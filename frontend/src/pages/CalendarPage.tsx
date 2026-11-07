import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Filter,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext.js';
import { api } from '../services/api.js';
import { Task } from '../types/index.js';
import { TaskModal } from '../components/kanban/TaskModal.js';
import { PriorityBadge } from '../components/common/Badge.js';
import { Avatar } from '../components/common/Avatar.js';

export const CalendarPage: React.FC = () => {
  const { currentWorkspace, projects } = useWorkspace();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [currentDate, setCurrentDate] = useState(new Date());

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  useEffect(() => {
    if (!currentWorkspace) return;
    api.getTasks({ workspaceId: currentWorkspace._id }).then(setTasks);
  }, [currentWorkspace?._id]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // First day of month & number of days
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const filteredTasks = tasks.filter((t) => {
    if (selectedProject !== 'all' && t.project !== selectedProject) return false;
    return !!t.dueDate;
  });

  // Map tasks to dates in current month
  const tasksByDate: { [day: number]: Task[] } = {};
  filteredTasks.forEach((t) => {
    const d = new Date(t.dueDate!);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      if (!tasksByDate[day]) tasksByDate[day] = [];
      tasksByDate[day].push(t);
    }
  });

  const todayDate = new Date();
  const isCurrentMonthToday = todayDate.getFullYear() === year && todayDate.getMonth() === month;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Schedule & Deadlines Calendar
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Keep track of task deliveries and upcoming project milestones.
          </p>
        </div>

        {/* Project Filter */}
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
          <Filter className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="text-xs bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none pr-2"
          >
            <option value="all">All Projects</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Calendar Navigation Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            {monthNames[month]} {year}
          </h2>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goToToday}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            >
              Today
            </button>
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 gap-px mb-2 text-center text-xs font-bold text-slate-400">
          <div>SUN</div>
          <div>MON</div>
          <div>TUE</div>
          <div>WED</div>
          <div>THU</div>
          <div>FRI</div>
          <div>SAT</div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {/* Empty cells for leading days */}
          {Array.from({ length: firstDayIndex }).map((_, idx) => (
            <div
              key={`empty-${idx}`}
              className="min-h-[90px] sm:min-h-[110px] p-2 rounded-xl bg-slate-50/50 dark:bg-slate-800/20 opacity-40"
            />
          ))}

          {/* Actual Month Days */}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const dayNum = idx + 1;
            const isToday = isCurrentMonthToday && todayDate.getDate() === dayNum;
            const dayTasks = tasksByDate[dayNum] || [];

            return (
              <div
                key={dayNum}
                className={`min-h-[90px] sm:min-h-[110px] p-2 rounded-xl border transition-colors flex flex-col justify-between ${
                  isToday
                    ? 'border-primary bg-primary-50/30 dark:bg-primary-950/20'
                    : 'border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                      isToday
                        ? 'bg-primary text-white shadow-xs'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {dayNum}
                  </span>
                  {dayTasks.length > 0 && (
                    <span className="text-[10px] font-semibold text-slate-400">
                      {dayTasks.length}
                    </span>
                  )}
                </div>

                {/* Tasks list on that day */}
                <div className="space-y-1 flex-1 overflow-y-auto max-h-16">
                  {dayTasks.slice(0, 2).map((task) => (
                    <div
                      key={task._id}
                      onClick={() => {
                        setSelectedTask(task);
                        setIsTaskModalOpen(true);
                      }}
                      className="px-1.5 py-1 rounded-md text-[10px] font-medium truncate cursor-pointer transition-colors bg-slate-100 hover:bg-primary hover:text-white dark:bg-slate-700 dark:text-slate-200"
                    >
                      {task.title}
                    </div>
                  ))}
                  {dayTasks.length > 2 && (
                    <span className="text-[9px] text-slate-400 font-semibold block text-center">
                      +{dayTasks.length - 2} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

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
