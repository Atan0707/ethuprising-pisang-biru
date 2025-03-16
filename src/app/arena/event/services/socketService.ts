import { Socket, io } from "socket.io-client";

// Define player interface
export interface Player {
  id: string;
  name: string;
  address: string;
  level: number;
  blockmon: {
    id: number;
    name: string;
    level: number;
    type: string;
    image: string;
  };
  position: {
    x: number;
    y: number;
  };
  status: "online" | "battling" | "idle";
  lastActive: string;
}

// Define message interface
export interface Message {
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
}

// Define socket event interfaces
export interface ServerToClientEvents {
  playersUpdate: (players: Record<string, Player>) => void;
  receiveMessage: (message: Message) => void;
}

export interface ClientToServerEvents {
  updatePosition: (position: { x: number; y: number }) => void;
  sendMessage: (message: string) => void;
  joinEvent: (eventId: string) => void;
}

// Socket service singleton
let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

// Initialize socket connection
export const initializeSocket = (eventId?: string): Socket<ServerToClientEvents, ClientToServerEvents> => {
  if (socket) return socket;

  const socketUrl = "http://localhost:3003";

  socket = io(socketUrl, {
    reconnection: true,
    secure: true,
  });

  socket.on("connect", () => {
    console.log("Connected to socket server:", socketUrl);
    
    // Join the specific event room if provided
    if (eventId) {
      socket.emit("joinEvent", eventId);
    }
  });

  socket.on("disconnect", () => {
    console.log("Disconnected from socket server");
  });

  return socket;
};

// Get the socket instance
export const getSocket = (): Socket<ServerToClientEvents, ClientToServerEvents> | null => {
  return socket;
};

// Disconnect socket
export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Update player position
export const updatePosition = (position: { x: number; y: number }): void => {
  if (socket && socket.connected) {
    socket.emit("updatePosition", position);
  }
};

// Send chat message
export const sendMessage = (message: string): void => {
  if (socket && socket.connected) {
    socket.emit("sendMessage", message);
  }
};

// Join event
export const joinEvent = (eventId: string): void => {
  if (socket && socket.connected) {
    socket.emit("joinEvent", eventId);
  }
}; 