'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAppKit, useAppKitAccount } from '@reown/appkit/react'
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

  // Log connection attempts
  const handleConnectClick = () => {
    console.log('Attempting to connect wallet...')
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
          </div>
          
          <div className="flex items-center">
            {mounted && (
              <>
                {isConnected && address ? (
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => open({ view: 'Account' })}
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
                  onClick={() => open({ view: 'Networks' })}
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