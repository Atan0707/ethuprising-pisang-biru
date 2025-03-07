'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAppKit, useAppKitAccount } from '@reown/appkit/react';
import { toast } from 'sonner';

// Mock data for initial development - will be replaced with actual contract calls
const MOCK_LISTINGS = [
  {
    id: 1,
    name: 'Fire Blockmon',
    image: '/blockmon/fire.jpg',
    price: '0.05',
    seller: '0x1234...5678',
    attribute: 'FIRE',
    rarity: 'RARE',
    level: 5
  },
  {
    id: 2,
    name: 'Water Blockmon',
    image: '/blockmon/water.jpg',
    price: '0.08',
    seller: '0x8765...4321',
    attribute: 'WATER',
    rarity: 'UNCOMMON',
    level: 3
  },
  {
    id: 3,
    name: 'Plant Blockmon',
    image: '/blockmon/plant.jpg',
    price: '0.12',
    seller: '0x5678...1234',
    attribute: 'PLANT',
    rarity: 'EPIC',
    level: 7
  }
];

export default function MarketplacePage() {
  const [listings, setListings] = useState(MOCK_LISTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  
  // Use reown wallet integration
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();

  // Ensure component is mounted to avoid hydration issues
  useEffect(() => {
    setMounted(true);
    
    // Simulate loading data from blockchain
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  // Function to handle buying an NFT
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleBuyNFT = async (id: number, price: string) => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      toast.loading('Processing purchase...');
      
      // For now, we'll just simulate a successful purchase
      setTimeout(() => {
        toast.dismiss();
        toast.success(`Successfully purchased Blockmon #${id}!`);
        
        // Remove the purchased listing from the display
        setListings(listings.filter(listing => listing.id !== id));
      }, 2000);
    } catch (error) {
      console.error('Error purchasing NFT:', error);
      toast.dismiss();
      toast.error('Failed to purchase NFT');
    }
  };

  // Function to handle listing an NFT
  const handleListNFT = () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }
    
    router.push('/marketplace/list');
  };

  // Function to handle wallet connection
  const handleConnectWallet = () => {
    toast.loading('Connecting Wallet', {
      description: 'Please approve the connection request in your wallet.',
      icon: '🔗',
    });
    open();
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 pb-10 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Format address for display
  const formatAddress = (address: string | undefined) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Blockmon Marketplace</h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Buy and sell your Blockmon NFTs
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-4">
            {!isConnected ? (
              <button
                onClick={handleConnectWallet}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Connect Wallet
              </button>
            ) : (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {formatAddress(address)}
                </span>
                <button
                  onClick={handleListNFT}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  List NFT
                </button>
              </div>
            )}
          </div>
        </div>

        {listings.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">No listings available</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Be the first to list your Blockmon NFT on the marketplace!
            </p>
            <div className="mt-6">
              <button
                onClick={handleListNFT}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                List Your NFT
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {listings.map((listing) => (
              <div
                key={listing.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-transform hover:scale-105"
              >
                <div className="relative h-48 w-full bg-gray-200 dark:bg-gray-700">
                  <Image
                    src={listing.image}
                    alt={listing.name}
                    layout="fill"
                    objectFit="cover"
                    className="rounded-t-lg"
                  />
                  <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                    Lvl {listing.level}
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{listing.name}</h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {listing.attribute}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Rarity: <span className="font-medium">{listing.rarity}</span>
                  </p>
                  <div className="mt-4 flex justify-between items-center">
                    <div className="flex items-center">
                      <Image
                        src="/eth-logo.svg"
                        alt="ETH"
                        width={16}
                        height={16}
                        className="mr-1"
                      />
                      <span className="font-bold text-gray-900 dark:text-white">{listing.price} ETH</span>
                    </div>
                    <button
                      onClick={() => handleBuyNFT(listing.id, listing.price)}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-1.5 px-3 rounded transition-colors"
                    >
                      Buy Now
                    </button>
                  </div>
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Seller: {listing.seller}
                  </div>
                </div>
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700">
                  <Link
                    href={`/marketplace/${listing.id}`}
                    className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 