'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useAppKitAccount, useAppKitProvider } from '@reown/appkit/react'
import { Eip1193Provider, ethers } from 'ethers'
import Blocknogotchi from '@/contract/Blocknogotchi.json'
import NFCScanner from '../components/claim/NFCScanner'
import ClaimSuccess from '../components/claim/ClaimSuccess'
import { toast } from 'sonner'

// Contract ABI (partial, just what we need)
const CONTRACT_ABI = Blocknogotchi.abi

// Contract address
const CONTRACT_ADDRESS = '0x41C29e60aB713998E78cE6a86e55D3E23D68deb3'

// Type for event logs
interface EventLog {
  name?: string;
  args?: unknown[];
}

export default function ClaimPage() {
  const { address, isConnected } = useAppKitAccount()
  const { walletProvider } = useAppKitProvider('eip155')
  const [mounted, setMounted] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [claimResult, setClaimResult] = useState<{tokenId: string, petName: string, image: string} | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Ensure component is mounted to avoid hydration issues
  useEffect(() => {
    setMounted(true)
  }, [])

  // Handle claim with hash from NFC card
  const handleClaim = async (claimHash: string) => {
    if (!isConnected || !address || !walletProvider) {
      setError('Please connect your wallet to claim')
      return
    }

    setIsScanning(false)
    setError(null)
    
    // Show transaction pending toast
    const pendingToastId = toast.loading('Transaction Pending', {
      description: 'Claiming your Blocknogotchi pet. Please wait while the transaction is being processed...',
      icon: '⏳',
      duration: Infinity,
    })
    
    try {
      const provider = new ethers.BrowserProvider(walletProvider as Eip1193Provider)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
      
      // Call claimPet function with the hash from NFC card
      const tx = await contract.claimPet(claimHash)
      
      // Show transaction submitted toast
      toast.dismiss(pendingToastId)
      const submittedToastId = toast.loading('Transaction Submitted', {
        description: `Transaction hash: ${tx.hash.slice(0, 10)}...${tx.hash.slice(-8)}`,
        icon: '📝',
        duration: Infinity,
      })
      
      // Wait for transaction to be mined
      const receipt = await tx.wait()
      
      // Show transaction confirmed toast
      toast.dismiss(submittedToastId)
      toast.success('Transaction Confirmed', {
        description: 'Your claim transaction has been confirmed on the blockchain.',
        icon: '✅',
      })
      
      // Parse the event to get tokenId
      const event = receipt.logs
        .map((log: unknown) => {
          try {
            return contract.interface.parseLog(log as { topics: string[]; data: string })
          } catch {
            return null
          }
        })
        .find((event: EventLog | null) => event && event.name === 'PetClaimed')
      
      if (event && event.args) {
        const tokenId = event.args[0].toString()
        
        // Get pet details
        const pet = await contract.getPet(tokenId)
        
        setClaimResult({
          tokenId,
          petName: pet.name,
          image: pet.uri
        })
      }
    } catch (err) {
      console.error('Error claiming:', err)
      
      // Dismiss pending toast and show error toast
      toast.dismiss(pendingToastId)
      toast.error('Transaction Failed', {
        description: (err instanceof Error ? err.message : String(err)),
        icon: '❌',
      })
      
      setError('Error claiming: ' + (err instanceof Error ? err.message : String(err)))
    }
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen pt-20 pb-10">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-8 text-blue-600">Claim Your Blocknogotchi</h1>
        
        {!isConnected ? (
          <div className="bg-white/80 dark:bg-gray-800/80 rounded-xl p-8 shadow-xl backdrop-blur-sm">
            <p className="text-center text-lg mb-4">Please connect your wallet to claim your Blocknogotchi</p>
            <div className="flex justify-center">
              <Image src="/pokeball.svg" alt="Pokeball" width={100} height={100} className="animate-bounce" />
            </div>
          </div>
        ) : claimResult ? (
          <ClaimSuccess 
            tokenId={claimResult.tokenId} 
            petName={claimResult.petName} 
            image={claimResult.image} 
            onReset={() => setClaimResult(null)}
          />
        ) : (
          <NFCScanner 
            isScanning={isScanning} 
            setIsScanning={setIsScanning} 
            onScan={handleClaim}
            error={error}
          />
        )}
      </div>
    </div>
  )
} 