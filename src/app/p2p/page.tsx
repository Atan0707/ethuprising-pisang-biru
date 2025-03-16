'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
// import Link from 'next/link';
import { useAppKit, useAppKitAccount, useAppKitProvider } from '@reown/appkit/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
// import { getAttributeString, getRarityString } from '@/app/utils/marketplace';
import { 
  getP2PListingDetails, 
  // P2PListing, 
  DetailedP2PListing } from '@/app/utils/p2p-swap';
import { getBlocknogotchiContract } from '../utils/contractUtils';
import NFCScanner from '@/app/components/p2p/NFCScanner';
import { Eip1193Provider, ethers } from 'ethers';

export default function P2PSwapPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedListing, setScannedListing] = useState<DetailedP2PListing | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  // Use reown wallet integration
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider('eip155');

  // Ensure component is mounted
  useEffect(() => {
    setMounted(true);
  }, []);

  // Function to handle NFC scanning or manual hash input
  const handleScan = async (hash: string, serialNumber: string) => {
    if (!isConnected || !walletProvider) {
      setError('Please connect your wallet first');
      return;
    }

    setIsLoading(true);
    setScannedListing(null);
    setError(null);
    
    try {
      // Get the contract instance with signer
      const provider = new ethers.BrowserProvider(walletProvider as Eip1193Provider);
      const signer = await provider.getSigner();
      const contract = await getBlocknogotchiContract(signer);
      
      // Get token ID from hash
      const tokenId = await contract.getTokenIdFromHash(hash);
      console.log('Token ID:', tokenId);

      if (tokenId.toString() === '0') {
        throw new Error('This NFC card is not associated with any Blockmon');
      }

      // Get Blockmon data to verify it exists
      const blockmonData = await contract.getBlocknogotchi(tokenId);
      console.log('Blockmon Data:', blockmonData);

      if (!blockmonData) {
        throw new Error('Failed to fetch Blockmon data');
      }

      // Store the serial number for future verification if provided
      if (serialNumber) {
        localStorage.setItem(`nft_${tokenId}_serial`, serialNumber);
      }

      // Fetch the listing details for this token ID
      const listing = await getP2PListingDetails(tokenId);
      
      if (listing && listing.status === 'active') {
        setScannedListing(listing);
        toast.success('Found an active listing!');
      } else if (listing) {
        toast.info(`This NFT is not currently for sale (Status: ${listing.status}).`);
      } else {
        toast.info('No active listing found for this NFT.');
      }
    } catch (error) {
      console.error('Error processing scan:', error);
      
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to process scan');
      }
    } finally {
      setIsLoading(false);
    }
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Person-to-Person NFT Swap</h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Swap your Blocknogotchi with others!
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
                  Trade Blocknogotchi
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* NFC Scan Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Find Blocknogotchi Listings</h2>
            <p className="text-gray-500 dark:text-gray-400">
              Scan your NFC card or enter its hash to find available listings.
            </p>
          </div>
          
          <NFCScanner
            isScanning={isScanning}
            setIsScanning={setIsScanning}
            onScan={handleScan}
            error={error}
          />
        </div>

        {/* Loading State */}
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
                      onClick={() => router.push(`/p2p/${scannedListing.id}`)}
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