'use client';

import LeaderboardByLevel from '@/app/components/leaderboard/LeaderboardByLevel';

export default function LevelsLeaderboardPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        Blockmon Levels Leaderboard
      </h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <LeaderboardByLevel />
      </div>
    </div>
  );
} 