'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAppKit, useAppKitAccount } from '@reown/appkit/react'
import { toast } from 'sonner'
// import { useAppKitAccount } from '@reown/appkit/react'

export default function Navbar() {
  const { open } = useAppKit()
  const { address, isConnected } = useAppKitAccount()
  const [mounted, setMounted] = useState(false)

  // Function to format address for display
  const formatAddress = (address: string | undefined) => {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  // Ensure component is mounted to avoid hydration issues
  useEffect(() => {
    setMounted(true)
  }, [])

  // Add event listeners for wallet connection events
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleConnected = () => {
        toast.success('Wallet Connected', {
          description: 'Your wallet has been connected successfully.',
          icon: '🦊',
        })
      }
      
      const handleDisconnected = () => {
        toast.error('Wallet Disconnected', {
          description: 'Your wallet has been disconnected.',
          icon: '🔌',
        })
      }
      
      const handleChainChanged = () => {
        toast.info('Network Changed', {
          description: 'You have switched to a different blockchain network.',
          icon: '🔄',
        })
      }
      
      document.addEventListener('appkit:connected', handleConnected)
      document.addEventListener('appkit:disconnected', handleDisconnected)
      document.addEventListener('appkit:chain-changed', handleChainChanged)
      
      return () => {
        document.removeEventListener('appkit:connected', handleConnected)
        document.removeEventListener('appkit:disconnected', handleDisconnected)
        document.removeEventListener('appkit:chain-changed', handleChainChanged)
      }
    }
  }, [])

  // Handle wallet connection
  const handleConnectClick = () => {
    toast.loading('Connecting Wallet', {
      description: 'Please approve the connection request in your wallet.',
      icon: '🔗',
    })
    open()
  }

  return (
    <nav className="fixed top-0 left-0 w-full bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold">Blocknogotchi</span>
            </Link>
            <div className="hidden md:ml-6 md:flex md:space-x-4">
              <Link href="/mint" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
                Mint
              </Link>
              <Link href="/claim" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                Claim
              </Link>
              <Link href="/arena" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
                Arena
              </Link>
            </div>
          </div>
          
          <div className="flex items-center">
            {mounted && (
              <>
                {isConnected && address ? (
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => {
                        open({ view: 'Account' })
                        toast('Account Details', {
                          description: 'Viewing your wallet account details.',
                          icon: '👤',
                        })
                      }}
                      className="px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium hover:from-blue-600 hover:to-purple-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                    >
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                      {formatAddress(address)}
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={handleConnectClick}
                    className="px-4 py-2 rounded-full bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Connect Wallet
                  </button>
                )}
                <button 
                  onClick={() => {
                    open({ view: 'Networks' })
                    toast('Network Selection', {
                      description: 'Choose a blockchain network to connect to.',
                      icon: '🌐',
                    })
                  }}
                  className="ml-2 px-4 py-2 rounded-full border border-gray-200 dark:border-gray-700 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Networks
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
} 