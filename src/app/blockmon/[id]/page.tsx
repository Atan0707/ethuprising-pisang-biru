"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useQuery, gql } from "@apollo/client";
import Link from "next/link";
import Image from "next/image";
import { ethers } from "ethers";
import Blocknogotchi from "@/contract/BlocknogotchiContract.json";
import { toast } from "sonner";
import { useAppKitAccount } from "@reown/appkit/react";
import { BLOCKNOGOTCHI_CONTRACT_ADDRESS } from "@/app/utils/config";
// GraphQL query to get Blocknogotchi battle data
const GET_BLOCKNOGOTCHI_BATTLES = gql`
  query GetBlocknogotchiBattles($tokenId: String!) {
    battleCompleteds(
      where: { tokenId: $tokenId }
      first: 100
      orderBy: blockTimestamp
      orderDirection: desc
    ) {
      id
      tokenId
      opponentId
      won
      blockTimestamp
      transactionHash
    }
  }
`;

// GraphQL query to get Blocknogotchi level data
const GET_BLOCKNOGOTCHI_LEVELS = gql`
  query GetBlocknogotchiLevels($tokenId: String!) {
    blocknogotchiLeveledUps(
      where: { tokenId: $tokenId }
      first: 100
      orderBy: blockTimestamp
      orderDirection: desc
    ) {
      id
      tokenId
      newLevel
      blockTimestamp
      transactionHash
    }
  }
`;

// GraphQL query to get Blocknogotchi creation data
const GET_BLOCKNOGOTCHI_CREATED = gql`
  query GetBlocknogotchiCreated($tokenId: String!) {
    blocknogotchiCreateds(where: { tokenId: $tokenId }, first: 1) {
      id
      tokenId
      owner
      blockTimestamp
      transactionHash
    }
  }
`;

// Enum mapping for attributes
const attributeMap = [
  { name: "Fire", color: "text-red-500", bgColor: "bg-red-100", icon: "🔥" },
  { name: "Water", color: "text-blue-500", bgColor: "bg-blue-100", icon: "💧" },
  {
    name: "Plant",
    color: "text-green-500",
    bgColor: "bg-green-100",
    icon: "🌿",
  },
  {
    name: "Electric",
    color: "text-yellow-500",
    bgColor: "bg-yellow-100",
    icon: "⚡",
  },
  {
    name: "Earth",
    color: "text-amber-700",
    bgColor: "bg-amber-100",
    icon: "🌍",
  },
  { name: "Air", color: "text-sky-500", bgColor: "bg-sky-100", icon: "💨" },
  {
    name: "Light",
    color: "text-yellow-400",
    bgColor: "bg-yellow-50",
    icon: "✨",
  },
  {
    name: "Dark",
    color: "text-purple-700",
    bgColor: "bg-purple-100",
    icon: "🌑",
  },
];

// Enum mapping for rarity
const rarityMap = [
  { name: "Common", color: "text-gray-600", bgColor: "bg-gray-100" },
  { name: "Uncommon", color: "text-green-600", bgColor: "bg-green-100" },
  { name: "Rare", color: "text-blue-600", bgColor: "bg-blue-100" },
  { name: "Epic", color: "text-purple-600", bgColor: "bg-purple-100" },
  { name: "Legendary", color: "text-yellow-600", bgColor: "bg-yellow-100" },
];

// Add these interfaces after the existing const declarations
interface BlockmonData {
  name: string;
  attribute: number;
  rarity: number;
  level: number;
  hp: number;
  baseDamage: number;
  battleCount: number;
  battleWins: number;
  birthTime: number;
  lastBattleTime: number;
  claimed: boolean;
  owner: string;
  tokenURI: string;
  age: number;
  experience: number;
}

interface BattleRecord {
  id: string;
  tokenId: string;
  opponentId: string;
  won: boolean;
  blockTimestamp: string;
  transactionHash: string;
}

interface LevelRecord {
  id: string;
  tokenId: string;
  newLevel: number;
  blockTimestamp: string;
  transactionHash: string;
}

export default function BlockmonDetailsPage() {
  const params = useParams();
  const tokenId = params.id as string;

  const [blockmonData, setBlockmonData] = useState<BlockmonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"stats" | "battles" | "levels">(
    "stats"
  );
  const [nfcWriting, setNfcWriting] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Get current user's wallet address
  const { address: currentUserAddress } = useAppKitAccount();

  const { data: battleData } = useQuery(GET_BLOCKNOGOTCHI_BATTLES, {
    variables: { tokenId },
    skip: !tokenId,
  });

  const { data: levelData } = useQuery(GET_BLOCKNOGOTCHI_LEVELS, {
    variables: { tokenId },
    skip: !tokenId,
  });

  // We're not using this data directly, but keeping the query for future reference
  useQuery(GET_BLOCKNOGOTCHI_CREATED, {
    variables: { tokenId },
    skip: !tokenId,
  });

  useEffect(() => {
    const fetchBlockmonData = async () => {
      try {
        setLoading(true);

        // Connect to the Scroll Sepolia network
        const provider = new ethers.JsonRpcProvider(
          "https://sepolia-rpc.scroll.io/"
        );

        // Contract address from the-graph/networks.json
        const contractAddress = BLOCKNOGOTCHI_CONTRACT_ADDRESS;

        // Create contract instance
        const contract = new ethers.Contract(
          contractAddress,
          Blocknogotchi.abi,
          provider
        );

        // Call getPokemon function
        const data = await contract.getBlocknogotchi(tokenId);

        setBlockmonData({
          name: data[0],
          attribute: Number(data[1]),
          rarity: Number(data[2]),
          level: Number(data[3]),
          hp: Number(data[4]),
          baseDamage: Number(data[5]),
          battleCount: Number(data[6]),
          battleWins: Number(data[7]),
          birthTime: Number(data[8]),
          lastBattleTime: Number(data[9]),
          claimed: data[10],
          owner: data[11],
          tokenURI: data[12],
          age: Number(data[13]),
          experience: Number(data[14]),
        });

        setLoading(false);
      } catch (err) {
        console.error("Error fetching Blockmon data:", err);
        setError("Failed to fetch Blockmon data. Please try again later.");
        setLoading(false);
      }
    };

    if (tokenId) {
      fetchBlockmonData();
    }
  }, [tokenId]);

  // Ensure component is mounted to avoid hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if current user is the owner of the Blockmon
  const isOwner = blockmonData && currentUserAddress && 
    currentUserAddress.toLowerCase() === blockmonData.owner.toLowerCase();

  // Function to handle writing to NFC
  const handleWriteToNFC = async () => {
    if (!tokenId) return;

    try {
      setNfcWriting(true);

      // Check if Web NFC API is available
      if (!("NDEFReader" in window)) {
        toast.error("NFC is not supported on this device or browser");
        setNfcWriting(false);
        return;
      }

      // Connect to the Scroll Sepolia network
      const provider = new ethers.JsonRpcProvider(
        "https://sepolia-rpc.scroll.io/"
      );

      // Create contract instance
      const contract = new ethers.Contract(
        BLOCKNOGOTCHI_CONTRACT_ADDRESS,
        Blocknogotchi.abi,
        provider
      );

      // Get the claim hash for this token ID
      // Note: This function is restricted to the contract owner in the smart contract
      // This will only work if the frontend is being used by the contract owner
      let claimHash;
      try {
        claimHash = await contract.getClaimHash(tokenId);
        console.log("Claim hash:", claimHash);
      } catch (err) {
        console.error("Error fetching claim hash:", err);
        toast.error("Failed to fetch claim hash. Only contract owner can access this.");
        setNfcWriting(false);
        return;
      }

      toast.promise(
        (async () => {
          // @ts-expect-error - NDEFReader might not be recognized by TypeScript
          const ndef = new window.NDEFReader();
          await ndef.write({
            records: [{ recordType: "text", data: `blockmon-hash:${claimHash}` }],
          });
          return true;
        })(),
        {
          loading: "Tap your NFC card to write Blockmon data...",
          success: "Successfully wrote Blockmon data to NFC card!",
          error: "Failed to write to NFC card. Please try again.",
        }
      );
    } catch (error) {
      console.error("Error writing to NFC:", error);
      toast.error("Failed to write to NFC card. Please try again.");
    } finally {
      setNfcWriting(false);
    }
  };

  if (!mounted || loading) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center items-center min-h-screen">
        <div className="animate-bounce text-4xl">
          <span className="inline-block animate-spin">🎮</span>
          <span className="ml-4">Loading Blockmon...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
        <Link
          href="/leaderboard"
          className="mt-8 inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Back to Leaderboard
        </Link>
      </div>
    );
  }

  if (!blockmonData) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div
          className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <strong className="font-bold">Not Found!</strong>
          <span className="block sm:inline">
            {" "}
            Blockmon #{tokenId} not found.
          </span>
        </div>
        <Link
          href="/leaderboard"
          className="mt-8 inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Back to Leaderboard
        </Link>
      </div>
    );
  }

  const attribute = attributeMap[blockmonData.attribute];
  const rarity = rarityMap[blockmonData.rarity];
  const winRate =
    blockmonData.battleCount > 0
      ? Math.round((blockmonData.battleWins / blockmonData.battleCount) * 100)
      : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        href="/leaderboard"
        className="inline-flex items-center mb-6 text-blue-600 hover:text-blue-800"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 mr-2"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
            clipRule="evenodd"
          />
        </svg>
        Back to Leaderboard
      </Link>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        {/* Header with image and basic info */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 opacity-75"></div>
          <div className="relative p-8 flex flex-col md:flex-row items-center justify-between">
            <div className="flex flex-col md:flex-row items-center">
              {blockmonData.tokenURI ? (
                <div className="w-48 h-48 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white flex items-center justify-center mb-4 md:mb-0 md:mr-8">
                  <Image
                    src={blockmonData.tokenURI}
                    alt={blockmonData.name}
                    width={180}
                    height={180}
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-48 h-48 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white flex items-center justify-center mb-4 md:mb-0 md:mr-8">
                  <span className="text-6xl">{attribute.icon}</span>
                </div>
              )}

              <div className="text-center md:text-left text-white">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${attribute.bgColor} ${attribute.color}`}
                  >
                    {attribute.icon} {attribute.name}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${rarity.bgColor} ${rarity.color}`}
                  >
                    {rarity.name}
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold">
                  {blockmonData.name}
                </h1>
                <p className="text-xl opacity-90">#{tokenId}</p>
                <div className="mt-2 flex flex-wrap items-center justify-center md:justify-start gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      Lvl {blockmonData.level}
                    </div>
                    <div className="text-xs uppercase tracking-wide opacity-75">
                      Level
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {blockmonData.battleCount}
                    </div>
                    <div className="text-xs uppercase tracking-wide opacity-75">
                      Battles
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{winRate}%</div>
                    <div className="text-xs uppercase tracking-wide opacity-75">
                      Win Rate
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* NFC Write Button - Only show if current user is the owner */}
            {isOwner && (
              <button
                onClick={handleWriteToNFC}
                disabled={nfcWriting}
                className="mt-4 md:mt-0 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-md transition-colors duration-200 flex items-center"
              >
                {nfcWriting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Writing...
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    Write to NFC
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            className={`flex-1 py-4 px-6 text-center border-b-2 font-medium text-sm ${
              activeTab === "stats"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
            onClick={() => setActiveTab("stats")}
          >
            Stats
          </button>
          <button
            className={`flex-1 py-4 px-6 text-center border-b-2 font-medium text-sm ${
              activeTab === "battles"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
            onClick={() => setActiveTab("battles")}
          >
            Battle History
          </button>
          <button
            className={`flex-1 py-4 px-6 text-center border-b-2 font-medium text-sm ${
              activeTab === "levels"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
            onClick={() => setActiveTab("levels")}
          >
            Level History
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "stats" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
                  Combat Stats
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        HP
                      </span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {blockmonData.hp}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-600">
                      <div
                        className="bg-green-500 h-2.5 rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            (blockmonData.hp / 200) * 100
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Attack
                      </span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {blockmonData.baseDamage}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-600">
                      <div
                        className="bg-red-500 h-2.5 rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            (blockmonData.baseDamage / 100) * 100
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Experience
                      </span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {blockmonData.experience}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-600">
                      <div
                        className="bg-blue-500 h-2.5 rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            blockmonData.experience % 100
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
                  General Info
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Birth Time
                    </span>
                    <span className="font-medium text-gray-800 dark:text-white">
                      {new Date(
                        blockmonData.birthTime * 1000
                      ).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Age
                    </span>
                    <span className="font-medium text-gray-800 dark:text-white">
                      {Math.floor(blockmonData.age / 86400)} days
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Last Battle
                    </span>
                    <span className="font-medium text-gray-800 dark:text-white">
                      {blockmonData.lastBattleTime > 0
                        ? new Date(
                            blockmonData.lastBattleTime * 1000
                          ).toLocaleDateString()
                        : "Never battled"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Battles Won
                    </span>
                    <span className="font-medium text-gray-800 dark:text-white">
                      {blockmonData.battleWins} / {blockmonData.battleCount}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Claimed
                    </span>
                    <span className="font-medium text-gray-800 dark:text-white">
                      {blockmonData.claimed ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Owner
                    </span>
                    <Link
                      href={`/owner/${blockmonData.owner}`}
                      className="font-medium text-blue-500 hover:text-blue-700 truncate max-w-[200px]"
                    >
                      {blockmonData.owner}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "battles" && (
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
                Battle History
              </h3>
              {battleData?.battleCompleteds?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                        >
                          Date
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                        >
                          Opponent
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                        >
                          Result
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {battleData.battleCompleteds.map(
                        (battle: BattleRecord) => (
                          <tr key={battle.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {new Date(
                                parseInt(battle.blockTimestamp) * 1000
                              ).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Link
                                href={`/blockmon/${battle.opponentId}`}
                                className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                              >
                                #{battle.opponentId}
                              </Link>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 py-1 text-xs rounded-full ${
                                  battle.won
                                    ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
                                    : "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100"
                                }`}
                              >
                                {battle.won ? "Victory" : "Defeat"}
                              </span>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No battle history found for this Blockmon.
                </div>
              )}
            </div>
          )}

          {activeTab === "levels" && (
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
                Level History
              </h3>
              {levelData?.blocknogotchiLeveledUps?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                        >
                          Date
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                        >
                          New Level
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {levelData.blocknogotchiLeveledUps.map((level: LevelRecord) => (
                        <tr key={level.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {new Date(
                              parseInt(level.blockTimestamp) * 1000
                            ).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                              Level {level.newLevel}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No level history found for this Blockmon.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
