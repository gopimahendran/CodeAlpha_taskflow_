import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Calendar,
  CheckSquare,
  MessageSquare,
  Paperclip,
  Trash2,
  Send,
  User,
  Plus,
  Tag,
  Check,
  Clock,
  History,
  FileText,
  Upload,
} from 'lucide-react';
import { Task, TaskPriority, TaskStatus, Comment, User as UserType } from '../../types/index.js';
import { api } from '../../services/api.js';
import { socketService } from '../../services/socket.js';
import { useAuth } from '../../context/AuthContext.js';
import { useWorkspace } from '../../context/WorkspaceContext.js';
import { Modal } from '../common/Modal.js';
import { Avatar } from '../common/Avatar.js';
import { Button } from '../common/Button.js';
import { TagBadge } from '../common/Badge.js';

interface TaskModalProps {
  taskId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdated: (updatedTask: Task) => void;
  onTaskDeleted: (taskId: string) => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  taskId,
  isOpen,
  onClose,
  onTaskUpdated,
  onTaskDeleted,
}) => {
  const { user } = useAuth();
  const { members } = useWorkspace();

  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'activity'>('details');

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [labels, setLabels] = useState<string[]>([]);

  // Subtask state
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  // Comment state
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Activity logs for this task
  const [activityLogs, setActivityLogs] = useState<any[]>([]);

  // Load task details
  const loadTask = async (id: string) => {
    setIsLoading(true);
    try {
      const data = await api.getTask(id);
      setTask(data);
      setTitle(data.title);
      setDescription(data.description || '');
      setStatus(data.status);
      setPriority(data.priority);
      setAssigneeId(data.assignee?._id || '');
      setStartDate(data.startDate ? data.startDate.split('T')[0] : '');
      setDueDate(data.dueDate ? data.dueDate.split('T')[0] : '');
      setLabels(data.labels || []);

      // Load comments
      const comms = await api.getComments(id);
      setComments(comms);

      // Load activity
      const acts = await api.getActivity({ projectId: data.project });
      setActivityLogs(acts.filter((a) => a.task === id || a.details?.includes(data.title)));
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (taskId && isOpen) {
      loadTask(taskId);

      // Socket live comments & updates
      const socket = socketService.getSocket();
      if (socket) {
        socket.on('comment:created', (data: { taskId: string; comment: Comment }) => {
          if (data.taskId === taskId) {
            setComments((prev) => [...prev, data.comment]);
          }
        });
      }

      return () => {
        if (socket) socket.off('comment:created');
      };
    }
  }, [taskId, isOpen]);

  if (!isOpen) return null;

  // Save changes
  const handleSaveField = async (fieldsToUpdate: Partial<Task>) => {
    if (!task) return;
    try {
      const updated = await api.updateTask(task._id, fieldsToUpdate);
      setTask(updated);
      onTaskUpdated(updated);

      if (fieldsToUpdate.status === 'done' && task.status !== 'done') {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#5B5BD6', '#20B8A6', '#F97316', '#10B981'],
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add subtask
  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim() || !task) return;
    try {
      const updated = await api.addSubtask(task._id, newSubtaskTitle.trim());
      setTask(updated);
      onTaskUpdated(updated);
      setNewSubtaskTitle('');
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle subtask
  const handleToggleSubtask = async (subtaskId: string, currentCompleted: boolean) => {
    if (!task) return;
    try {
      const updated = await api.toggleSubtask(task._id, subtaskId, !currentCompleted);
      setTask(updated);
      onTaskUpdated(updated);
    } catch (err) {
      console.error(err);
    }
  };

  // Delete subtask
  const handleDeleteSubtask = async (subtaskId: string) => {
    if (!task) return;
    try {
      const updated = await api.deleteSubtask(task._id, subtaskId);
      setTask(updated);
      onTaskUpdated(updated);
    } catch (err) {
      console.error(err);
    }
  };

  // Add attachment (interactive simulated upload)
  const handleAddAttachment = async () => {
    if (!task) return;
    const sampleFiles = [
      { name: 'technical-specification-v3.pdf', size: '2.4 MB' },
      { name: 'wireframe-screen-flow.fig', size: '6.1 MB' },
      { name: 'api-response-schema.json', size: '128 KB' },
    ];
    const pick = sampleFiles[Math.floor(Math.random() * sampleFiles.length)];
    try {
      const updated = await api.addAttachment(task._id, pick);
      setTask(updated);
      onTaskUpdated(updated);
    } catch (err) {
      console.error(err);
    }
  };

  // Add Comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !task || isSubmittingComment) return;
    setIsSubmittingComment(true);
    try {
      const saved = await api.addComment(task._id, newCommentText.trim());
      setComments((prev) => [...prev, saved]);
      setNewCommentText('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Add Label
  const handleAddLabel = () => {
    if (!newLabel.trim() || !task) return;
    const labelTrimmed = newLabel.trim();
    if (!labels.includes(labelTrimmed)) {
      const updatedLabels = [...labels, labelTrimmed];
      setLabels(updatedLabels);
      handleSaveField({ labels: updatedLabels });
    }
    setNewLabel('');
  };

  const handleRemoveLabel = (labelToRemove: string) => {
    if (!task) return;
    const updatedLabels = labels.filter((l) => l !== labelToRemove);
    setLabels(updatedLabels);
    handleSaveField({ labels: updatedLabels });
  };

  // Delete task
  const handleDeleteTask = async () => {
    if (!task) return;
    if (window.confirm(`Are you sure you want to delete "${task.title}"?`)) {
      try {
        await api.deleteTask(task._id);
        onTaskDeleted(task._id);
        onClose();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const completedSubtasks = task?.subtasks?.filter((s) => s.completed).length || 0;
  const totalSubtasks = task?.subtasks?.length || 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="3xl">
      {isLoading || !task ? (
        <div className="py-16 text-center">
          <div className="inline-block w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="mt-2 text-xs text-slate-500">Loading task details...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header Bar: Status Badge + Priority Dropdown + Delete */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">Status:</span>
              <select
                value={status}
                onChange={(e) => {
                  const newStatus = e.target.value as TaskStatus;
                  setStatus(newStatus);
                  handleSaveField({ status: newStatus });
                }}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="backlog">Backlog</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="in_review">In Review</option>
                <option value="done">Done</option>
              </select>

              <span className="text-xs font-semibold text-slate-400 ml-2">Priority:</span>
              <select
                value={priority}
                onChange={(e) => {
                  const newPriority = e.target.value as TaskPriority;
                  setPriority(newPriority);
                  handleSaveField({ priority: newPriority });
                }}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleDeleteTask}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
              title="Delete task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Editable Title */}
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => {
                if (title.trim() && title !== task.title) {
                  handleSaveField({ title: title.trim() });
                }
              }}
              className="w-full text-base sm:text-xl font-bold text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-primary focus:outline-none transition-colors py-1"
              placeholder="Task title"
            />
          </div>

          {/* Metadata Row: Assignee + Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800 text-xs">
            {/* Assignee */}
            <div>
              <span className="block font-medium text-slate-400 mb-1">Assignee</span>
              <div className="flex items-center gap-2">
                <select
                  value={assigneeId}
                  onChange={(e) => {
                    setAssigneeId(e.target.value);
                    handleSaveField({ assignee: e.target.value as any });
                  }}
                  className="w-full py-1 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  <option value="">Unassigned</option>
                  {members.map((m) => {
                    const u = m.userDetails || (typeof m.user !== 'string' ? m.user : null);
                    if (!u) return null;
                    return (
                      <option key={u._id} value={u._id}>
                        {u.name} ({u.role})
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Start Date */}
            <div>
              <span className="block font-medium text-slate-400 mb-1">Start Date</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  handleSaveField({ startDate: e.target.value });
                }}
                className="w-full py-1 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
              />
            </div>

            {/* Due Date */}
            <div>
              <span className="block font-medium text-slate-400 mb-1">Due Date</span>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => {
                  setDueDate(e.target.value);
                  handleSaveField({ dueDate: e.target.value });
                }}
                className="w-full py-1 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
              />
            </div>
          </div>

          {/* Labels & Tags Manager */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Labels & Tags
            </label>
            <div className="flex flex-wrap items-center gap-1.5">
              {labels.map((l) => (
                <TagBadge key={l} label={l} onRemove={() => handleRemoveLabel(l)} />
              ))}
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  placeholder="+ Add label"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddLabel();
                    }
                  }}
                  className="px-2 py-0.5 text-xs rounded-md border border-dashed border-slate-300 dark:border-slate-700 bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none focus:border-primary w-24"
                />
              </div>
            </div>
          </div>

          {/* Tabs Navigation: Details / Checklist | Comments | Activity */}
          <div className="border-b border-slate-200 dark:border-slate-800 flex items-center gap-4 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('details')}
              className={`pb-2 transition-colors border-b-2 flex items-center gap-1.5 ${
                activeTab === 'details'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Details & Checklist</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('comments')}
              className={`pb-2 transition-colors border-b-2 flex items-center gap-1.5 ${
                activeTab === 'comments'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Discussion ({comments.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('activity')}
              className={`pb-2 transition-colors border-b-2 flex items-center gap-1.5 ${
                activeTab === 'activity'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Activity History</span>
            </button>
          </div>

          {/* TAB 1: Details & Checklist */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={() => {
                    if (description !== task.description) {
                      handleSaveField({ description });
                    }
                  }}
                  placeholder="Add details, acceptance criteria, or technical notes..."
                  className="w-full p-3 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30 leading-relaxed"
                />
              </div>

              {/* Subtasks / Checklist */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Subtasks & Checklist
                    </span>
                  </div>
                  {totalSubtasks > 0 && (
                    <span className="text-xs font-semibold text-slate-500">
                      {completedSubtasks}/{totalSubtasks} ({Math.round((completedSubtasks / totalSubtasks) * 100)}%)
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                {totalSubtasks > 0 && (
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-3">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-300"
                      style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
                    />
                  </div>
                )}

                {/* List of subtasks */}
                <div className="space-y-1.5 mb-3">
                  {task.subtasks?.map((st) => (
                    <div
                      key={st.id}
                      className="group flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-colors"
                    >
                      <label className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={st.completed}
                          onChange={() => handleToggleSubtask(st.id, st.completed)}
                          className="w-4 h-4 rounded text-primary focus:ring-primary/40 border-slate-300 dark:border-slate-600"
                        />
                        <span
                          className={`text-xs text-slate-800 dark:text-slate-200 ${
                            st.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''
                          }`}
                        >
                          {st.title}
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handleDeleteSubtask(st.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-opacity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Subtask Input */}
                <form onSubmit={handleAddSubtask} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add a new checklist item..."
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <Button type="submit" variant="secondary" size="sm">
                    Add Item
                  </Button>
                </form>
              </div>

              {/* Attachments Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Attachments ({task.attachments?.length || 0})
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleAddAttachment}
                    leftIcon={<Upload className="w-3.5 h-3.5" />}
                  >
                    Upload File
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {task.attachments?.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                        <div className="truncate">
                          <p className="font-medium text-slate-800 dark:text-slate-200 truncate">
                            {att.name}
                          </p>
                          <p className="text-[10px] text-slate-400">{att.size}</p>
                        </div>
                      </div>
                      <a
                        href={att.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-primary hover:underline font-medium px-2 py-1"
                      >
                        Download
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Comments & Discussions */}
          {activeTab === 'comments' && (
            <div className="space-y-4">
              {/* Comment Input */}
              <form onSubmit={handleAddComment} className="flex items-start gap-3">
                <Avatar src={user?.avatar} name={user?.name || 'User'} size="sm" />
                <div className="flex-1 space-y-2">
                  <textarea
                    rows={2}
                    placeholder="Write a comment... Tip: type @Name to mention a teammate"
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      isLoading={isSubmittingComment}
                      disabled={!newCommentText.trim()}
                      rightIcon={<Send className="w-3.5 h-3.5" />}
                    >
                      Post Comment
                    </Button>
                  </div>
                </div>
              </form>

              {/* Comments List */}
              <div className="space-y-3 pt-2 divide-y divide-slate-100 dark:divide-slate-800/60">
                {comments.length === 0 ? (
                  <p className="text-center py-6 text-xs text-slate-400">
                    No comments yet. Start the team discussion!
                  </p>
                ) : (
                  comments.map((comm) => (
                    <div key={comm._id} className="pt-3 flex items-start gap-3">
                      <Avatar src={comm.user?.avatar} name={comm.user?.name || 'User'} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {comm.user?.name}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(comm.createdAt).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 leading-relaxed whitespace-pre-wrap">
                          {comm.content}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Activity History */}
          {activeTab === 'activity' && (
            <div className="space-y-3">
              {activityLogs.length === 0 ? (
                <p className="text-center py-6 text-xs text-slate-400">No activity recorded yet.</p>
              ) : (
                activityLogs.map((log) => (
                  <div key={log._id} className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                    <Avatar src={log.user?.avatar} name={log.user?.name || 'User'} size="xs" />
                    <div className="flex-1">
                      <p>
                        <span className="font-semibold text-slate-800 dark:text-white">
                          {log.user?.name}
                        </span>{' '}
                        {log.details}
                      </p>
                      <span className="text-[10px] text-slate-400">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};
