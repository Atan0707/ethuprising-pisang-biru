'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getOwnedNFTs, BlockmonData } from '@/app/utils/marketplace';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useAppKitAccount } from '@reown/appkit/react';

// Enum mapping for attributes
const attributeMap = [
  { name: 'FIRE', color: 'text-red-500', bgColor: 'bg-red-100', icon: '🔥' },
  { name: 'WATER', color: 'text-blue-500', bgColor: 'bg-blue-100', icon: '💧' },
  { name: 'PLANT', color: 'text-green-500', bgColor: 'bg-green-100', icon: '🌿' },
  { name: 'ELECTRIC', color: 'text-yellow-500', bgColor: 'bg-yellow-100', icon: '⚡' },
  { name: 'EARTH', color: 'text-amber-700', bgColor: 'bg-amber-100', icon: '🌍' },
  { name: 'AIR', color: 'text-sky-500', bgColor: 'bg-sky-100', icon: '💨' },
  { name: 'LIGHT', color: 'text-yellow-400', bgColor: 'bg-yellow-50', icon: '✨' },
  { name: 'DARK', color: 'text-purple-700', bgColor: 'bg-purple-100', icon: '🌑' }
];

// Enum mapping for rarity
const rarityMap = [
  { name: 'COMMON', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  { name: 'UNCOMMON', color: 'text-green-600', bgColor: 'bg-green-100' },
  { name: 'RARE', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  { name: 'EPIC', color: 'text-purple-600', bgColor: 'bg-purple-100' },
  { name: 'LEGENDARY', color: 'text-yellow-600', bgColor: 'bg-yellow-100' }
];

export default function OwnerBlockmonsPage() {
  const { address } = useParams();
  const ownerAddress = typeof address === 'string' ? address : '';
  // const router = useRouter();
  const { address: currentUserAddress } = useAppKitAccount();
  
  const [blockmons, setBlockmons] = useState<BlockmonData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [attributeFilter, setAttributeFilter] = useState<number | null>(null);
  const [rarityFilter, setRarityFilter] = useState<number | null>(null);
  const [sortOption, setSortOption] = useState<'level' | 'rarity' | 'attribute' | 'name'>('level');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [marketplaceListings] = useState<number[]>([]);

  // Check if the profile belongs to the current user
  const isCurrentUser = useMemo(() => {
    if (!currentUserAddress || !ownerAddress) return false;
    return currentUserAddress.toLowerCase() === ownerAddress.toLowerCase();
  }, [currentUserAddress, ownerAddress]);

  // Ensure component is mounted to avoid hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch Blockmons data when component mounts
  useEffect(() => {
    const fetchBlockmonsData = async () => {
      if (!mounted || !ownerAddress) return;
      
      setIsLoading(true);
      try {
        // Use the getOwnedNFTs function from marketplace.ts
        const ownedTokens = await getOwnedNFTs(ownerAddress);
        
        if (ownedTokens.length === 0) {
          console.log('No owned tokens found');
          toast.info('No Blockmons found', {
            description: 'This address doesn\'t own any Blockmons yet.',
            icon: '🔍',
          });
        } else {
          console.log(`Found ${ownedTokens.length} owned tokens`);
        }
        
        setBlockmons(ownedTokens);
        
        // TODO: Fetch marketplace listings for this user
        // This would require a new function in marketplace.ts
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching owned NFTs:', error);
        toast.error(`Failed to fetch Blockmons: ${(error as Error).message}`);
        setError('Failed to load Blockmons. Please try again later.');
        setIsLoading(false);
      }
    };

    fetchBlockmonsData();
  }, [mounted, ownerAddress]);

  // Format address for display
  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Filter and sort blockmons
  const filteredAndSortedBlockmons = useMemo(() => {
    let result = [...blockmons];
    
    // Apply search filter
    if (searchTerm) {
      result = result.filter(blockmon => 
        blockmon.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply attribute filter
    if (attributeFilter !== null) {
      result = result.filter(blockmon => blockmon.attribute === attributeFilter);
    }
    
    // Apply rarity filter
    if (rarityFilter !== null) {
      result = result.filter(blockmon => blockmon.rarity === rarityFilter);
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (sortOption) {
        case 'level':
          comparison = a.level - b.level;
          break;
        case 'rarity':
          comparison = a.rarity - b.rarity;
          break;
        case 'attribute':
          comparison = a.attribute - b.attribute;
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    return result;
  }, [blockmons, searchTerm, attributeFilter, rarityFilter, sortOption, sortDirection]);

  // Calculate stats
  const stats = useMemo(() => {
    if (blockmons.length === 0) {
      return {
        total: 0,
        highestLevel: 0,
        rarityDistribution: [0, 0, 0, 0, 0],
        attributeDistribution: [0, 0, 0, 0, 0, 0, 0, 0]
      };
    }
    
    const rarityDistribution = [0, 0, 0, 0, 0];
    const attributeDistribution = [0, 0, 0, 0, 0, 0, 0, 0];
    let highestLevel = 0;
    
    blockmons.forEach(blockmon => {
      // Update highest level
      if (blockmon.level > highestLevel) {
        highestLevel = blockmon.level;
      }
      
      // Update rarity distribution
      if (blockmon.rarity >= 0 && blockmon.rarity < 5) {
        rarityDistribution[blockmon.rarity]++;
      }
      
      // Update attribute distribution
      if (blockmon.attribute >= 0 && blockmon.attribute < 8) {
        attributeDistribution[blockmon.attribute]++;
      }
    });
    
    return {
      total: blockmons.length,
      highestLevel,
      rarityDistribution,
      attributeDistribution
    };
  }, [blockmons]);

  // Render loading state
  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 pb-10 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!mounted) return null;

  return (
    <div className="min-h-screen pt-20 pb-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/" className="text-blue-500 hover:text-blue-700 flex items-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Home
          </Link>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {isCurrentUser ? 'My Blockmon Collection' : `Blockmons owned by ${formatAddress(ownerAddress)}`}
              </h1>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Address: {ownerAddress}
              </p>
            </div>
            {/* {isCurrentUser && (
              <Link
                href="/mint"
                className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Mint New Blockmon
              </Link>
            )} */}
          </div>
        </div>

        {error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg" role="alert">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        ) : blockmons.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">No Blockmons found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              This address doesn&apos;t own any Blockmons yet.
            </p>
            {/* <div className="mt-6">
              <button
                onClick={() => router.push('/mint')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Mint a Blockmon
              </button>
            </div> */}
          </div>
        ) : (
          <>
            {/* Stats Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-6">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Collection Stats</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.total}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Blockmon</div>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">Lvl {stats.highestLevel}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Highest Level</div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {stats.rarityDistribution[4]} / {stats.total}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Legendary Blockmon</div>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
                    <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                      {Math.max(...stats.attributeDistribution) > 0 
                        ? attributeMap[stats.attributeDistribution.indexOf(Math.max(...stats.attributeDistribution))].name 
                        : 'None'}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Most Common Attribute</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Filters and Sorting */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-6">
              <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <label htmlFor="search" className="sr-only">Search</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <input
                        id="search"
                        name="search"
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Search by name"
                        type="search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div>
                      <label htmlFor="attribute-filter" className="sr-only">Filter by Attribute</label>
                      <select
                        id="attribute-filter"
                        name="attribute-filter"
                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={attributeFilter === null ? '' : attributeFilter}
                        onChange={(e) => setAttributeFilter(e.target.value === '' ? null : Number(e.target.value))}
                      >
                        <option value="">All Attributes</option>
                        {attributeMap.map((attr, index) => (
                          <option key={index} value={index}>{attr.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="rarity-filter" className="sr-only">Filter by Rarity</label>
                      <select
                        id="rarity-filter"
                        name="rarity-filter"
                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={rarityFilter === null ? '' : rarityFilter}
                        onChange={(e) => setRarityFilter(e.target.value === '' ? null : Number(e.target.value))}
                      >
                        <option value="">All Rarities</option>
                        {rarityMap.map((rarity, index) => (
                          <option key={index} value={index}>{rarity.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <label htmlFor="sort-option" className="sr-only">Sort by</label>
                      <select
                        id="sort-option"
                        name="sort-option"
                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={sortOption}
                        onChange={(e) => setSortOption(e.target.value as 'level' | 'rarity' | 'attribute' | 'name')}
                      >
                        <option value="level">Level</option>
                        <option value="rarity">Rarity</option>
                        <option value="attribute">Attribute</option>
                        <option value="name">Name</option>
                      </select>
                      
                      <button
                        type="button"
                        onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                        className="inline-flex items-center p-2 border border-gray-300 rounded-md text-gray-700 dark:text-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        {sortDirection === 'asc' ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                  Showing {filteredAndSortedBlockmons.length} of {blockmons.length} Blockmon
                </div>
              </div>
            </div>
            
            {/* Blockmon Grid */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                {filteredAndSortedBlockmons.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">No Blockmon match your filters.</p>
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setAttributeFilter(null);
                        setRarityFilter(null);
                      }}
                      className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Clear Filters
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredAndSortedBlockmons.map((blockmon, index) => (
                      <motion.div
                        key={blockmon.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <div className="border rounded-lg overflow-hidden cursor-pointer transition-all border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-lg transform hover:-translate-y-1">
                          <div className="relative h-48 w-full bg-gray-200 dark:bg-gray-700">
                            {blockmon.tokenURI ? (
                              <Image
                                src={blockmon.tokenURI}
                                alt={blockmon.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center">
                                <span className="text-6xl">{attributeMap[blockmon.attribute].icon}</span>
                              </div>
                            )}
                            <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                              Lvl {blockmon.level}
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                              <h3 className="text-lg font-semibold text-white">{blockmon.name}</h3>
                              <div className="flex items-center gap-1 mt-1">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${attributeMap[blockmon.attribute].bgColor} ${attributeMap[blockmon.attribute].color}`}>
                                  {attributeMap[blockmon.attribute].icon} {attributeMap[blockmon.attribute].name}
                                </span>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${rarityMap[blockmon.rarity].bgColor} ${rarityMap[blockmon.rarity].color}`}>
                                  {rarityMap[blockmon.rarity].name}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="p-4">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                ID: #{blockmon.id}
                              </span>
                              {marketplaceListings.includes(blockmon.id) && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                  Listed
                                </span>
                              )}
                            </div>
                            <div className="mt-2 flex justify-between">
                              <Link 
                                href={`/blockmon/${blockmon.id}`}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                              >
                                View Details
                              </Link>
                              {isCurrentUser && (
                                <Link 
                                  href={`/marketplace/list/${blockmon.id}`} 
                                  className="text-green-600 hover:text-green-800 text-sm font-medium"
                                >
                                  List for Sale
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 