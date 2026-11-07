import React, { useState, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import confetti from 'canvas-confetti';
import {
  Search,
  Filter,
  Kanban as KanbanIcon,
  List as ListIcon,
  Plus,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { Task, TaskPriority, TaskStatus, Project, User } from '../../types/index.js';
import { api } from '../../services/api.js';
import { socketService } from '../../services/socket.js';
import { KanbanColumn } from './KanbanColumn.js';
import { TaskCard } from './TaskCard.js';
import { TaskModal } from './TaskModal.js';
import { PriorityBadge, StatusBadge, TagBadge } from '../common/Badge.js';
import { Avatar } from '../common/Avatar.js';
import { Button } from '../common/Button.js';

interface KanbanBoardProps {
  project: Project;
}

const COLUMNS: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'backlog', title: 'Backlog', color: '#64748B' },
  { id: 'todo', title: 'To Do', color: '#5B5BD6' },
  { id: 'in_progress', title: 'In Progress', color: '#F59E0B' },
  { id: 'in_review', title: 'In Review', color: '#8B5CF6' },
  { id: 'done', title: 'Done', color: '#10B981' },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ project }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  // View Mode: Board vs List
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('all');
  const [selectedLabel, setSelectedLabel] = useState<string>('all');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const loadTasks = async () => {
    try {
      const data = await api.getTasks({ projectId: project._id });
      setTasks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
    socketService.joinProject(project._id);

    const socket = socketService.getSocket();
    if (socket) {
      socket.on('task:created', (newTask: Task) => {
        if (newTask.project === project._id) {
          setTasks((prev) => {
            if (prev.some((t) => t._id === newTask._id)) return prev;
            return [...prev, newTask];
          });
        }
      });

      socket.on('task:updated', (updated: Task) => {
        if (updated.project === project._id) {
          setTasks((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
        }
      });

      socket.on('task:moved', (data: { taskId: string; fromStatus: string; toStatus: string; order: number; task?: Task }) => {
        setTasks((prev) =>
          prev.map((t) =>
            t._id === data.taskId ? { ...t, status: data.toStatus as TaskStatus, order: data.order } : t
          )
        );
      });

      socket.on('task:deleted', (data: { taskId: string }) => {
        setTasks((prev) => prev.filter((t) => t._id !== data.taskId));
      });
    }

    return () => {
      socketService.leaveProject(project._id);
      if (socket) {
        socket.off('task:created');
        socket.off('task:updated');
        socket.off('task:moved');
        socket.off('task:deleted');
      }
    };
  }, [project._id]);

  // Extract unique labels & assignees for filter dropdowns
  const availableLabels = Array.from(new Set(tasks.flatMap((t) => t.labels || [])));
  const availableAssignees = Array.from(
    new Map(
      tasks
        .filter((t) => t.assignee)
        .map((t) => [t.assignee!._id, t.assignee!])
    ).values()
  );

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchDesc = task.description?.toLowerCase().includes(q);
      const matchLabel = task.labels?.some((l) => l.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchLabel) return false;
    }
    if (selectedPriority !== 'all' && task.priority !== selectedPriority) {
      return false;
    }
    if (selectedAssignee !== 'all') {
      if (!task.assignee || task.assignee._id !== selectedAssignee) return false;
    }
    if (selectedLabel !== 'all') {
      if (!task.labels || !task.labels.includes(selectedLabel)) return false;
    }
    return true;
  });

  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t._id === active.id);
    if (task) setActiveTask(task);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTaskObj = tasks.find((t) => t._id === activeId);
    if (!activeTaskObj) return;

    // Check if over a column or another task
    const isOverColumn = COLUMNS.some((col) => col.id === overId);
    let targetStatus: TaskStatus | null = null;

    if (isOverColumn) {
      targetStatus = overId as TaskStatus;
    } else {
      const overTask = tasks.find((t) => t._id === overId);
      if (overTask) {
        targetStatus = overTask.status;
      }
    }

    if (targetStatus && activeTaskObj.status !== targetStatus) {
      setTasks((prev) =>
        prev.map((t) => (t._id === activeId ? { ...t, status: targetStatus! } : t))
      );
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTaskObj = tasks.find((t) => t._id === activeId);
    if (!activeTaskObj) return;

    const isOverColumn = COLUMNS.some((col) => col.id === overId);
    let targetStatus: TaskStatus = activeTaskObj.status;

    if (isOverColumn) {
      targetStatus = overId as TaskStatus;
    } else {
      const overTask = tasks.find((t) => t._id === overId);
      if (overTask) targetStatus = overTask.status;
    }

    // Persist status change to backend
    try {
      await api.moveTask(activeId, targetStatus);
      socketService.emitTaskMove({
        taskId: activeId,
        fromStatus: activeTaskObj.status,
        toStatus: targetStatus,
        newOrder: 0,
        projectId: project._id,
        workspaceId: project.workspace,
      });

      // Confetti burst if moved to Done
      if (targetStatus === 'done' && activeTaskObj.status !== 'done') {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#5B5BD6', '#20B8A6', '#F97316', '#10B981'],
        });
      }
    } catch (err) {
      console.error(err);
      loadTasks(); // rollback on error
    }
  };

  // Quick Add task in column
  const handleQuickAddTask = async (status: TaskStatus, title: string) => {
    try {
      const newTask = await api.createTask({
        title,
        status,
        projectId: project._id,
        workspaceId: project.workspace,
        priority: 'medium',
      });
      setTasks((prev) => [...prev, newTask]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Controls & Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        {/* Left: View mode toggle + Search input */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View mode switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('board')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'board'
                  ? 'bg-white dark:bg-slate-700 text-primary shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <KanbanIcon className="w-3.5 h-3.5" />
              <span>Board</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-700 text-primary shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <ListIcon className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
          </div>

          {/* Search within board */}
          <div className="relative flex-1 sm:w-60">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        {/* Right: Filters by Priority, Assignee, Label */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Priority filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Assignee filter */}
          <select
            value={selectedAssignee}
            onChange={(e) => setSelectedAssignee(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">All Assignees</option>
            {availableAssignees.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name}
              </option>
            ))}
          </select>

          {/* Label filter */}
          {availableLabels.length > 0 && (
            <select
              value={selectedLabel}
              onChange={(e) => setSelectedLabel(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none"
            >
              <option value="all">All Labels</option>
              {availableLabels.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          )}

          {/* Reset Filters button if active */}
          {(searchQuery || selectedPriority !== 'all' || selectedAssignee !== 'all' || selectedLabel !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedPriority('all');
                setSelectedAssignee('all');
                setSelectedLabel('all');
              }}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              title="Clear filters"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content: Board View vs List View */}
      {viewMode === 'board' ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-6 pt-1 items-start min-h-[550px]">
            {COLUMNS.map((column) => {
              const colTasks = filteredTasks.filter((t) => t.status === column.id);
              return (
                <KanbanColumn
                  key={column.id}
                  id={column.id}
                  title={column.title}
                  color={column.color}
                  tasks={colTasks}
                  onTaskClick={handleTaskClick}
                  onAddTask={handleQuickAddTask}
                />
              );
            })}
          </div>

          <DragOverlay>
            {activeTask ? (
              <TaskCard task={activeTask} onClick={() => {}} isOverlay />
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        /* List View */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Task Title</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Assignee</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3">Checklist</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400">
                      No matching tasks found.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((task) => (
                    <tr
                      key={task._id}
                      onClick={() => handleTaskClick(task)}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-100">
                        <div className="flex items-center gap-2">
                          <span>{task.title}</span>
                          {task.labels?.map((l) => (
                            <span
                              key={l}
                              className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500"
                            >
                              {l}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={task.status} size="sm" />
                      </td>
                      <td className="px-4 py-3">
                        <PriorityBadge priority={task.priority} size="sm" />
                      </td>
                      <td className="px-4 py-3">
                        {task.assignee ? (
                          <div className="flex items-center gap-1.5">
                            <Avatar src={task.assignee.avatar} name={task.assignee.name} size="xs" />
                            <span className="text-slate-700 dark:text-slate-300 font-medium">
                              {task.assignee.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {task.dueDate
                          ? new Date(task.dueDate).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                            })
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {task.subtasks && task.subtasks.length > 0
                          ? `${task.subtasks.filter((s) => s.completed).length}/${task.subtasks.length}`
                          : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Task Details Modal */}
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
