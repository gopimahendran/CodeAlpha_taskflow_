import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;

  connect(): Socket {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    // Connect to same origin or port 5000 in dev
    this.socket = io({
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      // console.log('[Socket] Connected to server, id:', this.socket?.id);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  joinUser(userId: string) {
    if (this.socket && userId) {
      this.socket.emit('join:user', userId);
    }
  }

  joinWorkspace(workspaceId: string) {
    if (this.socket && workspaceId) {
      this.socket.emit('join:workspace', workspaceId);
    }
  }

  leaveWorkspace(workspaceId: string) {
    if (this.socket && workspaceId) {
      this.socket.emit('leave:workspace', workspaceId);
    }
  }

  joinProject(projectId: string) {
    if (this.socket && projectId) {
      this.socket.emit('join:project', projectId);
    }
  }

  leaveProject(projectId: string) {
    if (this.socket && projectId) {
      this.socket.emit('leave:project', projectId);
    }
  }

  emitTaskMove(data: {
    taskId: string;
    fromStatus: string;
    toStatus: string;
    newOrder: number;
    projectId: string;
    workspaceId: string;
  }) {
    if (this.socket) {
      this.socket.emit('task:move', data);
    }
  }
}

export const socketService = new SocketService();
