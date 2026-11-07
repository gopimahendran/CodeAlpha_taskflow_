import { Server as SocketServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';

let ioInstance: SocketServer | null = null;

export const initSocket = (httpServer: HttpServer): SocketServer => {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    },
  });

  io.on('connection', (socket: Socket) => {
    // console.log(`[Socket] Client connected: ${socket.id}`);

    // Join personal room
    socket.on('join:user', (userId: string) => {
      if (userId) {
        socket.join(`user:${userId}`);
        // console.log(`[Socket] ${socket.id} joined user room: user:${userId}`);
      }
    });

    // Join workspace room
    socket.on('join:workspace', (workspaceId: string) => {
      if (workspaceId) {
        socket.join(`workspace:${workspaceId}`);
        // console.log(`[Socket] ${socket.id} joined workspace:${workspaceId}`);
      }
    });

    // Leave workspace room
    socket.on('leave:workspace', (workspaceId: string) => {
      if (workspaceId) {
        socket.leave(`workspace:${workspaceId}`);
      }
    });

    // Join project room
    socket.on('join:project', (projectId: string) => {
      if (projectId) {
        socket.join(`project:${projectId}`);
      }
    });

    // Leave project room
    socket.on('leave:project', (projectId: string) => {
      if (projectId) {
        socket.leave(`project:${projectId}`);
      }
    });

    // Task drag & drop live broadcast (for instant peer collaboration)
    socket.on('task:move', (data: { taskId: string; fromStatus: string; toStatus: string; newOrder: number; projectId: string; workspaceId: string }) => {
      socket.to(`project:${data.projectId}`).emit('task:moved', data);
      socket.to(`workspace:${data.workspaceId}`).emit('task:moved', data);
    });

    socket.on('disconnect', () => {
      // console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  ioInstance = io;
  return io;
};

export const getIO = (): SocketServer | null => ioInstance;

export const emitToWorkspace = (workspaceId: string, event: string, payload: any) => {
  if (ioInstance) {
    ioInstance.to(`workspace:${workspaceId}`).emit(event, payload);
  }
};

export const emitToProject = (projectId: string, event: string, payload: any) => {
  if (ioInstance) {
    ioInstance.to(`project:${projectId}`).emit(event, payload);
  }
};

export const emitToUser = (userId: string, event: string, payload: any) => {
  if (ioInstance) {
    ioInstance.to(`user:${userId}`).emit(event, payload);
  }
};
