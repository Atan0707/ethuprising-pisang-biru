'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'

interface NFCScannerProps {
  isScanning: boolean
  setIsScanning: (scanning: boolean) => void
  onScan: (hash: string) => void
  error: string | null
}

// Type for NFC reading event
interface NFCReadingEvent {
  message: {
    records: Array<{
      recordType: string;
      data: ArrayBuffer;
    }>;
  };
}

export default function NFCScanner({ isScanning, setIsScanning, onScan, error }: NFCScannerProps) {
  const [manualHash, setManualHash] = useState('')
  const [nfcSupported, setNfcSupported] = useState<boolean | null>(null)

  // Check if NFC is supported
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check if NDEFReader is available in the window object
      const supported = 'NDEFReader' in window
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
      // @ts-expect-error - NDEFReader is not in the TypeScript types yet
      const ndef = new window.NDEFReader()
      
      await ndef.scan()
      
      ndef.addEventListener("reading", ({ message }: NFCReadingEvent) => {
        // Process NDEF message
        for (const record of message.records) {
          if (record.recordType === "text") {
            const textDecoder = new TextDecoder()
            const hash = textDecoder.decode(record.data)
            
            toast.dismiss(scanToastId)
            toast.success('NFC Card Detected', {
              description: 'Successfully read the claim hash from your NFC card.',
              icon: '✅',
            })
            
            onScan(hash)
          }
        }
      })
    } catch (error) {
      console.error('Error scanning NFC:', error)
      setIsScanning(false)
      
      toast.dismiss(scanToastId)
      toast.error('Scanning Failed', {
        description: 'Failed to scan NFC card. Please try again or enter the hash manually.',
        icon: '❌',
      })
    }
  }

  // Handle manual hash submission
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (manualHash.trim()) {
      toast('Processing Hash', {
        description: 'Submitting the claim hash you entered...',
        icon: '🔍',
      })
      onScan(manualHash.trim())
    } else {
      toast.error('Empty Hash', {
        description: 'Please enter a valid claim hash.',
        icon: '⚠️',
      })
    }
  }

  // Show toast when error occurs
  useEffect(() => {
    if (error) {
      toast.error('Claim Error', {
        description: error,
        icon: '❌',
      })
    }
  }, [error])

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 rounded-xl p-8 shadow-xl backdrop-blur-sm">
      <div className="flex flex-col md:flex-row items-center gap-8 mb-8">
        <div className="w-48 h-48 relative flex-shrink-0">
          <Image 
            src="/nfc-scan.svg" 
            alt="NFC Scan" 
            fill
            style={{ objectFit: 'contain' }}
            className={`rounded-lg ${isScanning ? 'animate-pulse' : ''}`}
          />
        </div>
        
        <div className="flex-1">
          <h2 className="text-2xl font-bold mb-4">Scan Your NFC Card</h2>
          
          <p className="mb-4 text-gray-600 dark:text-gray-300">
            Bring your NFC card close to your device to claim your Blocknogotchi pet. The card contains a unique hash that will transfer the pet to your wallet.
          </p>
          
          {error && (
            <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-3 rounded-lg mb-4">
              {error}
            </div>
          )}
          
          {nfcSupported === false && (
            <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 p-3 rounded-lg mb-4">
              Your device doesn&apos;t support NFC scanning. Please enter the hash manually.
            </div>
          )}
          
          {nfcSupported && (
            <button
              onClick={startScanning}
              disabled={isScanning}
              className={`w-full px-6 py-3 mb-4 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-md flex items-center justify-center gap-2 ${isScanning ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isScanning ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Scanning...
                </>
              ) : (
                <>
                  <Image src="/pokeball.svg" alt="Pokeball" width={20} height={20} />
                  Start NFC Scan
                </>
              )}
            </button>
          )}
          
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Or Enter Hash Manually</h3>
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input
                type="text"
                value={manualHash}
                onChange={(e) => setManualHash(e.target.value)}
                placeholder="Enter claim hash from NFC card"
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
              >
                Claim
              </button>
            </form>
          </div>
        </div>
      </div>
      
      <div className="flex justify-center mt-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Image src="/info.svg" alt="Info" width={16} height={16} />
          <span>Make sure NFC is enabled on your device</span>
        </div>
      </div>
    </div>
  )
} 