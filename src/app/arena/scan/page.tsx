"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { RetroButton } from "@/components/ui/retro-button";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { Eip1193Provider, ethers } from "ethers";
import Blockmon from "@/contract/Blockmon.json";
import { toast } from "sonner";

// Contract address
const CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
  "0xe1e52a36E15eBf6785842e55b6d1D901819985ec";

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

// Interface for NFC reading event
interface NFCReadingEvent {
  message: {
    records: Array<{
      recordType: string;
      data: ArrayBuffer;
    }>;
  };
}

export default function ScanPage() {
  const { address, isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider("eip155");
  const [scanStage, setScanStage] = useState(0); // 0: no scan, 1: first scan, 2: second scan, 3: battle ready
  const [isScanning, setIsScanning] = useState(false);
  const [firstPokemon, setFirstPokemon] = useState<Pokemon | null>(null);
  const [secondPokemon, setSecondPokemon] = useState<Pokemon | null>(null);
  const [battleStarted, setBattleStarted] = useState(false);
  const [battleLog, setBattleLog] = useState<string[]>([]);
  const [currentTurn, setCurrentTurn] = useState(1); // 1: first player, 2: second player
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdownValue, setCountdownValue] = useState(3);
  const [showReadyMessage, setShowReadyMessage] = useState(false);
  const [nfcSupported, setNfcSupported] = useState<boolean | null>(null);
  const [battleCode, setBattleCode] = useState<string | null>(null);

  // Sound effect references
  const countdownSoundRef = useRef<HTMLAudioElement | null>(null);
  const battleStartSoundRef = useRef<HTMLAudioElement | null>(null);

  // Check if NFC is supported
  useEffect(() => {
    if (typeof window !== "undefined") {
      setNfcSupported("NDEFReader" in window);
    }
  }, []);

  const handleScan = async () => {
    if (scanStage >= 2 || !isConnected || !walletProvider) {
      toast.error("Please connect your wallet first");
      return;
    }

    setIsScanning(true);
    const scanToastId = toast.loading("Scanning for NFC Card", {
      description: "Bring your NFC card close to your device...",
      icon: "📡",
      duration: Infinity,
    });

    try {
      // @ts-expect-error - NDEFReader is not in the TypeScript types yet
      const ndef = new window.NDEFReader();
      await ndef.scan();

      // Create a function for the event handler so we can remove it later
      const handleReading = async ({ message }: NFCReadingEvent) => {
        try {
          // Process NDEF message
          for (const record of message.records) {
            if (record.recordType === "text") {
              const textDecoder = new TextDecoder();
              const claimHash = textDecoder.decode(record.data);

              // Get token ID and pokemon data from blockchain
              const provider = new ethers.BrowserProvider(
                walletProvider as Eip1193Provider
              );
              const signer = await provider.getSigner();
              const contract = new ethers.Contract(
                CONTRACT_ADDRESS,
                Blockmon.abi,
                signer
              );

              // Get token ID from claim hash
              const tokenId = await contract.hashToToken(claimHash);

              // Get pokemon data
              const pokemonData = await contract.getPokemon(tokenId);

              // Convert blockchain data to Pokemon interface
              const pokemon: Pokemon = {
                id: Number(tokenId),
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

              // Update state based on scan stage
              if (scanStage === 0) {
                setFirstPokemon(pokemon);
                setScanStage(1);
                setBattleLog((prev) => [
                  ...prev,
                  `${pokemon.owner} scanned their Blocknogotchi: ${pokemon.name}!`,
                ]);
              } else if (scanStage === 1) {
                setSecondPokemon(pokemon);
                setScanStage(2);
                setBattleLog((prev) => [
                  ...prev,
                  `${pokemon.owner} scanned their Blocknogotchi: ${pokemon.name}!`,
                ]);
              }

              toast.dismiss(scanToastId);
              toast.success("NFC Card Detected", {
                description:
                  "Successfully read the claim hash from your NFC card.",
                icon: "✅",
              });

              // Remove the event listener after successful scan
              ndef.removeEventListener("reading", handleReading);
              setIsScanning(false);
              break; // Exit the loop after processing the first valid record
            }
          }
        } catch (error) {
          console.error("Error processing NFC data:", error);
          toast.dismiss(scanToastId);
          toast.error("Error Processing NFC Data", {
            description:
              error instanceof Error ? error.message : "Unknown error occurred",
            icon: "❌",
          });
          // Remove the event listener on error
          ndef.removeEventListener("reading", handleReading);
          setIsScanning(false);
        }
      };

      // Add the event listener
      ndef.addEventListener("reading", handleReading);
    } catch (error) {
      console.error("Error scanning NFC:", error);
      toast.dismiss(scanToastId);
      toast.error("Scanning Failed", {
        description: "Failed to scan NFC card. Please try again.",
        icon: "❌",
      });
      setIsScanning(false);
    }
  };

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

  // Generate a random 6-character code
  const generateBattleCode = () => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
  };

  // Save battle data to JSON file
  const saveBattleData = async (code: string) => {
    if (!firstPokemon || !secondPokemon) return;

    try {
      const battleData = {
        code,
        deviceA: {
          tokenId: firstPokemon.id.toString(),
          joined: false,
          gesture: "",
          score: 0,
          ready: false,
        },
        deviceB: {
          tokenId: secondPokemon.id.toString(),
          joined: false,
          gesture: "",
          score: 0,
          ready: false,
        },
      };

      console.log("Saving battle data:", battleData); // Add this for debugging

      const response = await fetch("/api/battle/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(battleData),
      });

      if (!response.ok) {
        throw new Error("Failed to save battle data");
      }
    } catch (error) {
      console.error("Error saving battle data:", error);
      toast.error("Failed to save battle data");
    }
  };

  const startBattle = () => {
    // Generate battle code
    const code = generateBattleCode();
    setBattleCode(code);

    // Start the countdown animation
    setShowCountdown(true);

    // Play countdown sound
    if (countdownSoundRef.current) {
      countdownSoundRef.current.currentTime = 0;
      countdownSoundRef.current
        .play()
        .catch((error) =>
          console.error("Error playing countdown sound:", error)
        );
    }

    // Countdown sequence
    const countdownInterval = setInterval(() => {
      setCountdownValue((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          // Show "READY FOR THE NEXT BATTLE" message
          setShowReadyMessage(true);

          // Play battle start sound
          if (battleStartSoundRef.current) {
            battleStartSoundRef.current
              .play()
              .catch((error) =>
                console.error("Error playing battle start sound:", error)
              );
          }

          // Save battle data and show code
          saveBattleData(code);

          return 0;
        }

        // Play countdown sound for each number
        if (countdownSoundRef.current) {
          countdownSoundRef.current.currentTime = 0;
          countdownSoundRef.current
            .play()
            .catch((error) =>
              console.error("Error playing countdown sound:", error)
            );
        }

        return prev - 1;
      });
    }, 1000);
  };

  const executeMove = (moveIndex: number) => {
    if (!battleStarted || !firstPokemon || !secondPokemon) return;

    const attacker = currentTurn === 1 ? firstPokemon : secondPokemon;
    const defender = currentTurn === 1 ? secondPokemon : firstPokemon;
    const move = attacker.moves[moveIndex];

    // Calculate random damage between 10-25
    const damage = Math.floor(Math.random() * 16) + 10;

    // Update HP
    if (currentTurn === 1 && secondPokemon) {
      setSecondPokemon((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          hp: Math.max(0, prev.hp - damage),
        };
      });
    } else if (firstPokemon) {
      setFirstPokemon((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          hp: Math.max(0, prev.hp - damage),
        };
      });
    }

    // Add to battle log
    setBattleLog((prev) => [
      ...prev,
      `${attacker.name} used ${move} and dealt ${damage} damage to ${defender.name}!`,
    ]);

    // Check if battle ended
    if (defender.hp - damage <= 0) {
      setBattleLog((prev) => [
        ...prev,
        `${defender.name} fainted! ${attacker.name} wins the battle!`,
      ]);
      setBattleStarted(false);
    } else {
      // Switch turns
      setCurrentTurn(currentTurn === 1 ? 2 : 1);
    }
  };

  const resetBattle = () => {
    setScanStage(0);
    setFirstPokemon(null);
    setSecondPokemon(null);
    setBattleStarted(false);
    setBattleLog([]);
    setCurrentTurn(1);
  };

  // Auto-scroll battle log
  useEffect(() => {
    const logElement = document.getElementById("battle-log");
    if (logElement) {
      logElement.scrollTop = logElement.scrollHeight;
    }
  }, [battleLog]);

  return (
    <div className="relative">
      {/* Sound effects */}
      <audio
        ref={countdownSoundRef}
        src="/sounds/countdown-beep.mp3"
        preload="auto"
      ></audio>
      <audio
        ref={battleStartSoundRef}
        src="/sounds/battle-start.mp3"
        preload="auto"
      ></audio>

      {/* Countdown overlay */}
      {showCountdown && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center">
          {!showReadyMessage ? (
            <div className="text-9xl font-bold text-white animate-pulse font-retro tracking-wide text-shadow-glow">
              {countdownValue}
            </div>
          ) : (
            <div className="text-center animate-bounce">
              <div className="text-4xl md:text-6xl font-bold text-white mb-4 font-retro tracking-wide uppercase">
                READY FOR THE
              </div>
              <div className="text-5xl md:text-7xl font-extrabold bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 bg-clip-text text-transparent font-retro tracking-wide uppercase text-shadow-glow">
                NEXT BATTLE!
              </div>
              {battleCode && (
                <div className="mt-8">
                  <div className="text-2xl text-white mb-2 font-retro">
                    BATTLE CODE:
                  </div>
                  <div className="text-4xl font-mono tracking-widest bg-white/10 px-6 py-3 rounded-lg text-yellow-400 font-bold">
                    {battleCode}
                  </div>
                  <div className="mt-4 text-gray-400 text-sm">
                    Share this code with your opponent to start the battle
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

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
          <Link
            href="/arena"
            className="text-white hover:text-blue-300 flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            <span className="font-pixel tracking-wide">Back to Arena</span>
          </Link>

          {scanStage > 0 && (
            <button
              onClick={resetBattle}
              className="text-white hover:text-red-300 flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span className="font-pixel tracking-wide">Reset</span>
            </button>
          )}
        </div>

        <div className="bg-black/40 backdrop-blur-md rounded-xl shadow-lg overflow-hidden border border-white/10 max-w-4xl mx-auto">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-white mb-6 text-center font-retro tracking-wide uppercase">
              Arena Battle Scanner
            </h2>

            {/* Battle Arena */}
            <div className="mb-6">
              {/* First Player */}
              <div className="mb-8">
                {firstPokemon ? (
                  <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 rounded-lg p-4 border border-blue-500/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-20 h-20 relative mr-4 bg-white/10 rounded-lg overflow-hidden flex items-center justify-center">
                          {firstPokemon?.image ? (
                            <div className="relative w-16 h-16">
                              <Image
                                src={firstPokemon.image}
                                alt={firstPokemon.name}
                                layout="fill"
                                objectFit="contain"
                              />
                            </div>
                          ) : (
                            <div className="text-gray-400 text-xs">
                              No Image
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white font-retro tracking-wide uppercase">
                            {firstPokemon?.name}
                          </h3>
                          <p className="text-blue-300 font-pixel tracking-wide">
                            Lv. {firstPokemon?.level} • {firstPokemon?.type}
                          </p>
                          <p className="text-xs text-gray-300 mt-1 font-pixel tracking-wide">
                            Owner: {firstPokemon?.owner}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="mb-1">
                          <span className="text-white font-medium font-pixel tracking-wide">
                            {firstPokemon?.hp}/{firstPokemon?.maxHp} HP
                          </span>
                        </div>
                        <div className="w-32 h-3 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-green-500 to-emerald-400"
                            style={{
                              width: `${
                                firstPokemon
                                  ? (firstPokemon.hp / firstPokemon.maxHp) * 100
                                  : 0
                              }%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {battleStarted && currentTurn === 1 && firstPokemon && (
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        {firstPokemon.moves.map(
                          (move: string, index: number) => (
                            <RetroButton
                              key={index}
                              onClick={() => executeMove(index)}
                              variant="blue"
                              className="text-xs"
                            >
                              {move}
                            </RetroButton>
                          )
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-800/40 rounded-lg p-6 border border-gray-700/50 flex flex-col items-center justify-center">
                    <div className="text-center mb-4">
                      <p className="text-white text-lg mb-1 font-retro tracking-wide uppercase">
                        First Player
                      </p>
                      <p className="text-gray-400 text-sm font-pixel tracking-wide">
                        Waiting for scan...
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* VS Divider */}
              <div className="flex items-center justify-center mb-8">
                <div className="w-1/3 h-px bg-white/20"></div>
                <div className="mx-4 text-white font-bold text-xl font-retro tracking-wide text-shadow-glow">
                  VS
                </div>
                <div className="w-1/3 h-px bg-white/20"></div>
              </div>

              {/* Second Player */}
              <div className="mb-6">
                {secondPokemon ? (
                  <div className="bg-gradient-to-r from-red-900/40 to-orange-900/40 rounded-lg p-4 border border-red-500/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-20 h-20 relative mr-4 bg-white/10 rounded-lg overflow-hidden flex items-center justify-center">
                          {secondPokemon?.image ? (
                            <div className="relative w-16 h-16">
                              <Image
                                src={secondPokemon.image}
                                alt={secondPokemon.name}
                                layout="fill"
                                objectFit="contain"
                              />
                            </div>
                          ) : (
                            <div className="text-gray-400 text-xs">
                              No Image
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white font-retro tracking-wide uppercase">
                            {secondPokemon?.name}
                          </h3>
                          <p className="text-red-300 font-pixel tracking-wide">
                            Lv. {secondPokemon?.level} • {secondPokemon?.type}
                          </p>
                          <p className="text-xs text-gray-300 mt-1 font-pixel tracking-wide">
                            Owner: {secondPokemon?.owner}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="mb-1">
                          <span className="text-white font-medium font-pixel tracking-wide">
                            {secondPokemon?.hp}/{secondPokemon?.maxHp} HP
                          </span>
                        </div>
                        <div className="w-32 h-3 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-red-500 to-orange-400"
                            style={{
                              width: `${
                                secondPokemon
                                  ? (secondPokemon.hp / secondPokemon.maxHp) *
                                    100
                                  : 0
                              }%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {battleStarted && currentTurn === 2 && secondPokemon && (
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        {secondPokemon.moves.map(
                          (move: string, index: number) => (
                            <RetroButton
                              key={index}
                              onClick={() => executeMove(index)}
                              variant="default"
                              className="text-xs"
                            >
                              {move}
                            </RetroButton>
                          )
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-800/40 rounded-lg p-6 border border-gray-700/50 flex flex-col items-center justify-center">
                    <div className="text-center mb-4">
                      <p className="text-white text-lg mb-1 font-retro tracking-wide uppercase">
                        Second Player
                      </p>
                      <p className="text-gray-400 text-sm font-pixel tracking-wide">
                        Waiting for scan...
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Battle Log */}
              {battleLog.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-white font-medium mb-2 font-retro tracking-wide uppercase">
                    Battle Log
                  </h3>
                  <div
                    id="battle-log"
                    className="bg-black/30 border border-gray-700/50 rounded-lg p-3 h-32 overflow-y-auto text-sm"
                  >
                    {battleLog.map((log, index) => (
                      <div
                        key={index}
                        className="mb-1 text-gray-300 font-pixel tracking-wide"
                      >
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-center">
                {!isConnected ? (
                  <div className="text-center w-full">
                    <p className="text-white mb-4 font-retro tracking-wide uppercase text-shadow-glow">
                      Please connect your wallet to start scanning
                    </p>
                  </div>
                ) : nfcSupported === false ? (
                  <div className="text-center w-full">
                    <p className="text-white mb-4 font-retro tracking-wide uppercase text-shadow-glow">
                      NFC is not supported on this device
                    </p>
                    <p className="text-sm text-gray-300 font-pixel tracking-wide">
                      Please use a device with NFC capabilities (like an Android
                      phone with Chrome)
                    </p>
                  </div>
                ) : scanStage < 2 ? (
                  <RetroButton
                    onClick={handleScan}
                    disabled={isScanning}
                    variant="blue"
                    size="full"
                    className="w-full max-w-md"
                  >
                    {isScanning
                      ? "Scanning..."
                      : scanStage === 0
                      ? "Scan First Blocknogotchi"
                      : "Scan Second Blocknogotchi"}
                  </RetroButton>
                ) : !battleStarted ? (
                  <RetroButton
                    onClick={startBattle}
                    variant="default"
                    size="full"
                    className="w-full max-w-md"
                  >
                    Start Battle
                  </RetroButton>
                ) : (
                  <div className="text-center w-full">
                    <p className="text-white mb-2 font-retro tracking-wide uppercase text-shadow-glow">
                      {currentTurn === 1 && firstPokemon
                        ? firstPokemon.name
                        : secondPokemon?.name}
                      &apos;s turn to attack!
                    </p>
                    <p className="text-sm text-gray-300 font-pixel tracking-wide">
                      Select a move above to attack
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
