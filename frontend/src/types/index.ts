export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  bio?: string;
  createdAt: string;
}

export interface Workspace {
  _id: string;
  name: string;
  description: string;
  slug: string;
  owner: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMember {
  _id: string;
  workspace: string;
  user: User | string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  joinedAt: string;
  userDetails?: User;
}

export interface ProjectStats {
  total: number;
  completed: number;
  inProgress: number;
  progressPercent: number;
}

export interface Project {
  _id: string;
  name: string;
  description: string;
  workspace: string;
  owner: User | string;
  status: 'active' | 'archived' | 'completed';
  deadline?: string;
  color: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
  stats?: ProjectStats;
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  size: string;
  url: string;
  uploadedAt: string;
  uploadedBy?: string;
}

export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  _id: string;
  title: string;
  description: string;
  project: string;
  workspace: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee?: User;
  creator: User;
  startDate?: string;
  dueDate?: string;
  labels: string[];
  subtasks: SubTask[];
  attachments: Attachment[];
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  _id: string;
  task: string;
  user: User;
  content: string;
  parentComment?: string;
  mentions: string[];
  createdAt: string;
}

export interface Notification {
  _id: string;
  recipient: string;
  sender: User;
  type: 'task_assigned' | 'comment_added' | 'status_changed' | 'deadline_approaching';
  title: string;
  message: string;
  link: string;
  read: boolean;
  createdAt: string;
}

export interface ActivityLog {
  _id: string;
  workspace: string;
  project?: string;
  task?: string;
  user: User;
  action: string;
  details: string;
  createdAt: string;
}
