import { useState, useEffect } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { isNfcSupported, readFromNfcTag } from '@/app/utils/nfc'
import { Button } from '@/components/ui/button'

interface NFCScannerProps {
  isScanning: boolean
  setIsScanning: (scanning: boolean) => void
  onScan: (hash: string) => void
  error: string | null
}

export default function NFCScanner({ isScanning, setIsScanning, onScan, error }: NFCScannerProps) {
  const [manualHash, setManualHash] = useState('')
  const [nfcSupported, setNfcSupported] = useState<boolean | null>(null)

  // Check if NFC is supported
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const supported = isNfcSupported()
      setNfcSupported(supported)
      
      if (!supported) {
        toast.warning('NFC Not Supported', {
          description: 'Your device does not support NFC scanning. You can enter the hash manually.',
          icon: '📱',
          duration: 5000,
        })
      }
    }
  }, [])

  // Start NFC scanning
  const startScanning = async () => {
    setIsScanning(true)
    
    const scanToastId = toast.loading('Scanning for NFC Card', {
      description: 'Bring your NFC card close to your device...',
      icon: '📡',
      duration: Infinity,
    })
    
    try {
      // Then read the data from the NFC tag
      const nfcData = await readFromNfcTag({ timeoutMs: 15000 }) // 15 second timeout
      
      // Validate the NFC data
      if (!nfcData) {
        throw new Error('No data read from NFC card')
      }
      
      // Ensure the hash is in the correct format
      const hash = nfcData.startsWith('0x') ? nfcData : `0x${nfcData}`
        
      
      toast.dismiss(scanToastId)
      toast.success('NFC Card Detected', {
        description: 'Successfully read the hash from your NFC card.',
        icon: '✅',
      })
      
      onScan(hash)
    } catch (error) {
      console.error('Error scanning NFC:', error)
      setIsScanning(false)
      
      toast.dismiss(scanToastId)
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          toast.error('Scan timed out. Please try again and hold your card closer to the device.')
        } else if (error.message.includes('permission')) {
          toast.error('NFC permission denied. Please allow NFC access in your browser settings.')
        } else if (error.message.includes('No data')) {
          toast.error('No valid data found on NFC card. Please ensure this is the correct card.')
        } else {
          toast.error(error.message)
        }
      } else {
        toast.error('Failed to scan NFC card. Please try again.')
      }
    }
  }

  // Handle manual hash submission
  const handleManualSubmit = (e: React.MouseEvent) => {
    e.preventDefault()
    if (manualHash.trim()) {
      toast('Processing Hash', {
        description: 'Submitting the hash you entered...',
        icon: '🔍',
      })
      onScan(manualHash.trim())
    } else {
      toast.error('Empty Hash', {
        description: 'Please enter a valid hash.',
        icon: '⚠️',
      })
    }
  }

  // Show toast when error occurs
  useEffect(() => {
    if (error) {
      toast.error('Verification Error', {
        description: error,
        icon: '❌',
      })
    }
  }, [error])

  return (
    <div className="bg-white/90 dark:bg-gray-800/90 rounded-2xl p-8 shadow-xl backdrop-blur-sm border border-white/50 dark:border-gray-700/50">
      {/* Error display */}
      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-4 rounded-xl mb-6 border-l-4 border-red-500">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* NFC not supported warning */}
      {nfcSupported === false && (
        <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 p-4 rounded-xl mb-6 border-l-4 border-yellow-500">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="font-medium">Your device doesn&apos;t support NFC scanning. Please enter the hash manually.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left side - NFC Scanning */}
        <div className={`${nfcSupported === false ? 'opacity-50' : ''}`}>
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold">Scan Your NFC Card</h2>
          </div>
          
          <div className="mb-6 flex justify-center">
            <div className="w-40 h-40 relative">
              <div className={`absolute inset-0 bg-blue-500/20 rounded-full ${isScanning ? 'animate-ping' : ''}`}></div>
              <Image 
                src="/nfc-scan.svg" 
                alt="NFC Scan" 
                fill
                style={{ objectFit: 'contain' }}
                className="relative z-10"
              />
            </div>
          </div>
          
          <p className="mb-6 text-gray-600 dark:text-gray-300 text-center">
            Bring your NFC card close to your device to verify ownership and list your Blockmon.
          </p>
          
          {nfcSupported && (
            <Button
              onClick={startScanning}
              disabled={isScanning}
              className={`w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-md flex items-center justify-center gap-2 transition-all ${isScanning ? 'opacity-70 cursor-not-allowed' : 'hover:-translate-y-0.5'}`}
            >
              {isScanning ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Scanning...</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                  <span>Start NFC Scan</span>
                </>
              )}
            </Button>
          )}
        </div>
        
        {/* Right side - Manual Hash Entry */}
        <div>
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold">Enter Hash Manually</h2>
          </div>
          
          <div className="p-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl mb-6">
            <p className="mb-4 text-gray-600 dark:text-gray-300">
              Enter the hash from your NFC card to verify ownership and list your Blockmon.
            </p>
            
            <div>
              <div className="mb-4">
                <label htmlFor="hash-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Hash
                </label>
                <input
                  id="hash-input"
                  type="text"
                  value={manualHash}
                  onChange={(e) => setManualHash(e.target.value)}
                  placeholder="Enter hash from NFC card"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
              
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleManualSubmit(e);
                }}
                className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl shadow-md transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2 font-medium"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Verify with Hash
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-center mt-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>Make sure NFC is enabled on your device if available</span>
        </div>
      </div>
    </div>
  )
} 