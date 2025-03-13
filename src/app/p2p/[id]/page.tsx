'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAppKit, useAppKitAccount, useAppKitProvider } from '@reown/appkit/react';
import { toast } from 'sonner';
import { Eip1193Provider } from 'ethers';
import { getP2PListingDetails, purchaseP2PListing, cancelP2PListing, claimBackP2PListing, DetailedP2PListing } from '@/app/utils/p2p-swap';
import { Button } from '@/components/ui/button';

export default function P2PSwapDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [listing, setListing] = useState<DetailedP2PListing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nfcHash, setNfcHash] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [nfcVerified, setNfcVerified] = useState(false);
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

  // Fetch listing details
  useEffect(() => {
    const fetchListingDetails = async () => {
      if (!mounted) return;

      const id = await params;
      
      setIsLoading(true);
      try {
        const listingId = parseInt(id.id);
        const details = await getP2PListingDetails(listingId);
        console.log('P2P listing details:', details);
        setListing(details);
      } catch (error) {
        console.error('Error fetching P2P listing details:', error);
        toast.error('Failed to load listing details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchListingDetails();
  }, [mounted, params]);

  // Function to simulate NFC scanning
  const handleScanNFC = () => {
    setIsScanning(true);
    
    // Simulate NFC scanning process
    setTimeout(() => {
      // Generate a random hash to simulate NFC reading
      const randomHash = Array.from({ length: 64 }, () => 
        Math.floor(Math.random() * 16).toString(16)
      ).join('');
      
      const hash = `0x${randomHash}`;
      setNfcHash(hash);
      setNfcVerified(true);
      setIsScanning(false);
      toast.success('NFC card scanned and verified successfully!');
    }, 2000);
  };

  // Function to handle purchasing the NFT
  const handlePurchase = async () => {
    if (!isConnected || !walletProvider) {
      toast.error('Please connect your wallet first');
      return;
    }
    
    if (!listing) {
      toast.error('Listing details not available');
      return;
    }
    
    if (!nfcVerified || !nfcHash) {
      toast.error('Please scan your NFC card to verify the physical card');
      return;
    }
    
    setIsSubmitting(true);
    toast.loading('Processing purchase...');
    
    try {
      const success = await purchaseP2PListing(
        listing.id,
        listing.price,
        nfcHash,
        walletProvider as Eip1193Provider
      );
      
      if (success) {
        toast.dismiss();
        toast.success(`Successfully purchased Blockmon #${listing.id}!`);
        
        // Redirect to the P2P swap page after a short delay
        setTimeout(() => {
          router.push('/p2p-swap');
        }, 1500);
      }
    } catch (error) {
      console.error('Error purchasing P2P listing:', error);
      toast.dismiss();
      toast.error('Failed to purchase NFT');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to handle cancelling the listing
  const handleCancel = async () => {
    if (!isConnected || !walletProvider) {
      toast.error('Please connect your wallet first');
      return;
    }
    
    if (!listing) {
      toast.error('Listing details not available');
      return;
    }
    
    // Check if the user is the seller
    if (address?.toLowerCase() !== listing.seller.toLowerCase()) {
      toast.error('Only the seller can cancel this listing');
      return;
    }
    
    setIsSubmitting(true);
    toast.loading('Cancelling listing...');
    
    try {
      const success = await cancelP2PListing(
        listing.id,
        walletProvider as Eip1193Provider
      );
      
      if (success) {
        toast.dismiss();
        toast.success(`Successfully cancelled listing for Blockmon #${listing.id}!`);
        
        // Redirect to the P2P swap page after a short delay
        setTimeout(() => {
          router.push('/p2p-swap');
        }, 1500);
      }
    } catch (error) {
      console.error('Error cancelling P2P listing:', error);
      toast.dismiss();
      toast.error('Failed to cancel listing');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to handle claiming back the NFT
  const handleClaimBack = async () => {
    if (!isConnected || !walletProvider) {
      toast.error('Please connect your wallet first');
      return;
    }
    
    if (!listing) {
      toast.error('Listing details not available');
      return;
    }
    
    // Check if the user is the seller
    if (address?.toLowerCase() !== listing.seller.toLowerCase()) {
      toast.error('Only the seller can claim back this listing');
      return;
    }
    
    if (!nfcVerified || !nfcHash) {
      toast.error('Please scan your NFC card to verify ownership');
      return;
    }
    
    setIsSubmitting(true);
    toast.loading('Claiming back NFT...');
    
    try {
      const success = await claimBackP2PListing(
        listing.id,
        nfcHash,
        walletProvider as Eip1193Provider
      );
      
      if (success) {
        toast.dismiss();
        toast.success(`Successfully claimed back Blockmon #${listing.id}!`);
        
        // Redirect to the P2P swap page after a short delay
        setTimeout(() => {
          router.push('/p2p-swap');
        }, 1500);
      }
    } catch (error) {
      console.error('Error claiming back P2P listing:', error);
      toast.dismiss();
      toast.error('Failed to claim back NFT');
    } finally {
      setIsSubmitting(false);
    }
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

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 pb-10 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If listing not found
  if (!listing) {
    return (
      <div className="min-h-screen pt-20 pb-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
            <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-red-100 dark:bg-red-900">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-600 dark:text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="mt-6 text-xl font-medium text-gray-900 dark:text-white">Listing Not Found</h3>
            <p className="mt-3 text-base text-gray-500 dark:text-gray-400">
              The P2P listing you are looking for does not exist or has been removed.
            </p>
            <div className="mt-6">
              <button
                onClick={() => router.push('/p2p-swap')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Back to P2P Swap
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!mounted) return null;

  return (
    <div className="min-h-screen pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <button
            onClick={() => router.push('/p2p-swap')}
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to P2P Swap
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {listing.name}
              </h1>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                listing.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                listing.status === 'sold' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
              }`}>
                {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
              </span>
            </div>
          </div>
          
          <div className="p-6">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Left column - Image and stats */}
              <div className="w-full lg:w-1/3">
                <div className="relative aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden mb-6">
                  <Image
                    src={listing.image}
                    alt={listing.name}
                    fill
                    className="object-cover"
                  />
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Stats</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">HP</p>
                      <div className="mt-1 relative pt-1">
                        <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200 dark:bg-gray-600">
                          <div style={{ width: `${(listing.stats.hp / 200) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-red-500"></div>
                        </div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">{listing.stats.hp}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Attack</p>
                      <div className="mt-1 relative pt-1">
                        <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200 dark:bg-gray-600">
                          <div style={{ width: `${(listing.stats.attack / 100) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-orange-500"></div>
                        </div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">{listing.stats.attack}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Defense</p>
                      <div className="mt-1 relative pt-1">
                        <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200 dark:bg-gray-600">
                          <div style={{ width: `${(listing.stats.defense / 100) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"></div>
                        </div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">{listing.stats.defense}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Speed</p>
                      <div className="mt-1 relative pt-1">
                        <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200 dark:bg-gray-600">
                          <div style={{ width: `${(listing.stats.speed / 100) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"></div>
                        </div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">{listing.stats.speed}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* NFC Scan Section */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Physical Card Verification</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Scan the NFC chip in the physical card to verify ownership and enable purchase.
                  </p>
                  
                  {nfcVerified ? (
                    <div className="flex items-center text-green-600 dark:text-green-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>NFC Card Verified</span>
                    </div>
                  ) : (
                    <Button
                      onClick={handleScanNFC}
                      disabled={isScanning}
                      className="w-full bg-blue-600 hover:bg-blue-700"
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
                  )}
                </div>
              </div>
              
              {/* Right column - Details and actions */}
              <div className="w-full lg:w-2/3">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Attribute</p>
                    <p className="font-medium text-gray-900 dark:text-white">{listing.attribute}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Rarity</p>
                    <p className="font-medium text-gray-900 dark:text-white">{listing.rarity}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Level</p>
                    <p className="font-medium text-gray-900 dark:text-white">{listing.level}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Seller</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formatAddress(listing.seller)}</p>
                  </div>
                </div>
                
                <div className="mb-6">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Description</p>
                  <p className="text-gray-700 dark:text-gray-300">{listing.description}</p>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Price</h3>
                  <div className="flex items-center">
                    <Image
                      src="/eth-logo.svg"
                      alt="ETH"
                      width={24}
                      height={24}
                      className="mr-2"
                    />
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">{listing.price} ETH</span>
                  </div>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Includes 2% platform fee
                  </p>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Transaction History</h3>
                  {listing.history.length > 0 ? (
                    <div className="space-y-3">
                      {listing.history.map((item, index) => (
                        <div key={index} className="flex items-start">
                          <div className="flex-shrink-0 h-5 w-5 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                            <span className="text-xs text-blue-600 dark:text-blue-400">•</span>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {item.event}
                              {item.by && ` by ${formatAddress(item.by)}`}
                              {item.price && ` for ${item.price} ETH`}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(item.date)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No transaction history available</p>
                  )}
                </div>
                
                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  {!isConnected ? (
                    <Button
                      onClick={handleConnectWallet}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      Connect Wallet
                    </Button>
                  ) : listing.status === 'active' && address?.toLowerCase() === listing.seller.toLowerCase() ? (
                    <Button
                      onClick={handleCancel}
                      disabled={isSubmitting}
                      className="w-full bg-red-600 hover:bg-red-700"
                    >
                      {isSubmitting ? 'Processing...' : 'Cancel Listing'}
                    </Button>
                  ) : listing.status === 'active' ? (
                    <Button
                      onClick={handlePurchase}
                      disabled={isSubmitting || !nfcVerified}
                      className={`w-full ${nfcVerified ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'}`}
                    >
                      {isSubmitting ? 'Processing...' : nfcVerified ? 'Buy Now' : 'Scan NFC to Buy'}
                    </Button>
                  ) : listing.status === 'sold' && address?.toLowerCase() === listing.seller.toLowerCase() ? (
                    <Button
                      onClick={handleClaimBack}
                      disabled={isSubmitting || !nfcVerified}
                      className={`w-full ${nfcVerified ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-400 cursor-not-allowed'}`}
                    >
                      {isSubmitting ? 'Processing...' : nfcVerified ? 'Claim Back NFT' : 'Scan NFC to Claim'}
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 