'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Eip1193Provider, ethers } from 'ethers'
import Blockmon from '@/contract/Blockmon.json'
import { useAppKitProvider } from "@reown/appkit/react"
import { toast } from 'sonner'
import NfcModal from './NfcModal'

// Pokemon data
const POKEMON = [
  {
    name: 'Charmander',
    species: 0, // FIRE
    image: 'https://plum-tough-mongoose-147.mypinata.cloud/ipfs/bafkreigryiqie52hop6px6afkv4bzixkcxjp5izl2fehcotjnvbmgdpwnq'
  },
  {
    name: 'Bulbasaur',
    species: 2, // PLANT
    image: 'https://plum-tough-mongoose-147.mypinata.cloud/ipfs/bafybeig3r7utqwlbhitgphpyfceysntd6ubxjpthpftpf5un5puviktly4'
  },
  {
    name: 'Pikachu',
    species: 3, // ELECTRIC
    image: 'https://plum-tough-mongoose-147.mypinata.cloud/ipfs/bafkreiaakfzr3rzenjtre7z6b5fzfhgyobthodphisfvmeu55aqz2b6j2y'
  },
  {
    name: 'Squirtle',
    species: 1, // WATER
    image: 'https://plum-tough-mongoose-147.mypinata.cloud/ipfs/bafybeiaqeil2zo4jkmb7qevmye37yv5wdhen5nns7qmmpw2f4ktkhexepm'
  }
]

// Contract ABI (partial, just what we need)
const CONTRACT_ABI = Blockmon.abi

// Contract address
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || ''

interface MintCardProps {
  isAdmin: boolean;
  address?: string;
}

// Type for event logs
interface EventLog {
  name?: string;
  args?: unknown[];
}

export default function MintCard({ isAdmin }: MintCardProps) {
  const [selectedPokemon, setSelectedPokemon] = useState<number | null>(null)
  const [customName, setCustomName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [mintResult, setMintResult] = useState<{tokenId: string, claimHash: string} | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isNfcModalOpen, setIsNfcModalOpen] = useState(false)
  const { walletProvider } = useAppKitProvider('eip155')

  // Select a random Pokemon
  const selectRandomPokemon = () => {
    const randomIndex = Math.floor(Math.random() * POKEMON.length)
    setSelectedPokemon(randomIndex)
    setCustomName(POKEMON[randomIndex].name)
  }

  // Handle mint
  const handleMint = async () => {
    if (!isAdmin || selectedPokemon === null || !customName.trim()) {
      setError('Please select a Pokemon and enter a name')
      toast.error('Mint Error', {
        description: 'Please select a Pokemon and enter a name',
        icon: '⚠️',
      })
      return
    }

    setIsLoading(true)
    setError(null)
    
    // Show minting pending toast
    const pendingToastId = toast.loading('Minting in Progress', {
      description: 'Creating your new Blocknogotchi pet. Please wait...',
      icon: '🥚',
      duration: Infinity,
    })
    
    try {
      if (!walletProvider) {
        throw new Error('Ethereum provider not found')
      }
      
      const provider = new ethers.BrowserProvider(walletProvider as Eip1193Provider)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
      
      const pokemon = POKEMON[selectedPokemon]
      
      // Call createPet function (name, species, rarity, uri)
      // Rarity is set to 0 (COMMON) for all Pokemon as requested
      const tx = await contract.createPokemon(
        customName,
        pokemon.species,
        0, // COMMON rarity
        pokemon.image
      )
      
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
      toast.success('Mint Successful', {
        description: `${customName} has been created! You can now store the claim hash in an NFC card.`,
        icon: '🎉',
      })
      
      // Parse the event to get tokenId and claimHash
      const event = receipt.logs
        .map((log: unknown) => {
          try {
            return contract.interface.parseLog(log as { topics: string[]; data: string })
          } catch {
            return null
          }
        })
        .find((event: EventLog | null) => event && event.name === 'PokemonCreated')
      
      if (event && event.args) {
        const tokenId = event.args[0].toString()
        const claimHash = event.args[1]
        
        setMintResult({
          tokenId,
          claimHash
        })
      }
      
      setIsLoading(false)
    } catch (err) {
      console.error('Error minting:', err)
      
      // Dismiss pending toast and show error toast
      toast.dismiss(pendingToastId)
      toast.error('Mint Failed', {
        description: (err instanceof Error ? err.message : String(err)),
        icon: '❌',
      })
      
      setError('Error minting: ' + (err instanceof Error ? err.message : String(err)))
      setIsLoading(false)
    }
  }

  // Open NFC modal
  const handleWriteToNfc = () => {
    setIsNfcModalOpen(true)
  }

  if (!isAdmin) {
    return (
      <div className="bg-white/80 dark:bg-gray-800/80 rounded-xl p-8 shadow-xl backdrop-blur-sm">
        <p className="text-center text-lg mb-4">Only the contract admin can mint new Blocknogotchi NFTs</p>
        <div className="flex justify-center">
          <Image src="/pokeball.svg" alt="Pokeball" width={100} height={100} className="animate-pulse" />
        </div>
      </div>
    )
  }

  if (mintResult) {
    return (
      <div className="bg-white/80 dark:bg-gray-800/80 rounded-xl p-8 shadow-xl backdrop-blur-sm">
        <h2 className="text-2xl font-bold text-center mb-6 text-green-600">Mint Successful!</h2>
        
        <div className="flex flex-col md:flex-row items-center gap-8 mb-8">
          <div className="w-48 h-48 relative">
            <Image 
              src={POKEMON[selectedPokemon!].image} 
              alt={customName} 
              fill
              style={{ objectFit: 'contain' }}
              className="rounded-lg"
            />
          </div>
          
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-2">{customName}</h3>
            <p className="mb-4 text-gray-600 dark:text-gray-300">
              Your new Blocknogotchi has been minted successfully! Store the claim hash in an NFC card to allow users to claim this pet.
            </p>
            
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg mb-4">
              <p className="font-semibold mb-1">Token ID:</p>
              <p className="font-mono text-sm mb-3 break-all">{mintResult.tokenId}</p>
              
              <p className="font-semibold mb-1">Claim Hash:</p>
              <p className="font-mono text-sm break-all">{mintResult.claimHash}</p>
            </div>
            
            <div className="flex justify-center mt-6">
              <button
                onClick={handleWriteToNfc}
                className="flex items-center px-6 py-3 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors shadow-md"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Write to NFC Card
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex justify-center mt-6">
          <button
            onClick={() => {
              setMintResult(null)
              setSelectedPokemon(null)
              setCustomName('')
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-md"
          >
            Mint Another
          </button>
        </div>

        {/* NFC Modal */}
        <NfcModal 
          isOpen={isNfcModalOpen}
          onClose={() => setIsNfcModalOpen(false)}
          claimHash={mintResult.claimHash}
        />
      </div>
    )
  }

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 rounded-xl p-8 shadow-xl backdrop-blur-sm">
      <h2 className="text-2xl font-bold text-center mb-6">Create a New Blocknogotchi</h2>
      
      {selectedPokemon === null ? (
        <div className="text-center mb-8">
          <p className="mb-4">Click the button below to randomly select a Pokemon</p>
          <button
            onClick={selectRandomPokemon}
            className="px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-md"
          >
            Random Pokemon
          </button>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row items-center gap-8 mb-8">
          <div className="w-48 h-48 relative">
            <Image 
              src={POKEMON[selectedPokemon].image} 
              alt={POKEMON[selectedPokemon].name} 
              fill
              style={{ objectFit: 'contain' }}
              className="rounded-lg"
            />
          </div>
          
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-2">{POKEMON[selectedPokemon].name}</h3>
            <p className="mb-4 text-gray-600 dark:text-gray-300">
              Species: {['Fire', 'Water', 'Plant', 'Electric'][POKEMON[selectedPokemon].species]}
            </p>
            
            <div className="mb-4">
              <label htmlFor="customName" className="block text-sm font-medium mb-1">
                Custom Name (optional)
              </label>
              <input
                type="text"
                id="customName"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Enter a custom name"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
              />
            </div>
            
            <div className="flex justify-between">
              <button
                onClick={() => setSelectedPokemon(null)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Choose Another
              </button>
              
              <button
                onClick={handleMint}
                disabled={isLoading}
                className={`px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-md ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isLoading ? 'Minting...' : 'Mint NFT'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      
      <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
        <h3 className="font-bold mb-2 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          Important Information
        </h3>
        <p className="text-sm">
          After minting, you&apos;ll receive a claim hash. Store this hash in an NFC card to allow users to claim their Blocknogotchi pet. Each hash can only be used once.
        </p>
      </div>
    </div>
  )
} 