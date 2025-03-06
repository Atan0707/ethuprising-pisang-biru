'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useAppKitAccount, useAppKitProvider } from '@reown/appkit/react'
import { Eip1193Provider, ethers } from 'ethers'
import MintCard from '../components/mint/MintCard'
import Blocknogotchi from '@/contract/Blocknogotchi.json'

// Contract ABI (partial, just what we need)
const CONTRACT_ABI = Blocknogotchi.abi

// Contract address
const CONTRACT_ADDRESS = '0x41C29e60aB713998E78cE6a86e55D3E23D68deb3'

export default function MintPage() {
  const { address, isConnected } = useAppKitAccount()
  const { walletProvider } = useAppKitProvider('eip155')
  const [mounted, setMounted] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  // Check if user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      if (isConnected && address && walletProvider) {
        try {
          const provider = new ethers.BrowserProvider(walletProvider as Eip1193Provider)
          const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider)
          const owner = await contract.owner()
          setIsAdmin(owner.toLowerCase() === address.toLowerCase())
        } catch (err) {
          console.error('Error checking admin status:', err)
          setIsAdmin(false)
        }
      }
    }
    
    if (mounted) {
      checkAdmin()
    }
  }, [address, isConnected, mounted])

  // Ensure component is mounted to avoid hydration issues
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="min-h-screen pt-20 pb-10 relative">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image 
          src="/pokemon-background.webp" 
          alt="Pokemon Background" 
          fill 
          style={{ objectFit: 'cover', opacity: 0.15 }}
          priority
        />
      </div>
      
      <div className="max-w-4xl mx-auto px-4 relative z-10">
        <h1 className="text-4xl font-bold text-center mb-8 text-blue-600">Mint Blocknogotchi</h1>
        
        {!isConnected ? (
          <div className="bg-white/80 dark:bg-gray-800/80 rounded-xl p-8 shadow-xl backdrop-blur-sm">
            <p className="text-center text-lg mb-4">Please connect your wallet to continue</p>
            <div className="flex justify-center">
              <Image src="/pokeball.svg" alt="Pokeball" width={100} height={100} className="animate-bounce" />
            </div>
          </div>
        ) : (
          <MintCard isAdmin={isAdmin} address={address} />
        )}
      </div>
    </div>
  )
} 