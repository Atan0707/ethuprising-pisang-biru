
'use client';

import { useState, useEffect } from 'react';

interface NFCRecord {
  recordType: string;
  mediaType?: string;
  data: string;
  encoding?: string;
  lang?: string;
}

interface NDEFReadingEvent {
  message: {
    records: Array<{
      recordType: string;
      mediaType?: string;
      data: ArrayBuffer;
      encoding?: string;
      lang?: string;
    }>;
  };
}

interface NDEFErrorEvent {
  message?: string;
}

export default function Home() {
  // Tab state
  const [activeTab, setActiveTab] = useState<'read' | 'write'>('read');

  // Write state
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('text');
  const [writeStatus, setWriteStatus] = useState<'idle' | 'writing' | 'success' | 'error'>('idle');
  const [writeErrorMessage, setWriteErrorMessage] = useState('');

  // Read state
  const [readStatus, setReadStatus] = useState<'idle' | 'reading' | 'error'>('idle');
  const [readErrorMessage, setReadErrorMessage] = useState('');
  const [records, setRecords] = useState<NFCRecord[]>([]);
  const [isReading, setIsReading] = useState(false);
  
  // Check if Web NFC is supported
  const isNfcSupported = typeof window !== 'undefined' && 'NDEFReader' in window;

  // Read functions
  async function startReading() {
    if (!isNfcSupported) {
      setReadStatus('error');
      setReadErrorMessage('Web NFC is not supported in this browser. Try Chrome on Android.');
      return;
    }

    try {
      setIsReading(true);
      setReadStatus('reading');
      setReadErrorMessage('');
      setRecords([]);

      // @ts-expect-error - TypeScript might not have NDEFReader types
      const ndef = new NDEFReader();
      await ndef.scan();
      
      ndef.addEventListener("reading", ({ message }: NDEFReadingEvent) => {
        const newRecords: NFCRecord[] = [];
        
        // Process all records from the message
        for (const record of message.records) {
          let recordData: string;
          
          if (record.recordType === "text") {
            const textDecoder = new TextDecoder(record.encoding || 'utf-8');
            recordData = textDecoder.decode(record.data);
          } else if (record.recordType === "url") {
            const textDecoder = new TextDecoder();
            recordData = textDecoder.decode(record.data);
          } else {
            // For other record types, just show record type
            recordData = `[${record.recordType} data]`;
          }
          
          newRecords.push({
            recordType: record.recordType,
            mediaType: record.mediaType,
            data: recordData,
            encoding: record.encoding,
            lang: record.lang
          });
        }
        
        setRecords(newRecords);
        setReadStatus('idle');
      });

      ndef.addEventListener("error", (error: NDEFErrorEvent) => {
        console.error(error);
        setReadStatus('error');
        setReadErrorMessage(error.message || 'Failed to read NFC tag');
      });
      
    } catch (error) {
      console.error(error);
      setReadStatus('error');
      setReadErrorMessage(error instanceof Error ? error.message : 'Failed to read NFC tag');
      setIsReading(false);
    }
  }

  function stopReading() {
    setIsReading(false);
    setReadStatus('idle');
  }

  // Write function
  async function handleWrite() {
    if (!isNfcSupported) {
      setWriteStatus('error');
      setWriteErrorMessage('Web NFC is not supported in this browser. Try Chrome on Android.');
      return;
    }

    try {
      setWriteStatus('writing');
      setWriteErrorMessage('');

      // @ts-expect-error - TypeScript might not have NDEFReader types
      const ndef = new NDEFReader();
      await ndef.write({
        records: [
          messageType === 'text' 
            ? { recordType: "text", data: message }
            : { recordType: "url", data: message }
        ]
      });

      setWriteStatus('success');
    } catch (error) {
      console.error(error);
      setWriteStatus('error');
      setWriteErrorMessage(error instanceof Error ? error.message : 'Failed to write to NFC tag');
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isReading) {
        stopReading();
      }
    };
  }, [isReading]);

  function getRecordDisplay(record: NFCRecord) {
    if (record.recordType === "url") {
      return (
        <div>
          <p className="font-medium">URL:</p>
          <a 
            href={record.data} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline break-all"
          >
            {record.data}
          </a>
        </div>
      );
    }
    
    if (record.recordType === "text") {
      return (
        <div>
          <p className="font-medium">Text:</p>
          <p className="break-words">{record.data}</p>
          {record.lang && <p className="text-sm text-gray-500">Language: {record.lang}</p>}
        </div>
      );
    }
    
    return (
      <div>
        <p className="font-medium">{record.recordType}:</p>
        <p className="break-words">{record.data}</p>
        {record.mediaType && <p className="text-sm text-gray-500">Media Type: {record.mediaType}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen p-8">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">NFC Reader/Writer</h1>

        {!isNfcSupported && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-red-800 dark:text-red-200">
              Your browser doesn&apos;t support the Web NFC API. Please use Chrome on Android.
            </p>
          </div>
        )}

        <div className="flex mb-6">
          <button
            onClick={() => setActiveTab('read')}
            className={`flex-1 p-3 font-medium ${
              activeTab === 'read'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Read NFC
          </button>
          <button
            onClick={() => setActiveTab('write')}
            className={`flex-1 p-3 font-medium ${
              activeTab === 'write'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Write NFC
          </button>
        </div>

        {/* Read Tab */}
        {activeTab === 'read' && (
          <div>
            {isReading ? (
              <button
                onClick={stopReading}
                className="w-full p-3 mb-6 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
              >
                Stop Reading
              </button>
            ) : (
              <button
                onClick={startReading}
                disabled={!isNfcSupported}
                className={`w-full p-3 mb-6 rounded-lg font-medium ${
                  !isNfcSupported
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                Start Reading NFC Tags
              </button>
            )}

            {readStatus === 'reading' && records.length === 0 && (
              <div className="p-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                <div className="animate-pulse mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-blue-800 dark:text-blue-200 font-medium">
                  Waiting for NFC tag...
                </p>
                <p className="text-blue-600 dark:text-blue-300 text-sm mt-2">
                  Hold your device near an NFC tag
                </p>
              </div>
            )}

            {readStatus === 'error' && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-red-800 dark:text-red-200">
                  {readErrorMessage || 'Failed to read NFC tag'}
                </p>
              </div>
            )}

            {records.length > 0 && (
              <div className="mt-6">
                <h2 className="text-xl font-semibold mb-4">Tag Content</h2>
                <div className="space-y-4">
                  {records.map((record, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      {getRecordDisplay(record)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Write Tab */}
        {activeTab === 'write' && (
          <div>
            <div className="mb-6">
              <label className="block mb-2 text-sm font-medium">Message Type</label>
              <div className="flex gap-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="messageType"
                    value="text"
                    checked={messageType === 'text'}
                    onChange={() => setMessageType('text')}
                    className="mr-2"
                  />
                  <span>Text</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="messageType"
                    value="url"
                    checked={messageType === 'url'}
                    onChange={() => setMessageType('url')}
                    className="mr-2"
                  />
                  <span>URL</span>
                </label>
              </div>
            </div>

            <div className="mb-6">
              <label className="block mb-2 text-sm font-medium">
                {messageType === 'text' ? 'Text Message' : 'URL'}
              </label>
              <input
                type={messageType === 'url' ? 'url' : 'text'}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={messageType === 'url' ? 'https://example.com' : 'Enter your message here'}
                className="w-full p-3 border rounded-lg"
              />
            </div>

            <button
              onClick={handleWrite}
              disabled={writeStatus === 'writing' || !message}
              className={`w-full p-3 rounded-lg font-medium ${
                writeStatus === 'writing' || !message
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {writeStatus === 'writing' ? 'Tap NFC Tag...' : 'Write to NFC Tag'}
            </button>

            {writeStatus === 'success' && (
              <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-green-800 dark:text-green-200">
                  Successfully wrote to NFC tag!
                </p>
              </div>
            )}

            {writeStatus === 'error' && (
              <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-red-800 dark:text-red-200">
                  {writeErrorMessage || 'Failed to write to NFC tag'}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h2 className="font-medium mb-2">Instructions:</h2>
          {activeTab === 'read' ? (
            <ol className="list-decimal list-inside text-sm space-y-2">
              <li>Click &quot;Start Reading NFC Tags&quot;</li>
              <li>Hold your device near an NFC tag</li>
              <li>The content will display automatically</li>
              <li>You can scan multiple tags without restarting</li>
            </ol>
          ) : (
            <ol className="list-decimal list-inside text-sm space-y-2">
              <li>Enter the text or URL you want to write</li>
              <li>Click &quot;Write to NFC Tag&quot;</li>
              <li>Hold your NFC tag close to the back of your device</li>
              <li>Keep the tag near until writing is complete</li>
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
