import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Calendar,
  CheckSquare,
  MessageSquare,
  Paperclip,
  GripVertical,
} from 'lucide-react';
import { Task } from '../../types/index.js';
import { PriorityBadge, TagBadge } from '../common/Badge.js';
import { Avatar } from '../common/Avatar.js';

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  isOverlay?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onClick, isOverlay = false }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task._id,
    data: {
      type: 'Task',
      task,
    },
    disabled: isOverlay,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const completedSubtasks = task.subtasks?.filter((s) => s.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;

  // Due date formatting & urgency check
  const formatDueDate = (dateStr?: string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(date);
    due.setHours(0, 0, 0, 0);

    const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 3600 * 24));
    const isOverdue = diffDays < 0;
    const isUrgent = diffDays >= 0 && diffDays <= 2;

    let text = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    if (diffDays === 0) text = 'Today';
    else if (diffDays === 1) text = 'Tomorrow';
    else if (diffDays === -1) text = 'Yesterday';

    return { text, isOverdue, isUrgent };
  };

  const dueDateInfo = formatDueDate(task.dueDate);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative bg-white dark:bg-slate-800/90 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/70 shadow-xs hover:shadow-card hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-150 cursor-pointer select-none ${
        isDragging ? 'opacity-40 ring-2 ring-primary/40' : ''
      } ${isOverlay ? 'shadow-elevated rotate-2 scale-102 cursor-grabbing' : ''}`}
      onClick={onClick}
    >
      {/* Top Row: Drag Handle + Priority + Labels */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
          <PriorityBadge priority={task.priority} size="sm" />
          {task.labels?.slice(0, 2).map((label) => (
            <TagBadge key={label} label={label} />
          ))}
          {task.labels && task.labels.length > 2 && (
            <span className="text-[10px] text-slate-400 font-medium">
              +{task.labels.length - 2}
            </span>
          )}
        </div>

        {/* Drag handle */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded transition-opacity cursor-grab active:cursor-grabbing"
          title="Drag task"
        >
          <GripVertical className="w-4 h-4" />
        </button>
      </div>

      {/* Task Title */}
      <h4 className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1.5 leading-snug line-clamp-2">
        {task.title}
      </h4>

      {/* Description Snippet */}
      {task.description && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mb-3 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Subtasks Progress Bar (if task has subtasks) */}
      {totalSubtasks > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
            <span className="flex items-center gap-1 font-medium text-[10px]">
              <CheckSquare className="w-3 h-3 text-primary" />
              <span>
                {completedSubtasks}/{totalSubtasks} Subtasks
              </span>
            </span>
            <span className="text-[10px] font-semibold">
              {Math.round((completedSubtasks / totalSubtasks) * 100)}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                completedSubtasks === totalSubtasks
                  ? 'bg-emerald-500'
                  : 'bg-primary'
              }`}
              style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Card Footer: Metadata (due date, comments, attachments) + Assignee */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60 text-slate-400 text-[11px]">
        <div className="flex items-center gap-3">
          {dueDateInfo && (
            <span
              className={`flex items-center gap-1 font-medium ${
                dueDateInfo.isOverdue
                  ? 'text-rose-600 dark:text-rose-400 font-semibold'
                  : dueDateInfo.isUrgent
                  ? 'text-amber-600 dark:text-amber-400 font-semibold'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{dueDateInfo.text}</span>
            </span>
          )}

          {task.attachments && task.attachments.length > 0 && (
            <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
              <Paperclip className="w-3 h-3" />
              <span>{task.attachments.length}</span>
            </span>
          )}

          <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
            <MessageSquare className="w-3 h-3" />
            <span>0</span>
          </span>
        </div>

        {/* Assignee Avatar */}
        {task.assignee ? (
          <div title={`Assigned to ${task.assignee.name}`}>
            <Avatar
              src={task.assignee.avatar}
              name={task.assignee.name}
              size="xs"
            />
          </div>
        ) : (
          <div
            className="w-5 h-5 rounded-full border border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center text-[10px] text-slate-400"
            title="Unassigned"
          >
            ?
          </div>
        )}
      </div>
    </div>
  );
};
