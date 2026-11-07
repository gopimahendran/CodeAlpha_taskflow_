import {
  User,
  Workspace,
  WorkspaceMember,
  Project,
  Task,
  Comment,
  Notification,
  ActivityLog,
} from '../types/index.js';

const API_BASE = '/api';

class ApiService {
  private getToken(): string | null {
    return localStorage.getItem('taskflow_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMsg = 'An unexpected error occurred';
      try {
        const errorData = await response.json();
        errorMsg = errorData.error || errorMsg;
      } catch {
        errorMsg = response.statusText || errorMsg;
      }
      throw new Error(errorMsg);
    }

    return response.json();
  }

  // --- Auth ---
  async login(email: string, password: string):Promise<{ user: User; token: string }> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(data: { name: string; email: string; password: string; role?: string }): Promise<{ user: User; token: string }> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMe(): Promise<{ user: User }> {
    return this.request('/auth/me');
  }

  async updateMe(data: Partial<User>): Promise<{ user: User }> {
    return this.request('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getUsers(): Promise<User[]> {
    return this.request('/auth/users');
  }

  async demoSwitch(userId: string): Promise<{ user: User; token: string }> {
    return this.request('/auth/demo-switch', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  // --- Workspaces ---
  async getWorkspaces(): Promise<Workspace[]> {
    return this.request('/workspaces');
  }

  async getWorkspace(id: string): Promise<Workspace> {
    return this.request(`/workspaces/${id}`);
  }

  async createWorkspace(data: { name: string; description?: string }): Promise<Workspace> {
    return this.request('/workspaces', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateWorkspace(id: string, data: Partial<Workspace>): Promise<Workspace> {
    return this.request(`/workspaces/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getWorkspaceMembers(id: string): Promise<WorkspaceMember[]> {
    return this.request(`/workspaces/${id}/members`);
  }

  async inviteMember(workspaceId: string, email: string, role = 'member'): Promise<WorkspaceMember> {
    return this.request(`/workspaces/${workspaceId}/members`, {
      method: 'POST',
      body: JSON.stringify({ email, role }),
    });
  }

  async removeMember(workspaceId: string, userId: string): Promise<{ success: boolean }> {
    return this.request(`/workspaces/${workspaceId}/members/${userId}`, {
      method: 'DELETE',
    });
  }

  // --- Projects ---
  async getProjects(params?: { workspaceId?: string; status?: string }): Promise<Project[]> {
    const query = new URLSearchParams();
    if (params?.workspaceId) query.append('workspaceId', params.workspaceId);
    if (params?.status) query.append('status', params.status);
    return this.request(`/projects?${query.toString()}`);
  }

  async getProject(id: string): Promise<Project> {
    return this.request(`/projects/${id}`);
  }

  async createProject(data: {
    name: string;
    description?: string;
    workspaceId: string;
    deadline?: string;
    color?: string;
    icon?: string;
  }): Promise<Project> {
    return this.request('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProject(id: string, data: Partial<Project>): Promise<Project> {
    return this.request(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async archiveProject(id: string): Promise<Project> {
    return this.request(`/projects/${id}/archive`, {
      method: 'PUT',
    });
  }

  async deleteProject(id: string): Promise<{ success: boolean }> {
    return this.request(`/projects/${id}`, {
      method: 'DELETE',
    });
  }

  // --- Tasks ---
  async getTasks(params?: {
    workspaceId?: string;
    projectId?: string;
    status?: string;
    assignee?: string;
    priority?: string;
    search?: string;
    label?: string;
  }): Promise<Task[]> {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val) query.append(key, val);
      });
    }
    return this.request(`/tasks?${query.toString()}`);
  }

  async getTask(id: string): Promise<Task> {
    return this.request(`/tasks/${id}`);
  }

  async createTask(data: {
    title: string;
    description?: string;
    projectId: string;
    workspaceId: string;
    status?: string;
    priority?: string;
    assignee?: string;
    startDate?: string;
    dueDate?: string;
    labels?: string[];
  }): Promise<Task> {
    return this.request('/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTask(id: string, data: Partial<Task>): Promise<Task> {
    return this.request(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async moveTask(id: string, status: string, order?: number): Promise<Task> {
    return this.request(`/tasks/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, order }),
    });
  }

  async deleteTask(id: string): Promise<{ success: boolean }> {
    return this.request(`/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  async addSubtask(taskId: string, title: string): Promise<Task> {
    return this.request(`/tasks/${taskId}/subtasks`, {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
  }

  async toggleSubtask(taskId: string, subtaskId: string, completed: boolean): Promise<Task> {
    return this.request(`/tasks/${taskId}/subtasks/${subtaskId}`, {
      method: 'PUT',
      body: JSON.stringify({ completed }),
    });
  }

  async deleteSubtask(taskId: string, subtaskId: string): Promise<Task> {
    return this.request(`/tasks/${taskId}/subtasks/${subtaskId}`, {
      method: 'DELETE',
    });
  }

  async addAttachment(taskId: string, data: { name: string; size: string; url?: string }): Promise<Task> {
    return this.request(`/tasks/${taskId}/attachments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteAttachment(taskId: string, attachmentId: string): Promise<Task> {
    return this.request(`/tasks/${taskId}/attachments/${attachmentId}`, {
      method: 'DELETE',
    });
  }

  // --- Comments ---
  async getComments(taskId: string): Promise<Comment[]> {
    return this.request(`/comments/${taskId}`);
  }

  async addComment(taskId: string, content: string, parentComment?: string): Promise<Comment> {
    return this.request(`/comments/${taskId}`, {
      method: 'POST',
      body: JSON.stringify({ content, parentComment }),
    });
  }

  // --- Notifications ---
  async getNotifications(): Promise<Notification[]> {
    return this.request('/notifications');
  }

  async markNotificationAsRead(id: string): Promise<{ success: boolean }> {
    return this.request(`/notifications/${id}/read`, {
      method: 'PUT',
    });
  }

  async markAllNotificationsAsRead(): Promise<{ success: boolean }> {
    return this.request('/notifications/read-all', {
      method: 'PUT',
    });
  }

  // --- Activity ---
  async getActivity(params?: { workspaceId?: string; projectId?: string }): Promise<ActivityLog[]> {
    const query = new URLSearchParams();
    if (params?.workspaceId) query.append('workspaceId', params.workspaceId);
    if (params?.projectId) query.append('projectId', params.projectId);
    return this.request(`/activity?${query.toString()}`);
  }

  // --- Seed / Reset ---
  async resetSeed(): Promise<{ success: boolean; message: string }> {
    return this.request('/seed/reset', {
      method: 'POST',
    });
  }
}

export const api = new ApiService();
