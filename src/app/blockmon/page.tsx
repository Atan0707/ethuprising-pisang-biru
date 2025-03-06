'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface NFCReadingStatus {
  status: 'idle' | 'reading' | 'success' | 'error';
  message?: string;
}

// Define an interface for the NDEF message record
interface NDEFRecord {
  recordType: string;
  data: ArrayBuffer;
}

export default function BlockmonScanPage() {
  const [nfcSupported, setNfcSupported] = useState<boolean | null>(null);
  const [readingStatus, setReadingStatus] = useState<NFCReadingStatus>({ status: 'idle' });
  // We're using scannedId in the UI indirectly through readingStatus.message
  const [, setScannedId] = useState<string | null>(null);
  const router = useRouter();

  // Check if NFC is supported
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check if NDEFReader exists in the window object
      setNfcSupported('NDEFReader' in window);
    }
  }, []);

  const startNfcScan = async () => {
    try {
      setReadingStatus({ status: 'reading', message: 'Scanning for NFC card...' });
      
      // @ts-expect-error - NDEFReader is not in the TypeScript types yet
      const ndef = new window.NDEFReader();
      
      await ndef.scan();
      
      ndef.addEventListener("reading", ({ message }: { message: { records: NDEFRecord[] } }) => {
        try {
          // Process NDEF message
          for (const record of message.records) {
            if (record.recordType === "text") {
              const textDecoder = new TextDecoder();
              const text = textDecoder.decode(record.data);
              
              // Assuming the text contains the blockmon ID
              // Format could be "blockmon:123" or just "123"
              const blockmonId = text.includes(':') ? text.split(':')[1] : text;
              
              setScannedId(blockmonId);
              setReadingStatus({ 
                status: 'success', 
                message: `Successfully scanned Blockmon #${blockmonId}` 
              });
              
              // Redirect to blockmon details page after a short delay
              setTimeout(() => {
                router.push(`/blockmon/${blockmonId}`);
              }, 1500);
            }
          }
        } catch (error) {
          console.error('Error processing NFC data:', error);
          setReadingStatus({ 
            status: 'error', 
            message: 'Error processing NFC data. Please try again.' 
          });
        }
      });

      ndef.addEventListener("error", (error: { message: string }) => {
        console.error('NFC reading error:', error);
        setReadingStatus({ 
          status: 'error', 
          message: `Error reading NFC: ${error.message}` 
        });
      });
    } catch (error) {
      console.error('Error starting NFC scan:', error);
      setReadingStatus({ 
        status: 'error', 
        message: 'Error starting NFC scan. Make sure NFC is enabled on your device.' 
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="p-8">
          <h1 className="text-3xl font-bold text-center mb-6">Scan Blockmon Card</h1>
          
          {nfcSupported === null ? (
            <div className="text-center py-4">
              <div className="animate-pulse">Checking NFC support...</div>
            </div>
          ) : !nfcSupported ? (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative mb-6" role="alert">
              <strong className="font-bold">NFC not supported!</strong>
              <span className="block sm:inline"> Your device or browser doesn&apos;t support NFC scanning. Please use a compatible device (like an Android phone with Chrome).</span>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Tap the button below and hold your Blockmon NFC card to the back of your device to scan it.
                </p>
                
                {readingStatus.status === 'idle' && (
                  <button
                    onClick={startNfcScan}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-full shadow-lg transform transition-transform hover:scale-105 flex items-center justify-center mx-auto"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                    </svg>
                    Start NFC Scan
                  </button>
                )}
                
                {readingStatus.status === 'reading' && (
                  <div className="text-center py-4">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                    <p>{readingStatus.message}</p>
                  </div>
                )}
                
                {readingStatus.status === 'success' && (
                  <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
                    <strong className="font-bold">Success!</strong>
                    <span className="block sm:inline"> {readingStatus.message}</span>
                    <p className="mt-2">Redirecting to Blockmon details...</p>
                  </div>
                )}
                
                {readingStatus.status === 'error' && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <strong className="font-bold">Error!</strong>
                    <span className="block sm:inline"> {readingStatus.message}</span>
                    <button
                      onClick={startNfcScan}
                      className="mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                    >
                      Try Again
                    </button>
                  </div>
                )}
              </div>
              
              <div className="mt-8 border-t pt-6">
                <h2 className="text-xl font-semibold mb-4">How to scan your Blockmon card:</h2>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Tap the &quot;Start NFC Scan&quot; button</li>
                  <li>Hold your Blockmon NFC card to the back of your device</li>
                  <li>Keep the card steady until scanning completes</li>
                  <li>You&apos;ll be redirected to your Blockmon&apos;s details page</li>
                </ol>
              </div>
            </>
          )}
          
          <div className="mt-8 text-center">
            <Link href="/" className="text-blue-600 hover:text-blue-800">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
