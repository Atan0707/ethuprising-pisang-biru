'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { P2PListing, getP2PListings } from '@/app/utils/p2p-swap';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import BlocknogotchiImage from '@/app/components/BlocknogotchiImage';
// import { getBlocknogotchiContract } from '@/app/utils/contractUtils';
// import { hashToId } from '@/app/utils/contractUtils';

export default function ListingsGrid() {
  const [listings, setListings] = useState<P2PListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

//   const contract = getBlocknogotchiContract();
//   const id = await hashToId(listings[3].id, contract);
//   console.log(id);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        setIsLoading(true);
        const data = await getP2PListings();
        console.log('Fetched listings data:', data);
        
        // Log each listing's image URI
        data.forEach((listing, index) => {
          console.log(`Listing ${index} - ID: ${listing.id}, Name: ${listing.name}, Image URI: ${listing.image}`);
        });
        
        setListings(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching listings:', err);
        setError('Failed to load available listings. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchListings();
  }, []);

  // Get attribute and rarity display strings
  const getAttributeDisplay = (attributeNum: number) => {
    const attributes = ['Fire', 'Water', 'Earth', 'Air', 'Light', 'Dark'];
    return attributes[attributeNum] || 'Unknown';
  };

  const getRarityDisplay = (rarityNum: number) => {
    const rarities = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
    return rarities[rarityNum] || 'Unknown';
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
            <Skeleton className="h-36 w-full" />
            <div className="p-3 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-8 w-full mt-2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 md:py-12">
        <div className="text-red-500 mb-4">⚠️</div>
        <h3 className="text-xl font-semibold mb-2">Something went wrong</h3>
        <p className="text-gray-400 mb-4 md:mb-6">{error}</p>
        <Button 
          onClick={() => window.location.reload()}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="text-center py-8 md:py-12 bg-gray-800 rounded-lg shadow-md">
        <div className="text-5xl mb-4">🔍</div>
        <h3 className="text-xl font-semibold mb-2">No listings found</h3>
        <p className="text-gray-400 mb-4 md:mb-6">There are currently no Blocknogotchi available for trade.</p>
        <Button 
          onClick={() => router.push('/p2p/create')}
          className="bg-green-600 hover:bg-green-700"
        >
          Create a Listing
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
      {listings.map((listing) => (
        <div key={listing.id} className="bg-gray-800 rounded-lg overflow-hidden shadow-lg transition-transform hover:scale-105">
          <div className="relative aspect-square bg-gray-700">
            <BlocknogotchiImage
              tokenURI={listing.image || `/blockmon/${getAttributeDisplay(listing.attribute).toLowerCase()}.jpg` || '/blockmon/default.png'}
              alt={listing.name}
              className="object-cover"
            />
            <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
              {getAttributeDisplay(listing.attribute)}
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 md:p-3">
              <div className="flex justify-between items-center">
                <span className="text-white text-sm md:text-base font-medium truncate">{listing.name}</span>
                <span className="bg-purple-600 text-white text-xs px-1.5 py-0.5 md:px-2 md:py-1 rounded">
                  Lvl {listing.level}
                </span>
              </div>
            </div>
          </div>
          
          <div className="p-2 md:p-4 space-y-2 md:space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-xs md:text-sm">Rarity</span>
              <span className="text-white text-xs md:text-sm font-medium">{getRarityDisplay(listing.rarity)}</span>
            </div>
            
            <div className="flex justify-between items-center pt-1 md:pt-2 border-t border-gray-700">
              <span className="text-gray-400 text-xs md:text-sm">Price</span>
              <span className="text-white text-xs md:text-sm font-bold flex items-center">
                <Image
                  src="/eth-logo.svg"
                  alt="ETH"
                  width={12}
                  height={12}
                  className="mr-1"
                />
                {listing.price} ETH
              </span>
            </div>
            
            <Button 
              onClick={() => router.push(`/blockmon/${listing.id}`)}
              className="w-full mt-1 md:mt-2 bg-blue-600 hover:bg-blue-700 py-1 md:py-2 text-xs md:text-sm"
            >
              View Details
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
} 