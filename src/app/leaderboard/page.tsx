'use client';

import { useState } from 'react';
import { useQuery, gql } from '@apollo/client';
import LeaderboardByLevel from '@/app/components/leaderboard/LeaderboardByLevel';
import LeaderboardByBattles from '@/app/components/leaderboard/LeaderboardByBattles';

// Query to get summary statistics
const GET_SUMMARY_STATS = gql`
  query GetSummaryStats {
    pokemonLeveledUps(first: 5, orderBy: newLevel, orderDirection: desc) {
      tokenId
      newLevel
    }
    battleCompleteds(first: 1000) {
      tokenId
      opponentId
      won
    }
  }
`;

interface LevelUp {
  tokenId: string;
  newLevel: number;
}

interface Battle {
  tokenId: string;
  opponentId: string;
  won: boolean;
}

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<'level' | 'battles'>('level');
  const { loading, data } = useQuery(GET_SUMMARY_STATS);

  // Calculate summary stats
  const totalBattles = data?.battleCompleteds?.length || 0;
  
  // Find unique Blockmon IDs
  const uniqueBlockmonIds = new Set<string>();
  data?.battleCompleteds?.forEach((battle: Battle) => {
    uniqueBlockmonIds.add(battle.tokenId);
    uniqueBlockmonIds.add(battle.opponentId);
  });
  
  data?.pokemonLeveledUps?.forEach((levelUp: LevelUp) => {
    uniqueBlockmonIds.add(levelUp.tokenId);
  });
  
  const totalBlockmon = uniqueBlockmonIds.size;
  
  // Get highest level
  const highestLevel = data?.pokemonLeveledUps?.[0]?.newLevel || 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        Blockmon Leaderboard
      </h1>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col items-center justify-center">
          <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">{totalBlockmon}</div>
          <div className="text-gray-600 dark:text-gray-400 mt-2">Active Blockmon</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col items-center justify-center">
          <div className="text-4xl font-bold text-purple-600 dark:text-purple-400">{totalBattles}</div>
          <div className="text-gray-600 dark:text-gray-400 mt-2">Total Battles</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col items-center justify-center">
          <div className="text-4xl font-bold text-green-600 dark:text-green-400">{highestLevel}</div>
          <div className="text-gray-600 dark:text-gray-400 mt-2">Highest Level</div>
        </div>
      </div>
      
      <div className="flex justify-center mb-8">
        <div className="inline-flex rounded-md shadow-sm" role="group">
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
              activeTab === 'level'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:bg-gray-700'
            }`}
            onClick={() => setActiveTab('level')}
          >
            By Level
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
              activeTab === 'battles'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:bg-gray-700'
            }`}
            onClick={() => setActiveTab('battles')}
          >
            By Battles
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          activeTab === 'level' ? (
            <LeaderboardByLevel />
          ) : (
            <LeaderboardByBattles />
          )
        )}
      </div>
    </div>
  );
} 