/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useEffect, useState, useRef } from "react";
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
  joinGame: (playerData: {
    imageUrl: string;
    name: string;
    baseDamage: number;
    health: number;
    tokenId: string;
  }) => void;
  makeMove: (data: { gameId: string; move: string }) => void;
}

interface ServerToClientEvents {
  gameStart: (data: {
    gameId: string;
    opponent: boolean;
    opponentData: {
      imageUrl: string;
      name: string;
      baseDamage: number;
      health: number;
      tokenId: string;
    };
  }) => void;
  waiting: () => void;
  opponentMoved: () => void;
  roundResult: (data: {
    yourMove: string;
    opponentMove: string;
    damageTo: string;
    manaGained: string[];
  }) => void;
}

// Update the interface for opponent data
interface OpponentData {
  imageUrl: string;
  name: string;
  baseDamage: number;
  health: number;
  tokenId: string;
}

/* eslint-disable react-hooks/exhaustive-deps */

// The useEffect dependencies are intentionally limited to prevent infinite loops
// and unnecessary re-renders. The other values are handled within the state updates.

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

  // Add state for damage animation
  const [showDamageAnimation, setShowDamageAnimation] = useState(false);
  const [damageTarget, setDamageTarget] = useState("");

  // Add state for mana gain animation
  const [showManaAnimation, setShowManaAnimation] = useState(false);
  const [manaGainTarget, setManaGainTarget] = useState("");

  // Add state for dodge animation
  const [showDodgeAnimation, setShowDodgeAnimation] = useState(false);
  const [dodgeTarget, setDodgeTarget] = useState("");

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

  // Update playerData state type
  const [playerData, setPlayerData] = useState<{
    imageUrl: string;
    name: string;
    baseDamage: number;
    health: number;
  } | null>(null);

  // Add opponent data state
  const [opponentData, setOpponentData] = useState<OpponentData | null>(null);

  // Add state for transaction status
  const [transactionStatus, setTransactionStatus] = useState<string>("");

  // Add this near the top of your Battle component
  const opponentDataRef = useRef<OpponentData | null>(null);

  // Add this state to track if a transaction is in progress
  const [isRecording, setIsRecording] = useState(false);

  // Add this state to track if we're waiting for transaction confirmation
  const [transactionTimeout, setTransactionTimeout] =
    useState<NodeJS.Timeout | null>(null);

  // Update the recordBattleResult function
  const recordBattleResult = async (
    winnerTokenId: string,
    loserTokenId: string
  ) => {
    if (isRecording) {
      console.log("Transaction already in progress, skipping...");
      return;
    }

    try {
      setIsRecording(true);
      console.log("Recording battle result:", { winnerTokenId, loserTokenId });
      setTransactionStatus("Recording battle result...");

      // Add retries for getting the transaction hash
      let retries = 3;
      let response;

      while (retries > 0) {
        response = await fetch("/api/recordBattle", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            winnerTokenId,
            loserTokenId,
          }),
        });

        const data = await response.json();
        console.log("Battle recording response:", data);

        if (data.success && data.transactionHash) {
          setTransactionStatus(
            `Battle recorded! Transaction: ${data.transactionHash}`
          );
          break;
        } else if (retries > 1) {
          // Wait 2 seconds before retrying
          await new Promise((resolve) => setTimeout(resolve, 2000));
          retries--;
        } else {
          setTransactionStatus(data.error || "Failed to get transaction hash");
          break;
        }
      }
    } catch (error) {
      console.error("Error recording battle:", error);
      setTransactionStatus(
        "Error recording battle: " + (error as Error).message
      );
    } finally {
      // Add a delay before allowing new transactions
      setTimeout(() => {
        setIsRecording(false);
      }, 5000);
    }
  };

  // Update the handleGameOver function with logging
  const handleGameOver = (result: "win" | "lose" | "draw") => {
    console.log("Game over:", { result });
    console.log("Current opponent data from ref:", opponentDataRef.current);
    setGameOver(result);

    if (result !== "draw") {
      const params = new URLSearchParams(window.location.search);
      const yourTokenId = params.get("tokenId");
      const opponentTokenId = opponentDataRef.current?.tokenId;

      console.log("Token IDs for battle recording:", {
        yourTokenId,
        opponentTokenId,
        fullOpponentData: opponentDataRef.current,
      });

      if (yourTokenId && opponentTokenId) {
        if (result === "win") {
          console.log("Recording win:", {
            winner: yourTokenId,
            loser: opponentTokenId,
          });
          recordBattleResult(yourTokenId, opponentTokenId);
        } else {
          console.log("Recording loss:", {
            winner: opponentTokenId,
            loser: yourTokenId,
          });
          recordBattleResult(opponentTokenId, yourTokenId);
        }
      } else {
        console.error("Missing token IDs:", {
          yourTokenId,
          opponentTokenId,
          opponentData: opponentDataRef.current,
          params: Object.fromEntries(params),
        });
      }
    }
  };

  // Modify useEffect to set initial player states from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const playerData = {
      imageUrl: params.get("imageUrl") || "",
      name: params.get("name") || "Unknown",
      baseDamage: parseInt(params.get("baseDamage") || "0"),
      health: parseInt(params.get("health") || "500"),
    };
    setPlayerData(playerData);

    // Set initial player states based on URL params
    setYourPlayer((prev) => ({
      ...prev,
      health: playerData.health,
      healthPercent: 100,
    }));

    // Update YOU constant with player data
    Object.assign(YOU, {
      health: playerData.health,
      damagePerAttack: playerData.baseDamage,
    });
  }, []);

  useEffect(() => {
    // Change to use wss:// for secure WebSocket connection
    const socketUrl = "wss://167.99.77.31:3006";
    const newSocket = io(socketUrl, {
      reconnection: true,
      secure: true,
      transports: ["websocket"], // Force WebSocket transport only
      rejectUnauthorized: false, // Allow self-signed certificates if you're using them
    });

    // Add error handling for connection issues
    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    // Select random blockmons for player and opponent
    const blockmons = [
      "Aquavaria",
      "Duskveil",
      "Marisoul",
      "Nocturnyx",
      "Luminox",
      "Ignisoul",
      "Golethorn",
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
      console.log("Game started with full data:", data);
      console.log("Opponent data received:", data.opponentData);

      setGameState({
        gameId: data.gameId,
        status: "playing",
        opponent: data.opponent,
        myMove: null,
        opponentMoved: false,
      });

      if (data.opponentData) {
        const opponentInfo = {
          imageUrl: data.opponentData.imageUrl,
          name: data.opponentData.name,
          baseDamage: data.opponentData.baseDamage,
          health: data.opponentData.health,
          tokenId: data.opponentData.tokenId,
        };

        console.log(
          "Setting opponent data with tokenId:",
          opponentInfo.tokenId
        );
        opponentDataRef.current = opponentInfo; // Store in ref
        setOpponentData(opponentInfo);

        setOpponentPlayer((prev) => ({
          ...prev,
          health: data.opponentData.health,
          healthPercent: 100,
        }));

        Object.assign(OPPONENT, {
          health: data.opponentData.health,
          damagePerAttack: data.opponentData.baseDamage,
        });
      }

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

      // Trigger dodge animation
      if (data.yourMove === "dodge") {
        setDodgeTarget("you");
        setShowDodgeAnimation(true);
        setTimeout(() => setShowDodgeAnimation(false), 2000);
      } else if (data.opponentMove === "dodge") {
        setDodgeTarget("opponent");
        setShowDodgeAnimation(true);
        setTimeout(() => setShowDodgeAnimation(false), 2000);
      }

      // Trigger damage animation
      if (data.damageTo === "you" || data.damageTo === "both") {
        setDamageTarget("you");
        setShowDamageAnimation(true);
        setTimeout(() => setShowDamageAnimation(false), 1500);
      } else if (data.damageTo === "opponent") {
        setDamageTarget("opponent");
        setShowDamageAnimation(true);
        setTimeout(() => setShowDamageAnimation(false), 1500);
      }

      // Trigger mana gain animation
      if (data.manaGained.includes("you")) {
        setManaGainTarget("you");
        setShowManaAnimation(true);
        setTimeout(() => setShowManaAnimation(false), 1500);
      } else if (data.manaGained.includes("opponent")) {
        setManaGainTarget("opponent");
        setShowManaAnimation(true);
        setTimeout(() => setShowManaAnimation(false), 1500);
      }

      setYourPlayer((prev) => {
        let newHealth = prev.health;
        let newMana = prev.mana;

        if (data.damageTo === "you" || data.damageTo === "both") {
          newHealth -=
            opponentDataRef.current?.baseDamage || OPPONENT.damagePerAttack;
        }

        // Handle mana changes
        if (data.manaGained.includes("you")) {
          newMana = Math.min(YOU.mana, newMana + YOU.manaPerGenerate);
        }
        if (data.yourMove === "attack") {
          newMana = Math.max(0, newMana - YOU.manaPerAttack);
        }

        newHealth = Math.max(0, newHealth);
        const playerGameOver = "";
        if (newHealth <= 0) {
          if (opponentPlayer.health <= 0) {
            handleGameOver("draw");
          } else {
            handleGameOver("lose");
          }
        }

        return {
          health: newHealth,
          mana: newMana,
          healthPercent: (newHealth / (playerData?.health || YOU.health)) * 100,
          manaPercent: (newMana / YOU.mana) * 100,
          gameOver: playerGameOver,
        };
      });

      setOpponentPlayer((prev) => {
        let newHealth = prev.health;
        let newMana = prev.mana;

        if (data.damageTo === "opponent" || data.damageTo === "both") {
          newHealth -= playerData?.baseDamage || YOU.damagePerAttack;
        }

        // Handle mana changes
        if (data.manaGained.includes("opponent")) {
          newMana = Math.min(OPPONENT.mana, newMana + OPPONENT.manaPerGenerate);
        }
        if (data.opponentMove === "attack") {
          newMana = Math.max(0, newMana - OPPONENT.manaPerAttack);
        }

        newHealth = Math.max(0, newHealth);
        const playerGameOver = "";
        if (newHealth <= 0) {
          if (yourPlayer.health <= 0) {
            handleGameOver("draw");
          } else {
            handleGameOver("win");
          }
        }

        return {
          health: newHealth,
          mana: newMana,
          healthPercent:
            (newHealth / (opponentData?.health || OPPONENT.health)) * 100,
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
    if (socket && playerData) {
      const params = new URLSearchParams(window.location.search);
      const tokenId = params.get("tokenId");
      socket.emit("joinGame", {
        ...playerData,
        tokenId: tokenId || "",
      });
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

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (transactionTimeout) {
        clearTimeout(transactionTimeout);
      }
    };
  }, [transactionTimeout]);

  return (
    <>
      <div
        className={`min-h-screen w-full bg-no-repeat bg-cover bg-center fixed inset-0 ${
          showDamageAnimation
            ? damageTarget === "you" || damageTarget === "both"
              ? "animate-damage-shake damage-overlay-you"
              : "animate-damage-shake damage-overlay-opponent"
            : ""
        }`}
        style={{
          backgroundImage:
            "url('/images/events/battle-theme/background-battle.gif')",
          imageRendering: "pixelated",
          backgroundSize: "100% 100%",
        }}
      >
        <div className="flex flex-col h-screen">
          {gameState.status === "idle" && (
            <div className="flex justify-center items-center h-screen">
              <button
                onClick={handleJoinGame}
                className="px-8 py-4 rounded pixelated font-bold uppercase text-xl bg-gray-700 text-white border-t-4 border-l-4  border-b-4 border-r-4 border-gray-900 hover:bg-gray-600"
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
                  <div className="text-white font-bold pixelated text-xs md:text-base mb-1">
                    {playerData?.name || "Player"}
                  </div>
                  <div className="flex items-center">
                    <span className="text-white mr-1 md:mr-2 font-bold pixelated text-xs md:text-base">
                      HP
                    </span>
                    <div className="flex-1 h-3 md:h-6 bg-gray-900 border-2 border-white p-[2px] pixelated">
                      <div
                        className="h-full bg-gradient-to-r from-red-700 to-red-500 transition-all duration-300"
                        style={{
                          width: `${yourPlayer.healthPercent}%`,
                          boxShadow: "0 0 4px #ff0000",
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-white mr-1 md:mr-2 font-bold pixelated text-xs md:text-base">
                      MP
                    </span>
                    <div className="flex-1 h-3 md:h-6 bg-gray-900 border-2 border-white p-[2px] pixelated">
                      <div
                        className="h-full bg-gradient-to-r from-blue-700 to-blue-500 transition-all duration-300"
                        style={{
                          width: `${yourPlayer.manaPercent}%`,
                          boxShadow: "0 0 4px #0000ff",
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
                      backgroundImage:
                        "url('/images/events/battle-theme/chatbox.png')",
                      backgroundSize: "100% 100%",
                      backgroundRepeat: "no-repeat",
                      imageRendering: "pixelated",
                      minHeight: "80px",
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
                  <div className="text-white font-bold pixelated text-xs md:text-base mb-1 text-right">
                    {opponentData?.name || "Opponent"}
                  </div>
                  <div className="flex items-center">
                    <div className="flex-1 h-3 md:h-6 bg-gray-900 border-2 border-white p-[2px] pixelated">
                      <div
                        className="h-full bg-gradient-to-r from-red-700 to-red-500 transition-all duration-300"
                        style={{
                          width: `${opponentPlayer.healthPercent}%`,
                          boxShadow: "0 0 4px #ff0000",
                        }}
                      ></div>
                    </div>
                    <span className="text-white ml-1 md:ml-2 font-bold pixelated text-xs md:text-base">
                      HP
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div className="flex-1 h-3 md:h-6 bg-gray-900 border-2 border-white p-[2px] pixelated">
                      <div
                        className="h-full bg-gradient-to-r from-blue-700 to-blue-500 transition-all duration-300"
                        style={{
                          width: `${opponentPlayer.manaPercent}%`,
                          boxShadow: "0 0 4px #0000ff",
                        }}
                      ></div>
                    </div>
                    <span className="text-white ml-1 md:ml-2 font-bold pixelated text-xs md:text-base">
                      MP
                    </span>
                  </div>
                </div>
              </div>

              {/* Combat Log in the middle of the page - Mobile only */}
              <div className="md:hidden absolute top-[40%] left-1/2 -translate-x-1/2 w-[80%] flex flex-col items-center justify-center overflow-auto text-white z-30">
                <div
                  className="w-full h-full flex flex-col items-center justify-center pixelated relative"
                  style={{
                    backgroundImage:
                      "url('/images/events/battle-theme/chatbox.png')",
                    backgroundSize: "100% 100%",
                    backgroundRepeat: "no-repeat",
                    imageRendering: "pixelated",
                    minHeight: "50px",
                    padding: "8px",
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
                        : "bg-gray-700 text-white border-t-1 border-l-1  border-b-1 border-r-1 border-gray-900 hover:bg-gray-600"
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
                        : "bg-gray-700 text-white border-t-1 border-l-1  border-b-1 border-r-1 border-gray-900 hover:bg-gray-600"
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
                        : "bg-gray-700 text-white border-t-1 border-l-1  border-b-1 border-r-1 border-gray-900 hover:bg-gray-600"
                    }`}
                  >
                    Mana
                  </button>
                </div>

                {/* Mobile layout for players */}
                <div className="md:hidden w-1/2 relative">
                  {/* Player avatar on ground */}
                  <div className="absolute bottom-[5%] left-1/2 -translate-x-1/2">
                    <div
                      className={`relative ${
                        showManaAnimation && manaGainTarget === "you"
                          ? "mana-sparkle"
                          : ""
                      } ${
                        showDodgeAnimation && dodgeTarget === "you"
                          ? "dodge-effect"
                          : ""
                      }`}
                    >
                      <Image
                        src={
                          playerData?.imageUrl ||
                          `/blockmon/${playerBlockmon}.gif`
                        }
                        alt="Player Blockmon"
                        width={160}
                        height={160}
                        className="w-24 h-24 object-contain"
                        style={{
                          imageRendering: "pixelated",
                          filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.5))",
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="md:hidden w-1/2 relative">
                  {/* Opponent avatar on ground */}
                  <div className="absolute bottom-[5%] left-1/2 -translate-x-1/2">
                    <div
                      className={`relative ${
                        showManaAnimation && manaGainTarget === "opponent"
                          ? "mana-sparkle"
                          : ""
                      } ${
                        showDodgeAnimation && dodgeTarget === "opponent"
                          ? "dodge-effect"
                          : ""
                      }`}
                    >
                      <Image
                        src={
                          opponentData?.imageUrl ||
                          `/blockmon/${opponentBlockmon}.gif`
                        }
                        alt="Opponent Blockmon"
                        width={160}
                        height={160}
                        className="w-24 h-24 object-contain"
                        style={{
                          imageRendering: "pixelated",
                          filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.5))",
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Desktop layout for players - Original positioning */}
                <div className="hidden md:block absolute bottom-[-10%] left-[15%]">
                  <div
                    className={`relative ${
                      showManaAnimation && manaGainTarget === "you"
                        ? "mana-sparkle"
                        : ""
                    } ${
                      showDodgeAnimation && dodgeTarget === "you"
                        ? "dodge-effect"
                        : ""
                    }`}
                  >
                    <Image
                      src={
                        playerData?.imageUrl ||
                        `/blockmon/${playerBlockmon}.gif`
                      }
                      alt="Player Blockmon"
                      width={160}
                      height={160}
                      className="w-40 h-40 object-contain"
                      style={{
                        imageRendering: "pixelated",
                        filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.5))",
                      }}
                    />
                  </div>
                </div>

                <div className="hidden md:block absolute bottom-[-10%] right-[15%]">
                  <div
                    className={`relative ${
                      showManaAnimation && manaGainTarget === "opponent"
                        ? "mana-sparkle"
                        : ""
                    } ${
                      showDodgeAnimation && dodgeTarget === "opponent"
                        ? "dodge-effect"
                        : ""
                    }`}
                  >
                    <Image
                      src={
                        opponentData?.imageUrl ||
                        `/blockmon/${opponentBlockmon}.gif`
                      }
                      alt="Opponent Blockmon"
                      width={160}
                      height={160}
                      className="w-40 h-40 object-contain"
                      style={{
                        imageRendering: "pixelated",
                        filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.5))",
                      }}
                    />
                  </div>
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
                      : "bg-gray-700 text-white border-t-2 border-l-2  border-b-2 border-r-2 border-gray-900 hover:bg-gray-600"
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
                      : "bg-gray-700 text-white border-t-2 border-l-2  border-b-2 border-r-2 border-gray-900 hover:bg-gray-600"
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
                      : "bg-gray-700 text-white border-t-2 border-l-2  border-b-2 border-r-2 border-gray-900 hover:bg-gray-600"
                  }`}
                >
                  Mana
                </button>
              </div>

              {/* Responsive overlay messages */}
              {gameState.myMove && !gameState.opponentMoved && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pixelated z-40">
                  <div className="bg-gray-900 border-4 border-t-gray-700 border-l-gray-700 border-b-gray-950 border-r-gray-950 p-4 md:p-6 rounded-lg">
                    <div className="text-center text-sm md:text-xl font-bold text-white animate-pulse">
                      Waiting for opponent&apos;s move...
                    </div>
                    <div className="flex justify-center mt-3 space-x-1">
                      <div
                        className="w-2 h-2 md:w-3 md:h-3 bg-white rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      ></div>
                      <div
                        className="w-2 h-2 md:w-3 md:h-3 bg-white rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      ></div>
                      <div
                        className="w-2 h-2 md:w-3 md:h-3 bg-white rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}

              {gameOver && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pixelated z-50">
                  <div
                    className={`bg-gray-900 border-4 md:border-8 ${
                      gameOver === "win"
                        ? "border-yellow-500"
                        : "border-red-700"
                    } p-4 md:p-8 rounded-lg shadow-lg`}
                  >
                    <div
                      className={`text-center text-xl md:text-3xl font-bold ${
                        gameOver === "win" ? "text-yellow-400" : "text-red-500"
                      }`}
                    >
                      {gameOver === "draw"
                        ? "DRAW!"
                        : gameOver === "win"
                        ? "YOU WON!"
                        : "YOU LOST!"}
                    </div>
                    {gameOver !== "draw" && (
                      <div className="mt-2 text-sm text-gray-300 break-all">
                        {transactionStatus}
                      </div>
                    )}
                    {gameOver === "win" && (
                      <div className="mt-2 md:mt-4 flex justify-center">
                        <div className="text-yellow-300 text-lg md:text-xl">
                          ★ ★ ★
                        </div>
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

        /* Damage animation styles */
        @keyframes shake {
          0% {
            transform: translate(0, 0) rotate(0deg);
          }
          10% {
            transform: translate(-5px, -5px) rotate(-1deg);
          }
          20% {
            transform: translate(5px, -5px) rotate(1deg);
          }
          30% {
            transform: translate(-5px, 5px) rotate(0deg);
          }
          40% {
            transform: translate(5px, 5px) rotate(1deg);
          }
          50% {
            transform: translate(-5px, -5px) rotate(-1deg);
          }
          60% {
            transform: translate(5px, -5px) rotate(0deg);
          }
          70% {
            transform: translate(-5px, 5px) rotate(-1deg);
          }
          80% {
            transform: translate(-5px, -5px) rotate(1deg);
          }
          90% {
            transform: translate(5px, 5px) rotate(0deg);
          }
          100% {
            transform: translate(0, 0) rotate(0deg);
          }
        }

        .animate-damage-shake {
          animation: shake 1.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }

        .damage-overlay-you::after {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 0, 0, 0.3);
          pointer-events: none;
          animation: fadeOut 1.5s forwards;
        }

        .damage-overlay-opponent::after {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 0, 0, 0.3);
          pointer-events: none;
          animation: fadeOut 1.5s forwards;
        }

        @keyframes fadeOut {
          0% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }

        /* Mana gain animation styles */
        @keyframes sparkle {
          0%,
          100% {
            box-shadow: 0 0 10px 5px rgba(0, 100, 255, 0.4);
          }
          50% {
            box-shadow: 0 0 20px 10px rgba(0, 150, 255, 0.7);
          }
        }

        .mana-sparkle::before {
          content: "";
          position: absolute;
          top: -10px;
          left: -10px;
          right: -10px;
          bottom: -10px;
          border-radius: 50%;
          background: radial-gradient(
            circle,
            rgba(0, 200, 255, 0.2) 0%,
            rgba(0, 100, 255, 0) 70%
          );
          animation: sparkle 1.5s ease-in-out infinite;
          z-index: -1;
        }

        .mana-sparkle::after {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cstyle%3E@keyframes float %7B 0%25 %7B opacity: 0; transform: translateY(0) scale(0.5); %7D 50%25 %7B opacity: 1; %7D 100%25 %7B opacity: 0; transform: translateY(-20px) scale(1); %7D %7D .particle %7B animation: float 1s infinite ease-out; %7D .p1 %7B animation-delay: 0.1s; %7D .p2 %7B animation-delay: 0.3s; %7D .p3 %7B animation-delay: 0.5s; %7D .p4 %7B animation-delay: 0.7s; %7D .p5 %7B animation-delay: 0.9s; %7D%3C/style%3E%3Ccircle class='particle p1' cx='20' cy='50' r='2' fill='%230088ff'/%3E%3Ccircle class='particle p2' cx='40' cy='60' r='2' fill='%230088ff'/%3E%3Ccircle class='particle p3' cx='60' cy='30' r='2' fill='%230088ff'/%3E%3Ccircle class='particle p4' cx='80' cy='70' r='2' fill='%230088ff'/%3E%3Ccircle class='particle p5' cx='50' cy='40' r='2' fill='%230088ff'/%3E%3C/svg%3E")
            center/cover no-repeat;
          pointer-events: none;
          z-index: 10;
          opacity: 0.8;
          animation: fadeOut 1.5s forwards;
        }

        /* Dodge animation styles */
        @keyframes dodge {
          0%,
          100% {
            opacity: 1;
          }
          25%,
          75% {
            opacity: 0.2;
          }
          50% {
            opacity: 0;
          }
        }

        .dodge-effect {
          animation: dodge 2s ease-in-out;
          position: relative;
        }

        .dodge-effect::before {
          content: "";
          position: absolute;
          top: -5px;
          left: -5px;
          right: -5px;
          bottom: -5px;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          z-index: -1;
          animation: pulse 2s ease-in-out;
        }

        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 0;
          }
          50% {
            transform: scale(1.5);
            opacity: 0.5;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }
      `}</style>
    </>
  );
}

export default Battle;
