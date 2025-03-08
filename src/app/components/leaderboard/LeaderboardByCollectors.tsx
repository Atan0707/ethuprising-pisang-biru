'use client';

import { useQuery, gql } from '@apollo/client';
import { useState } from 'react';
import Link from 'next/link';

// GraphQL query to get Transfer data
const GET_TRANSFER_DATA = gql`
  query GetTransferData {
    transfers(first: 1000) {
      id
      from
      to
      tokenId
      blockTimestamp
      transactionHash
    }
  }
`;

interface Transfer {
  id: string;
  from: string;
  to: string;
  tokenId: string;
  blockTimestamp: string;
  transactionHash: string;
}

interface CollectorStats {
  address: string;
  tokenCount: number;
  lastActivity: string;
}

export default function LeaderboardByCollectors() {
  const [page, setPage] = useState(1);
  const pageSize = 10;
  
  const { loading, error, data } = useQuery(GET_TRANSFER_DATA);

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  if (error) return (
    <div className="text-center text-red-500 p-4">
      Error loading collector data: {error.message}
    </div>
  );

  // Process data to get current owners and their token counts
  const processOwnershipData = () => {
    const currentOwnership: Record<string, string> = {}; // tokenId -> owner
    const ownerActivity: Record<string, string> = {}; // owner -> latest timestamp
    
    // Process transfers to determine current ownership
    if (data?.transfers) {
      // Group transfers by tokenId
      const transfersByToken: Record<string, Transfer[]> = {};
      
      data.transfers.forEach((transfer: Transfer) => {
        const tokenId = transfer.tokenId;
        if (!transfersByToken[tokenId]) {
          transfersByToken[tokenId] = [];
        }
        transfersByToken[tokenId].push(transfer);
      });
      
      // For each token, find the most recent transfer to determine current owner
      Object.entries(transfersByToken).forEach(([tokenId, transfers]) => {
        // Sort transfers by timestamp (ascending)
        const sortedTransfers = transfers.sort(
          (a: Transfer, b: Transfer) => 
            parseInt(a.blockTimestamp) - parseInt(b.blockTimestamp)
        );
        
        // The last transfer in the sorted array is the most recent one
        const latestTransfer = sortedTransfers[sortedTransfers.length - 1];
        
        // Set current owner
        currentOwnership[tokenId] = latestTransfer.to;
        
        // Update activity timestamps for all involved addresses
        sortedTransfers.forEach((transfer: Transfer) => {
          const timestamp = parseInt(transfer.blockTimestamp);
          
          if (!ownerActivity[transfer.from] || timestamp > parseInt(ownerActivity[transfer.from])) {
            ownerActivity[transfer.from] = transfer.blockTimestamp;
          }
          
          if (!ownerActivity[transfer.to] || timestamp > parseInt(ownerActivity[transfer.to])) {
            ownerActivity[transfer.to] = transfer.blockTimestamp;
          }
        });
      });
    }
    
    // Count tokens per owner
    const ownerCounts: Record<string, number> = {};
    Object.values(currentOwnership).forEach((owner) => {
      ownerCounts[owner] = (ownerCounts[owner] || 0) + 1;
    });
    
    // Create collector stats array
    const collectors: CollectorStats[] = Object.keys(ownerCounts)
      .filter(address => 
        // Filter out zero address and any other special addresses if needed
        address !== "0x0000000000000000000000000000000000000000"
      )
      .map(address => ({
        address,
        tokenCount: ownerCounts[address],
        lastActivity: ownerActivity[address]
      }));
    
    // Sort by token count (descending)
    return collectors.sort((a, b) => b.tokenCount - a.tokenCount);
  };

  const collectors = processOwnershipData();
  
  // Paginate the data
  const paginatedData = collectors.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(collectors.length / pageSize);

  // Format address for display
  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Top Blockmon Collectors</h2>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Rank
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Collector
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Blockmons Owned
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Last Activity
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedData.map((collector: CollectorStats, index: number) => (
              <tr key={collector.address} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'}>
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
                  <Link href={`/owner/${collector.address}`} className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 hover:underline">
                    {formatAddress(collector.address)}
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-semibold text-purple-600 dark:text-purple-400">{collector.tokenCount}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {new Date(parseInt(collector.lastActivity) * 1000).toLocaleDateString()}
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