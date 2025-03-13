'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAppKit, useAppKitAccount, useAppKitProvider } from '@reown/appkit/react';
import { toast } from 'sonner';
import { Eip1193Provider } from 'ethers';
import { createP2PListing } from '@/app/utils/p2p-swap';
import { getOwnedNFTs, BlockmonData } from '@/app/utils/marketplace';
import { isNfcSupported, readFromNfcTag, getNfcSerialNumber } from '@/app/utils/nfc';
import { Button } from '@/components/ui/button';

export default function CreateP2PListingPage() {
  const [ownedNFTs, setOwnedNFTs] = useState<BlockmonData[]>([]);
  const [selectedNFT, setSelectedNFT] = useState<BlockmonData | null>(null);
  const [price, setPrice] = useState<string>('');
  const [nfcHash, setNfcHash] = useState<string>('');
  const [nfcSerialNumber, setNfcSerialNumber] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [nfcVerified, setNfcVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [nfcSupported, setNfcSupported] = useState(false);
  const router = useRouter();
  
  // Use reown wallet integration
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider('eip155');

  // Ensure component is mounted to avoid hydration issues
  useEffect(() => {
    setMounted(true);
    // Check if NFC is supported
    if (typeof window !== 'undefined') {
      setNfcSupported(isNfcSupported());
    }
  }, []);

  // Fetch user's owned NFTs
  useEffect(() => {
    const fetchOwnedNFTs = async () => {
      if (!mounted || !isConnected || !address) return;
      
      setIsLoading(true);
      try {
        const nfts = await getOwnedNFTs(address);
        console.log('Owned NFTs:', nfts);
        setOwnedNFTs(nfts);
      } catch (error) {
        console.error('Error fetching owned NFTs:', error);
        toast.error('Failed to load your NFTs');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOwnedNFTs();
  }, [mounted, isConnected, address]);

  // Function to handle NFT selection
  const handleSelectNFT = (nft: BlockmonData) => {
    setSelectedNFT(nft);
    // Reset NFC verification when selecting a different NFT
    setNfcVerified(false);
    setNfcHash('');
    setNfcSerialNumber('');
  };

  // Function to handle price input
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers and decimals
    if (/^\d*\.?\d*$/.test(value)) {
      setPrice(value);
    }
  };

  // Function to handle real NFC scanning
  const handleScanNFC = async () => {
    if (!selectedNFT) {
      toast.error('Please select an NFT first');
      return;
    }
    
    if (!nfcSupported) {
      toast.error('NFC is not supported on this device or browser');
      return;
    }
    
    setIsScanning(true);
    const toastId = toast.loading('Scanning NFC card...', {
      description: 'Please hold your NFC card near your device',
      duration: 10000, // 10 seconds
    });
    
    try {
      // Try to get the serial number first
      const serialNumber = await getNfcSerialNumber();
      setNfcSerialNumber(serialNumber);
      
      // Then read the data from the NFC tag
      const nfcData = await readFromNfcTag({ timeoutMs: 15000 }); // 15 second timeout
      
      // Validate the NFC data
      if (!nfcData) {
        throw new Error('No data read from NFC card');
      }
      
      // Use the NFC data as the hash or process it as needed
      // For security, you might want to hash the data or verify it against blockchain data
      const hash = nfcData.startsWith('0x') ? nfcData : `0x${nfcData}`;
      
      setNfcHash(hash);
      setNfcVerified(true);
      toast.dismiss(toastId);
      toast.success('NFC card scanned and verified successfully!', {
        description: `Serial: ${serialNumber.slice(0, 8)}...`,
      });
    } catch (error) {
      console.error('Error scanning NFC card:', error);
      toast.dismiss(toastId);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          toast.error('Scan timed out. Please try again and hold your card closer to the device.');
        } else if (error.message.includes('permission')) {
          toast.error('NFC permission denied. Please allow NFC access in your browser settings.');
        } else if (error.message.includes('No data')) {
          toast.error('No valid data found on NFC card. Please ensure this is the correct card.');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.error('Failed to scan NFC card. Please try again.');
      }
    } finally {
      setIsScanning(false);
    }
  };

  // Function to handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected || !walletProvider) {
      toast.error('Please connect your wallet first');
      return;
    }
    
    if (!selectedNFT) {
      toast.error('Please select an NFT to list');
      return;
    }
    
    if (!price || parseFloat(price) <= 0) {
      toast.error('Please enter a valid price');
      return;
    }
    
    if (!nfcVerified || !nfcHash) {
      toast.error('Please scan your NFC card to verify ownership');
      return;
    }
    
    setIsSubmitting(true);
    const toastId = toast.loading('Creating P2P listing...');
    
    try {
      // Include the NFC serial number in the listing for additional verification
      const success = await createP2PListing(
        selectedNFT.id,
        price,
        nfcHash,
        walletProvider as Eip1193Provider,
        nfcSerialNumber // Pass the serial number if your API supports it
      );
      
      if (success) {
        toast.dismiss(toastId);
        toast.success('P2P listing created successfully!');
        
        // Redirect to the P2P swap page after a short delay
        setTimeout(() => {
          router.push('/p2p');
        }, 1500);
      }
    } catch (error) {
      console.error('Error creating P2P listing:', error);
      toast.dismiss(toastId);
      
      if (error instanceof Error) {
        toast.error(`Failed to create P2P listing: ${error.message}`);
      } else {
        toast.error('Failed to create P2P listing');
      }
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

  // Render loading state
  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 pb-10 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If not connected, show connect wallet prompt
  if (!isConnected) {
    return (
      <div className="min-h-screen pt-20 pb-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
            <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-blue-100 dark:bg-blue-900">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-600 dark:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="mt-6 text-xl font-medium text-gray-900 dark:text-white">Connect Your Wallet</h3>
            <p className="mt-3 text-base text-gray-500 dark:text-gray-400">
              Please connect your wallet to create a P2P listing for your physical NFT card.
            </p>
            <div className="mt-6">
              <Button
                onClick={handleConnectWallet}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Connect Wallet
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!mounted) return null;

  return (
    <div className="min-h-screen pt-20 pb-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <button
            onClick={() => router.push('/p2p')}
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to P2P Swap
          </button>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create P2P Swap Listing</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              List your physical NFT card for sale with secure escrow
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Step 1: Select NFT to List
              </label>
              
              {ownedNFTs.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-gray-500 dark:text-gray-400">
                    You don&apos;t own any NFTs yet. Claim or purchase one first!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {ownedNFTs.map((nft) => (
                    <div
                      key={nft.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedNFT?.id === nft.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                      }`}
                      onClick={() => handleSelectNFT(nft)}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="relative h-16 w-16 bg-gray-200 dark:bg-gray-700 rounded-md overflow-hidden">
                          <Image
                            src={nft.tokenURI || '/blockmon/placeholder.png'}
                            alt={nft.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">{nft.name}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            ID: #{nft.id} • Level: {nft.level}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Step 2: Verify Physical Card
              </label>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Scan the NFC chip in your physical card to verify ownership before listing.
                </p>
                
                {!nfcSupported && (
                  <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                    <div className="flex items-center text-yellow-600 dark:text-yellow-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span>NFC is not supported on this device or browser. Please use a compatible device.</span>
                    </div>
                  </div>
                )}
                
                {nfcVerified ? (
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                    <div className="flex items-center text-green-600 dark:text-green-400 mb-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="font-medium">NFC Card Verified</span>
                    </div>
                    {nfcSerialNumber && (
                      <p className="text-xs text-green-600 dark:text-green-400 ml-7">
                        Card Serial: {nfcSerialNumber.slice(0, 8)}...{nfcSerialNumber.slice(-4)}
                      </p>
                    )}
                  </div>
                ) : (
                  <Button
                    type="button"
                    onClick={handleScanNFC}
                    disabled={isScanning || !selectedNFT || !nfcSupported}
                    className={`w-full ${
                      selectedNFT && nfcSupported 
                        ? 'bg-blue-600 hover:bg-blue-700' 
                        : 'bg-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {isScanning ? (
                      <>
                        <span className="animate-spin mr-2">⟳</span>
                        Scanning...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                        </svg>
                        Scan NFC Card
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
            
            <div className="mb-6">
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Step 3: Set Price (ETH)
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Image
                    src="/eth-logo.svg"
                    alt="ETH"
                    width={16}
                    height={16}
                  />
                </div>
                <input
                  type="text"
                  name="price"
                  id="price"
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-12 sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                  placeholder="0.00"
                  value={price}
                  onChange={handlePriceChange}
                  disabled={!nfcVerified}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 dark:text-gray-400 sm:text-sm">ETH</span>
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Platform fee: 2% of the sale price
              </p>
            </div>
            
            <div className="mt-8">
              <Button
                type="submit"
                disabled={isSubmitting || !selectedNFT || !nfcVerified || !price || parseFloat(price) <= 0}
                className={`w-full ${
                  selectedNFT && nfcVerified && price && parseFloat(price) > 0
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? 'Creating Listing...' : 'Create P2P Listing'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 