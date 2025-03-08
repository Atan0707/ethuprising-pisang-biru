"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function HostPage() {
  const [hostName, setHostName] = useState<string>("");
  const [gameCode, setGameCode] = useState<string | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Generate a unique host ID if needed
  const [hostId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const storedId = localStorage.getItem("rps-host-id");
      if (storedId) return storedId;

      const newId = crypto.randomUUID();
      localStorage.setItem("rps-host-id", newId);
      return newId;
    }
    return "";
  });

  // Create a new hosted game
  const createHostedGame = async () => {
    if (!hostName.trim()) {
      setError("Please enter your name");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/game/host", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hostId,
          hostName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(
          `Failed to create game: ${errorData.error || response.statusText}`
        );
        return;
      }

      const data = await response.json();
      console.log("Game created:", data);
      setGameId(data.gameId);
      setGameCode(data.gameCode);
    } catch (error) {
      console.error("Error creating game:", error);
      setError("Network error when creating a game. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Reset the state for creating a new game
  const createNewGame = () => {
    setGameCode(null);
    setGameId(null);
    setError(null);
  };

  // Check game status
  const checkGameStatus = async () => {
    if (!gameId) return;

    try {
      const response = await fetch("/api/debug");
      const data = await response.json();

      const gameInfo = data.games.find((g: any) => g.id === gameId);

      if (gameInfo) {
        alert(
          `Game ${gameId} status:\nPlayers: ${gameInfo.playerCount}/2\nState: ${gameInfo.state}`
        );
      } else {
        alert(`Game ${gameId} not found.`);
      }
    } catch (error) {
      console.error("Error checking game status:", error);
      setError("Failed to check game status.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-4xl font-bold mb-6">Game Host Panel</h1>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 w-full max-w-md">
          <p>{error}</p>
        </div>
      )}

      {!gameCode ? (
        <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
          <h2 className="text-2xl font-semibold mb-4">Create a New Game</h2>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Your Name</label>
            <input
              type="text"
              value={hostName}
              onChange={(e) => setHostName(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded mb-4"
              placeholder="Enter your name"
            />
          </div>

          <button
            onClick={createHostedGame}
            disabled={isLoading}
            className={`w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 ${
              isLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isLoading ? "Creating Game..." : "Create Game"}
          </button>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-md text-center w-full max-w-md">
          <h2 className="text-2xl font-semibold mb-4">Game Created!</h2>

          <div className="mb-4">
            <p className="text-gray-600 mb-2">
              Share this code with the players:
            </p>
            <div className="text-4xl font-mono tracking-wider bg-gray-100 p-4 rounded-lg mb-4">
              {gameCode}
            </div>
          </div>

          <div className="flex gap-4 justify-center mb-6">
            <button
              onClick={checkGameStatus}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Check Status
            </button>
            <button
              onClick={createNewGame}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              New Game
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <Link href="/" className="text-blue-500 hover:underline">
              Return to Home
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
