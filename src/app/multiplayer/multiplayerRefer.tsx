"use client";

import React, { useRef, useState, useEffect } from "react";
import * as tf from "@tensorflow/tfjs";
import * as handpose from "@tensorflow-models/handpose";
import "@tensorflow/tfjs-backend-webgl";

function MultiplayerGame() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [model, setModel] = useState<handpose.HandPose | null>(null);
  const [gesture, setGesture] = useState<string>("");
  const [playerName, setPlayerName] = useState<string>("");
  const [gameState, setGameState] = useState<
    "joining" | "waiting" | "playing" | "selecting" | "countdown" | "result"
  >("joining");
  const [gameId, setGameId] = useState<string | null>(null);
  const [inputGameCode, setInputGameCode] = useState<string>("");
  const [playerId] = useState<string>(() => {
    // Generate a unique player ID or get from local storage
    if (typeof window !== "undefined") {
      const storedId = localStorage.getItem("rps-player-id");
      if (storedId) return storedId;

      const newId = crypto.randomUUID();
      localStorage.setItem("rps-player-id", newId);
      return newId;
    }
    return "";
  });
  const [opponent, setOpponent] = useState<{
    name: string;
    gesture: string | null;
  }>({ name: "", gesture: null });
  const [myGesture, setMyGesture] = useState<string | null>(null);
  const [result, setResult] = useState<string>("");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [selectionTimer, setSelectionTimer] = useState<number | null>(null);
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [countdownSeconds, setCountdownSeconds] = useState<number>(3);
  const [previousGesture, setPreviousGesture] = useState<string>("");
  const [gestureConfidence, setGestureConfidence] = useState<number>(0);

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

  // Add a separate setupCamera function outside the useEffect to fix the reference error
  // Define the setupCamera function separately so it can be called from button click
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

  // Then modify the useEffect to call this function
  useEffect(() => {
    setupCamera();

    // Clean up on unmount
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        const tracks = stream.getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, []);

  // Detect hand gestures (direct from camera/page.tsx)
  useEffect(() => {
    if (!model || !videoRef.current || gameState !== "selecting") return;

    let lastDetectionTime = Date.now();
    const TIMEOUT_DURATION = 500; // 500ms timeout for hand detection
    let animationFrameId: number;

    const detectHandGesture = async () => {
      if (videoRef.current && model) {
        // Check if video is ready with valid dimensions
        if (
          videoRef.current.readyState === 4 &&
          videoRef.current.videoWidth > 0 &&
          videoRef.current.videoHeight > 0
        ) {
          try {
            const predictions = await model.estimateHands(videoRef.current);

            // If no hands are detected
            if (predictions.length === 0) {
              // If it's been more than TIMEOUT_DURATION since we last saw a hand,
              // set gesture to unknown
              if (Date.now() - lastDetectionTime > TIMEOUT_DURATION) {
                setGesture("unknown");
              }
            } else {
              // We detected a hand, update the last detection time
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

    // Cleanup function to cancel animation frame when component unmounts
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [model, gameState]);

  // Log API errors better
  const handleApiError = async (response: Response, errorPrefix: string) => {
    let errorMessage = errorPrefix;
    try {
      const errorData = await response.json();
      console.error(`${errorPrefix} - Status ${response.status}:`, errorData);
      if (errorData.error) {
        errorMessage += `: ${errorData.error}`;
      } else {
        errorMessage += `: Status ${response.status}`;
      }
    } catch (e) {
      console.error(
        `${errorPrefix} - Status ${response.status}:`,
        await response.text()
      );
      errorMessage += `: Status ${response.status}`;
    }
    setError(errorMessage);
  };

  // Poll for game updates
  useEffect(() => {
    if (
      gameState !== "playing" &&
      gameState !== "waiting" &&
      gameState !== "selecting"
    ) {
      if (pollInterval) {
        clearInterval(pollInterval);
        setPollInterval(null);
      }
      return;
    }

    const pollForUpdates = async () => {
      try {
        if (!gameId) return;

        console.log("Polling for game:", gameId);
        const response = await fetch(
          `/api/game?gameId=${gameId}&playerId=${playerId}`
        );

        if (!response.ok) {
          console.error("Error polling game state:", await response.text());
          return;
        }

        const data = await response.json();
        console.log("Poll response:", data);

        if (gameState === "waiting" && data.state === "active") {
          // Another player joined the game
          setOpponent({ name: data.opponent.name, gesture: null });
          setGameState("playing");
          setCountdown(3);
        } else if (
          (gameState === "playing" || gameState === "selecting") &&
          data.state === "complete"
        ) {
          // Game is complete
          setOpponent((prev) => ({ ...prev, gesture: data.opponent.gesture }));
          setResult(data.result.message);
          setGameState("result");
          clearInterval(pollInterval!);
          setPollInterval(null);
        }
      } catch (error) {
        console.error("Error polling for updates:", error);
      }
    };

    // Poll immediately and then at intervals
    pollForUpdates();

    if (!pollInterval) {
      const interval = setInterval(pollForUpdates, 2000); // Poll every 2 seconds
      setPollInterval(interval);
    }

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
        setPollInterval(null);
      }
    };
  }, [gameState, gameId, playerId, pollInterval]);

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

  // Submit gesture to the server
  const submitGesture = async (gesture: string) => {
    if (!gameId) return;

    setMyGesture(gesture);

    try {
      const response = await fetch("/api/game/gesture", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gameId,
          playerId,
          gesture,
        }),
      });

      if (!response.ok) {
        console.error("Error submitting gesture:", await response.text());
        setError("Failed to submit your gesture. Please try again.");
        return;
      }

      const data = await response.json();

      if (data.gameComplete) {
        setResult(data.result.message);
        setGameState("result");

        if (pollInterval) {
          clearInterval(pollInterval);
          setPollInterval(null);
        }
      }
    } catch (error) {
      console.error("Error submitting gesture:", error);
      setError("Network error when submitting your gesture. Please try again.");
    }
  };

  // 5-second gesture selection timer
  useEffect(() => {
    if (selectionTimer === null || gameState !== "selecting") return;

    if (selectionTimer > 0) {
      const timer = setTimeout(() => {
        setSelectionTimer(selectionTimer - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else {
      // When timer reaches 0, submit the current gesture
      submitGesture(gesture && gesture !== "unknown" ? gesture : "rock");
    }
  }, [selectionTimer, gesture, gameState]);

  // Add auto-submit effect here, after submitGesture is defined
  useEffect(() => {
    // If we've detected the same gesture consistently for more than 1 second during selection phase
    // and have high confidence, auto-submit it
    if (
      gameState === "selecting" &&
      gesture !== "unknown" &&
      gestureConfidence > 0.8
    ) {
      const autoSubmitTimer = setTimeout(() => {
        if (gesture === previousGesture && gesture !== "unknown") {
          console.log("Auto-submitting stable gesture:", gesture);
          submitGesture(gesture);
        }
      }, 1500); // 1.5 seconds of the same gesture triggers auto-submit

      return () => clearTimeout(autoSubmitTimer);
    }
  }, [gesture, previousGesture, gestureConfidence, gameState]);

  // Manual gesture selection (fallback for when camera doesn't work)
  const selectManualGesture = (gesture: string) => {
    if (gameState !== "selecting") return;
    setGesture(gesture);
  };

  // Join an existing game with a code
  const joinGame = async () => {
    if (!playerName.trim()) {
      setError("Please enter your name");
      return;
    }

    if (!inputGameCode.trim()) {
      setError("Please enter a game code");
      return;
    }

    setError(null);

    try {
      const response = await fetch("/api/game/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gameCode: inputGameCode.trim(),
          playerId,
          playerName,
        }),
      });

      if (!response.ok) {
        await handleApiError(response, "Failed to join the game");
        return;
      }

      const data = await response.json();
      console.log("Game joined:", data);
      setGameId(data.gameId);

      if (data.opponent) {
        setOpponent({ name: data.opponent, gesture: null });
        setGameState("playing");
        setCountdown(3);
      } else {
        setGameState("waiting");
      }
    } catch (error) {
      console.error("Error joining game:", error);
      setError("Network error when joining the game. Please try again.");
    }
  };

  // Reset the game
  const resetGame = () => {
    setMyGesture(null);
    setOpponent({ name: "", gesture: null });
    setResult("");
    setGameState("joining");
    setGameId(null);
    setInputGameCode("");
    setCountdown(null);
    setSelectionTimer(null);
    setError(null);

    if (pollInterval) {
      clearInterval(pollInterval);
      setPollInterval(null);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-4xl font-bold mb-6">Rock Paper Scissors</h1>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 w-full max-w-4xl">
          <p>{error}</p>
        </div>
      )}

      {gameState === "joining" && (
        <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
          <h2 className="text-2xl font-semibold mb-4">Join Game</h2>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Your Name</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded mb-4"
              placeholder="Enter your name"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Game Code</label>
            <input
              type="text"
              value={inputGameCode}
              onChange={(e) => setInputGameCode(e.target.value.toUpperCase())}
              className="w-full p-2 border border-gray-300 rounded mb-4"
              placeholder="Enter game code"
              maxLength={5}
            />
          </div>

          <button
            onClick={joinGame}
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
          >
            Join Game
          </button>
        </div>
      )}

      {gameState === "waiting" && (
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-semibold mb-4">
            Waiting for opponent to join
          </h2>
          <div className="text-4xl font-mono tracking-wider bg-gray-100 p-4 rounded-lg mb-4">
            {inputGameCode}
          </div>
          <p className="mb-4">Game ID: {gameId}</p>

          {/* Debug section */}
          <div className="mt-8 pt-4 border-t border-gray-200 text-left">
            <h3 className="text-sm font-semibold text-gray-500 mb-2">
              Debug Info
            </h3>
            <p className="text-xs text-gray-500">Game ID: {gameId}</p>
            <p className="text-xs text-gray-500">
              Player ID: {playerId.substring(0, 8)}...
            </p>
            <button
              onClick={async () => {
                try {
                  const response = await fetch("/api/debug");
                  const data = await response.json();
                  console.log("Game store debug info:", data);
                  alert(
                    `Current games: ${
                      data.gameIds.join(", ") || "None"
                    }\nWaiting players: ${data.waitingPlayers}`
                  );
                } catch (error) {
                  console.error("Error fetching debug info:", error);
                }
              }}
              className="text-xs text-blue-500 mt-2"
            >
              Check Server State
            </button>
          </div>

          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mt-6"></div>
          <button
            onClick={resetGame}
            className="mt-6 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      )}

      {(gameState === "playing" ||
        gameState === "selecting" ||
        gameState === "result") && (
        <div className="w-full max-w-4xl">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6">
            <div className="text-xl font-semibold mb-2 md:mb-0">
              You: {playerName}
            </div>
            <div className="text-xl font-semibold">
              Opponent: {opponent.name}
            </div>
          </div>

          <div className="relative mb-6">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full max-w-xl mx-auto h-[480px] border-4 rounded-lg object-cover shadow-xl"
              style={{
                borderColor: gameState === "selecting" ? "#ef4444" : "#3b82f6",
                backgroundColor: "#000",
              }}
            />

            {gesture && gesture !== "unknown" && (
              <div className="absolute top-2 left-2 bg-blue-700 text-white px-4 py-2 rounded-lg text-lg font-bold shadow-lg border-2 border-white">
                Detected:{" "}
                <span className="text-yellow-300">{gesture.toUpperCase()}</span>
              </div>
            )}

            {selectionTimer !== null && gameState === "selecting" && (
              <div className="absolute top-2 right-2 bg-red-600 text-white px-4 py-2 rounded-full text-xl font-bold shadow-lg border-2 border-white">
                {selectionTimer}s
              </div>
            )}

            {gameState === "selecting" && (
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-80 text-white p-3 text-center text-lg font-semibold border-t-2 border-yellow-400">
                Show your rock, paper, or scissors gesture to the camera!
              </div>
            )}

            {videoRef.current && !videoRef.current.srcObject && (
              <button
                onClick={() => setupCamera()}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold text-lg shadow-lg border-2 border-white"
              >
                Enable Camera
              </button>
            )}
          </div>

          {countdown !== null && gameState === "playing" && (
            <div className="text-center mb-8">
              <div className="text-2xl font-semibold mb-2">Get Ready!</div>
              <div className="text-6xl font-bold text-blue-600 mb-4">
                {countdown === 0 ? "GO!" : countdown}
              </div>
              <div className="bg-yellow-100 p-4 rounded-lg max-w-xl mx-auto">
                <p className="text-yellow-800">
                  <span className="font-bold">Next:</span> You'll have 5 seconds
                  to show your rock, paper, or scissors gesture to the camera.
                </p>
                <p className="text-yellow-800 text-sm mt-2">
                  Make sure your hand is clearly visible in the video feed!
                </p>
              </div>
            </div>
          )}

          {gameState === "selecting" && (
            <div className="text-center mb-4">
              <div className="text-2xl font-semibold mb-2">
                Make Your Gesture!
              </div>
              <div className="bg-blue-100 p-4 rounded-lg mb-4 max-w-xl mx-auto">
                <p className="font-medium text-blue-800">
                  Hold your hand in front of the camera with one of these
                  gestures:
                </p>
                <div className="flex justify-center gap-8 mt-3">
                  <div className="p-4 rounded-lg flex flex-col items-center bg-white shadow-md border border-gray-300">
                    <span className="text-4xl">✊</span>
                    <span className="text-sm font-bold mt-2 text-gray-800">
                      Rock
                    </span>
                    <span className="text-xs mt-1 text-gray-600">
                      (Closed fist)
                    </span>
                  </div>
                  <div className="p-4 rounded-lg flex flex-col items-center bg-white shadow-md border border-gray-300">
                    <span className="text-4xl">✋</span>
                    <span className="text-sm font-bold mt-2 text-gray-800">
                      Paper
                    </span>
                    <span className="text-xs mt-1 text-gray-600">
                      (Open hand)
                    </span>
                  </div>
                  <div className="p-4 rounded-lg flex flex-col items-center bg-white shadow-md border border-gray-300">
                    <span className="text-4xl">✌️</span>
                    <span className="text-sm font-bold mt-2 text-gray-800">
                      Scissors
                    </span>
                    <span className="text-xs mt-1 text-gray-600">
                      (Two fingers)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {gameState === "result" && (
            <div className="bg-black p-6 rounded-lg shadow-md text-center">
              <div className="text-2xl mb-4">
                You chose: <span className="font-bold">{myGesture}</span>
              </div>
              <div className="text-2xl mb-4">
                {opponent.name} chose:{" "}
                <span className="font-bold">{opponent.gesture}</span>
              </div>
              <div className="text-4xl font-bold text-purple-600 mb-4">
                {result}
              </div>
              <button
                onClick={resetGame}
                className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Play Again
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MultiplayerGame;
