'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'

interface ClaimSuccessProps {
  tokenId: string
  petName: string
  image: string
  onReset: () => void
}

export default function ClaimSuccess({ tokenId, petName, image, onReset }: ClaimSuccessProps) {
  const [confetti, setConfetti] = useState<{ x: number; y: number; size: number; color: string }[]>([])
  
  // Create confetti effect and show success toast on mount
  useEffect(() => {
    // Create confetti effect
    const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#1A535C', '#FF9F1C']
    const newConfetti = Array.from({ length: 50 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)]
    }))
    
    setConfetti(newConfetti)
    
    // Show success toast
    toast.success('Claim Successful!', {
      description: `${petName} has been transferred to your wallet.`,
      icon: '🎉',
      duration: 5000,
    })
    
    // Show additional info toast after a delay
    const timeout = setTimeout(() => {
      toast('Pet Care Tips', {
        description: 'Remember to feed and play with your pet regularly!',
        icon: '💡',
        action: {
          label: 'Learn More',
          onClick: () => window.open('/care-guide', '_blank'),
        },
      })
    }, 3000)
    
    return () => clearTimeout(timeout)
  }, [petName])
  
  // Handle reset with toast notification
  const handleReset = () => {
    toast.info('Ready to Claim', {
      description: 'You can now claim another Blocknogotchi pet.',
      icon: '🔄',
    })
    onReset()
  }

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 rounded-xl p-8 shadow-xl backdrop-blur-sm relative overflow-hidden">
      {/* Confetti */}
      {confetti.map((c, i) => (
        <div
          key={i}
          className="absolute animate-fall"
          style={{
            left: `${c.x}%`,
            top: `${c.y}%`,
            width: `${c.size}px`,
            height: `${c.size}px`,
            backgroundColor: c.color,
            borderRadius: '50%',
            zIndex: 1
          }}
        />
      ))}
      
      <div className="relative z-10">
        <h2 className="text-2xl font-bold text-center mb-6 text-green-600">Claim Successful!</h2>
        
        <div className="flex flex-col md:flex-row items-center gap-8 mb-8">
          <div className="w-48 h-48 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full animate-pulse"></div>
            <Image 
              src={image} 
              alt={petName} 
              fill
              style={{ objectFit: 'contain' }}
              className="rounded-lg"
            />
          </div>
          
          <div className="flex-1">
            <div className="bg-yellow-100 dark:bg-yellow-900/30 p-4 rounded-lg mb-6 border-l-4 border-yellow-500">
              <h3 className="text-xl font-bold mb-2 text-yellow-700 dark:text-yellow-300">
                {petName} joined your team!
              </h3>
              <p className="text-yellow-600 dark:text-yellow-400">
                Take good care of your new Blocknogotchi pet. Feed it, play with it, and watch it grow!
              </p>
            </div>
            
            <div className="mb-4">
              <p className="font-semibold mb-1">Token ID:</p>
              <p className="font-mono text-sm mb-3">{tokenId}</p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/pet/${tokenId}`}
                className="px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-md flex items-center gap-2"
                onClick={() => toast('Viewing Pet', {
                  description: `Taking you to ${petName}'s profile page.`,
                  icon: '👁️',
                })}
              >
                <Image src="/pokeball.svg" alt="Pokeball" width={20} height={20} />
                View Pet
              </Link>
              
              <button
                onClick={handleReset}
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Claim Another
              </button>
            </div>
          </div>
        </div>
        
        <div className="mt-8 p-4 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
          <h3 className="text-lg font-semibold mb-2 text-blue-700 dark:text-blue-300">What&apos;s Next?</h3>
          <ul className="list-disc list-inside space-y-2 text-blue-600 dark:text-blue-400">
            <li>Visit your pet regularly to feed and play with it</li>
            <li>Watch your pet grow and evolve as you take care of it</li>
            <li>Collect more Blocknogotchi pets to build your collection</li>
          </ul>
        </div>
      </div>
    </div>
  )
} 