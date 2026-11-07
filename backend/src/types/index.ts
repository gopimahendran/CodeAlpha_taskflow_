export interface IUser {
  _id: string;
  name: string;
  email: string;
  password?: string;
  avatar?: string;
  role: string;
  bio?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IWorkspace {
  _id: string;
  name: string;
  description: string;
  slug: string;
  owner: string; // User ID
  createdAt: string;
  updatedAt: string;
}

export interface IWorkspaceMember {
  _id: string;
  workspace: string; // Workspace ID
  user: string | IUser; // User ID or populated IUser
  role: 'owner' | 'admin' | 'member' | 'viewer';
  joinedAt: string;
}

export interface IProject {
  _id: string;
  name: string;
  description: string;
  workspace: string; // Workspace ID
  owner: string | IUser; // User ID or populated IUser
  status: 'active' | 'archived' | 'completed';
  deadline?: string;
  color: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ISubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface IAttachment {
  id: string;
  name: string;
  size: string;
  url: string;
  uploadedAt: string;
  uploadedBy?: string;
}

export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface ITask {
  _id: string;
  title: string;
  description: string;
  project: string; // Project ID
  workspace: string; // Workspace ID
  status: TaskStatus;
  priority: TaskPriority;
  assignee?: string | IUser;
  creator: string | IUser;
  startDate?: string;
  dueDate?: string;
  labels: string[];
  subtasks: ISubTask[];
  attachments: IAttachment[];
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface IComment {
  _id: string;
  task: string; // Task ID
  user: string | IUser; // User ID or populated IUser
  content: string;
  parentComment?: string;
  mentions: string[];
  createdAt: string;
}

export interface INotification {
  _id: string;
  recipient: string; // User ID
  sender: string | IUser;
  type: 'task_assigned' | 'comment_added' | 'status_changed' | 'deadline_approaching';
  title: string;
  message: string;
  link: string;
  read: boolean;
  createdAt: string;
}

export interface IActivityLog {
  _id: string;
  workspace: string;
  project?: string;
  task?: string;
  user: string | IUser;
  action: string;
  details: string;
  createdAt: string;
}

export interface AuthRequestUser {
  userId: string;
  email: string;
  role: string;
}
