'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import { useAppKit, useAppKitAccount, useAppKitProvider } from '@reown/appkit/react';
import { getListingDetails, purchaseNFT, DetailedListing } from '@/app/utils/marketplace';
import { Eip1193Provider } from 'ethers';

export default function ListingDetailPage() {
  const [listing, setListing] = useState<DetailedListing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const params = useParams();
  const listingId = params?.id ? (Array.isArray(params.id) ? params.id[0] : params.id) : null;
  
  // Use reown wallet integration
  const { open } = useAppKit();
  const { isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider('eip155');

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
        // router.push('/marketplace');
        return;
      }
      
      try {
        // Fetch listing data from blockchain/subgraph
        const data = await getListingDetails(parseInt(listingId));
        
        if (!data) {
          throw new Error('Listing not found');
        }
        
        setListing(data);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading listing:', error);
        setIsLoading(false);
        toast.error('Error loading listing details');
        // router.push('/marketplace');
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
    if (!isConnected || !walletProvider) {
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
      
      // Call the real purchase function
      const success = await purchaseNFT(listing.id, listing.price, walletProvider as Eip1193Provider);
      
      if (success) {
        toast.dismiss();
        toast.success(`Successfully purchased ${listing.name}!`);
        
        // Redirect to blockmon page after a short delay
        setTimeout(() => {
          router.push(`/blockmon/${listing.id}`);
        }, 1500);
      } else {
        setIsPurchasing(false);
      }
    } catch (error) {
      console.error('Error purchasing NFT:', error);
      toast.dismiss();
      toast.error('Failed to purchase NFT');
      setIsPurchasing(false);
    }
  };

  // Format address for display
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Format age to be more readable
  const formatAge = (ageValue: number) => {
    // If age is in seconds, convert to days
    const days = Math.floor(ageValue / (60 * 60 * 24));
    
    if (days > 365) {
      const years = (days / 365).toFixed(1);
      return `${years} years `;
    } else if (days > 30) {
      const months = Math.floor(days / 30);
      return `${months} months `;
    } else if (days > 0) {
      return `${days} days `;
    } else {
      const hours = Math.floor(ageValue / (60 * 60));
      return `${hours} hours `;
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
    <div className="min-h-screen pt-20 pb-10 bg-gray-50 dark:bg-gray-900">
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

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
            <div className="relative h-96 w-full bg-gray-200 dark:bg-gray-700 rounded-xl overflow-hidden border-4 border-yellow-400 dark:border-yellow-600">
              <Image
                src={listing.image}
                alt={listing.name}
                width={500}
                height={500}
                className="rounded-lg w-full h-full object-contain"
                priority
              />
              <div className="absolute top-4 right-4 bg-blue-600 text-white text-sm font-bold px-3 py-1 rounded-full">
                Lvl {listing.level}
              </div>
            </div>
            
            <div className="flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{listing.name}</h1>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {listing.attribute || 'NORMAL'}
                  </span>
                </div>
                
                <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    Rarity: <span className="font-medium">{listing.rarity}</span>
                  </p>
                  
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Owner: <Link href={`/owner/${listing.rawData.owner}`} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline">
                      {formatAddress(listing.rawData.owner)}
                    </Link>
                  </p>
                </div>
              </div>
              
              <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Data</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">HP</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{listing.rawData.hp}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Base Damage</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{listing.rawData.baseDamage}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Battle Count</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{listing.rawData.battleCount}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Battle Wins</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{listing.rawData.battleWins}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Age</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatAge(listing.rawData.age)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Experience</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{listing.rawData.experience}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 p-6 rounded-xl">
                <div className="flex items-center">
                  <Image
                    src="/eth-logo.svg"
                    alt="ETH"
                    width={28}
                    height={28}
                    className="mr-2"
                  />
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">{listing.price} ETH</span>
                </div>
                <div>
                  {!isConnected ? (
                    <button
                      onClick={handleConnectWallet}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors shadow-md"
                    >
                      Connect Wallet
                    </button>
                  ) : (
                    <button
                      onClick={handleBuyNFT}
                      disabled={isPurchasing}
                      className={`${
                        isPurchasing
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-green-600 hover:bg-green-700'
                      } text-white font-medium py-3 px-6 rounded-lg transition-colors shadow-md`}
                    >
                      {isPurchasing ? 'Processing...' : 'Buy Now'}
                    </button>
                  )}
                </div>
              </div>
              
              <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                Seller: {formatAddress(listing.seller)}
              </div>
            </div>
          </div>
          
          <div className="p-8 border-t border-gray-200 dark:border-gray-700">
            <button 
              onClick={() => document.getElementById('data-details')?.classList.toggle('hidden')}
              className="flex items-center justify-between w-full mb-4 text-lg font-semibold text-gray-900 dark:text-white"
            >
              <span>Detailed Data</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div id="data-details" className="hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    <tr>
                      <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Name</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{listing.rawData.name}</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Attribute</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{listing.rawData.attribute}</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Rarity</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{listing.rawData.rarity}</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Level</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{listing.rawData.level}</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">HP</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{listing.rawData.hp}</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Base Damage</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{listing.rawData.baseDamage}</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Battle Count</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{listing.rawData.battleCount}</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Battle Wins</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{listing.rawData.battleWins}</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Birth Time</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{listing.rawData.birthTime}</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Last Battle Time</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{listing.rawData.lastBattleTime}</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Claimed</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{listing.rawData.claimed ? 'Yes' : 'No'}</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Owner</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <Link href={`/owner/${listing.rawData.owner}`} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline">
                          {formatAddress(listing.rawData.owner)}
                        </Link>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Token URI</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <a href={listing.rawData.tokenURI} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline truncate block max-w-xs">
                          {listing.rawData.tokenURI}
                        </a>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Age</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatAge(listing.rawData.age)}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Experience</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{listing.rawData.experience}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          <div className="p-8 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Transaction History</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 rounded-lg overflow-hidden">
                <thead className="bg-gray-100 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Event</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">From</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">To</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Price</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {listing.history.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{item.event}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{item.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {item.by ? (
                          <Link href={`/owner/${item.by}`} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline">
                            {formatAddress(item.by)}
                          </Link>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {item.against ? (
                          <Link href={`/owner/${item.against}`} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline">
                            {formatAddress(item.against)}
                          </Link>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {item.price ? (
                          <div className="flex items-center">
                            <Image src="/eth-logo.svg" alt="ETH" width={16} height={16} className="mr-1" />
                            <span>{item.price}</span>
                          </div>
                        ) : '-'}
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