'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { writeToNfcTag, isNfcSupported } from '@/app/utils/nfc'
import { toast } from 'sonner'
import { hashToId } from "@/app/utils/contractUtils";
import { Eip1193Provider } from 'ethers';

interface NfcModalProps {
  isOpen: boolean;
  onClose: () => void;
  claimHash: string;
  walletProvider: Eip1193Provider;
}

export default function NfcModal({ isOpen, onClose, claimHash, walletProvider }: NfcModalProps) {
  const [isWriting, setIsWriting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nfcSupported, setNfcSupported] = useState(false)

  useEffect(() => {
    // Check if NFC is supported
    setNfcSupported(isNfcSupported())
  }, [])

  const handleWriteToNfc = async () => {
    if (!nfcSupported) {
      setError('NFC is not supported on this device or browser')
      return
    }

    setIsWriting(true)
    setError(null)

    try {
      // Show toast for NFC scanning
      const pendingToastId = toast.loading('Waiting for NFC Card', {
        description: 'Please tap your NFC card to the back of your device',
        icon: '📱',
        duration: Infinity,
      })

      // Write claim hash to NFC tag
      const id = await hashToId(claimHash, walletProvider)
      await writeToNfcTag(claimHash, id)
      
      // Dismiss pending toast and show success toast
      toast.dismiss(pendingToastId)
      toast.success('NFC Write Successful', {
        description: 'The claim hash has been written to your NFC card',
        icon: '✅',
      })

      setIsSuccess(true)
      setIsWriting(false)
    } catch (err) {
      console.error('Error writing to NFC:', err)
      
      // Show error toast
      toast.error('NFC Write Failed', {
        description: (err instanceof Error ? err.message : String(err)),
        icon: '❌',
      })
      
      setError('Error writing to NFC: ' + (err instanceof Error ? err.message : String(err)))
      setIsWriting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Store Claim Hash on NFC Card</h2>
          
          {!nfcSupported ? (
            <div className="mb-6">
              <div className="flex justify-center mb-4">
                <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-red-600 dark:text-red-400 mb-4">
                NFC is not supported on this device or browser.
              </p>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Please use a device with NFC capabilities and a compatible browser (Chrome for Android).
              </p>
              <div className="flex justify-center">
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          ) : isSuccess ? (
            <div className="mb-6">
              <div className="flex justify-center mb-4">
                <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <p className="text-green-600 dark:text-green-400 mb-4">
                Claim hash successfully written to NFC card!
              </p>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                The NFC card can now be used to claim this Blocknogotchi pet.
              </p>
              <div className="flex justify-center">
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <div className="flex justify-center mb-6">
                <div className="relative w-40 h-40">
                  <Image 
                    src="/nfc-card.svg" 
                    alt="NFC Card" 
                    fill
                    style={{ objectFit: 'contain' }}
                    className={isWriting ? "animate-pulse" : ""}
                  />
                </div>
              </div>
              
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {isWriting 
                  ? "Please tap your NFC card to the back of your device..." 
                  : "Ready to write the claim hash to your NFC card. This will allow users to claim the Blocknogotchi pet."}
              </p>
              
              {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}
              
              <div className="flex justify-center space-x-4">
                <button
                  onClick={onClose}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  disabled={isWriting}
                >
                  Cancel
                </button>
                
                <button
                  onClick={handleWriteToNfc}
                  disabled={isWriting}
                  className={`px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors ${isWriting ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isWriting ? 'Writing...' : 'Write to NFC Card'}
                </button>
              </div>
            </div>
          )}
          
          <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg text-sm">
            <h3 className="font-bold mb-2 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Important Information
            </h3>
            <p>
              The claim hash is unique and can only be used once. Make sure to keep the NFC card safe until it&apos;s given to a user.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 