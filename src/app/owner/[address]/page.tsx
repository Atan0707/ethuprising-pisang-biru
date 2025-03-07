'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getOwnedNFTs, BlockmonData } from '@/app/utils/marketplace';
import { toast } from 'sonner';

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
  const router = useRouter();
  
  const [blockmons, setBlockmons] = useState<BlockmonData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/" className="text-blue-500 hover:text-blue-700 flex items-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Blockmons owned by {formatAddress(ownerAddress)}
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Full address: {ownerAddress}
          </p>
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
            <div className="mt-6">
              <button
                onClick={() => router.push('/mint')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Mint a Blockmon
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {blockmons.map((blockmon) => (
                  <Link href={`/blockmon/${blockmon.id}`} key={blockmon.id}>
                    <div className="border rounded-lg overflow-hidden cursor-pointer transition-all border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-lg">
                      <div className="relative h-40 w-full bg-gray-200 dark:bg-gray-700">
                        {blockmon.tokenURI ? (
                          <Image
                            src={blockmon.tokenURI}
                            alt={blockmon.name}
                            layout="fill"
                            objectFit="cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <span className="text-6xl">{attributeMap[blockmon.attribute].icon}</span>
                          </div>
                        )}
                        <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                          Lvl {blockmon.level}
                        </div>
                      </div>
                      <div className="p-3">
                        <div className="flex justify-between items-start">
                          <h3 className="text-md font-semibold text-gray-900 dark:text-white">{blockmon.name}</h3>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${attributeMap[blockmon.attribute].bgColor} ${attributeMap[blockmon.attribute].color}`}>
                            {attributeMap[blockmon.attribute].name}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Rarity: <span className="font-medium">{rarityMap[blockmon.rarity].name}</span>
                        </p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          ID: <span className="font-medium">#{blockmon.id}</span>
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 