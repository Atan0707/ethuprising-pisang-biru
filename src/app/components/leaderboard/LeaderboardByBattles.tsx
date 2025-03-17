'use client';

import { useQuery, gql } from '@apollo/client';
import { useState } from 'react';
import Link from 'next/link';

// GraphQL query to get battle data
const GET_BATTLE_DATA = gql`
  query GetBattleData {
    battleCompleteds(first: 1000) {
      id
      tokenId
      opponentId
      won
      blockTimestamp
    }
    blocknogotchiCreateds(first: 1000) {
      id
      tokenId
      blockTimestamp
    }
  }
`;

interface BattleData {
  id: string;
  tokenId: string;
  opponentId: string;
  won: boolean;
  blockTimestamp: string;
}

interface PokemonCreated {
  id: string;
  tokenId: string;
  blockTimestamp: string;
}

interface PokemonBattleStats {
  tokenId: string;
  totalBattles: number;
  wins: number;
  lastBattle: string;
}

export default function LeaderboardByBattles() {
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<'battles' | 'wins'>('battles');
  const pageSize = 10;
  
  const { loading, error, data } = useQuery(GET_BATTLE_DATA);

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  if (error) return (
    <div className="text-center text-red-500 p-4">
      Error loading battle data: {error.message}
    </div>
  );

  // Process battle data to get stats per Pokemon
  const battleStats: Record<string, PokemonBattleStats> = {};
  
  // First, add all created Pokemon with 0 battles
  if (data?.blocknogotchiCreateds) {
    data.blocknogotchiCreateds.forEach((pokemon: PokemonCreated) => {
      if (!battleStats[pokemon.tokenId]) {
        battleStats[pokemon.tokenId] = {
          tokenId: pokemon.tokenId,
          totalBattles: 0,
          wins: 0,
          lastBattle: pokemon.blockTimestamp
        };
      }
    });
  }
  
  if (data?.battleCompleteds) {
    // Group battles by tokenId to count them correctly
    const battlesByToken: Record<string, { battles: number, wins: number, lastBattle: string }> = {};
    
    data.battleCompleteds.forEach((battle: BattleData) => {
      const tokenId = battle.tokenId;
      
      if (!battlesByToken[tokenId]) {
        battlesByToken[tokenId] = {
          battles: 0,
          wins: 0,
          lastBattle: '0'
        };
      }
      
      // Increment battles count
      battlesByToken[tokenId].battles += 1;
      
      // Increment wins if won
      if (battle.won) {
        battlesByToken[tokenId].wins += 1;
      }
      
      // Update last battle timestamp if newer
      if (parseInt(battle.blockTimestamp) > parseInt(battlesByToken[tokenId].lastBattle)) {
        battlesByToken[tokenId].lastBattle = battle.blockTimestamp;
      }
    });
    
    // Update battleStats with the correct counts
    Object.entries(battlesByToken).forEach(([tokenId, stats]) => {
      if (!battleStats[tokenId]) {
        battleStats[tokenId] = {
          tokenId,
          totalBattles: 0,
          wins: 0,
          lastBattle: '0'
        };
      }
      
      battleStats[tokenId].totalBattles = stats.battles;
      battleStats[tokenId].wins = stats.wins;
      battleStats[tokenId].lastBattle = stats.lastBattle;
    });
  }

  // Convert to array and sort
  const sortedPokemon = Object.values(battleStats).sort((a, b) => {
    if (sortBy === 'battles') {
      return b.totalBattles - a.totalBattles;
    } else {
      return b.wins - a.wins;
    }
  });

  // Paginate the data
  const paginatedData = sortedPokemon.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(sortedPokemon.length / pageSize);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">All Blockmon by Battles</h2>
        
        <div className="inline-flex rounded-md shadow-sm" role="group">
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
              sortBy === 'battles'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:bg-gray-700'
            }`}
            onClick={() => setSortBy('battles')}
          >
            Total Battles
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
              sortBy === 'wins'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:bg-gray-700'
            }`}
            onClick={() => setSortBy('wins')}
          >
            Wins
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Rank
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Blockmon ID
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Total Battles
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Wins
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Win Rate
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Last Battle
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedData.map((pokemon, index) => (
              <tr key={pokemon.tokenId} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {(page - 1) * pageSize + index + 1}
                    </div>
                    {index < 3 && pokemon.totalBattles > 0 && (
                      <div className="ml-2">
                        {index === 0 && <span className="text-yellow-500">🥇</span>}
                        {index === 1 && <span className="text-gray-400">🥈</span>}
                        {index === 2 && <span className="text-amber-600">🥉</span>}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link href={`/blockmon/${pokemon.tokenId}`} className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 hover:underline">
                    #{pokemon.tokenId}
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                    {pokemon.totalBattles}
                    {pokemon.totalBattles === 0 && <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">(No battles yet)</span>}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-white">{pokemon.wins}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-white">
                    {pokemon.totalBattles > 0 ? `${Math.round((pokemon.wins / pokemon.totalBattles) * 100)}%` : '0%'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {pokemon.totalBattles > 0 
                    ? new Date(parseInt(pokemon.lastBattle) * 1000).toLocaleDateString()
                    : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <nav className="inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-600 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium ${
                  pageNum === page
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {pageNum}
              </button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-600 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              Next
            </button>
          </nav>
        </div>
      )}
    </div>
  );
} 