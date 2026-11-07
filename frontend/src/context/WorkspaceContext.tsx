import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Workspace, Project, WorkspaceMember } from '../types/index.js';
import { api } from '../services/api.js';
import { socketService } from '../services/socket.js';
import { useAuth } from './AuthContext.js';

interface WorkspaceContextType {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  projects: Project[];
  members: WorkspaceMember[];
  isLoading: boolean;
  setCurrentWorkspace: (workspace: Workspace) => void;
  refreshWorkspaces: () => Promise<void>;
  refreshProjects: () => Promise<void>;
  refreshMembers: () => Promise<void>;
  createWorkspace: (name: string, description?: string) => Promise<Workspace>;
  createProject: (data: { name: string; description?: string; deadline?: string; color?: string; icon?: string }) => Promise<Project>;
  inviteMember: (email: string, role?: string) => Promise<WorkspaceMember>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspaceState] = useState<Workspace | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshWorkspaces = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await api.getWorkspaces();
      setWorkspaces(data);
      if (data.length > 0 && !currentWorkspace) {
        setCurrentWorkspaceState(data[0]);
      }
    } catch (err) {
      console.error('[WorkspaceContext] Failed to load workspaces:', err);
    }
  }, [isAuthenticated, currentWorkspace]);

  const refreshProjects = useCallback(async () => {
    if (!currentWorkspace) return;
    try {
      const data = await api.getProjects({ workspaceId: currentWorkspace._id });
      setProjects(data);
    } catch (err) {
      console.error('[WorkspaceContext] Failed to load projects:', err);
    }
  }, [currentWorkspace]);

  const refreshMembers = useCallback(async () => {
    if (!currentWorkspace) return;
    try {
      const data = await api.getWorkspaceMembers(currentWorkspace._id);
      setMembers(data);
    } catch (err) {
      console.error('[WorkspaceContext] Failed to load members:', err);
    }
  }, [currentWorkspace]);

  useEffect(() => {
    if (isAuthenticated) {
      setIsLoading(true);
      refreshWorkspaces().finally(() => setIsLoading(false));
    } else {
      setWorkspaces([]);
      setCurrentWorkspaceState(null);
      setProjects([]);
      setMembers([]);
      setIsLoading(false);
    }
  }, [isAuthenticated, user?._id]);

  useEffect(() => {
    if (currentWorkspace) {
      socketService.joinWorkspace(currentWorkspace._id);
      refreshProjects();
      refreshMembers();

      const socket = socketService.getSocket();
      if (socket) {
        socket.on('project:created', refreshProjects);
        socket.on('project:updated', refreshProjects);
        socket.on('project:deleted', refreshProjects);
        socket.on('workspace:memberAdded', refreshMembers);
        socket.on('workspace:memberRemoved', refreshMembers);
      }

      return () => {
        socketService.leaveWorkspace(currentWorkspace._id);
        if (socket) {
          socket.off('project:created', refreshProjects);
          socket.off('project:updated', refreshProjects);
          socket.off('project:deleted', refreshProjects);
          socket.off('workspace:memberAdded', refreshMembers);
          socket.off('workspace:memberRemoved', refreshMembers);
        }
      };
    }
  }, [currentWorkspace?._id, refreshProjects, refreshMembers]);

  const setCurrentWorkspace = (workspace: Workspace) => {
    if (currentWorkspace) {
      socketService.leaveWorkspace(currentWorkspace._id);
    }
    setCurrentWorkspaceState(workspace);
  };

  const createWorkspace = async (name: string, description?: string): Promise<Workspace> => {
    const newWs = await api.createWorkspace({ name, description });
    setWorkspaces((prev) => [...prev, newWs]);
    setCurrentWorkspace(newWs);
    return newWs;
  };

  const createProject = async (data: {
    name: string;
    description?: string;
    deadline?: string;
    color?: string;
    icon?: string;
  }): Promise<Project> => {
    if (!currentWorkspace) throw new Error('No active workspace');
    const newProj = await api.createProject({
      ...data,
      workspaceId: currentWorkspace._id,
    });
    setProjects((prev) => [...prev, newProj]);
    return newProj;
  };

  const inviteMember = async (email: string, role = 'member'): Promise<WorkspaceMember> => {
    if (!currentWorkspace) throw new Error('No active workspace');
    const newMember = await api.inviteMember(currentWorkspace._id, email, role);
    setMembers((prev) => [...prev, newMember]);
    return newMember;
  };

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        currentWorkspace,
        projects,
        members,
        isLoading,
        setCurrentWorkspace,
        refreshWorkspaces,
        refreshProjects,
        refreshMembers,
        createWorkspace,
        createProject,
        inviteMember,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = (): WorkspaceContextType => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
