'use client';

import { useQuery, gql } from '@apollo/client';
import { useState } from 'react';
import Link from 'next/link';

// GraphQL query to get Pokemon level data
const GET_POKEMON_LEVELS = gql`
  query GetPokemonLevels {
    pokemonLeveledUps(first: 100, orderBy: newLevel, orderDirection: desc) {
      id
      tokenId
      newLevel
      blockTimestamp
      transactionHash
    }
  }
`;

interface PokemonLevel {
  id: string;
  tokenId: string;
  newLevel: number;
  blockTimestamp: string;
  transactionHash: string;
}

export default function LeaderboardByLevel() {
  const [page, setPage] = useState(1);
  const pageSize = 10;
  
  const { loading, error, data } = useQuery(GET_POKEMON_LEVELS);

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  if (error) return (
    <div className="text-center text-red-500 p-4">
      Error loading leaderboard data: {error.message}
    </div>
  );

  // Process data to get unique Pokemon with highest level
  const processedData: Record<string, PokemonLevel> = {};
  
  if (data?.pokemonLeveledUps) {
    data.pokemonLeveledUps.forEach((item: PokemonLevel) => {
      const tokenId = item.tokenId;
      if (!processedData[tokenId] || processedData[tokenId].newLevel < item.newLevel) {
        processedData[tokenId] = item;
      }
    });
  }

  // Convert to array and sort by level
  const sortedPokemon = Object.values(processedData)
    .sort((a: PokemonLevel, b: PokemonLevel) => b.newLevel - a.newLevel);

  // Paginate the data
  const paginatedData = sortedPokemon.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(sortedPokemon.length / pageSize);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Top Blockmon by Level</h2>
      
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
                Level
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Last Level Up
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedData.map((pokemon: PokemonLevel, index: number) => (
              <tr key={pokemon.id} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {(page - 1) * pageSize + index + 1}
                    </div>
                    {index < 3 && (
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
                  <div className="text-sm font-semibold text-blue-600 dark:text-blue-400">Level {pokemon.newLevel}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {new Date(parseInt(pokemon.blockTimestamp) * 1000).toLocaleDateString()}
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