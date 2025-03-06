'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'

interface NFCWriterProps {
  tokenId: string
  petName: string
  isOpen: boolean
  onClose: () => void
}

export default function NFCWriter({ tokenId, petName, isOpen, onClose }: NFCWriterProps) {
  const [isWriting, setIsWriting] = useState(false)
  const [writeSuccess, setWriteSuccess] = useState(false)
  const [nfcSupported, setNfcSupported] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Check if NFC is supported
  useEffect(() => {
    if (typeof window !== 'undefined' && isOpen) {
      // Check if NDEFReader is available in the window object
      const supported = 'NDEFReader' in window
      setNfcSupported(supported)
      
      if (!supported) {
        toast.warning('NFC Not Supported', {
          description: 'Your device does not support NFC writing. You can skip this step.',
          icon: '📱',
          duration: 5000,
        })
      }
    }
  }, [isOpen])

  // Reset state when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setIsWriting(false)
      setWriteSuccess(false)
      setError(null)
    }
  }, [isOpen])

  // Start NFC writing
  const startWriting = async () => {
    setIsWriting(true)
    setError(null)
    
    const writeToastId = toast.loading('Writing to NFC Card', {
      description: 'Bring your NFC card close to your device...',
      icon: '📡',
      duration: Infinity,
    })
    
    try {
      // @ts-expect-error - NDEFReader is not in the TypeScript types yet
      const ndef = new window.NDEFReader()
      
      await ndef.write({
        records: [{
          recordType: "text",
          data: `BlocknogotchiID:${tokenId}:${petName}`
        }]
      })
      
      toast.dismiss(writeToastId)
      toast.success('NFC Card Updated', {
        description: 'Successfully wrote your pet data to the NFC card.',
        icon: '✅',
      })
      
      setWriteSuccess(true)
      setIsWriting(false)
    } catch (error) {
      console.error('Error writing to NFC:', error)
      setIsWriting(false)
      
      toast.dismiss(writeToastId)
      toast.error('Writing Failed', {
        description: 'Failed to write to NFC card. Please try again.',
        icon: '❌',
      })
      
      setError('Error writing to NFC card: ' + (error instanceof Error ? error.message : String(error)))
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-2xl max-w-md w-full relative animate-fadeIn">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">Store Pet on NFC Card</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Save your pet&apos;s information to your NFC card for easy access
          </p>
        </div>
        
        <div className="flex justify-center mb-6">
          <div className="w-32 h-32 relative">
            <Image 
              src="/nfc-write.svg" 
              alt="NFC Write" 
              fill
              style={{ objectFit: 'contain' }}
              className={`rounded-lg ${isWriting ? 'animate-pulse' : ''}`}
            />
          </div>
        </div>
        
        <div className="mb-6">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-lg">
            <h3 className="font-semibold mb-2 text-blue-700 dark:text-blue-300">
              Pet Information
            </h3>
            <p className="text-blue-600 dark:text-blue-400 mb-2">
              <span className="font-semibold">Name:</span> {petName}
            </p>
            <p className="text-blue-600 dark:text-blue-400">
              <span className="font-semibold">Token ID:</span> {tokenId}
            </p>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}
        
        {nfcSupported === false ? (
          <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 p-3 rounded-lg mb-4">
            Your device doesn&apos;t support NFC writing. You can skip this step.
          </div>
        ) : writeSuccess ? (
          <div className="text-center">
            <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-lg mb-4">
              <p className="text-green-700 dark:text-green-300 font-semibold">
                Successfully stored your pet on the NFC card!
              </p>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-md w-full"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {nfcSupported && (
              <button
                onClick={startWriting}
                disabled={isWriting}
                className={`px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-md flex items-center justify-center gap-2 ${isWriting ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isWriting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Writing to NFC Card...
                  </>
                ) : (
                  <>
                    <Image src="/pokeball.svg" alt="Pokeball" width={20} height={20} />
                    Write to NFC Card
                  </>
                )}
              </button>
            )}
            
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Skip
            </button>
          </div>
        )}
      </div>
    </div>
  )
} 