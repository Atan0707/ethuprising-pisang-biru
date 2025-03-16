"use client";
import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import Link from "next/link";
import Image from "next/image";
import { RetroButton } from "@/components/ui/retro-button";
import { toast } from "sonner";

// Constants for player stats
const YOU = {
  health: 500,
  mana: 100,
  manaPerAttack: 30,
  damagePerAttack: 150,
  manaPerGenerate: 30,
  name: "You",
  image: "/images/pika.png",
};

const OPPONENT = {
  health: 500,
  mana: 100,
  manaPerAttack: 30,
  damagePerAttack: 150,
  manaPerGenerate: 30,
  name: "Opponent",
  image: "/images/charizard.png",
};

// Game state interface
interface GameState {
  gameId: string | null;
  status: string;
  opponent: boolean;
  myMove: string | null;
  opponentMoved: boolean;
}

// Socket event interfaces
interface ClientToServerEvents {
  joinGame: () => void;
  makeMove: (data: { gameId: string; move: string }) => void;
}

interface ServerToClientEvents {
  gameStart: (data: { gameId: string; opponent: boolean }) => void;
  waiting: () => void;
  opponentMoved: () => void;
  roundResult: (data: {
    yourMove: string;
    opponentMove: string;
    damageTo: string;
    manaGained: string[];
  }) => void;
}

// Battle animations
const ANIMATIONS = {
  attack: {
    you: { transform: "translateX(50px)", transition: "transform 0.3s ease-in-out" },
    opponent: { transform: "translateX(-50px)", transition: "transform 0.3s ease-in-out" },
  },
  defend: {
    you: { boxShadow: "0 0 20px #3498db", transition: "box-shadow 0.3s ease-in-out" },
    opponent: { boxShadow: "0 0 20px #3498db", transition: "box-shadow 0.3s ease-in-out" },
  },
  generate: {
    you: { boxShadow: "0 0 20px #2ecc71", transition: "box-shadow 0.3s ease-in-out" },
    opponent: { boxShadow: "0 0 20px #2ecc71", transition: "box-shadow 0.3s ease-in-out" },
  },
  damage: {
    you: { filter: "brightness(1.5) sepia(1) hue-rotate(-50deg) saturate(5)", transition: "filter 0.3s ease-in-out" },
    opponent: { filter: "brightness(1.5) sepia(1) hue-rotate(-50deg) saturate(5)", transition: "filter 0.3s ease-in-out" },
  },
};

export default function BattlePage() {
  // Socket and game state
  const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    gameId: null,
    status: "idle",
    opponent: false,
    myMove: null,
    opponentMoved: false,
  });

  // Player states
  const [yourPlayer, setYourPlayer] = useState({
    health: YOU.health,
    mana: YOU.mana,
    healthPercent: 100,
    manaPercent: 100,
    gameOver: "",
    animation: {},
  });

  const [opponentPlayer, setOpponentPlayer] = useState({
    health: OPPONENT.health,
    mana: OPPONENT.mana,
    healthPercent: 100,
    manaPercent: 100,
    gameOver: "",
    animation: {},
  });

  // Game state
  const [gameOver, setGameOver] = useState<string | null>(null);
  const [combatLog, setCombatLog] = useState<string[]>([]);
  const [roundCount, setRoundCount] = useState(1);
  const [mounted, setMounted] = useState(false);
  
  // Refs for animations
  const yourRef = useRef<HTMLDivElement>(null);
  const opponentRef = useRef<HTMLDivElement>(null);
  const combatLogRef = useRef<HTMLDivElement>(null);

  // Initialize socket connection
  useEffect(() => {
    setMounted(true);
    
    const socketUrl = "http://localhost:3006";
    const newSocket = io(socketUrl, {
      reconnection: true,
      secure: true,
    });

    newSocket.on("connect", () => {
      console.log("Connected to battle server:", socketUrl);
    });

    newSocket.on("waiting", () => {
      console.log("Waiting for an opponent");
      setGameState((prev) => ({
        ...prev,
        status: "waiting",
      }));
      
      // Auto-join game in development
      if (process.env.NODE_ENV === "development") {
        setTimeout(() => {
          newSocket.emit("joinGame");
        }, 1000);
      }
    });

    newSocket.on("gameStart", (data) => {
      console.log("Game started!", data);
      setGameState({
        gameId: data.gameId,
        status: "playing",
        opponent: data.opponent,
        myMove: null,
        opponentMoved: false,
      });
      
      toast.success("Battle started! Make your move!");
      setCombatLog(prev => ["Battle started! Make your move!", ...prev]);

      newSocket.on("opponentMoved", () => {
        setGameState((prev) => ({
          ...prev,
          opponentMoved: true,
        }));
        
        toast.info("Opponent has made their move!");
        setCombatLog(prev => ["Opponent has made their move!", ...prev]);
      });
    });

    newSocket.on("roundResult", (data) => {
      setRoundCount(prev => prev + 1);
      
      // Reset move state
      setGameState((prev) => ({
        ...prev,
        status: "playing",
        myMove: null,
        opponentMoved: false,
      }));

      // Apply animations
      if (data.yourMove === "attack") {
        setYourPlayer(prev => ({ ...prev, animation: ANIMATIONS.attack.you }));
        setTimeout(() => setYourPlayer(prev => ({ ...prev, animation: {} })), 500);
      } else if (data.yourMove === "defend") {
        setYourPlayer(prev => ({ ...prev, animation: ANIMATIONS.defend.you }));
        setTimeout(() => setYourPlayer(prev => ({ ...prev, animation: {} })), 500);
      } else if (data.yourMove === "generate") {
        setYourPlayer(prev => ({ ...prev, animation: ANIMATIONS.generate.you }));
        setTimeout(() => setYourPlayer(prev => ({ ...prev, animation: {} })), 500);
      }
      
      if (data.opponentMove === "attack") {
        setOpponentPlayer(prev => ({ ...prev, animation: ANIMATIONS.attack.opponent }));
        setTimeout(() => setOpponentPlayer(prev => ({ ...prev, animation: {} })), 500);
      } else if (data.opponentMove === "defend") {
        setOpponentPlayer(prev => ({ ...prev, animation: ANIMATIONS.defend.opponent }));
        setTimeout(() => setOpponentPlayer(prev => ({ ...prev, animation: {} })), 500);
      } else if (data.opponentMove === "generate") {
        setOpponentPlayer(prev => ({ ...prev, animation: ANIMATIONS.generate.opponent }));
        setTimeout(() => setOpponentPlayer(prev => ({ ...prev, animation: {} })), 500);
      }
      
      // Apply damage animations
      if (data.damageTo === "you" || data.damageTo === "both") {
        setTimeout(() => {
          setYourPlayer(prev => ({ ...prev, animation: ANIMATIONS.damage.you }));
          setTimeout(() => setYourPlayer(prev => ({ ...prev, animation: {} })), 500);
        }, 600);
      }
      
      if (data.damageTo === "opponent" || data.damageTo === "both") {
        setTimeout(() => {
          setOpponentPlayer(prev => ({ ...prev, animation: ANIMATIONS.damage.opponent }));
          setTimeout(() => setOpponentPlayer(prev => ({ ...prev, animation: {} })), 500);
        }, 600);
      }

      // Update your player stats
      setYourPlayer((prev) => {
        let newHealth = prev.health;
        let newMana = prev.mana;

        // Handle damage
        if (data.damageTo === "you" || data.damageTo === "both") {
          newHealth -= OPPONENT.damagePerAttack;
        }

        // Handle mana changes
        if (data.manaGained.includes("you")) {
          newMana = Math.min(YOU.mana, newMana + YOU.manaPerGenerate);
        }
        if (data.yourMove === "attack") {
          newMana = Math.max(0, newMana - YOU.manaPerAttack);
        }

        newHealth = Math.max(0, newHealth);
        let playerGameOver = "";
        if (newHealth <= 0) {
          setGameOver("lose");
          playerGameOver = "lose";
        }

        return {
          health: newHealth,
          mana: newMana,
          healthPercent: (newHealth / YOU.health) * 100,
          manaPercent: (newMana / YOU.mana) * 100,
          gameOver: playerGameOver,
          animation: prev.animation,
        };
      });

      // Update opponent player stats
      setOpponentPlayer((prev) => {
        let newHealth = prev.health;
        let newMana = prev.mana;

        // Handle damage
        if (data.damageTo === "opponent" || data.damageTo === "both") {
          newHealth -= YOU.damagePerAttack;
        }

        // Handle mana changes
        if (data.manaGained.includes("opponent")) {
          newMana = Math.min(OPPONENT.mana, newMana + OPPONENT.manaPerGenerate);
        }
        if (data.opponentMove === "attack") {
          newMana = Math.max(0, newMana - OPPONENT.manaPerAttack);
        }

        newHealth = Math.max(0, newHealth);
        let playerGameOver = "";
        if (newHealth <= 0) {
          setGameOver("win");
          playerGameOver = "lose";
        }

        return {
          health: newHealth,
          mana: newMana,
          healthPercent: (newHealth / OPPONENT.health) * 100,
          manaPercent: (newMana / OPPONENT.mana) * 100,
          gameOver: playerGameOver,
          animation: prev.animation,
        };
      });

      // Update combat log
      setCombatLog((prev) => {
        const newLog = [
          `Round ${roundCount}: You used ${data.yourMove}, opponent used ${data.opponentMove}`,
        ];
        if (data.damageTo === "both") {
          newLog.push("Both players took damage!");
        } else if (data.damageTo === "you") {
          newLog.push("You took damage!");
        } else if (data.damageTo === "opponent") {
          newLog.push("Opponent took damage!");
        }
        
        data.manaGained.forEach((player: string) => {
          newLog.push(`${player === "you" ? "You" : "Opponent"} gained mana!`);
        });
        
        return [...newLog, ...prev].slice(0, 10);
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [roundCount]);

  // Auto-scroll combat log
  useEffect(() => {
    if (combatLogRef.current) {
      combatLogRef.current.scrollTop = 0;
    }
  }, [combatLog]);

  // Handle joining a game
  const handleJoinGame = () => {
    if (socket) {
      socket.emit("joinGame");
      toast.info("Looking for an opponent...");
    }
  };

  // Handle making a move
  const handleMove = (move: string) => {
    if (socket && gameState.gameId && !gameState.myMove) {
      socket.emit("makeMove", {
        gameId: gameState.gameId,
        move: move,
      });
      
      setGameState((prev) => ({
        ...prev,
        myMove: move,
      }));
      
      toast.success(`You chose to ${move}!`);
    }
  };

  // Handle game restart
  const handleRestart = () => {
    setYourPlayer({
      health: YOU.health,
      mana: YOU.mana,
      healthPercent: 100,
      manaPercent: 100,
      gameOver: "",
      animation: {},
    });
    
    setOpponentPlayer({
      health: OPPONENT.health,
      mana: OPPONENT.mana,
      healthPercent: 100,
      manaPercent: 100,
      gameOver: "",
      animation: {},
    });
    
    setGameState({
      gameId: null,
      status: "idle",
      opponent: false,
      myMove: null,
      opponentMoved: false,
    });
    
    setGameOver(null);
    setCombatLog([]);
    setRoundCount(1);
    
    if (socket) {
      socket.disconnect();
      const socketUrl = "http://localhost:3006";
      const newSocket = io(socketUrl, {
        reconnection: true,
        secure: true,
      });
      setSocket(newSocket);
    }
  };

  if (!mounted) return null;

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Battle Background */}
      <div className="fixed inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: "url('/images/events/battle-theme/background-battle.gif')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-black/30" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-8 flex-1 flex flex-col">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Link href="/arena" className="text-white hover:text-blue-300 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-pixel tracking-wide">Back to Arena</span>
          </Link>
          
          <div className="bg-black/50 px-3 py-1 rounded-full text-white text-sm font-pixel">
            {gameState.status === "playing" ? (
              <span className="text-green-400">Battle in Progress</span>
            ) : gameState.status === "waiting" ? (
              <span className="text-yellow-400">Waiting for Opponent</span>
            ) : (
              <span className="text-blue-400">Ready to Battle</span>
            )}
          </div>
        </div>
        
        {gameState.status === "idle" ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="bg-black/70 backdrop-blur-md rounded-xl p-8 max-w-md w-full text-center">
              <h1 className="text-3xl font-bold mb-6 text-white font-retro tracking-wide uppercase">
                Blockmon Battle
              </h1>
              <p className="text-gray-300 mb-8 font-pixel tracking-wide">
                Challenge another trainer to a battle! Test your skills and strategy in turn-based combat.
              </p>
              <RetroButton 
                variant="default" 
                size="default" 
                className="w-full"
                onClick={handleJoinGame}
              >
                Find Opponent
              </RetroButton>
            </div>
          </div>
        ) : gameState.status === "waiting" ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="bg-black/70 backdrop-blur-md rounded-xl p-8 max-w-md w-full text-center">
              <h1 className="text-3xl font-bold mb-6 text-white font-retro tracking-wide uppercase">
                Finding Opponent
              </h1>
              <div className="flex justify-center mb-6">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
              <p className="text-gray-300 mb-8 font-pixel tracking-wide">
                Searching for another trainer to battle with you...
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            {/* Battle Arena */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Your Character */}
              <div className="lg:col-span-1 flex flex-col items-center">
                <div 
                  ref={yourRef}
                  className="relative w-48 h-48 mb-4"
                  style={yourPlayer.animation}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Image 
                      src={YOU.image}
                      alt="Your Character"
                      width={150}
                      height={150}
                      className="object-contain"
                    />
                  </div>
                </div>
                
                <div className="bg-black/70 backdrop-blur-md rounded-xl p-4 w-full">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-white font-bold font-retro">{YOU.name}</h3>
                    <span className="text-white font-pixel">{Math.floor(yourPlayer.health)}/{YOU.health} HP</span>
                  </div>
                  
                  {/* Health Bar */}
                  <div className="w-full h-4 bg-gray-800 rounded-full mb-2 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full transition-all duration-500"
                      style={{ width: `${yourPlayer.healthPercent}%` }}
                    />
                  </div>
                  
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-blue-300 font-pixel">Mana</span>
                    <span className="text-blue-300 font-pixel">{Math.floor(yourPlayer.mana)}/{YOU.mana}</span>
                  </div>
                  
                  {/* Mana Bar */}
                  <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-500"
                      style={{ width: `${yourPlayer.manaPercent}%` }}
                    />
                  </div>
                </div>
              </div>
              
              {/* Battle Info */}
              <div className="lg:col-span-1 flex flex-col">
                {/* VS Display */}
                <div className="bg-black/70 backdrop-blur-md rounded-xl p-4 mb-4 flex items-center justify-center">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-white font-retro tracking-wide uppercase mb-2">
                      Round {roundCount}
                    </h2>
                    <div className="flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-blue-600/50 flex items-center justify-center">
                        <span className="text-white font-bold text-2xl">VS</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Combat Log */}
                <div className="bg-black/70 backdrop-blur-md rounded-xl p-4 flex-1 flex flex-col">
                  <h3 className="text-white font-bold font-retro mb-2">Battle Log</h3>
                  <div 
                    ref={combatLogRef}
                    className="flex-1 overflow-y-auto max-h-[200px] font-pixel text-sm"
                  >
                    {combatLog.length === 0 ? (
                      <p className="text-gray-400 text-center py-4">Battle has not started yet</p>
                    ) : (
                      <div className="space-y-2">
                        {combatLog.map((log, index) => (
                          <div 
                            key={index} 
                            className="text-gray-300 border-l-2 border-blue-500 pl-2"
                          >
                            {log}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Opponent Character */}
              <div className="lg:col-span-1 flex flex-col items-center">
                <div 
                  ref={opponentRef}
                  className="relative w-48 h-48 mb-4"
                  style={opponentPlayer.animation}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Image 
                      src={OPPONENT.image}
                      alt="Opponent Character"
                      width={150}
                      height={150}
                      className="object-contain"
                    />
                  </div>
                </div>
                
                <div className="bg-black/70 backdrop-blur-md rounded-xl p-4 w-full">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-white font-bold font-retro">{OPPONENT.name}</h3>
                    <span className="text-white font-pixel">{Math.floor(opponentPlayer.health)}/{OPPONENT.health} HP</span>
                  </div>
                  
                  {/* Health Bar */}
                  <div className="w-full h-4 bg-gray-800 rounded-full mb-2 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full transition-all duration-500"
                      style={{ width: `${opponentPlayer.healthPercent}%` }}
                    />
                  </div>
                  
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-blue-300 font-pixel">Mana</span>
                    <span className="text-blue-300 font-pixel">{Math.floor(opponentPlayer.mana)}/{OPPONENT.mana}</span>
                  </div>
                  
                  {/* Mana Bar */}
                  <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-500"
                      style={{ width: `${opponentPlayer.manaPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Controls */}
            <div className="bg-black/70 backdrop-blur-md rounded-xl p-4 mb-6">
              {gameOver ? (
                <div className="text-center">
                  <h2 className={`text-2xl font-bold font-retro mb-4 ${gameOver === "win" ? "text-green-400" : "text-red-400"}`}>
                    {gameOver === "win" ? "Victory!" : "Defeat!"}
                  </h2>
                  <p className="text-gray-300 font-pixel mb-6">
                    {gameOver === "win" 
                      ? "Congratulations! You've defeated your opponent!" 
                      : "You were defeated! Better luck next time!"}
                  </p>
                  <RetroButton 
                    variant="default" 
                    size="default" 
                    className="mx-auto"
                    onClick={handleRestart}
                  >
                    Battle Again
                  </RetroButton>
                </div>
              ) : (
                <>
                  <h3 className="text-white font-bold font-retro mb-4 text-center">Your Move</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <RetroButton 
                      variant="default" 
                      size="default" 
                      className="w-full"
                      onClick={() => handleMove("attack")}
                      disabled={!!gameState.myMove || yourPlayer.mana < YOU.manaPerAttack}
                    >
                      <div className="flex flex-col items-center">
                        <span>Attack</span>
                        <span className="text-xs mt-1">({YOU.manaPerAttack} Mana)</span>
                      </div>
                    </RetroButton>
                    
                    <RetroButton 
                      variant="blue" 
                      size="default" 
                      className="w-full"
                      onClick={() => handleMove("defend")}
                      disabled={!!gameState.myMove}
                    >
                      <div className="flex flex-col items-center">
                        <span>Defend</span>
                        <span className="text-xs mt-1">(0 Mana)</span>
                      </div>
                    </RetroButton>
                    
                    <RetroButton 
                      variant="default" 
                      size="default" 
                      className="w-full"
                      onClick={() => handleMove("generate")}
                      disabled={!!gameState.myMove}
                    >
                      <div className="flex flex-col items-center">
                        <span>Generate Mana</span>
                        <span className="text-xs mt-1">(+{YOU.manaPerGenerate})</span>
                      </div>
                    </RetroButton>
                  </div>
                  
                  {gameState.myMove && (
                    <div className="mt-4 text-center">
                      <p className="text-white font-pixel">
                        You chose to <span className="text-blue-300 font-bold">{gameState.myMove}</span>
                        {gameState.opponentMoved 
                          ? ". Waiting for round results..." 
                          : ". Waiting for opponent's move..."}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


