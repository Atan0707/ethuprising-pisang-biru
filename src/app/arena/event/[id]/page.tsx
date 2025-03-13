"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAppKitAccount } from "@reown/appkit/react";
import { RetroButton } from "@/components/ui/retro-button";
import { toast } from "sonner";

// Define player interface
interface Player {
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

export default function EventPage() {
  const params = useParams();
  const router = useRouter();
  const { address, isConnected } = useAppKitAccount();
  const [event, setEvent] = useState<Event | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [showPlayerDetails, setShowPlayerDetails] = useState(false);
  const [playerPosition, setPlayerPosition] = useState({ x: 50, y: 50 });
  const [mounted, setMounted] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ sender: string; message: string; timestamp: string }[]>([
    { sender: "System", message: "Welcome to the event! Chat with other trainers here.", timestamp: "12:00 PM" },
    { sender: "BlockMaster", message: "Hey everyone! Who wants to battle?", timestamp: "12:02 PM" },
    { sender: "CryptoTrainer", message: "I'm up for a challenge!", timestamp: "12:03 PM" }
  ]);
  const [chatInput, setChatInput] = useState("");
  const mapRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const eventId = params.id as string;

  // Ensure component is mounted to avoid hydration issues
  useEffect(() => {
    setMounted(true);
    
    // Get event data
    if (eventId && EVENTS[eventId]) {
      setEvent(EVENTS[eventId]);
      
      // Add current player to the event
      const updatedEvent = {
        ...EVENTS[eventId],
        participants: [...EVENTS[eventId].participants]
      };
      setEvent(updatedEvent);
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
      }
    }
  }, [address, event]);

  // Handle map click to move player
  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mapRef.current) return;
    
    const rect = mapRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setPlayerPosition({ x, y });
    
    // Update current player position in the event
    if (event) {
      const updatedParticipants = event.participants.map(player => 
        player.id === CURRENT_PLAYER.id ? { ...player, position: { x, y } } : player
      );
      
      setEvent({
        ...event,
        participants: updatedParticipants
      });
    }
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
    
    if (!chatInput.trim()) return;
    
    const newMessage = {
      sender: CURRENT_PLAYER.name,
      message: chatInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setChatMessages([...chatMessages, newMessage]);
    setChatInput("");
    
    // Auto-scroll chat to bottom
    setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }, 100);
  };

  const handleBattleRequest = () => {
    if (!selectedPlayer) return;
    
    toast.success("Battle Request Sent", {
      description: `You challenged ${selectedPlayer.name} to a battle!`,
      duration: 5000
    });
    
    closePlayerDetails();
  };

  if (!mounted || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-pulse text-white font-retro tracking-wide">Loading event...</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* Background image - positioned to respect navbar */}
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
          
          <div className="flex items-center">
            <div className="bg-black/50 px-3 py-1 rounded-full text-white text-sm font-pixel">
              <span className="text-green-400 mr-1">●</span>
              {event.participants.length + 1}/{event.maxParticipants} Online
            </div>
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-2 text-white font-retro tracking-wide uppercase">
          {event.name}
        </h1>
        <p className="text-gray-300 mb-6 font-pixel tracking-wide">
          {event.description}
        </p>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Event Map */}
          <div className="lg:col-span-2">
            <div className="bg-black/40 backdrop-blur-md rounded-xl shadow-lg overflow-hidden border border-white/10 mb-6">
              <div className="p-4">
                <h2 className="text-xl font-bold text-white mb-2 font-retro tracking-wide uppercase">
                  Event Map
                </h2>
                <p className="text-gray-300 mb-4 text-sm font-pixel tracking-wide">
                  Click anywhere on the map to move your character. Interact with other players by clicking on their avatars.
                </p>
                
                {/* Interactive Map */}
                <div 
                  ref={mapRef}
                  className="relative w-full h-[500px] bg-gradient-to-br from-blue-900/50 to-purple-900/50 rounded-lg border border-white/20 overflow-hidden cursor-pointer"
                  onClick={handleMapClick}
                >
                  {/* Map Background */}
                  <div className="absolute inset-0 bg-[url('/images/map-grid.png')] bg-repeat opacity-20"></div>
                  
                  {/* Event Areas */}
                  <div className="absolute left-[20%] top-[30%] w-[30%] h-[25%] rounded-lg border-2 border-dashed border-yellow-500/50 bg-yellow-500/10 flex items-center justify-center">
                    <span className="text-yellow-300 font-pixel text-sm">Battle Arena</span>
                  </div>
                  
                  <div className="absolute right-[15%] top-[20%] w-[25%] h-[20%] rounded-lg border-2 border-dashed border-blue-500/50 bg-blue-500/10 flex items-center justify-center">
                    <span className="text-blue-300 font-pixel text-sm">Trading Zone</span>
                  </div>
                  
                  <div className="absolute left-[25%] bottom-[15%] w-[20%] h-[15%] rounded-lg border-2 border-dashed border-green-500/50 bg-green-500/10 flex items-center justify-center">
                    <span className="text-green-300 font-pixel text-sm">Showcase Area</span>
                  </div>
                  
                  <div className="absolute right-[25%] bottom-[25%] w-[20%] h-[15%] rounded-lg border-2 border-dashed border-purple-500/50 bg-purple-500/10 flex items-center justify-center">
                    <span className="text-purple-300 font-pixel text-sm">Workshop</span>
                  </div>
                  
                  {/* Other Players */}
                  {event.participants.map((player) => (
                    <button
                      key={player.id}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
                      style={{ left: `${player.position.x}%`, top: `${player.position.y}%` }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayerClick(player);
                      }}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center relative ${
                        player.status === "battling" 
                          ? "bg-red-500" 
                          : player.status === "idle" 
                            ? "bg-yellow-500" 
                            : "bg-green-500"
                      }`}>
                        <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden">
                          <span className="text-white font-bold text-xs">{player.name.substring(0, 2)}</span>
                        </div>
                        
                        {/* Status indicator */}
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border border-gray-800 ${
                          player.status === "battling" 
                            ? "bg-red-500" 
                            : player.status === "idle" 
                              ? "bg-yellow-500" 
                              : "bg-green-500"
                        }`}></div>
                      </div>
                      
                      {/* Hover tooltip */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-32 bg-black/80 rounded-lg p-2 text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <p className="text-white text-xs font-bold mb-1">{player.name}</p>
                        <p className="text-gray-300 text-xs">Lv. {player.level} Trainer</p>
                        <p className="text-xs text-gray-400 mt-1">{player.blockmon.name} (Lv. {player.blockmon.level})</p>
                      </div>
                    </button>
                  ))}
                  
                  {/* Current Player */}
                  <div
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
                    style={{ left: `${playerPosition.x}%`, top: `${playerPosition.y}%` }}
                  >
                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center relative animate-pulse">
                      <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center overflow-hidden">
                        <span className="text-white font-bold text-xs">YOU</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Chat and Participants */}
          <div>
            {/* Chat */}
            <div className="bg-black/40 backdrop-blur-md rounded-xl shadow-lg overflow-hidden border border-white/10 mb-6">
              <div className="p-4">
                <h2 className="text-xl font-bold text-white mb-2 font-retro tracking-wide uppercase">
                  Event Chat
                </h2>
                
                <div 
                  ref={chatContainerRef}
                  className="h-[300px] bg-black/30 rounded-lg border border-white/10 p-3 mb-3 overflow-y-auto"
                >
                  {chatMessages.map((msg, index) => (
                    <div key={index} className="mb-2">
                      <div className="flex items-start">
                        <span className={`font-bold text-sm ${
                          msg.sender === "System" 
                            ? "text-yellow-400" 
                            : msg.sender === CURRENT_PLAYER.name 
                              ? "text-blue-400" 
                              : "text-green-400"
                        }`}>
                          {msg.sender}:
                        </span>
                        <span className="text-white text-sm ml-2 flex-grow">{msg.message}</span>
                        <span className="text-gray-500 text-xs ml-2">{msg.timestamp}</span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <form onSubmit={handleChatSubmit} className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-grow bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Send
                  </button>
                </form>
              </div>
            </div>
            
            {/* Participants */}
            <div className="bg-black/40 backdrop-blur-md rounded-xl shadow-lg overflow-hidden border border-white/10">
              <div className="p-4">
                <h2 className="text-xl font-bold text-white mb-2 font-retro tracking-wide uppercase">
                  Participants
                </h2>
                
                <div className="max-h-[300px] overflow-y-auto pr-2">
                  {/* Current Player */}
                  <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-3 mb-2 flex items-center">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center mr-3">
                      <span className="text-white font-bold text-xs">YOU</span>
                    </div>
                    <div className="flex-grow">
                      <p className="text-white font-bold">{CURRENT_PLAYER.name} (You)</p>
                      <p className="text-gray-300 text-sm">Lv. {CURRENT_PLAYER.level} • {CURRENT_PLAYER.blockmon.name}</p>
                    </div>
                    <div className="text-green-400 text-xs">Online</div>
                  </div>
                  
                  {/* Other Participants */}
                  {event.participants.map((player) => (
                    <div 
                      key={player.id}
                      className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-3 mb-2 flex items-center cursor-pointer transition-colors"
                      onClick={() => handlePlayerClick(player)}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                        player.status === "battling" 
                          ? "bg-red-500" 
                          : player.status === "idle" 
                            ? "bg-yellow-500" 
                            : "bg-green-500"
                      }`}>
                        <span className="text-white font-bold text-xs">{player.name.substring(0, 2)}</span>
                      </div>
                      <div className="flex-grow">
                        <p className="text-white font-bold">{player.name}</p>
                        <p className="text-gray-300 text-sm">Lv. {player.level} • {player.blockmon.name}</p>
                      </div>
                      <div className={`text-xs ${
                        player.status === "battling" 
                          ? "text-red-400" 
                          : player.status === "idle" 
                            ? "text-yellow-400" 
                            : "text-green-400"
                      }`}>
                        {player.status === "battling" 
                          ? "Battling" 
                          : player.status === "idle" 
                            ? "Idle" 
                            : "Online"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
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
              
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mr-4">
                  <span className="text-white font-bold text-xl">{selectedPlayer.name.substring(0, 2)}</span>
                </div>
                <div>
                  <p className="text-white font-bold text-lg">{selectedPlayer.name}</p>
                  <p className="text-gray-400 text-sm">Level {selectedPlayer.level} Trainer</p>
                  <p className="text-gray-400 text-xs mt-1">{selectedPlayer.address}</p>
                </div>
              </div>
              
              <div className="bg-black/30 rounded-lg p-4 mb-6">
                <h4 className="text-white font-bold mb-2">Active Blockmon</h4>
                <div className="flex items-center">
                  <div className="w-16 h-16 bg-gray-800 rounded-lg mr-3 flex items-center justify-center">
                    <span className="text-gray-400 text-xs">Image</span>
                  </div>
                  <div>
                    <p className="text-white font-bold">{selectedPlayer.blockmon.name}</p>
                    <p className="text-gray-300 text-sm">Level {selectedPlayer.blockmon.level}</p>
                    <p className="text-blue-400 text-sm">{selectedPlayer.blockmon.type}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-black/30 rounded-lg p-4 mb-6">
                <h4 className="text-white font-bold mb-2">Status</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-gray-400 text-sm">Status</p>
                    <p className={`font-bold ${
                      selectedPlayer.status === "battling" 
                        ? "text-red-400" 
                        : selectedPlayer.status === "idle" 
                          ? "text-yellow-400" 
                          : "text-green-400"
                    }`}>
                      {selectedPlayer.status === "battling" 
                        ? "In Battle" 
                        : selectedPlayer.status === "idle" 
                          ? "Idle" 
                          : "Online"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Last Active</p>
                    <p className="text-white">{selectedPlayer.lastActive}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-3">
                <RetroButton 
                  variant="default" 
                  size="full" 
                  className="w-full"
                  onClick={handleBattleRequest}
                  disabled={selectedPlayer.status === "battling"}
                >
                  {selectedPlayer.status === "battling" 
                    ? "Player is in battle" 
                    : "Challenge to Battle"}
                </RetroButton>
                
                <RetroButton variant="blue" size="full" className="w-full">
                  Send Message
                </RetroButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 