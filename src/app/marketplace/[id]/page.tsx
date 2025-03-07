'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import { useAppKit, useAppKitAccount } from '@reown/appkit/react';

// Define a type for the listing history items
interface HistoryItem {
  event: string;
  date: string;
  by?: string;
  against?: string;
  price?: string;
}

// Define a type for the listing
interface Listing {
  id: number;
  name: string;
  image: string;
  price: string;
  seller: string;
  attribute: string;
  rarity: string;
  level: number;
  description: string;
  stats: {
    hp: number;
    attack: number;
    defense: number;
    speed: number;
  };
  history: HistoryItem[];
}

export default function ListingDetailPage() {
  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const params = useParams();
  const listingId = params?.id ? (Array.isArray(params.id) ? params.id[0] : params.id) : null;
  
  // Use reown wallet integration
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();

  // Ensure component is mounted to avoid hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch listing data
  useEffect(() => {
    const fetchListingData = async () => {
      if (!listingId) {
        setIsLoading(false);
        toast.error('Invalid listing ID');
        router.push('/marketplace');
        return;
      }
      
      try {
        // Fetch listing data from API
        const response = await fetch(`/api/listings/${listingId}`);
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        const data = await response.json();
        setListing(data);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading listing:', error);
        setIsLoading(false);
        toast.error('Error loading listing details');
        router.push('/marketplace');
      }
    };

    if (mounted) {
      fetchListingData();
    }
  }, [listingId, router, mounted]);

  // Function to handle wallet connection
  const handleConnectWallet = () => {
    toast.loading('Connecting Wallet', {
      description: 'Please approve the connection request in your wallet.',
      icon: '🔗',
    });
    open();
  };

  // Function to handle buying an NFT
  const handleBuyNFT = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!listing) {
      toast.error('Listing not found');
      return;
    }

    setIsPurchasing(true);
    
    try {
      toast.loading('Processing purchase...');
      
      setTimeout(() => {
        toast.dismiss();
        toast.success(`Successfully purchased ${listing.name}!`);
        
        // Redirect to blockmon page after a short delay
        setTimeout(() => {
          router.push(`/blockmon/${listing.id}`);
        }, 1500);
      }, 2000);
    } catch (error) {
      console.error('Error purchasing NFT:', error);
      toast.dismiss();
      toast.error('Failed to purchase NFT');
      setIsPurchasing(false);
    }
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

  // Render not found state
  if (!listing) {
    return (
      <div className="min-h-screen pt-20 pb-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">Listing not found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              The listing you&apos;re looking for doesn&apos;t exist or has been removed.
            </p>
            <div className="mt-6">
              <Link
                href="/marketplace"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Back to Marketplace
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/marketplace"
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Marketplace
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            <div className="relative h-80 md:h-96 w-full bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
              <Image
                src={listing.image}
                alt={listing.name}
                layout="fill"
                objectFit="cover"
                className="rounded-lg"
              />
              <div className="absolute top-4 right-4 bg-blue-600 text-white text-sm font-bold px-3 py-1 rounded-full">
                Lvl {listing.level}
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-start">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{listing.name}</h1>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {listing.attribute}
                </span>
              </div>
              
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Rarity: <span className="font-medium">{listing.rarity}</span>
              </p>
              
              <p className="mt-4 text-gray-700 dark:text-gray-300">
                {listing.description}
              </p>
              
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Stats</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">HP</p>
                    <div className="mt-1 relative pt-1">
                      <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200 dark:bg-gray-600">
                        <div style={{ width: `${(listing.stats.hp / 200) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-red-500"></div>
                      </div>
                      <span className="text-xs font-semibold inline-block text-gray-600 dark:text-gray-400 mt-1">{listing.stats.hp}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Attack</p>
                    <div className="mt-1 relative pt-1">
                      <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200 dark:bg-gray-600">
                        <div style={{ width: `${(listing.stats.attack / 100) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-orange-500"></div>
                      </div>
                      <span className="text-xs font-semibold inline-block text-gray-600 dark:text-gray-400 mt-1">{listing.stats.attack}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Defense</p>
                    <div className="mt-1 relative pt-1">
                      <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200 dark:bg-gray-600">
                        <div style={{ width: `${(listing.stats.defense / 100) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"></div>
                      </div>
                      <span className="text-xs font-semibold inline-block text-gray-600 dark:text-gray-400 mt-1">{listing.stats.defense}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Speed</p>
                    <div className="mt-1 relative pt-1">
                      <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200 dark:bg-gray-600">
                        <div style={{ width: `${(listing.stats.speed / 100) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"></div>
                      </div>
                      <span className="text-xs font-semibold inline-block text-gray-600 dark:text-gray-400 mt-1">{listing.stats.speed}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center">
                  <Image
                    src="/eth-logo.svg"
                    alt="ETH"
                    width={20}
                    height={20}
                    className="mr-2"
                  />
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">{listing.price} ETH</span>
                </div>
                
                {!isConnected ? (
                  <button
                    onClick={handleConnectWallet}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    Connect Wallet
                  </button>
                ) : (
                  <button
                    onClick={handleBuyNFT}
                    disabled={isPurchasing}
                    className={`bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-lg transition-colors ${
                      isPurchasing ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isPurchasing ? 'Processing...' : 'Buy Now'}
                  </button>
                )}
              </div>
              
              <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Seller: {listing.seller}
                {isConnected && address && address.toLowerCase() === listing.seller.toLowerCase() && (
                  <span className="ml-2 text-green-500">(You)</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Transaction History</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Event
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {listing.history.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {item.event}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {item.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {item.by && `By: ${item.by}`}
                        {item.against && `Against: ${item.against}`}
                        {item.price && `Price: ${item.price}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 