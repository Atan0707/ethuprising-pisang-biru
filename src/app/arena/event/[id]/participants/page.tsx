"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

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
  wins: number;
  losses: number;
}

// Define event interface
interface Event {
  id: string;
  name: string;
  participants: Player[];
}

// Sample event data
const EVENTS: Record<string, Event> = {
  "eth-uprising": {
    id: "eth-uprising",
    name: "ETH Uprising Hackathon",
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
        lastActive: "Just now",
        wins: 15,
        losses: 5
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
        lastActive: "2 min ago",
        wins: 8,
        losses: 3
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
        lastActive: "5 min ago",
        wins: 12,
        losses: 7
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
        lastActive: "Just now",
        wins: 5,
        losses: 10
      },
      {
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
        lastActive: "Now",
        wins: 10,
        losses: 8
      }
    ]
  },
  "pixel-masters": {
    id: "pixel-masters",
    name: "Pixel Masters Tournament",
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
        lastActive: "Just now",
        wins: 20,
        losses: 2
      },
      {
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
        lastActive: "Now",
        wins: 10,
        losses: 8
      }
    ]
  },
  "community-meetup": {
    id: "community-meetup",
    name: "Blockmon Community Meetup",
    participants: [
      {
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
        lastActive: "Now",
        wins: 10,
        losses: 8
      }
    ]
  }
};

type SortOption = "level" | "wins" | "winRate" | "name";

// Define status filter type
type StatusFilterType = "all" | "online" | "battling" | "idle";

export default function ParticipantsPage() {
  const params = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<Player[]>([]);
  const [filteredParticipants, setFilteredParticipants] = useState<Player[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("level");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>("all");
  const [mounted, setMounted] = useState(false);
  const eventId = params.id as string;

  // Ensure component is mounted to avoid hydration issues
  useEffect(() => {
    setMounted(true);
    
    // Get event data
    if (eventId && EVENTS[eventId]) {
      setEvent(EVENTS[eventId]);
      setParticipants(EVENTS[eventId].participants);
    } else {
      // Handle invalid event ID
      router.push("/arena/event");
    }
  }, [eventId, router]);

  // Filter and sort participants
  useEffect(() => {
    const filtered = participants
      .filter(player => {
        // Apply search filter
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          return (
            player.name.toLowerCase().includes(query) ||
            player.blockmon.name.toLowerCase().includes(query)
          );
        }
        
        // Apply status filter
        if (statusFilter !== "all") {
          return player.status === statusFilter;
        }
        
        return true;
      })
      .sort((a, b) => {
        // Apply sorting
        let valueA, valueB;
        
        switch (sortBy) {
          case "level":
            valueA = a.level;
            valueB = b.level;
            break;
          case "wins":
            valueA = a.wins;
            valueB = b.wins;
            break;
          case "winRate":
            valueA = a.wins / (a.wins + a.losses) || 0;
            valueB = b.wins / (b.wins + b.losses) || 0;
            break;
          case "name":
            valueA = a.name.toLowerCase();
            valueB = b.name.toLowerCase();
            return sortDirection === "asc" 
              ? valueA.localeCompare(valueB)
              : valueB.localeCompare(valueA);
          default:
            valueA = a.level;
            valueB = b.level;
        }
        
        return sortDirection === "asc" ? valueA - valueB : valueB - valueA;
      });
      
    setFilteredParticipants(filtered);
  }, [participants, searchQuery, statusFilter, sortBy, sortDirection]);

  const toggleSortDirection = () => {
    setSortDirection(sortDirection === "asc" ? "desc" : "asc");
  };

  if (!mounted || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-pulse text-white font-retro tracking-wide">Loading participants...</div>
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
          <Link href={`/arena/event/${eventId}`} className="text-white hover:text-blue-300 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-pixel tracking-wide">Back to Event</span>
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-2 text-white font-retro tracking-wide uppercase">
          {event.name} - Participants
        </h1>
        <p className="text-gray-300 mb-6 font-pixel tracking-wide">
          View and interact with all participants in this event.
        </p>

        <div className="bg-black/40 backdrop-blur-md rounded-xl shadow-lg overflow-hidden border border-white/10 mb-8">
          <div className="p-6">
            {/* Filters and Search */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-grow">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, Blockmon, or type..."
                  className="w-full bg-black/30 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilterType)}
                  className="bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="online">Online</option>
                  <option value="battling">Battling</option>
                  <option value="idle">Idle</option>
                </select>
                
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="level">Level</option>
                  <option value="wins">Wins</option>
                  <option value="winRate">Win Rate</option>
                  <option value="name">Name</option>
                </select>
                
                <button
                  onClick={toggleSortDirection}
                  className="bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-white hover:bg-black/50 transition-colors"
                >
                  {sortDirection === "asc" ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            
            {/* Participants List */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredParticipants.map((player) => (
                <Link 
                  key={player.id} 
                  href={`/arena/event/${eventId}?player=${player.id}`}
                  className={`block bg-white/5 hover:bg-white/10 border ${
                    player.id === "current" 
                      ? "border-blue-500/50" 
                      : "border-white/10"
                  } rounded-lg overflow-hidden transition-colors`}
                >
                  <div className="p-4">
                    <div className="flex items-center mb-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-3 ${
                        player.status === "battling" 
                          ? "bg-red-500" 
                          : player.status === "idle" 
                            ? "bg-yellow-500" 
                            : "bg-green-500"
                      }`}>
                        <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden">
                          <span className="text-white font-bold text-sm">{player.name.substring(0, 2)}</span>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center">
                          <h3 className="text-white font-bold">{player.name}</h3>
                          {player.id === "current" && (
                            <span className="ml-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">You</span>
                          )}
                        </div>
                        <p className="text-gray-400 text-sm">Level {player.level} Trainer</p>
                      </div>
                    </div>
                    
                    <div className="bg-black/30 rounded-lg p-3 mb-3">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-800 rounded-lg mr-2 flex items-center justify-center">
                          <span className="text-gray-500 text-xs">IMG</span>
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{player.blockmon.name}</p>
                          <p className="text-gray-400 text-xs">Lv. {player.blockmon.level} • {player.blockmon.type}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-black/20 rounded-lg p-2">
                        <p className="text-gray-400 text-xs mb-1">Wins</p>
                        <p className="text-green-400 font-bold">{player.wins}</p>
                      </div>
                      <div className="bg-black/20 rounded-lg p-2">
                        <p className="text-gray-400 text-xs mb-1">Losses</p>
                        <p className="text-red-400 font-bold">{player.losses}</p>
                      </div>
                      <div className="bg-black/20 rounded-lg p-2">
                        <p className="text-gray-400 text-xs mb-1">Win Rate</p>
                        <p className="text-blue-400 font-bold">
                          {Math.round((player.wins / (player.wins + player.losses || 1)) * 100)}%
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            
            {filteredParticipants.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-400 font-retro tracking-wide">No participants match your filters</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 