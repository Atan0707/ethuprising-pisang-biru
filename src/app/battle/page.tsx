"use client";
import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

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
        data.manaGained.forEach((player: any) => {
          newLog.push(`${player === "you" ? "You" : "Opponent"} gained mana!`);
        });
        return [...newLog, ...prev].slice(0, 5);
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
      <div className=" min-h-screen w-full">
        <div className=" flex flex-col h-[100vh] py-4">
          {gameState.status === "idle" && (
            <>
              <button
                onClick={handleJoinGame}
                className=" bg-primary text-light px-4 py-2 rounded"
              >
                Join Game
              </button>
            </>
          )}

          {gameState.status === "waiting" && <div>waiting for opponent</div>}

          {gameState.status === "playing" && (
            <>
              {/* Opponent Section */}
              <div className="flex-1 flex flex-col">
                <div className="flex justify-center items-center h-[70%]">
                  <div className="w-20 h-20 rounded-full bg-red-500"></div>
                </div>
                <div className="flex flex-col items-center justify-end pb-4">
                  <div className="w-[80%] space-y-2">
                    <div
                      className="h-4 bg-red-600 rounded-full transition-all duration-300"
                      style={{ width: `${opponentPlayer.healthPercent}%` }}
                    ></div>
                    <div
                      className="h-4 bg-blue-600 rounded-full transition-all duration-300"
                      style={{ width: `${opponentPlayer.manaPercent}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Combat Log - Middle */}
              <div className="h-[20%] w-full flex flex-col items-center overflow-auto text-white p-4 border-y-2 border-gray-400">
                {combatLog.map((log, index) => (
                  <div key={index} className="text-sm">
                    {log}
                  </div>
                ))}
              </div>

              {/* Player Section */}
              <div className="flex-1 flex flex-col">
                <div className="flex justify-center items-center h-[40%]">
                  <div className="w-20 h-20 rounded-full bg-blue-500"></div>
                </div>

                {/* Health/Mana bars now between circle and buttons */}
                <div className="flex flex-col items-center justify-center py-4">
                  <div className="w-[80%] space-y-2">
                    <div
                      className="h-4 bg-red-600 rounded-full transition-all duration-300"
                      style={{ width: `${yourPlayer.healthPercent}%` }}
                    ></div>
                    <div
                      className="h-4 bg-blue-600 rounded-full transition-all duration-300"
                      style={{ width: `${yourPlayer.manaPercent}%` }}
                    ></div>
                  </div>
                </div>

                {/* Buttons at the bottom */}
                <div className="flex flex-row justify-center gap-2 w-full p-3 text-black">
                  <button
                    onClick={() => handleMove("attack")}
                    disabled={Boolean(
                      gameState.myMove ||
                        gameOver ||
                        yourPlayer.mana < YOU.manaPerAttack
                    )}
                    className={`px-4 py-2 rounded-md ${
                      gameState.myMove ||
                      gameOver ||
                      yourPlayer.mana < YOU.manaPerAttack
                        ? "bg-gray-400"
                        : "bg-white hover:bg-blue-500 hover:text-white"
                    }`}
                  >
                    attack
                  </button>
                  <button
                    onClick={() => handleMove("dodge")}
                    disabled={Boolean(gameState.myMove || gameOver)}
                    className={`px-4 py-2 rounded-md ${
                      gameState.myMove || gameOver
                        ? "bg-gray-400"
                        : "bg-white hover:bg-blue-500 hover:text-white"
                    }`}
                  >
                    dodge
                  </button>
                  <button
                    onClick={() => handleMove("mana")}
                    disabled={Boolean(gameState.myMove || gameOver)}
                    className={`px-4 py-2 rounded-md ${
                      gameState.myMove || gameOver
                        ? "bg-gray-400"
                        : "bg-white hover:bg-blue-500 hover:text-white"
                    }`}
                  >
                    mana
                  </button>
                </div>
              </div>

              {/* Keep the overlay messages */}
              {gameState.myMove && !gameState.opponentMoved && (
                <div
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                              bg-black bg-opacity-50 text-white p-4 rounded"
                >
                  Waiting for opponent's move...
                </div>
              )}

              {gameOver && (
                <div
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                              bg-black bg-opacity-80 text-white p-8 rounded text-2xl z-50"
                >
                  {yourPlayer.gameOver !== "" &&
                  yourPlayer.gameOver === opponentPlayer.gameOver
                    ? "Draw!"
                    : gameOver === "win"
                    ? "You Won!"
                    : "You Lost!"}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default Battle;
