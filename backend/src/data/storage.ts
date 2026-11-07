import fs from 'fs';
import path from 'path';
import {
  IUser,
  IWorkspace,
  IWorkspaceMember,
  IProject,
  ITask,
  IComment,
  INotification,
  IActivityLog,
} from '../types/index.js';
import {
  defaultUsers,
  defaultWorkspaces,
  defaultWorkspaceMembers,
  defaultProjects,
  defaultTasks,
  defaultComments,
  defaultNotifications,
  defaultActivityLogs,
} from './seedData.js';
import { isMongoConnected } from '../config/db.js';
import { UserModel } from '../models/User.js';
import { WorkspaceModel } from '../models/Workspace.js';
import { WorkspaceMemberModel } from '../models/WorkspaceMember.js';
import { ProjectModel } from '../models/Project.js';
import { TaskModel } from '../models/Task.js';
import { CommentModel } from '../models/Comment.js';
import { NotificationModel } from '../models/Notification.js';
import { ActivityLogModel } from '../models/ActivityLog.js';

interface DatabaseSchema {
  users: IUser[];
  workspaces: IWorkspace[];
  workspaceMembers: IWorkspaceMember[];
  projects: IProject[];
  tasks: ITask[];
  comments: IComment[];
  notifications: INotification[];
  activityLogs: IActivityLog[];
}

const DB_FILE = path.join(process.cwd(), 'src', 'data', 'db.json');

class StorageEngine {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadFromFile();
  }

  private loadFromFile(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.users && parsed.tasks) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('[StorageEngine] Could not load db.json, generating default data:', err);
    }

    const initial: DatabaseSchema = {
      users: [...defaultUsers],
      workspaces: [...defaultWorkspaces],
      workspaceMembers: [...defaultWorkspaceMembers],
      projects: [...defaultProjects],
      tasks: [...defaultTasks],
      comments: [...defaultComments],
      notifications: [...defaultNotifications],
      activityLogs: [...defaultActivityLogs],
    };

    this.saveToFile(initial);
    return initial;
  }

  public saveToFile(dataToSave?: DatabaseSchema) {
    try {
      const data = dataToSave || this.data;
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[StorageEngine] Failed to save db.json:', err);
    }
  }

  public resetToDefaults() {
    this.data = {
      users: [...defaultUsers],
      workspaces: [...defaultWorkspaces],
      workspaceMembers: [...defaultWorkspaceMembers],
      projects: [...defaultProjects],
      tasks: [...defaultTasks],
      comments: [...defaultComments],
      notifications: [...defaultNotifications],
      activityLogs: [...defaultActivityLogs],
    };
    this.saveToFile();
  }

  // --- Users ---
  public getUsers(): IUser[] {
    return this.data.users;
  }
  public getUserById(id: string): IUser | undefined {
    return this.data.users.find((u) => u._id === id);
  }
  public getUserByEmail(email: string): IUser | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }
  public addUser(user: IUser): IUser {
    this.data.users.push(user);
    this.saveToFile();
    return user;
  }
  public updateUser(id: string, updates: Partial<IUser>): IUser | undefined {
    const idx = this.data.users.findIndex((u) => u._id === id);
    if (idx === -1) return undefined;
    this.data.users[idx] = { ...this.data.users[idx], ...updates, updatedAt: new Date().toISOString() };
    this.saveToFile();
    return this.data.users[idx];
  }

  // --- Workspaces ---
  public getWorkspaces(): IWorkspace[] {
    return this.data.workspaces;
  }
  public getWorkspaceById(id: string): IWorkspace | undefined {
    return this.data.workspaces.find((w) => w._id === id);
  }
  public addWorkspace(ws: IWorkspace): IWorkspace {
    this.data.workspaces.push(ws);
    this.saveToFile();
    return ws;
  }
  public updateWorkspace(id: string, updates: Partial<IWorkspace>): IWorkspace | undefined {
    const idx = this.data.workspaces.findIndex((w) => w._id === id);
    if (idx === -1) return undefined;
    this.data.workspaces[idx] = { ...this.data.workspaces[idx], ...updates, updatedAt: new Date().toISOString() };
    this.saveToFile();
    return this.data.workspaces[idx];
  }

  // --- Workspace Members ---
  public getWorkspaceMembers(workspaceId: string): (IWorkspaceMember & { userDetails?: IUser })[] {
    return this.data.workspaceMembers
      .filter((m) => m.workspace === workspaceId)
      .map((m) => {
        const uId = typeof m.user === 'string' ? m.user : (m.user as IUser)._id;
        const userObj = this.getUserById(uId);
        return {
          ...m,
          user: userObj || m.user,
          userDetails: userObj,
        };
      });
  }
  public addWorkspaceMember(member: IWorkspaceMember): IWorkspaceMember {
    this.data.workspaceMembers.push(member);
    this.saveToFile();
    return member;
  }
  public removeWorkspaceMember(workspaceId: string, userId: string): boolean {
    const initialLen = this.data.workspaceMembers.length;
    this.data.workspaceMembers = this.data.workspaceMembers.filter(
      (m) => !(m.workspace === workspaceId && (m.user === userId || (m.user as IUser)._id === userId))
    );
    this.saveToFile();
    return this.data.workspaceMembers.length < initialLen;
  }

  // --- Projects ---
  public getProjects(workspaceId?: string): IProject[] {
    const list = workspaceId ? this.data.projects.filter((p) => p.workspace === workspaceId) : this.data.projects;
    return list.map((p) => {
      const ownerId = typeof p.owner === 'string' ? p.owner : (p.owner as IUser)._id;
      return {
        ...p,
        owner: this.getUserById(ownerId) || p.owner,
      };
    });
  }
  public getProjectById(id: string): IProject | undefined {
    const p = this.data.projects.find((proj) => proj._id === id);
    if (!p) return undefined;
    const ownerId = typeof p.owner === 'string' ? p.owner : (p.owner as IUser)._id;
    return {
      ...p,
      owner: this.getUserById(ownerId) || p.owner,
    };
  }
  public addProject(project: IProject): IProject {
    this.data.projects.push(project);
    this.saveToFile();
    return project;
  }
  public updateProject(id: string, updates: Partial<IProject>): IProject | undefined {
    const idx = this.data.projects.findIndex((p) => p._id === id);
    if (idx === -1) return undefined;
    this.data.projects[idx] = { ...this.data.projects[idx], ...updates, updatedAt: new Date().toISOString() };
    this.saveToFile();
    return this.getProjectById(id);
  }
  public deleteProject(id: string): boolean {
    const prevLen = this.data.projects.length;
    this.data.projects = this.data.projects.filter((p) => p._id !== id);
    // Also delete or archive tasks of project
    this.data.tasks = this.data.tasks.filter((t) => t.project !== id);
    this.saveToFile();
    return this.data.projects.length < prevLen;
  }

  // --- Tasks ---
  public getTasks(filters?: { workspace?: string; project?: string; status?: string; assignee?: string }): ITask[] {
    let result = this.data.tasks;
    if (filters?.workspace) result = result.filter((t) => t.workspace === filters.workspace);
    if (filters?.project) result = result.filter((t) => t.project === filters.project);
    if (filters?.status) result = result.filter((t) => t.status === filters.status);
    if (filters?.assignee) {
      result = result.filter((t) => {
        const aId = typeof t.assignee === 'string' ? t.assignee : (t.assignee as IUser)?._id;
        return aId === filters.assignee;
      });
    }

    return result.map((t) => this.populateTask(t));
  }

  public getTaskById(id: string): ITask | undefined {
    const t = this.data.tasks.find((task) => task._id === id);
    if (!t) return undefined;
    return this.populateTask(t);
  }

  private populateTask(t: ITask): ITask {
    const assigneeId = typeof t.assignee === 'string' ? t.assignee : (t.assignee as IUser)?._id;
    const creatorId = typeof t.creator === 'string' ? t.creator : (t.creator as IUser)?._id;
    return {
      ...t,
      assignee: assigneeId ? this.getUserById(assigneeId) || t.assignee : undefined,
      creator: creatorId ? this.getUserById(creatorId) || t.creator : t.creator,
    };
  }

  public addTask(task: ITask): ITask {
    this.data.tasks.push(task);
    this.saveToFile();
    return this.populateTask(task);
  }

  public updateTask(id: string, updates: Partial<ITask>): ITask | undefined {
    const idx = this.data.tasks.findIndex((t) => t._id === id);
    if (idx === -1) return undefined;
    this.data.tasks[idx] = {
      ...this.data.tasks[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.saveToFile();
    return this.populateTask(this.data.tasks[idx]);
  }

  public deleteTask(id: string): boolean {
    const prev = this.data.tasks.length;
    this.data.tasks = this.data.tasks.filter((t) => t._id !== id);
    this.data.comments = this.data.comments.filter((c) => c.task !== id);
    this.saveToFile();
    return this.data.tasks.length < prev;
  }

  // --- Comments ---
  public getComments(taskId: string): IComment[] {
    return this.data.comments
      .filter((c) => c.task === taskId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map((c) => {
        const uId = typeof c.user === 'string' ? c.user : (c.user as IUser)._id;
        return {
          ...c,
          user: this.getUserById(uId) || c.user,
        };
      });
  }

  public addComment(comment: IComment): IComment {
    this.data.comments.push(comment);
    this.saveToFile();
    const uId = typeof comment.user === 'string' ? comment.user : (comment.user as IUser)._id;
    return {
      ...comment,
      user: this.getUserById(uId) || comment.user,
    };
  }

  // --- Notifications ---
  public getNotifications(userId: string): INotification[] {
    return this.data.notifications
      .filter((n) => n.recipient === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((n) => {
        const senderId = typeof n.sender === 'string' ? n.sender : (n.sender as IUser)._id;
        return {
          ...n,
          sender: this.getUserById(senderId) || n.sender,
        };
      });
  }

  public addNotification(notif: INotification): INotification {
    this.data.notifications.unshift(notif);
    this.saveToFile();
    const senderId = typeof notif.sender === 'string' ? notif.sender : (notif.sender as IUser)._id;
    return {
      ...notif,
      sender: this.getUserById(senderId) || notif.sender,
    };
  }

  public markNotificationAsRead(id: string): boolean {
    const notif = this.data.notifications.find((n) => n._id === id);
    if (!notif) return false;
    notif.read = true;
    this.saveToFile();
    return true;
  }

  public markAllNotificationsAsRead(userId: string): void {
    this.data.notifications.forEach((n) => {
      if (n.recipient === userId) n.read = true;
    });
    this.saveToFile();
  }

  // --- Activity Logs ---
  public getActivityLogs(workspaceId?: string, projectId?: string): IActivityLog[] {
    let list = this.data.activityLogs;
    if (workspaceId) list = list.filter((a) => a.workspace === workspaceId);
    if (projectId) list = list.filter((a) => a.project === projectId);
    return list
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 50)
      .map((a) => {
        const uId = typeof a.user === 'string' ? a.user : (a.user as IUser)._id;
        return {
          ...a,
          user: this.getUserById(uId) || a.user,
        };
      });
  }

  public addActivityLog(log: IActivityLog): IActivityLog {
    this.data.activityLogs.unshift(log);
    this.saveToFile();
    const uId = typeof log.user === 'string' ? log.user : (log.user as IUser)._id;
    return {
      ...log,
      user: this.getUserById(uId) || log.user,
    };
  }
}

export const storage = new StorageEngine();
