"use client";

import React, { useRef, useState, useEffect } from "react";
import * as tf from "@tensorflow/tfjs";
import * as handpose from "@tensorflow-models/handpose";
import "@tensorflow/tfjs-backend-webgl";
import { useSearchParams } from "next/navigation";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { Eip1193Provider, ethers } from "ethers";
import Blockmon from "@/contract/BlockmonV2.json";
import Image from "next/image";
import { toast } from "sonner";

// Contract address
const CONTRACT_ADDRESS = "0x577B2aE96f4719bD64cE51f762AECF91126081D3";

// Define Pokemon interface
interface Pokemon {
  id: number;
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  type: string;
  image: string;
  owner: string;
  moves: string[];
}

interface DeviceData {
  tokenId: string;
  joined: boolean;
  gesture?: string;
}

interface BattleData {
  code: string;
  deviceA: DeviceData;
  deviceB: DeviceData;
}

function MultiplayerGame() {
  const searchParams = useSearchParams();
  const { address, isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider("eip155");
  const videoRef = useRef<HTMLVideoElement>(null);
  const [model, setModel] = useState<handpose.HandPose | null>(null);
  const [gesture, setGesture] = useState<string>("");
  const [pokemon, setPokemon] = useState<Pokemon | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const device = searchParams.get("device")?.toUpperCase() || "";

  // Add new state variables for game flow
  const [gameState, setGameState] = useState<
    "joining" | "waiting" | "playing" | "selecting" | "countdown" | "result"
  >("joining");
  const [inputGameCode, setInputGameCode] = useState<string>("");
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);
  const [previousGesture, setPreviousGesture] = useState<string>("");
  const [gestureConfidence, setGestureConfidence] = useState<number>(0);
  const [myGesture, setMyGesture] = useState<string | null>(null);
  const [opponentGesture, setOpponentGesture] = useState<string | null>(null);
  const [result, setResult] = useState<string>("");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [selectionTimer, setSelectionTimer] = useState<number | null>(null);
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [myScore, setMyScore] = useState<number>(0);
  const [opponentScore, setOpponentScore] = useState<number>(0);
  const [isFinalResult, setIsFinalResult] = useState<boolean>(false);

  // Function to join a game with a code
  const joinGame = async () => {
    if (!inputGameCode.trim()) {
      setError("Please enter a game code");
      return;
    }

    if (!isConnected || !walletProvider) {
      setError("Please connect your wallet first");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      // Fetch current battle data
      console.log("Fetching battle.json...");
      const response = await fetch("/battle.json");
      const battleData: BattleData = await response.json();
      console.log("Current battle.json data:", {
        battleData,
        device,
        inputGameCode: inputGameCode.trim(),
      });

      if (battleData.code !== inputGameCode.trim()) {
        console.log("Code mismatch:", {
          expected: battleData.code,
          received: inputGameCode.trim(),
        });
        setError("Invalid game code");
        setIsLoading(false);
        return;
      }

      // Check if this device can join
      const deviceData =
        device === "A" ? battleData.deviceA : battleData.deviceB;
      const otherDeviceData =
        device === "A" ? battleData.deviceB : battleData.deviceA;

      console.log("Checking device slots:", {
        device,
        deviceData,
        otherDeviceData,
      });

      // Check if the slot is already joined
      if (deviceData.joined) {
        setError("This device slot is already taken");
        setIsLoading(false);
        return;
      }

      // Update battle.json with joined status
      const updatedBattleData = {
        ...battleData,
        [device === "A" ? "deviceA" : "deviceB"]: {
          ...deviceData,
          joined: true,
        },
      };

      // Save updated battle data
      const saveResponse = await fetch("/api/battle/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedBattleData),
      });

      if (!saveResponse.ok) {
        throw new Error("Failed to update battle data");
      }

      // Always go to waiting state first
      setGameState("waiting");
      startPolling();
      setIsLoading(false);
    } catch (error) {
      console.error("Error joining game:", error);
      setError("Failed to join the game. Please try again.");
      setIsLoading(false);
    }
  };

  // Function to start polling for opponent
  const startPolling = () => {
    if (pollInterval) return;

    console.log("Starting to poll for opponent...");
    const interval = setInterval(async () => {
      try {
        console.log("Polling battle.json...");
        const response = await fetch("/battle.json");
        const battleData: BattleData = await response.json();
        console.log("Poll result:", battleData);

        const deviceData =
          device === "A" ? battleData.deviceA : battleData.deviceB;
        const otherDeviceData =
          device === "A" ? battleData.deviceB : battleData.deviceA;

        // Check if both players have joined
        if (deviceData.joined && otherDeviceData.joined) {
          console.log("Both players ready:", {
            deviceA: battleData.deviceA,
            deviceB: battleData.deviceB,
          });
          clearInterval(interval);
          setPollInterval(null);
          setGameState("playing");
          loadBattleAndPokemonData(battleData);
        } else if (!deviceData.joined) {
          // If our slot is not joined, we got disconnected
          console.log("Lost connection - no longer joined");
          clearInterval(interval);
          setPollInterval(null);
          setGameState("joining");
          setError("Lost connection to the game");
        } else {
          console.log("Still waiting for opponent to join...");
        }
      } catch (error) {
        console.error("Error polling for opponent:", error);
      }
    }, 2000);

    setPollInterval(interval);
  };

  // Function to load battle and pokemon data
  const loadBattleAndPokemonData = async (battleData: BattleData) => {
    if (!isConnected || !walletProvider) {
      setError("Please connect your wallet first");
      setIsLoading(false);
      return;
    }

    try {
      // Get the correct token ID based on device parameter
      const deviceData =
        device === "A" ? battleData.deviceA : battleData.deviceB;
      if (!deviceData.tokenId) {
        setError("Invalid device parameter or battle data");
        setIsLoading(false);
        return;
      }

      // Get pokemon data from blockchain
      const provider = new ethers.BrowserProvider(
        walletProvider as Eip1193Provider
      );
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        Blockmon.abi,
        signer
      );

      const pokemonData = await contract.getPokemon(deviceData.tokenId);

      // Convert blockchain data to Pokemon interface
      const pokemonObj: Pokemon = {
        id: Number(deviceData.tokenId),
        name: pokemonData.pokemonData.name,
        level: pokemonData.pokemonData.level,
        hp: Number(pokemonData.pokemonData.hp),
        maxHp: Number(pokemonData.pokemonData.hp),
        type: getTypeFromAttribute(pokemonData.pokemonData.attribute),
        image: pokemonData.uri,
        owner: pokemonData.owner,
        moves: generateMovesForType(
          getTypeFromAttribute(pokemonData.pokemonData.attribute)
        ),
      };

      setPokemon(pokemonObj);
      setGameState("playing");
      setCountdown(3);
      setupCamera();
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading battle data:", error);
      setError("Failed to load battle data and pokemon");
      setIsLoading(false);
    }
  };

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
        setPollInterval(null);
      }
    };
  }, [pollInterval]);

  // Load battle data and pokemon
  useEffect(() => {
    const loadBattleData = async () => {
      if (!isConnected || !walletProvider) {
        setError("Please connect your wallet first");
        setIsLoading(false);
        return;
      }

      try {
        // Fetch battle data from battle.json
        const response = await fetch("/battle.json");
        const battleData: BattleData = await response.json();

        // Get the correct token ID based on device parameter
        const deviceData =
          device === "A" ? battleData.deviceA : battleData.deviceB;
        if (!deviceData.tokenId) {
          setError("Invalid device parameter or battle data");
          setIsLoading(false);
          return;
        }

        // Get pokemon data from blockchain
        const provider = new ethers.BrowserProvider(
          walletProvider as Eip1193Provider
        );
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          Blockmon.abi,
          signer
        );

        const pokemonData = await contract.getPokemon(deviceData.tokenId);

        // Convert blockchain data to Pokemon interface
        const pokemonObj: Pokemon = {
          id: Number(deviceData.tokenId),
          name: pokemonData.pokemonData.name,
          level: pokemonData.pokemonData.level,
          hp: Number(pokemonData.pokemonData.hp),
          maxHp: Number(pokemonData.pokemonData.hp),
          type: getTypeFromAttribute(pokemonData.pokemonData.attribute),
          image: pokemonData.uri,
          owner: pokemonData.owner,
          moves: generateMovesForType(
            getTypeFromAttribute(pokemonData.pokemonData.attribute)
          ),
        };

        setPokemon(pokemonObj);
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading battle data:", error);
        setError("Failed to load battle data and pokemon");
        setIsLoading(false);
      }
    };

    loadBattleData();
  }, [device, isConnected, walletProvider]);

  // Helper function to get type string from attribute number
  const getTypeFromAttribute = (attribute: number): string => {
    const types = [
      "Fire",
      "Water",
      "Plant",
      "Electric",
      "Earth",
      "Air",
      "Light",
      "Dark",
    ];
    return types[attribute] || "Unknown";
  };

  // Helper function to generate moves based on type
  const generateMovesForType = (type: string): string[] => {
    const movesByType: { [key: string]: string[] } = {
      Fire: ["Flamethrower", "Fire Blast", "Inferno", "Heat Wave"],
      Water: ["Hydro Pump", "Aqua Jet", "Surf", "Water Pulse"],
      Plant: ["Solar Beam", "Leaf Storm", "Giga Drain", "Petal Dance"],
      Electric: ["Thunder", "Volt Tackle", "Thunderbolt", "Spark"],
      Earth: ["Earthquake", "Rock Slide", "Magnitude", "Sand Tomb"],
      Air: ["Air Slash", "Hurricane", "Sky Attack", "Aerial Ace"],
      Light: ["Flash Cannon", "Solar Beam", "Aurora Beam", "Dazzling Gleam"],
      Dark: ["Dark Pulse", "Shadow Ball", "Night Slash", "Shadow Claw"],
      Unknown: ["Tackle", "Quick Attack", "Slam", "Take Down"],
    };
    return movesByType[type] || movesByType.Unknown;
  };

  // Load the handpose model
  useEffect(() => {
    const loadModel = async () => {
      try {
        await tf.ready();
        const loadedModel = await handpose.load();
        setModel(loadedModel);
        console.log("Handpose model loaded");
      } catch (err) {
        console.error("Error loading handpose model:", err);
        setError(
          "Failed to load hand detection model. Please try again or use manual selection."
        );
      }
    };
    loadModel();
  }, []);

  // Setup camera with the correct configuration
  const setupCamera = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        console.log("Requesting camera access...");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.style.display = "block";
          console.log("Camera set up successfully");
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError(
          "Could not access your camera. Please allow camera access to play."
        );
      }
    } else {
      setError(
        "Your browser doesn't support camera access. Please try a different browser."
      );
    }
  };

  // Initialize camera when entering selecting state
  useEffect(() => {
    if (gameState === "selecting") {
      setupCamera();
    }

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        const tracks = stream.getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, [gameState]);

  // Detect hand gestures
  useEffect(() => {
    if (!model || !videoRef.current || gameState !== "selecting") return;

    let lastDetectionTime = Date.now();
    const TIMEOUT_DURATION = 500;
    let animationFrameId: number;

    const detectHandGesture = async () => {
      if (videoRef.current && model) {
        if (
          videoRef.current.readyState === 4 &&
          videoRef.current.videoWidth > 0 &&
          videoRef.current.videoHeight > 0
        ) {
          try {
            const predictions = await model.estimateHands(videoRef.current);

            if (predictions.length === 0) {
              if (Date.now() - lastDetectionTime > TIMEOUT_DURATION) {
                setGesture("unknown");
              }
            } else {
              lastDetectionTime = Date.now();
              const fingers = predictions[0].landmarks;

              // Check finger extension using correct landmarks
              const isThumbExtended = fingers[4][1] < fingers[2][1]; // Tip vs MCP
              const isIndexExtended = fingers[8][1] < fingers[6][1]; // Tip vs PIP
              const isMiddleExtended = fingers[12][1] < fingers[10][1]; // Tip vs PIP
              const isRingExtended = fingers[16][1] < fingers[14][1]; // Tip vs PIP
              const isPinkyExtended = fingers[20][1] < fingers[18][1]; // Tip vs PIP

              // Determine gesture with more precise checks
              if (
                isIndexExtended &&
                isMiddleExtended &&
                !isRingExtended &&
                !isPinkyExtended
              ) {
                setGesture("scissors");
              } else if (
                isIndexExtended &&
                isMiddleExtended &&
                isRingExtended &&
                isPinkyExtended
              ) {
                setGesture("paper");
              } else if (
                !isIndexExtended &&
                !isMiddleExtended &&
                !isRingExtended &&
                !isPinkyExtended
              ) {
                setGesture("rock");
              } else {
                setGesture("unknown");
              }
            }
          } catch (error) {
            console.error("Error in hand detection:", error);
            setGesture("unknown");
          }
        }
        animationFrameId = requestAnimationFrame(detectHandGesture);
      }
    };

    detectHandGesture();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [model, gameState]);

  // Update the 5-second gesture selection timer
  useEffect(() => {
    if (selectionTimer === null || gameState !== "selecting") return;

    if (selectionTimer > 0) {
      const timer = setTimeout(() => {
        setSelectionTimer(selectionTimer - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else {
      // When timer reaches 0, force submit the current gesture or default to "rock"
      const finalGesture = gesture && gesture !== "unknown" ? gesture : "rock";
      console.log("Timer ended, submitting gesture:", finalGesture);
      submitGesture(finalGesture);
      setGameState("waiting"); // Set to waiting while we wait for opponent
    }
  }, [selectionTimer, gesture, gameState]);

  // Update the gesture submission function
  const submitGesture = async (gesture: string) => {
    try {
      console.log("Submitting gesture:", gesture);
      setMyGesture(gesture);

      // Get current battle data
      const response = await fetch("/battle.json");
      const battleData: BattleData = await response.json();

      // Update the gesture for the current device
      const updatedBattleData = {
        ...battleData,
        [device === "A" ? "deviceA" : "deviceB"]: {
          ...battleData[device === "A" ? "deviceA" : "deviceB"],
          gesture: gesture,
        },
      };

      // Save updated battle data
      await fetch("/api/battle/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedBattleData),
      });

      // Start polling for opponent's gesture
      startGesturePolling();
    } catch (error) {
      console.error("Error submitting gesture:", error);
      setError("Failed to submit your gesture. Please try again.");
    }
  };

  // Update the gesture polling function
  const startGesturePolling = () => {
    if (pollInterval) {
      clearInterval(pollInterval);
    }

    console.log("Starting gesture polling...");
    const interval = setInterval(async () => {
      try {
        const response = await fetch("/battle.json");
        const battleData: BattleData = await response.json();

        const myData = device === "A" ? battleData.deviceA : battleData.deviceB;
        const opponentData =
          device === "A" ? battleData.deviceB : battleData.deviceA;

        console.log("Polling gestures:", {
          myGesture: myData.gesture,
          opponentGesture: opponentData.gesture,
        });

        if (myData.gesture && opponentData.gesture) {
          // Both players have submitted gestures
          console.log("Both gestures submitted, determining winner...");
          clearInterval(interval);
          setPollInterval(null);
          setOpponentGesture(opponentData.gesture);
          determineWinner(myData.gesture, opponentData.gesture);
        }
      } catch (error) {
        console.error("Error polling for gestures:", error);
      }
    }, 1000);

    setPollInterval(interval);
  };

  // Countdown timer for gameplay
  useEffect(() => {
    if (countdown === null || gameState !== "playing") return;

    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else {
      // When countdown reaches 0, start the 5-second gesture selection phase
      setGameState("selecting");
      setSelectionTimer(5);
    }
  }, [countdown, gameState]);

  // Add auto-submit effect for consistent gestures
  useEffect(() => {
    // If we've detected the same gesture consistently for more than 1.5 seconds during selection phase
    if (gameState === "selecting" && gesture !== "unknown") {
      const autoSubmitTimer = setTimeout(() => {
        if (gesture === previousGesture && gesture !== "unknown") {
          console.log("Auto-submitting stable gesture:", gesture);
          submitGesture(gesture);
        }
      }, 1500); // 1.5 seconds of the same gesture triggers auto-submit

      return () => clearTimeout(autoSubmitTimer);
    }
  }, [gesture, previousGesture, gameState]);

  // Update the determineWinner function
  const determineWinner = (myGesture: string, opponentGesture: string) => {
    console.log("Determining winner:", { myGesture, opponentGesture });
    let resultMessage = "";

    if (myGesture === opponentGesture) {
      resultMessage = "It's a tie!";
    } else if (
      (myGesture === "rock" && opponentGesture === "scissors") ||
      (myGesture === "scissors" && opponentGesture === "paper") ||
      (myGesture === "paper" && opponentGesture === "rock")
    ) {
      resultMessage = "You win!";
    } else {
      resultMessage = "You lose!";
    }

    console.log("Result determined:", resultMessage);
    setResult(resultMessage);
    setGameState("result");
  };

  // Simplify the play again function
  const playAgain = () => {
    setGameState("joining");
    setInputGameCode("");
    setMyGesture(null);
    setOpponentGesture(null);
    setResult("");
    setGesture("");
    setPreviousGesture("");
  };

  // Add recordBattleWin function
  const recordBattleWin = async () => {
    if (!isConnected || !walletProvider || !pokemon) return;

    try {
      const provider = new ethers.BrowserProvider(
        walletProvider as Eip1193Provider
      );
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        Blockmon.abi,
        signer
      );

      // Get opponent's token ID from battle data
      const response = await fetch("/battle.json");
      const battleData: BattleData = await response.json();
      const opponentData =
        device === "A" ? battleData.deviceB : battleData.deviceA;

      const winnerTokenId = pokemon.id;
      const loserTokenId = Number(opponentData.tokenId);
      const experienceGained = 10;

      // Call the contract function
      const tx = await contract.recordBattleWin(
        winnerTokenId,
        loserTokenId,
        experienceGained
      );
      await tx.wait();

      toast.success("Battle win recorded! Experience gained: 10");
    } catch (error) {
      console.error("Error recording battle win:", error);
      toast.error("Failed to record battle win");
    }
  };

  if (!device || (device !== "A" && device !== "B")) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <p>Invalid device parameter. Please use ?device=A or ?device=B</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
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
        <h1 className="text-4xl font-bold mb-6 text-white font-retro tracking-wide text-center text-shadow-glow">
          Battle Arena - Device {device}
        </h1>

        {error && (
          <div className="bg-red-900/40 backdrop-blur-md border border-red-500/30 text-red-200 p-4 mb-6 w-full max-w-4xl mx-auto rounded-lg">
            <p className="font-pixel tracking-wide">{error}</p>
          </div>
        )}

        {gameState === "joining" && (
          <div className="bg-black/40 backdrop-blur-md rounded-xl shadow-lg overflow-hidden border border-white/10 max-w-md mx-auto p-6">
            <h2 className="text-2xl font-bold text-white mb-6 text-center font-retro tracking-wide uppercase">
              Join Battle
            </h2>
            <div className="mb-4">
              <label className="block text-white mb-2 font-pixel tracking-wide">
                Battle Code
              </label>
              <input
                type="text"
                value={inputGameCode}
                onChange={(e) => setInputGameCode(e.target.value.toUpperCase())}
                className="w-full p-2 bg-gray-900/50 border border-blue-500/30 rounded mb-4 text-white font-mono tracking-wider"
                placeholder="Enter battle code"
                maxLength={6}
              />
            </div>
            <button
              onClick={joinGame}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 font-retro tracking-wide uppercase"
            >
              {isLoading ? "Joining..." : "Join Battle"}
            </button>
          </div>
        )}

        {gameState === "waiting" && (
          <div className="bg-black/40 backdrop-blur-md rounded-xl shadow-lg overflow-hidden border border-white/10 max-w-md mx-auto p-6 text-center">
            <h2 className="text-2xl font-bold text-white mb-4 font-retro tracking-wide uppercase">
              Waiting for opponent
            </h2>
            <div className="text-4xl font-mono tracking-wider bg-gray-900/50 p-4 rounded-lg mb-4 text-yellow-400 border border-yellow-500/30">
              {inputGameCode}
            </div>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mt-6"></div>
            <button
              onClick={() => {
                if (pollInterval) {
                  clearInterval(pollInterval);
                  setPollInterval(null);
                }
                setGameState("joining");
                setInputGameCode("");
              }}
              className="mt-6 px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 font-pixel tracking-wide"
            >
              Cancel
            </button>
          </div>
        )}

        {countdown !== null && gameState === "playing" && (
          <div className="text-center mb-8">
            <div className="text-2xl font-semibold mb-2 text-white font-retro tracking-wide">
              Get Ready!
            </div>
            <div className="text-8xl font-bold text-blue-400 mb-4 font-retro tracking-wide text-shadow-glow animate-pulse">
              {countdown === 0 ? "GO!" : countdown}
            </div>
            <div className="bg-yellow-900/40 backdrop-blur-md border border-yellow-500/30 p-4 rounded-lg max-w-xl mx-auto">
              <p className="text-yellow-200 font-pixel tracking-wide">
                <span className="font-bold">Next:</span> You'll have 5 seconds
                to show your rock, paper, or scissors gesture to the camera.
              </p>
              <p className="text-yellow-200/80 text-sm mt-2 font-pixel tracking-wide">
                Make sure your hand is clearly visible in the video feed!
              </p>
            </div>
          </div>
        )}

        {gameState === "selecting" && (
          <div className="w-full max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Pokemon Display */}
              {pokemon && (
                <div className="w-full md:w-1/3 bg-black/40 backdrop-blur-md rounded-xl shadow-lg overflow-hidden border border-white/10 p-6">
                  <div className="relative w-full h-48 mb-4 bg-white/5 rounded-lg">
                    <Image
                      src={pokemon.image || ""}
                      alt={pokemon.name}
                      layout="fill"
                      objectFit="contain"
                      className="rounded-lg"
                    />
                  </div>
                  <h2 className="text-2xl font-bold mb-2 text-white font-retro tracking-wide uppercase">
                    {pokemon.name}
                  </h2>
                  <div className="mb-4">
                    <p className="text-blue-300 font-pixel tracking-wide">
                      Level {pokemon.level}
                    </p>
                    <p className="text-blue-300 font-pixel tracking-wide">
                      Type: {pokemon.type}
                    </p>
                    <div className="mt-2">
                      <div className="text-sm text-gray-300 font-pixel tracking-wide">
                        HP
                      </div>
                      <div className="w-full h-3 bg-gray-900 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-500 to-emerald-400"
                          style={{
                            width: `${(pokemon.hp / pokemon.maxHp) * 100}%`,
                          }}
                        ></div>
                      </div>
                      <div className="text-right text-sm text-gray-300 font-pixel tracking-wide">
                        {pokemon.hp}/{pokemon.maxHp}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {pokemon.moves.map((move, index) => (
                      <div
                        key={index}
                        className="bg-gray-900/50 p-2 rounded text-sm font-medium text-blue-300 font-pixel tracking-wide border border-blue-500/30"
                      >
                        {move}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Camera and Gesture Detection */}
              <div className="w-full md:w-2/3">
                <div className="relative mb-6">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-[480px] border-4 rounded-lg object-cover shadow-xl"
                    style={{
                      borderColor: "#ef4444",
                      backgroundColor: "#000",
                    }}
                  />

                  {gesture && gesture !== "unknown" && (
                    <div className="absolute top-2 left-2 bg-blue-900/90 backdrop-blur-md text-white px-4 py-2 rounded-lg text-lg font-bold shadow-lg border-2 border-blue-500/50">
                      Detected:{" "}
                      <span className="text-yellow-300 font-retro tracking-wide">
                        {gesture.toUpperCase()}
                      </span>
                    </div>
                  )}

                  {selectionTimer !== null && (
                    <div className="absolute top-2 right-2 bg-red-900/90 backdrop-blur-md text-white px-4 py-2 rounded-full text-xl font-bold shadow-lg border-2 border-red-500/50 font-retro tracking-wide">
                      {selectionTimer}s
                    </div>
                  )}

                  <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-md text-white p-3 text-center text-lg font-semibold border-t-2 border-yellow-500/30">
                    <span className="font-pixel tracking-wide">
                      Show your rock, paper, or scissors gesture to the camera!
                    </span>
                  </div>

                  {videoRef.current && !videoRef.current.srcObject && (
                    <button
                      onClick={setupCamera}
                      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-900/90 backdrop-blur-md hover:bg-red-800 text-white px-6 py-3 rounded-lg font-bold text-lg shadow-lg border-2 border-red-500/50 font-retro tracking-wide"
                    >
                      Enable Camera
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {gameState === "result" && (
          <div className="bg-black/40 backdrop-blur-md rounded-xl shadow-lg overflow-hidden border border-white/10 max-w-2xl mx-auto p-8 text-center">
            <div className="text-2xl mb-4 text-white font-pixel tracking-wide">
              You chose:{" "}
              <span className="font-bold text-blue-400">{myGesture}</span>
            </div>
            <div className="text-2xl mb-6 text-white font-pixel tracking-wide">
              Opponent chose:{" "}
              <span className="font-bold text-red-400">{opponentGesture}</span>
            </div>
            <div className="text-6xl font-bold mb-8 font-retro tracking-wide text-shadow-glow">
              <span
                className={
                  result === "You win!"
                    ? "text-green-400"
                    : result === "You lose!"
                    ? "text-red-400"
                    : "text-yellow-400"
                }
              >
                {result}
              </span>
            </div>
            <div className="flex flex-col gap-4">
              {result === "You win!" && (
                <button
                  onClick={recordBattleWin}
                  className="px-8 py-4 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white rounded-lg hover:from-yellow-500 hover:to-yellow-700 font-retro tracking-wide uppercase text-shadow-glow"
                >
                  Claim Reward 🏆
                </button>
              )}
              <button
                onClick={playAgain}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 font-retro tracking-wide uppercase"
              >
                Play Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MultiplayerGame;
