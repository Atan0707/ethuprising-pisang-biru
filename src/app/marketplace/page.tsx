'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAppKit, useAppKitAccount, useAppKitProvider } from '@reown/appkit/react';
import { toast } from 'sonner';
import { getActiveListings, purchaseNFT, MarketplaceListing, getAttributeString, getRarityString } from '@/app/utils/marketplace';
import { Eip1193Provider } from 'ethers';

export default function MarketplacePage() {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  
  // Use reown wallet integration
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider('eip155');

  // Ensure component is mounted to avoid hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch listings from the blockchain
  useEffect(() => {
    const fetchListings = async () => {
      if (!mounted) return;
      
      setIsLoading(true);
      try {
        const activeListings = await getActiveListings();
        console.log('Active listings:', activeListings);
        setListings(activeListings);
      } catch (error) {
        console.error('Error fetching listings:', error);
        toast.error('Failed to load marketplace listings');
      } finally {
        setIsLoading(false);
      }
    };

    fetchListings();

    // Set up a refresh interval to periodically update listings
    const refreshInterval = setInterval(fetchListings, 30000); // Refresh every 30 seconds

    // Clean up the interval when the component unmounts
    return () => clearInterval(refreshInterval);
  }, [mounted]);

  // Function to handle buying an NFT
  const handleBuyNFT = async (id: number, price: string) => {
    if (!isConnected || !walletProvider) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      toast.loading('Processing purchase...');
      
      // Call the real purchase function
      const success = await purchaseNFT(id, price, walletProvider as Eip1193Provider);
      
      if (success) {
        toast.dismiss();
        toast.success(`Successfully purchased Blockmon #${id}!`);
        
        // Remove the purchased listing from the display
        setListings(listings.filter(listing => listing.id !== id));
        
        // Redirect to blockmon page after a short delay
        setTimeout(() => {
          router.push(`/blockmon/${id}`);
        }, 1500);
      }
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
                  Sell your NFT
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
                    width={300}
                    height={200}
                    className="rounded-t-lg w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                    Lvl {listing.level}
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{listing.name}</h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {getAttributeString(listing.attribute)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Rarity: <span className="font-medium">{getRarityString(listing.rarity)}</span>
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
                    Seller: {formatAddress(listing.seller)}
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