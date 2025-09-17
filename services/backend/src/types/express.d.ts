import { Server as SocketIOServer } from "socket.io";

declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: string;
        name: string;
        email: string;
        role: string;
        onCall: boolean;
        timezone: string;
        preferences: any;
      };
      io?: SocketIOServer;
    }
  }
}

export {};
