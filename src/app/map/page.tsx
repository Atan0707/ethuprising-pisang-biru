"use client";
import React, { useEffect, useState, useRef } from "react";
import { Socket, io } from "socket.io-client";

interface Player {
  id: string;
  x: number;
  y: number;
  name: string;
}

interface Message {
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
}

interface ServerToClientEvents {
  playersUpdate: (players: Record<string, Player>) => void;
  receiveMessage: (message: Message) => void;
}

interface ClientToServerEvents {
  updatePosition: (position: { x: number; y: number }) => void;
  sendMessage: (message: string) => void;
}

const INTERACTION_RADIUS = 100;
const MAP_WIDTH = window.innerWidth;
const MAP_HEIGHT = window.innerHeight;
const PLAYER_AVATAR = "/images/sigma1.jpg";
const OPPONENT_AVATAR = "/images/sigma2.jpg";

function Map() {
  const [socket, setSocket] = useState<Socket<
    ServerToClientEvents,
    ClientToServerEvents
  > | null>(null);
  // built-in utility type in ts, it means all keys are string, and all values are type Player
  const [players, setPlayers] = useState<Record<string, Player>>({});
  const [
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    viewport, 
    setViewport] = useState({
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
  });
  const [myPosition, setMyPosition] = useState({
    x: MAP_WIDTH / 2,
    y: MAP_HEIGHT / 2,
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [nearbyPlayers, setNearbyPlayers] = useState<Player[]>([]);
  // const [showChat, setShowChat] = useState(false);
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const [moveInterval, setMoveInterval] = useState<number | null>(null);

  // Setup socket connection
  useEffect(() => {
    // Use the backend DevTunnel URL
    const socketUrl = "http://localhost:3003";

    const newSocket = io(socketUrl, {
      reconnection: true,
      secure: true,
    });

    newSocket.on("connect", () => {
      console.log("Connected to server:", socketUrl);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Handle socket events
  useEffect(() => {
    if (!socket) return;

    // Handle player updates
    socket.on("playersUpdate", (updatedPlayers: Record<string, Player>) => {
      setPlayers(updatedPlayers);

      // Calculate nearby players
      if (socket) {
        const nearby = Object.values(updatedPlayers).filter((player) => {
          if (player.id === socket.id) return false;
          const distance = Math.sqrt(
            Math.pow(player.x - myPosition.x, 2) +
              Math.pow(player.y - myPosition.y, 2)
          );
          return distance <= INTERACTION_RADIUS;
        });
        setNearbyPlayers(nearby);
      }
    });

    // Handle receiving messages
    socket.on("receiveMessage", (message: Message) => {
      setMessages((prev) => [...prev, message]);
      // Auto-scroll to bottom of chat
      if (chatBoxRef.current) {
        chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
      }
    });

    // Cleanup listeners
    return () => {
      socket.off("playersUpdate");
      socket.off("receiveMessage");
    };
  }, [socket, myPosition]);

  // Add viewport size listener
  useEffect(() => {
    const handleResize = () => {
      setViewport({
        width: MAP_WIDTH,
        height: MAP_HEIGHT,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Handle continuous movement
  const startMove = (direction: "up" | "down" | "left" | "right") => {
    handleMove(direction);
    const interval = window.setInterval(() => {
      handleMove(direction);
    }, 100);
    setMoveInterval(interval);
  };

  const stopMove = () => {
    if (moveInterval) {
      window.clearInterval(moveInterval);
      setMoveInterval(null);
    }
  };

  // Handle movement
  const handleMove = (direction: "up" | "down" | "left" | "right") => {
    if (!socket) return;

    let newX = myPosition.x;
    let newY = myPosition.y;
    const step = 10;

    switch (direction) {
      case "up":
        newY = Math.max(0, myPosition.y - step);
        break;
      case "down":
        newY = Math.min(MAP_HEIGHT - 50, myPosition.y + step);
        break;
      case "left":
        newX = Math.max(0, myPosition.x - step);
        break;
      case "right":
        newX = Math.min(MAP_WIDTH - 50, myPosition.x + step);
        break;
    }

    if (newX !== myPosition.x || newY !== myPosition.y) {
      setMyPosition({ x: newX, y: newY });
      socket.emit("updatePosition", { x: newX, y: newY });
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageInput.trim() && socket && nearbyPlayers.length > 0) {
      socket.emit("sendMessage", messageInput);
      setMessageInput("");
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-[#1B262C]">
      {/* Map Area */}
      <div
        ref={mapRef}
        className="flex-1 relative bg-[#0F4C75] overflow-hidden touch-none"
        style={{
          width: MAP_WIDTH,
          height: MAP_HEIGHT,
        }}
      >
        {/* Grid Background */}
        <div className="absolute inset-0 grid grid-cols-8 grid-rows-8">
          {Array.from({ length: 64 }).map((_, i) => (
            <div key={i} className="border border-[#3282B8]/30" />
          ))}
        </div>

        {/* Players */}
        {Object.values(players).map((player) => (
          <div key={player.id}>
            {/* Player Avatar - Now using images */}
            <div
              className={`fixed w-12 h-12 rounded-full transform -translate-x-1/2 -translate-y-1/2 overflow-hidden border-2 ${
                player.id === socket?.id
                  ? "border-[#3282B8]"
                  : "border-[#0F4C75]"
              }`}
              style={{
                left: `${player.x}px`,
                top: `${player.y}px`,
                zIndex: 20,
              }}
            >
              <img
                src={player.id === socket?.id ? PLAYER_AVATAR : OPPONENT_AVATAR}
                alt={player.name}
                className="w-full h-full object-cover"
              />
            </div>
            {/* Player Name */}
            <div
              className="absolute text-sm font-bold bg-[#BBE1FA] px-2 py-0.5 rounded-full shadow-md text-[#1B262C]"
              style={{
                left: `${player.x}px`,
                top: `${player.y - 25}px`,
                transform: "translate(-50%, 0)",
                zIndex: 21,
              }}
            >
              {player.name}
            </div>
            {/* Interaction Radius */}
            {player.id === socket?.id && (
              <div
                className="absolute rounded-full border-2 border-[#3282B8] opacity-30"
                style={{
                  left: `${player.x}px`,
                  top: `${player.y}px`,
                  width: `${INTERACTION_RADIUS * 2}px`,
                  height: `${INTERACTION_RADIUS * 2}px`,
                  transform: "translate(-50%, -50%)",
                  zIndex: 19,
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Control Area */}
      <div className="h-[30vh] bg-[#1B262C] border-t border-[#3282B8] flex">
        {/* D-Pad Controls */}
        <div className="flex-1 flex items-center justify-center">
          <div className="grid grid-cols-3 gap-2">
            <div />
            <button
              className="w-15 h-15 rounded-full flex items-center justify-center text-2xl shadow-md active:bg-[#3282B8]"
              onTouchStart={() => startMove("up")}
              onTouchEnd={stopMove}
              onClick={() => handleMove("up")}
            >
              ⬆️
            </button>
            <div />
            <button
              className="w-15 h-15 rounded-full flex items-center justify-center text-2xl shadow-md active:bg-[#3282B8]"
              onTouchStart={() => startMove("left")}
              onTouchEnd={stopMove}
              onClick={() => handleMove("left")}
            >
              ⬅️
            </button>
            <div />
            <button
              className="w-15 h-15 rounded-full flex items-center justify-center text-2xl shadow-md active:bg-[#3282B8]"
              onTouchStart={() => startMove("right")}
              onTouchEnd={stopMove}
              onClick={() => handleMove("right")}
            >
              ➡️
            </button>
            <div />
            <button
              className="w-15 h-15 rounded-full flex items-center justify-center text-2xl shadow-md active:bg-[#3282B8]"
              onTouchStart={() => startMove("down")}
              onTouchEnd={stopMove}
              onClick={() => handleMove("down")}
            >
              ⬇️
            </button>
            <div />
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 p-2 flex flex-col">
          <div className="flex-1 bg-[#0F4C75] rounded-lg shadow-md p-2 mb-2 overflow-y-auto">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`mb-1 p-1 rounded text-sm ${
                  msg.senderId === socket?.id
                    ? "bg-[#3282B8] text-[#BBE1FA] ml-2"
                    : "bg-[#1B262C] text-[#BBE1FA] mr-2"
                }`}
              >
                <div className="text-xs font-bold">{msg.senderName}</div>
                <div>{msg.content}</div>
              </div>
            ))}
          </div>
          <form onSubmit={handleSendMessage} className="flex gap-1">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              disabled={nearbyPlayers.length === 0}
              placeholder={
                nearbyPlayers.length > 0
                  ? "Type a message..."
                  : "No players nearby"
              }
              className="flex-1 p-1 text-sm border rounded bg-[#BBE1FA] text-[#1B262C] placeholder-[#1B262C]/50"
            />
            <button
              type="submit"
              disabled={nearbyPlayers.length === 0}
              className="px-3 py-1 bg-[#3282B8] text-[#BBE1FA] text-sm rounded disabled:bg-[#1B262C]/50"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Map;
