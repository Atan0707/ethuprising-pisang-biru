'use client';

import { useState, useEffect } from 'react';
import { useAppKit, useAppKitAccount, useAppKitProvider } from '@reown/appkit/react';
import { Eip1193Provider } from 'ethers';
import { toast } from 'sonner';
import { getBlocknogotchiContract, getSigner } from '@/app/utils/contractUtils';

export default function GetHashPage() {
  const [tokenId, setTokenId] = useState<string>('');
  const [claimHash, setClaimHash] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  // Use reown wallet integration
  const { open } = useAppKit();
  const { isConnected, address } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider('eip155');

  // Ensure component is mounted to avoid hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if the connected wallet is the contract owner (admin)
  useEffect(() => {
    const checkIfAdmin = async () => {
      if (isConnected && walletProvider && address) {
        try {
          const signer = await getSigner(walletProvider as Eip1193Provider);
          const contract = await getBlocknogotchiContract(signer);
          const owner = await contract.owner();
          setIsAdmin(owner.toLowerCase() === address.toLowerCase());
        } catch (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    };

    checkIfAdmin();
  }, [isConnected, walletProvider, address]);

  const handleGetClaimHash = async () => {
    if (!isConnected || !walletProvider) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!isAdmin) {
      toast.error('Only the contract owner can access claim hashes');
      return;
    }

    if (!tokenId || isNaN(Number(tokenId)) || Number(tokenId) <= 0) {
      toast.error('Please enter a valid token ID');
      return;
    }

    setIsLoading(true);
    setClaimHash('');

    try {
      const signer = await getSigner(walletProvider as Eip1193Provider);
      const contract = await getBlocknogotchiContract(signer);
      
      // Call the getClaimHash function from the contract
      const hash = await contract.getClaimHash(tokenId);
      setClaimHash(hash);
      toast.success('Claim hash retrieved successfully');
    } catch (error) {
      console.error('Error getting claim hash:', error);
      toast.error('Failed to get claim hash. Make sure the token exists and you are the owner.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectWallet = () => {
    open();
  };

  const copyToClipboard = () => {
    if (claimHash) {
      navigator.clipboard.writeText(claimHash);
      toast.success('Claim hash copied to clipboard');
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6 md:p-8">
        <h1 className="text-2xl font-bold text-center mb-8 text-gray-900 dark:text-white">
          Admin: Get Claim Hash
        </h1>

        {!isConnected ? (
          <div className="text-center">
            <p className="mb-4 text-gray-600 dark:text-gray-300">
              Please connect your wallet to access admin functions.
            </p>
            <button
              onClick={handleConnectWallet}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Connect Wallet
            </button>
          </div>
        ) : !isAdmin ? (
          <div className="text-center p-6 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-red-600 dark:text-red-400">
              Only the contract owner can access this page.
            </p>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Connected address: {address}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="tokenId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Token ID
              </label>
              <input
                id="tokenId"
                type="number"
                min="1"
                value={tokenId}
                onChange={(e) => setTokenId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter token ID"
                disabled={isLoading}
              />
            </div>

            <button
              onClick={handleGetClaimHash}
              disabled={isLoading || !tokenId}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading...
                </span>
              ) : (
                'Get Claim Hash'
              )}
            </button>

            {claimHash && (
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Claim Hash</h3>
                  <button
                    onClick={copyToClipboard}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </button>
                </div>
                <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-300 dark:border-gray-600 overflow-x-auto">
                  <code className="text-sm text-gray-800 dark:text-gray-200 break-all font-mono">
                    {claimHash}
                  </code>
                </div>
                <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                  This hash can be used to claim the Blocknogotchi with token ID {tokenId}.
                  <span className="block mt-1 font-semibold text-red-600 dark:text-red-400">
                    Keep this hash secure and only share it with the intended recipient.
                  </span>
                </p>
              </div>
            )}

            <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-400 mb-2">Security Notice</h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                The claim hash is a sensitive piece of information that allows anyone who possesses it to claim the associated Blocknogotchi. 
                Always ensure you&apos;re on a secure connection and that no unauthorized persons can see your screen when viewing claim hashes.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
