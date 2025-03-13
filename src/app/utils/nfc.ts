/**
 * NFC Utility functions for reading and writing to NFC tags
 */

// Define types for Web NFC API
interface NDEFMessage {
  records: NDEFRecord[];
}

interface NDEFRecord {
  recordType: string;
  mediaType?: string;
  id?: string;
  data?: BufferSource;
  encoding?: string;
  lang?: string;
}

interface NDEFReadingEvent extends Event {
  serialNumber: string;
  message: NDEFMessage;
}

interface NDEFReader extends EventTarget {
  scan(options?: { signal?: AbortSignal }): Promise<void>;
  write(message: NDEFMessage | NDEFRecord[] | NDEFRecord, options?: { signal?: AbortSignal, overwrite?: boolean }): Promise<void>;
}

// Check if Web NFC API is available
export const isNfcSupported = (): boolean => {
  return typeof window !== 'undefined' && 'NDEFReader' in window;
};

// Create a new NDEFReader instance with proper type checking
const createNDEFReader = (): NDEFReader => {
  if (!isNfcSupported()) {
    throw new Error('NFC is not supported on this device or browser');
  }
  
  // @ts-expect-error - NDEFReader is not in the TypeScript types yet
  return new window.NDEFReader();
};

// Write data to an NFC tag
export const writeToNfcTag = async (data: string, options?: { overwrite?: boolean }): Promise<boolean> => {
  if (!isNfcSupported()) {
    throw new Error('NFC is not supported on this device or browser');
  }

  try {
    const ndef = createNDEFReader();
    await ndef.write({
      records: [
        { recordType: "text", data: new TextEncoder().encode(data) },
      ]
    }, { overwrite: options?.overwrite ?? true });
    return true;
  } catch (error) {
    console.error('Error writing to NFC tag:', error);
    if (error instanceof Error) {
      if (error.name === 'NotAllowedError') {
        throw new Error('Permission to write to NFC tag was denied');
      } else if (error.name === 'NotSupportedError') {
        throw new Error('NFC tag does not support NDEF or NDEF cannot be written to this tag');
      } else if (error.name === 'NotReadableError') {
        throw new Error('NFC tag cannot be read');
      } else if (error.name === 'NetworkError') {
        throw new Error('Unable to connect to the NFC tag');
      }
    }
    throw error;
  }
};

// Read data from an NFC tag
export const readFromNfcTag = async (options?: { timeoutMs?: number }): Promise<string> => {
  if (!isNfcSupported()) {
    throw new Error('NFC is not supported on this device or browser');
  }

  return new Promise((resolve, reject) => {
    try {
      const ndef = createNDEFReader();
      
      // Set up a timeout if specified
      let timeoutId: NodeJS.Timeout | undefined;
      if (options?.timeoutMs) {
        timeoutId = setTimeout(() => {
          reject(new Error('NFC scan timed out. Please try again.'));
        }, options.timeoutMs);
      }
      
      // Create an abort controller for cleanup
      const abortController = new AbortController();
      const signal = abortController.signal;
      
      // Handle successful reading
      ndef.addEventListener("reading", ((event: Event) => {
        if (timeoutId) clearTimeout(timeoutId);
        abortController.abort(); // Stop scanning after successful read
        
        // Cast event to our custom type
        const ndefEvent = event as unknown as NDEFReadingEvent;
        
        for (const record of ndefEvent.message.records) {
          if (record.recordType === "text") {
            const textDecoder = new TextDecoder();
            const text = textDecoder.decode(record.data);
            resolve(text);
            return;
          }
        }
        
        // If we get here, no text record was found
        reject(new Error('No text data found on NFC tag'));
      }) as EventListener, { once: true });
      
      // Handle errors
      ndef.addEventListener("error", ((errorEvent: Event) => {
        if (timeoutId) clearTimeout(timeoutId);
        abortController.abort();
        reject(new Error('Error reading NFC tag' + errorEvent));
      }) as EventListener, { once: true });
      
      // Start scanning
      ndef.scan({ signal }).catch((error: Error) => {
        if (timeoutId) clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          // This is expected when we abort the scan after a successful read
          return;
        }
        reject(error);
      });
    } catch (error) {
      console.error('Error reading from NFC tag:', error);
      reject(error);
    }
  });
};

// Get NFC serial number (UID)
export const getNfcSerialNumber = async (): Promise<string> => {
  if (!isNfcSupported()) {
    throw new Error('NFC is not supported on this device or browser');
  }

  return new Promise((resolve, reject) => {
    try {
      const ndef = createNDEFReader();
      
      ndef.addEventListener("reading", ((event: Event) => {
        // Cast event to our custom type
        const ndefEvent = event as unknown as NDEFReadingEvent;
        resolve(ndefEvent.serialNumber);
      }) as EventListener, { once: true });
      
      ndef.scan().catch((error: Error) => {
        reject(error);
      });
    } catch (error) {
      console.error('Error getting NFC serial number:', error);
      reject(error);
    }
  });
};

// Verify if an NFC tag contains expected data
export const verifyNfcTag = async (expectedData: string): Promise<boolean> => {
  try {
    const data = await readFromNfcTag();
    return data === expectedData;
  } catch (error) {
    console.error('Error verifying NFC tag:', error);
    return false;
  }
}; 