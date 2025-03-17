/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import Image from "next/image";

const YOU = {
  health: 500,
  mana: 100,
  manaPerAttack: 30,
  damagePerAttack: 150,
  manaPerGenerate: 30,
};

const OPPONENT = {
  health: 500,
  mana: 100,
  manaPerAttack: 30,
  damagePerAttack: 150,
  manaPerGenerate: 30,
};

interface gameState {
  gameId: string | null;
  status: string;
  opponent: boolean;
  myMove: string | null;
  opponentMoved: boolean;
}

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

function Battle() {
  const [socket, setSocket] = useState<Socket<
    ServerToClientEvents,
    ClientToServerEvents
  > | null>(null);
  const [gameState, setGameState] = useState<gameState>({
    gameId: null,
    status: "idle",
    opponent: false,
    myMove: null,
    opponentMoved: false,
  });

  const [damageTo, setDamageTo] = useState("");
  const [manaGained, setManaGained] = useState([]);

  // Add state for blockmon selection
  const [playerBlockmon, setPlayerBlockmon] = useState("Aquavaria");
  const [opponentBlockmon, setOpponentBlockmon] = useState("Ignisoul");

  const [yourPlayer, setYourPlayer] = useState({
    health: YOU.health,
    mana: YOU.mana,
    healthPercent: 100,
    manaPercent: 100,
    gameOver: "",
  });

  const [opponentPlayer, setOpponentPlayer] = useState({
    health: OPPONENT.health,
    mana: OPPONENT.mana,
    healthPercent: 100,
    manaPercent: 100,
    gameOver: "",
  });

  const [gameOver, setGameOver] = useState<string | null>(null);

  // Add state for combat log
  const [combatLog, setCombatLog] = useState<string[]>([]);

  useEffect(() => {
    const socketUrl = "http://localhost:3006";
    const newSocket = io(socketUrl, {
      reconnection: true,
      secure: true,
    });

    // Select random blockmons for player and opponent
    const blockmons = [
      "Aquavaria",
      "Duskveil",
      "Marisoul",
      "Nocturnyx",
      "Luminox",
      "Ignisoul",
      "Golethorn"
    ];
    
    // Ensure player and opponent get different blockmons
    const playerIndex = Math.floor(Math.random() * blockmons.length);
    let opponentIndex;
    do {
      opponentIndex = Math.floor(Math.random() * blockmons.length);
    } while (opponentIndex === playerIndex);
    
    setPlayerBlockmon(blockmons[playerIndex]);
    setOpponentBlockmon(blockmons[opponentIndex]);

    newSocket.on("connect", () => {
      console.log("Connected to server:", socketUrl);
    });

    newSocket.on("waiting", () => {
      console.log("Waiting for an opponent");
      setGameState((prev) => ({
        ...prev,
        status: "waiting",
      }));
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

      newSocket.on("opponentMoved", () => {
        setGameState((prev) => ({
          ...prev,
          opponentMoved: true,
        }));
      });
    });

    newSocket.on("roundResult", (data) => {
      setGameState((prev) => ({
        ...prev,
        status: "playing",
        myMove: null,
        opponentMoved: false,
      }));

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
        };
      });

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
        };
      });

      // Update combat log
      setCombatLog((prev) => {
        const newLog = [
          `You used ${data.yourMove}, opponent used ${data.opponentMove}`,
        ];
        if (data.damageTo === "both") {
          newLog.push("Both players took damage!");
        } else if (data.damageTo === "you") {
          newLog.push("You took damage!");
        } else if (data.damageTo === "opponent") {
          newLog.push("Opponent took damage!");
        }
        // Modified this part to show all mana gains
        data.manaGained.forEach((player: string) => {
          newLog.push(`${player === "you" ? "You" : "Opponent"} gained mana!`);
        });
        return [...newLog, ...prev].slice(0, 2);
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleJoinGame = () => {
    if (socket) {
      socket.emit("joinGame");
    }
  };

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
    }
  };

  return (
    <>
      <div 
        className="min-h-screen w-full bg-no-repeat bg-cover bg-center fixed inset-0" 
        style={{ 
          backgroundImage: "url('/images/events/battle-theme/background-battle.gif')",
          imageRendering: "pixelated",
          backgroundSize: "100% 100%"
        }}
      >
        <div className="flex flex-col h-screen">
          {gameState.status === "idle" && (
            <div className="flex justify-center items-center h-screen">
              <button
                onClick={handleJoinGame}
                className="px-8 py-4 rounded pixelated font-bold uppercase text-xl bg-gray-700 text-white border-t-4 border-l-4 border-gray-500 border-b-4 border-r-4 border-gray-900 hover:bg-gray-600"
              >
                Join Game
              </button>
            </div>
          )}

          {gameState.status === "waiting" && (
            <div className="flex justify-center items-center h-screen">
              <div className="px-8 py-4 rounded pixelated font-bold text-xl text-white bg-gray-800 border-2 border-gray-600">
                Waiting for opponent...
              </div>
            </div>
          )}

          {gameState.status === "playing" && (
            <>
              {/* Health bars at the top for mobile, original layout for desktop */}
              <div className="flex flex-row w-full justify-center gap-6 md:gap-4 absolute md:static top-[15%] left-0 right-0 px-2 md:px-8 z-30 md:pt-25">
                {/* Player health/mana - Left */}
                <div className="w-[40%] md:flex-1 space-y-1 md:space-y-2">
                  <div className="flex items-center">
                    <span className="text-white mr-1 md:mr-2 font-bold pixelated text-xs md:text-base">HP</span>
                    <div className="flex-1 h-3 md:h-6 bg-gray-900 border-2 border-white p-[2px] pixelated">
                      <div
                        className="h-full bg-gradient-to-r from-red-700 to-red-500 transition-all duration-300"
                        style={{ 
                          width: `${yourPlayer.healthPercent}%`,
                          boxShadow: "0 0 4px #ff0000"
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-white mr-1 md:mr-2 font-bold pixelated text-xs md:text-base">MP</span>
                    <div className="flex-1 h-3 md:h-6 bg-gray-900 border-2 border-white p-[2px] pixelated">
                      <div
                        className="h-full bg-gradient-to-r from-blue-700 to-blue-500 transition-all duration-300"
                        style={{ 
                          width: `${yourPlayer.manaPercent}%`,
                          boxShadow: "0 0 4px #0000ff"
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                {/* Combat Log - Hidden on mobile, visible in original position on desktop */}
                <div className="hidden md:flex md:w-[40%] md:flex-col md:items-center md:justify-center md:overflow-auto md:text-white">
                  <div 
                    className="w-full h-full flex flex-col items-center justify-center pixelated relative"
                    style={{
                      backgroundImage: "url('/images/events/battle-theme/chatbox.png')",
                      backgroundSize: "100% 100%",
                      backgroundRepeat: "no-repeat",
                      imageRendering: "pixelated",
                      minHeight: "80px"
                    }}
                  >
                    {combatLog.slice(0, 2).map((log, index) => (
                      <div 
                        key={index} 
                        className="text-sm text-center font-bold text-black"
                        style={{ textShadow: "1px 1px 0 #fff" }}
                      >
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Opponent health/mana - Right */}
                <div className="w-[40%] md:flex-1 space-y-1 md:space-y-2">
                  <div className="flex items-center">
                    <div className="flex-1 h-3 md:h-6 bg-gray-900 border-2 border-white p-[2px] pixelated">
                      <div
                        className="h-full bg-gradient-to-r from-red-700 to-red-500 transition-all duration-300"
                        style={{ 
                          width: `${opponentPlayer.healthPercent}%`,
                          boxShadow: "0 0 4px #ff0000"
                        }}
                      ></div>
                    </div>
                    <span className="text-white ml-1 md:ml-2 font-bold pixelated text-xs md:text-base">HP</span>
                  </div>
                  <div className="flex items-center">
                    <div className="flex-1 h-3 md:h-6 bg-gray-900 border-2 border-white p-[2px] pixelated">
                      <div
                        className="h-full bg-gradient-to-r from-blue-700 to-blue-500 transition-all duration-300"
                        style={{ 
                          width: `${opponentPlayer.manaPercent}%`,
                          boxShadow: "0 0 4px #0000ff"
                        }}
                      ></div>
                    </div>
                    <span className="text-white ml-1 md:ml-2 font-bold pixelated text-xs md:text-base">MP</span>
                  </div>
                </div>
              </div>
              
              {/* Combat Log in the middle of the page - Mobile only */}
              <div className="md:hidden absolute top-[40%] left-1/2 -translate-x-1/2 w-[80%] flex flex-col items-center justify-center overflow-auto text-white z-30">
                <div 
                  className="w-full h-full flex flex-col items-center justify-center pixelated relative"
                  style={{
                    backgroundImage: "url('/images/events/battle-theme/chatbox.png')",
                    backgroundSize: "100% 100%",
                    backgroundRepeat: "no-repeat",
                    imageRendering: "pixelated",
                    minHeight: "50px",
                    padding: "8px"
                  }}
                >
                  {combatLog.slice(0, 2).map((log, index) => (
                    <div 
                      key={index} 
                      className="text-xs text-center font-bold text-black"
                      style={{ textShadow: "1px 1px 0 #fff" }}
                    >
                      {log}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Main battle area with players positioned at the bottom */}
              <div className="flex-1 flex flex-row w-full relative h-screen md:h-auto">
                {/* Buttons in the middle of the screen - Mobile only */}
                <div className="md:hidden absolute bottom-[0%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-row gap-1 w-[50%] z-20">
                  <button
                    onClick={() => handleMove("attack")}
                    disabled={Boolean(
                      gameState.myMove ||
                        gameOver ||
                        yourPlayer.mana < YOU.manaPerAttack
                    )}
                    className={`flex-1 px-1 py-1 rounded pixelated font-bold uppercase text-[10px] ${
                      gameState.myMove ||
                      gameOver ||
                      yourPlayer.mana < YOU.manaPerAttack
                        ? "bg-gray-600 text-yellow-400 border-1 border-gray-700"
                        : "bg-gray-700 text-white border-t-1 border-l-1 border-gray-500 border-b-1 border-r-1 border-gray-900 hover:bg-gray-600"
                    }`}
                  >
                    Attack
                  </button>
                  <button
                    onClick={() => handleMove("dodge")}
                    disabled={Boolean(gameState.myMove || gameOver)}
                    className={`flex-1 px-1 py-1 rounded pixelated font-bold uppercase text-[10px] ${
                      gameState.myMove || gameOver
                        ? "bg-gray-600 text-yellow-400 border-1 border-gray-700"
                        : "bg-gray-700 text-white border-t-1 border-l-1 border-gray-500 border-b-1 border-r-1 border-gray-900 hover:bg-gray-600"
                    }`}
                  >
                    Dodge
                  </button>
                  <button
                    onClick={() => handleMove("mana")}
                    disabled={Boolean(gameState.myMove || gameOver)}
                    className={`flex-1 px-1 py-1 rounded pixelated font-bold uppercase text-[10px] ${
                      gameState.myMove || gameOver
                        ? "bg-gray-600 text-yellow-400 border-1 border-gray-700"
                        : "bg-gray-700 text-white border-t-1 border-l-1 border-gray-500 border-b-1 border-r-1 border-gray-900 hover:bg-gray-600"
                    }`}
                  >
                    Mana
                  </button>
                </div>

                {/* Mobile layout for players */}
                <div className="md:hidden w-1/2 relative">
                  {/* Player avatar on ground */}
                  <div className="absolute bottom-[5%] left-1/2 -translate-x-1/2">
                    <Image 
                      src={`/blockmon/${playerBlockmon}.gif`} 
                      alt="Player Blockmon" 
                      width={160}
                      height={160}
                      className="w-24 h-24 object-contain"
                      style={{ 
                        imageRendering: "pixelated",
                        filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.5))"
                      }}
                    />
                  </div>
                </div>
                
                <div className="md:hidden w-1/2 relative">
                  {/* Opponent avatar on ground */}
                  <div className="absolute bottom-[5%] left-1/2 -translate-x-1/2">
                    <Image 
                      src={`/blockmon/${opponentBlockmon}.gif`} 
                      alt="Opponent Blockmon" 
                      width={160}
                      height={160}
                      className="w-24 h-24 object-contain"
                      style={{ 
                        imageRendering: "pixelated",
                        filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.5))"
                      }}
                    />
                  </div>
                </div>
                
                {/* Desktop layout for players - Original positioning */}
                <div className="hidden md:block absolute bottom-[-10%] left-[15%]">
                  <Image 
                    src={`/blockmon/${playerBlockmon}.gif`} 
                    alt="Player Blockmon" 
                    width={160}
                    height={160}
                    className="w-40 h-40 object-contain"
                    style={{ 
                      imageRendering: "pixelated",
                      filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.5))"
                    }}
                  />
                </div>
                
                <div className="hidden md:block absolute bottom-[-10%] right-[15%]">
                  <Image 
                    src={`/blockmon/${opponentBlockmon}.gif`} 
                    alt="Opponent Blockmon" 
                    width={160}
                    height={160}
                    className="w-40 h-40 object-contain"
                    style={{ 
                      imageRendering: "pixelated",
                      filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.5))"
                    }}
                  />
                </div>
              </div>

              {/* Buttons at the bottom - Desktop only */}
              <div className="hidden md:flex md:flex-row md:justify-center md:gap-4 md:w-full md:p-3">
                <button
                  onClick={() => handleMove("attack")}
                  disabled={Boolean(
                    gameState.myMove ||
                      gameOver ||
                      yourPlayer.mana < YOU.manaPerAttack
                  )}
                  className={`px-6 py-3 rounded pixelated font-bold uppercase ${
                    gameState.myMove ||
                    gameOver ||
                    yourPlayer.mana < YOU.manaPerAttack
                      ? "bg-gray-600 text-yellow-400 border-2 border-gray-700"
                      : "bg-gray-700 text-white border-t-2 border-l-2 border-gray-500 border-b-2 border-r-2 border-gray-900 hover:bg-gray-600"
                  }`}
                >
                  Attack
                </button>
                <button
                  onClick={() => handleMove("dodge")}
                  disabled={Boolean(gameState.myMove || gameOver)}
                  className={`px-6 py-3 rounded pixelated font-bold uppercase ${
                    gameState.myMove || gameOver
                      ? "bg-gray-600 text-yellow-400 border-2 border-gray-700"
                      : "bg-gray-700 text-white border-t-2 border-l-2 border-gray-500 border-b-2 border-r-2 border-gray-900 hover:bg-gray-600"
                  }`}
                >
                  Dodge
                </button>
                <button
                  onClick={() => handleMove("mana")}
                  disabled={Boolean(gameState.myMove || gameOver)}
                  className={`px-6 py-3 rounded pixelated font-bold uppercase ${
                    gameState.myMove || gameOver
                      ? "bg-gray-600 text-yellow-400 border-2 border-gray-700"
                      : "bg-gray-700 text-white border-t-2 border-l-2 border-gray-500 border-b-2 border-r-2 border-gray-900 hover:bg-gray-600"
                  }`}
                >
                  Mana
                </button>
              </div>

              {/* Responsive overlay messages */}
              {gameState.myMove && !gameState.opponentMoved && (
                <div
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pixelated z-40"
                >
                  <div className="bg-gray-900 border-4 border-t-gray-700 border-l-gray-700 border-b-gray-950 border-r-gray-950 p-4 md:p-6 rounded-lg">
                    <div className="text-center text-sm md:text-xl font-bold text-white animate-pulse">
                      Waiting for opponent&apos;s move...
                    </div>
                    <div className="flex justify-center mt-3 space-x-1">
                      <div className="w-2 h-2 md:w-3 md:h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                      <div className="w-2 h-2 md:w-3 md:h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                      <div className="w-2 h-2 md:w-3 md:h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                    </div>
                  </div>
                </div>
              )}

              {gameOver && (
                <div
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pixelated z-50"
                >
                  <div className={`bg-gray-900 border-4 md:border-8 ${gameOver === "win" ? "border-yellow-500" : "border-red-700"} p-4 md:p-8 rounded-lg shadow-lg`}>
                    <div className={`text-center text-xl md:text-3xl font-bold ${gameOver === "win" ? "text-yellow-400" : "text-red-500"}`}>
                      {yourPlayer.gameOver !== "" &&
                      yourPlayer.gameOver === opponentPlayer.gameOver
                        ? "DRAW!"
                        : gameOver === "win"
                        ? "YOU WON!"
                        : "YOU LOST!"}
                    </div>
                    {gameOver === "win" && (
                      <div className="mt-2 md:mt-4 flex justify-center">
                        <div className="text-yellow-300 text-lg md:text-xl">★ ★ ★</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add a style tag for pixelated font and responsive styles */}
      <style jsx global>{`
        .pixelated {
          image-rendering: pixelated;
          font-family: monospace;
          letter-spacing: -1px;
          text-shadow: 2px 2px 0 #000;
        }
        
        @media (max-width: 768px) {
          .pixelated {
            letter-spacing: -0.5px;
            text-shadow: 1px 1px 0 #000;
          }
        }
      `}</style>
    </>
  );
}

export default Battle;
