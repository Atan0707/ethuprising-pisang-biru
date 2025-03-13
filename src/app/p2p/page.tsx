'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
// import Link from 'next/link';
import { useAppKit, useAppKitAccount } from '@reown/appkit/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
// import { getAttributeString, getRarityString } from '@/app/utils/marketplace';
import { 
  getP2PListingDetails, 
  // P2PListing, 
  DetailedP2PListing } from '@/app/utils/p2p-swap';

export default function P2PSwapPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedListing, setScannedListing] = useState<DetailedP2PListing | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  
  // Use reown wallet integration
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();

  // Ensure component is mounted to avoid hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Function to simulate NFC scanning
  const handleScanNFC = async () => {
    setIsScanning(true);
    setScannedListing(null);
    
    // Simulate NFC scanning process
    setTimeout(async () => {
      try {
        // For demo purposes, we'll randomly select a token ID between 1 and 10
        // In a real implementation, you would decode the NFC data to get the token ID
        const tokenId = Math.floor(Math.random() * 10) + 1;
        
        // Fetch the listing details for this token ID
        setIsLoading(true);
        const listing = await getP2PListingDetails(tokenId);
        
        if (listing && listing.status === 'active') {
          setScannedListing(listing);
          toast.success('NFC card scanned successfully! Found an active listing.');
        } else if (listing) {
          toast.info(`This NFT is not currently for sale (Status: ${listing.status}).`);
        } else {
          toast.info('No active listing found for this NFC card.');
        }
      } catch (error) {
        console.error('Error processing NFC scan:', error);
        toast.error('Failed to process NFC scan');
      } finally {
        setIsScanning(false);
        setIsLoading(false);
      }
    }, 2000);
  };

  // Function to handle creating a new P2P swap listing
  const handleCreateListing = () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }
    
    router.push('/p2p/create');
  };

  // Function to handle wallet connection
  const handleConnectWallet = () => {
    toast.loading('Connecting Wallet', {
      description: 'Please approve the connection request in your wallet.',
      icon: '🔗',
    });
    open();
  };

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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">P2P Physical NFT Swap</h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Buy and sell physical NFT cards with secure escrow
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-4">
            {!isConnected ? (
              <Button
                onClick={handleConnectWallet}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Connect Wallet
              </Button>
            ) : (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {formatAddress(address)}
                </span>
                <Button
                  onClick={handleCreateListing}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Sell Physical NFT
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* NFC Scan Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-blue-100 dark:bg-blue-900 mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-600 dark:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Scan Your Physical NFT Card</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              To view or purchase a physical NFT, scan the NFC chip embedded in the card.
            </p>
            <Button
              onClick={handleScanNFC}
              disabled={isScanning || isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium text-lg"
            >
              {isScanning ? (
                <>
                  <span className="animate-spin mr-2">⟳</span>
                  Scanning...
                </>
              ) : (
                'Scan NFC Card'
              )}
            </Button>
          </div>
        </div>

        {/* Scanned Listing Details */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">Loading listing details...</p>
          </div>
        )}

        {scannedListing && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Found NFT Listing</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                This physical NFT card is available for purchase
              </p>
            </div>
            
            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-8">
                {/* NFT Image */}
                <div className="w-full md:w-1/3">
                  <div className="relative aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                    <Image
                      src={scannedListing.image}
                      alt={scannedListing.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
                
                {/* NFT Details */}
                <div className="w-full md:w-2/3">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{scannedListing.name}</h3>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {scannedListing.attribute}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Rarity</p>
                      <p className="font-medium text-gray-900 dark:text-white">{scannedListing.rarity}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Level</p>
                      <p className="font-medium text-gray-900 dark:text-white">{scannedListing.level}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Seller</p>
                      <p className="font-medium text-gray-900 dark:text-white">{formatAddress(scannedListing.seller)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Price</p>
                      <p className="font-medium text-gray-900 dark:text-white flex items-center">
                        <Image
                          src="/eth-logo.svg"
                          alt="ETH"
                          width={16}
                          height={16}
                          className="mr-1"
                        />
                        {scannedListing.price} ETH
                      </p>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Description</p>
                    <p className="text-gray-700 dark:text-gray-300">{scannedListing.description}</p>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <Button
                      onClick={() => router.push(`/p2p-swap/${scannedListing.id}`)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
                    >
                      View Details
                    </Button>
                    
                    <Button
                      onClick={() => router.push(`/p2p-swap/${scannedListing.id}`)}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium"
                    >
                      Buy Now
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 