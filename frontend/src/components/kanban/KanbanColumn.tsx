import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, MoreHorizontal } from 'lucide-react';
import { Task, TaskStatus } from '../../types/index.js';
import { TaskCard } from './TaskCard.js';

interface KanbanColumnProps {
  id: TaskStatus;
  title: string;
  tasks: Task[];
  color: string;
  onTaskClick: (task: Task) => void;
  onAddTask: (status: TaskStatus, title: string) => Promise<void>;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  id,
  title,
  tasks,
  color,
  onTaskClick,
  onAddTask,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      type: 'Column',
      status: id,
    },
  });

  const [isAdding, setIsAdding] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onAddTask(id, quickTitle.trim());
      setQuickTitle('');
      setIsAdding(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col flex-shrink-0 w-72 sm:w-80 bg-slate-100/70 dark:bg-slate-900/40 rounded-2xl p-3 border border-slate-200/60 dark:border-slate-800">
      {/* Column Header */}
      <div className="flex items-center justify-between px-2 py-1.5 mb-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
          <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
            {title}
          </h3>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700">
            {tasks.length}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsAdding(!isAdding)}
            className="p-1 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-800 transition-colors"
            title="Quick add task"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Add Inline Form */}
      {isAdding && (
        <form onSubmit={handleQuickAdd} className="mb-3 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-2.5 border border-primary/40 shadow-xs">
            <input
              type="text"
              autoFocus
              placeholder="What needs to be done? Press Enter"
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              className="w-full text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none bg-transparent"
            />
            <div className="flex items-center justify-end gap-1.5 mt-2">
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setQuickTitle('');
                }}
                className="px-2 py-1 text-[11px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!quickTitle.trim() || isSubmitting}
                className="px-2.5 py-1 text-[11px] font-medium bg-primary text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Task List / Drop Area */}
      <div
        ref={setNodeRef}
        className={`flex-1 flex flex-col gap-2.5 min-h-[350px] rounded-xl p-1 transition-colors ${
          isOver ? 'bg-primary-50/50 dark:bg-primary-950/20 ring-2 ring-primary/30 ring-dashed' : ''
        }`}
      >
        <SortableContext items={tasks.map((t) => t._id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task._id} task={task} onClick={() => onTaskClick(task)} />
          ))}
        </SortableContext>

        {tasks.length === 0 && !isAdding && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            <p className="text-xs text-slate-400 font-medium">No tasks in this column</p>
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="mt-2 text-xs text-primary hover:underline font-medium flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add a task</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
