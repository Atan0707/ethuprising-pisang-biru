/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAppKitAccount } from "@reown/appkit/react";
import { RetroButton } from "@/components/ui/retro-button";
import { toast } from "sonner";
import { Socket } from "socket.io-client";
import { 
  Player, 
  Message, 
  ServerToClientEvents, 
  ClientToServerEvents,
  initializeSocket,
  disconnectSocket,
  updatePosition as emitUpdatePosition,
  sendMessage as emitSendMessage
} from "../services/socketService";

// Define event interface
interface Event {
  id: string;
  name: string;
  description: string;
  location: string;
  date: string;
  participants: Player[];
  maxParticipants: number;
  image: string;
  active: boolean;
}

// Sample event data
const EVENTS: Record<string, Event> = {
  "eth-uprising": {
    id: "eth-uprising",
    name: "ETH Uprising Hackathon",
    description: "Join the biggest blockchain gaming hackathon and showcase your Blockmon!",
    location: "Virtual + Singapore",
    date: "March 15-17, 2024",
    participants: [
      {
        id: "player1",
        name: "BlockMaster",
        address: "0x1234...5678",
        level: 25,
        blockmon: {
          id: 1,
          name: "Pikachu",
          level: 25,
          type: "Electric",
          image: "/images/pika.png"
        },
        position: { x: 30, y: 40 },
        status: "online",
        lastActive: "Just now"
      },
      {
        id: "player2",
        name: "CryptoTrainer",
        address: "0x8765...4321",
        level: 18,
        blockmon: {
          id: 2,
          name: "Charizard",
          level: 36,
          type: "Fire/Flying",
          image: "/images/charizard.png"
        },
        position: { x: 45, y: 55 },
        status: "battling",
        lastActive: "2 min ago"
      },
      {
        id: "player3",
        name: "BlockchainPro",
        address: "0xabcd...ef12",
        level: 22,
        blockmon: {
          id: 3,
          name: "Blastoise",
          level: 34,
          type: "Water",
          image: "/images/charmander.png"
        },
        position: { x: 65, y: 30 },
        status: "idle",
        lastActive: "5 min ago"
      },
      {
        id: "player4",
        name: "NFTCollector",
        address: "0x7890...1234",
        level: 15,
        blockmon: {
          id: 4,
          name: "Venusaur",
          level: 32,
          type: "Grass/Poison",
          image: "/images/venusaur.png"
        },
        position: { x: 20, y: 70 },
        status: "online",
        lastActive: "Just now"
      }
    ],
    maxParticipants: 200,
    image: "/images/events/eth-uprising.jpg",
    active: true
  },
  "pixel-masters": {
    id: "pixel-masters",
    name: "Pixel Masters Tournament",
    description: "Weekly tournament for Blockmon trainers to compete and win exclusive rewards.",
    location: "Virtual",
    date: "Every Saturday",
    participants: [
      {
        id: "player5",
        name: "PixelChamp",
        address: "0x2468...1357",
        level: 30,
        blockmon: {
          id: 5,
          name: "Dragonite",
          level: 40,
          type: "Dragon/Flying",
          image: "/images/pika.png"
        },
        position: { x: 50, y: 50 },
        status: "online",
        lastActive: "Just now"
      }
    ],
    maxParticipants: 64,
    image: "/images/events/pixel-masters.jpg",
    active: true
  },
  "community-meetup": {
    id: "community-meetup",
    name: "Blockmon Community Meetup",
    description: "Meet other Blockmon trainers in your area and battle in person!",
    location: "Multiple Locations",
    date: "Monthly",
    participants: [],
    maxParticipants: 100,
    image: "/images/events/community-meetup.jpg",
    active: true
  }
};

// Current player (you)
const CURRENT_PLAYER: Player = {
  id: "current",
  name: "You",
  address: "0x3456...7890",
  level: 20,
  blockmon: {
    id: 6,
    name: "Gengar",
    level: 28,
    type: "Ghost/Poison",
    image: "/images/pika.png"
  },
  position: { x: 50, y: 50 },
  status: "online",
  lastActive: "Now"
};

// Constants
const INTERACTION_RADIUS = 100;
const PLAYER_AVATAR = "/images/pika.png";
const OPPONENT_AVATAR = "/images/charizard.png";

export default function EventPage() {
  const params = useParams();
  const router = useRouter();
  const { address, isConnected } = useAppKitAccount();
  const [event, setEvent] = useState<Event | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [showPlayerDetails, setShowPlayerDetails] = useState(false);
  const [playerPosition, setPlayerPosition] = useState({ x: 50, y: 50 });
  const [mounted, setMounted] = useState(false);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");
  const mapRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const eventId = params.id as string;
  const [socket, setSocket] = useState<Socket<
    ServerToClientEvents,
    ClientToServerEvents
  > | null>(null);
  const [players, setPlayers] = useState<Record<string, Player>>({});
  const [nearbyPlayers, setNearbyPlayers] = useState<Player[]>([]);
  const [moveInterval, setMoveInterval] = useState<number | null>(null);

  // Setup socket connection
  useEffect(() => {
    if (!eventId) return;
    
    const newSocket = initializeSocket(eventId);
    setSocket(newSocket);

    return () => {
      disconnectSocket();
    };
  }, [eventId]);

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
            Math.pow(player.position.x - playerPosition.x, 2) +
              Math.pow(player.position.y - playerPosition.y, 2)
          );
          return distance <= INTERACTION_RADIUS;
        });
        setNearbyPlayers(nearby);
      }
    });

    // Handle receiving messages
    socket.on("receiveMessage", (message: Message) => {
      setChatMessages((prev) => [...prev, message]);
      // Auto-scroll to bottom of chat
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    });

    // Cleanup listeners
    return () => {
      socket.off("playersUpdate");
      socket.off("receiveMessage");
    };
  }, [socket, playerPosition]);

  // Ensure component is mounted to avoid hydration issues
  useEffect(() => {
    setMounted(true);
    
    // Get event data
    if (eventId && EVENTS[eventId]) {
      setEvent(EVENTS[eventId]);
    } else {
      // Handle invalid event ID
      router.push("/arena/event");
    }
    
    // Auto-scroll chat to bottom
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [eventId, router]);

  // Add a check for authentication
  useEffect(() => {
    if (mounted && !isConnected) {
      toast.error("Please connect your wallet to join this event");
    }
  }, [mounted, isConnected]);
  
  // Use the address in the player info
  useEffect(() => {
    if (address && event) {
      // Check if the player is already in the event
      const existingPlayer = event.participants.find(p => p.address === address);
      if (existingPlayer) {
        setPlayerPosition(existingPlayer.position);
        if (socket) {
          socket.emit("updatePosition", existingPlayer.position);
        }
      }
    }
  }, [address, event, socket]);

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
    if (!socket || !mapRef.current) return;

    const mapRect = mapRef.current.getBoundingClientRect();
    const mapWidth = mapRect.width;
    const mapHeight = mapRect.height;

    let newX = playerPosition.x;
    let newY = playerPosition.y;
    const step = 2; // Percentage step size

    switch (direction) {
      case "up":
        newY = Math.max(0, playerPosition.y - step);
        break;
      case "down":
        newY = Math.min(100, playerPosition.y + step);
        break;
      case "left":
        newX = Math.max(0, playerPosition.x - step);
        break;
      case "right":
        newX = Math.min(100, playerPosition.x + step);
        break;
    }

    if (newX !== playerPosition.x || newY !== playerPosition.y) {
      setPlayerPosition({ x: newX, y: newY });
      emitUpdatePosition({ x: newX, y: newY });
    }
  };

  // Handle map click to move player
  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mapRef.current || !socket) return;
    
    const rect = mapRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setPlayerPosition({ x, y });
    emitUpdatePosition({ x, y });
  };

  const handlePlayerClick = (player: Player) => {
    setSelectedPlayer(player);
    setShowPlayerDetails(true);
  };

  const closePlayerDetails = () => {
    setShowPlayerDetails(false);
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim() && socket && nearbyPlayers.length > 0) {
      emitSendMessage(chatInput);
      setChatInput("");
    } else if (nearbyPlayers.length === 0) {
      toast.info("No players nearby to chat with");
    }
  };

  const handleBattleRequest = () => {
    if (selectedPlayer) {
      toast.success(`Battle request sent to ${selectedPlayer.name}`);
      closePlayerDetails();
    }
  };

  if (!mounted) return null;

  return (
    <div className="relative min-h-screen">
      {/* Background image */}
      <div
        className="fixed inset-0 top-16 -z-10"
        style={{
          backgroundImage: "url('/images/back.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/70 to-purple-900/70"></div>

        {/* Pattern overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/arena/event" className="text-white hover:text-blue-300 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-pixel tracking-wide">Back to Events</span>
          </Link>
        </div>

        {event ? (
          <>
            <h1 className="text-3xl font-bold mb-6 text-white font-retro tracking-wide uppercase">
              {event.name}
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Event Info */}
              <div className="bg-black/40 backdrop-blur-md rounded-xl shadow-lg overflow-hidden border border-white/10 lg:col-span-1">
                <div className="p-6">
                  <h2 className="text-xl font-bold text-white mb-4 font-retro tracking-wide uppercase">
                    Event Info
                  </h2>
                  <p className="text-gray-300 mb-6 font-pixel tracking-wide">
                    {event.description}
                  </p>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-black/30 p-3 rounded-lg">
                      <h4 className="text-gray-400 text-sm mb-1">Location</h4>
                      <p className="text-white font-pixel tracking-wide">{event.location}</p>
                    </div>
                    <div className="bg-black/30 p-3 rounded-lg">
                      <h4 className="text-gray-400 text-sm mb-1">Date</h4>
                      <p className="text-white font-pixel tracking-wide">{event.date}</p>
                    </div>
                    <div className="bg-black/30 p-3 rounded-lg">
                      <h4 className="text-gray-400 text-sm mb-1">Participants</h4>
                      <p className="text-white font-pixel tracking-wide">
                        {Object.keys(players).length}/{event.maxParticipants}
                      </p>
                    </div>
                    <div className="bg-black/30 p-3 rounded-lg">
                      <h4 className="text-gray-400 text-sm mb-1">Status</h4>
                      <p className="text-white font-pixel tracking-wide">{event.active ? "Active" : "Coming Soon"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Map */}
              <div className="bg-black/40 backdrop-blur-md rounded-xl shadow-lg overflow-hidden border border-white/10 lg:col-span-2">
                <div className="p-6">
                  <h2 className="text-xl font-bold text-white mb-4 font-retro tracking-wide uppercase">
                    Event Map
                  </h2>
                  <p className="text-gray-300 mb-4 font-pixel tracking-wide">
                    Click on the map to move your character. Interact with other trainers when you&apos;re close to them.
                  </p>
                  
                  {/* Map Area */}
                  <div 
                    ref={mapRef}
                    className="relative w-full h-[400px] bg-gradient-to-br from-blue-900/50 to-purple-900/50 rounded-lg border border-white/20 overflow-hidden mb-6"
                    onClick={handleMapClick}
                  >
                    {/* Map Background */}
                    <div className="absolute inset-0 bg-[url('/images/map.webp')] bg-cover bg-center opacity-80"></div>
                    
                    {/* Grid Background */}
                    <div className="absolute inset-0 grid grid-cols-8 grid-rows-8">
                      {Array.from({ length: 64 }).map((_, i) => (
                        <div key={i} className="border border-[#3282B8]/30" />
                      ))}
                    </div>
                    
                    {/* Players */}
                    {Object.values(players).map((player) => (
                      <div key={player.id} onClick={(e) => {
                        e.stopPropagation();
                        handlePlayerClick(player);
                      }}>
                        {/* Player Avatar */}
                        <div
                          className={`absolute w-12 h-12 rounded-full transform -translate-x-1/2 -translate-y-1/2 overflow-hidden border-2 ${
                            player.id === socket?.id
                              ? "border-[#3282B8]"
                              : "border-[#0F4C75]"
                          } cursor-pointer hover:scale-110 transition-transform`}
                          style={{
                            left: `${player.position.x}%`,
                            top: `${player.position.y}%`,
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
                            left: `${player.position.x}%`,
                            top: `${player.position.y - 5}%`,
                            transform: "translate(-50%, -100%)",
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
                              left: `${player.position.x}%`,
                              top: `${player.position.y}%`,
                              width: `${INTERACTION_RADIUS}px`,
                              height: `${INTERACTION_RADIUS}px`,
                              transform: "translate(-50%, -50%)",
                              zIndex: 19,
                            }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* Controls and Chat */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* D-Pad Controls */}
                    <div className="bg-black/30 p-4 rounded-lg">
                      <h3 className="text-white font-bold mb-3 font-retro tracking-wide">Controls</h3>
                      <div className="grid grid-cols-3 gap-2">
                        <div />
                        <button
                          className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-md bg-[#0F4C75] hover:bg-[#3282B8] active:bg-[#3282B8]"
                          onTouchStart={() => startMove("up")}
                          onTouchEnd={stopMove}
                          onMouseDown={() => startMove("up")}
                          onMouseUp={stopMove}
                          onMouseLeave={stopMove}
                        >
                          ⬆️
                        </button>
                        <div />
                        <button
                          className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-md bg-[#0F4C75] hover:bg-[#3282B8] active:bg-[#3282B8]"
                          onTouchStart={() => startMove("left")}
                          onTouchEnd={stopMove}
                          onMouseDown={() => startMove("left")}
                          onMouseUp={stopMove}
                          onMouseLeave={stopMove}
                        >
                          ⬅️
                        </button>
                        <div />
                        <button
                          className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-md bg-[#0F4C75] hover:bg-[#3282B8] active:bg-[#3282B8]"
                          onTouchStart={() => startMove("right")}
                          onTouchEnd={stopMove}
                          onMouseDown={() => startMove("right")}
                          onMouseUp={stopMove}
                          onMouseLeave={stopMove}
                        >
                          ➡️
                        </button>
                        <div />
                        <button
                          className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-md bg-[#0F4C75] hover:bg-[#3282B8] active:bg-[#3282B8]"
                          onTouchStart={() => startMove("down")}
                          onTouchEnd={stopMove}
                          onMouseDown={() => startMove("down")}
                          onMouseUp={stopMove}
                          onMouseLeave={stopMove}
                        >
                          ⬇️
                        </button>
                        <div />
                      </div>
                    </div>
                    
                    {/* Chat Area */}
                    <div className="bg-black/30 p-4 rounded-lg flex flex-col">
                      <h3 className="text-white font-bold mb-3 font-retro tracking-wide">Chat</h3>
                      <div 
                        ref={chatContainerRef}
                        className="flex-1 bg-[#0F4C75] rounded-lg shadow-md p-2 mb-2 overflow-y-auto max-h-[150px]"
                      >
                        {chatMessages.length === 0 ? (
                          <p className="text-gray-400 text-sm text-center p-2">No messages yet. Start chatting with nearby trainers!</p>
                        ) : (
                          chatMessages.map((msg, idx) => (
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
                          ))
                        )}
                      </div>
                      <form onSubmit={handleChatSubmit} className="flex gap-1">
                        <input
                          type="text"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
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
              </div>
            </div>
          </>
        ) : (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-white font-pixel">Loading event...</span>
          </div>
        )}
      </div>

      {/* Player Details Modal */}
      {mounted && showPlayerDetails && selectedPlayer && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl max-w-md w-full max-h-[80vh] overflow-y-auto border border-white/20">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-2xl font-bold text-white font-retro tracking-wide">{selectedPlayer.name}</h3>
                <button 
                  onClick={closePlayerDetails}
                  className="text-gray-400 hover:text-white"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="flex items-center mb-4">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-blue-500 mr-4">
                  <img 
                    src={selectedPlayer.blockmon.image}
                    alt={selectedPlayer.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-white font-pixel">Level {selectedPlayer.level} Trainer</p>
                  <p className="text-gray-400 text-sm font-pixel">{selectedPlayer.address}</p>
                  <p className={`text-sm font-pixel ${
                    selectedPlayer.status === "online" ? "text-green-400" : 
                    selectedPlayer.status === "battling" ? "text-orange-400" : "text-gray-400"
                  }`}>
                    {selectedPlayer.status.charAt(0).toUpperCase() + selectedPlayer.status.slice(1)}
                  </p>
                </div>
              </div>
              
              <div className="bg-black/30 p-3 rounded-lg mb-4">
                <h4 className="text-gray-400 text-sm mb-2">Main Blockmon</h4>
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full overflow-hidden border border-white/20 mr-3">
                    <img 
                      src={selectedPlayer.blockmon.image}
                      alt={selectedPlayer.blockmon.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-white font-pixel">{selectedPlayer.blockmon.name}</p>
                    <p className="text-gray-400 text-sm font-pixel">Level {selectedPlayer.blockmon.level} • {selectedPlayer.blockmon.type}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <RetroButton 
                  variant="default" 
                  size="default" 
                  className="w-full"
                  onClick={handleBattleRequest}
                  disabled={selectedPlayer.status === "battling"}
                >
                  {selectedPlayer.status === "battling" ? "Currently in Battle" : "Request Battle"}
                </RetroButton>
                
                <RetroButton 
                  variant="blue" 
                  size="default" 
                  className="w-full"
                  onClick={closePlayerDetails}
                >
                  Close
                </RetroButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 