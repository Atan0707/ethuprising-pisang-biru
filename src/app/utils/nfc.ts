/**
 * NFC Utility functions for reading and writing to NFC tags
 */

// Check if Web NFC API is available
export const isNfcSupported = (): boolean => {
  return typeof window !== 'undefined' && 'NDEFReader' in window;
};

// Write data to an NFC tag
export const writeToNfcTag = async (data: string): Promise<boolean> => {
  if (!isNfcSupported()) {
    throw new Error('NFC is not supported on this device or browser');
  }

  try {
    // @ts-expect-error - NDEFReader is not in the TypeScript types yet
    const ndef = new window.NDEFReader();
    await ndef.write({
      records: [
        { recordType: "text", data },
      ]
    });
    return true;
  } catch (error) {
    console.error('Error writing to NFC tag:', error);
    throw error;
  }
};

// Read data from an NFC tag
export const readFromNfcTag = async (): Promise<string> => {
  if (!isNfcSupported()) {
    throw new Error('NFC is not supported on this device or browser');
  }

  return new Promise((resolve, reject) => {
    try {
      // @ts-expect-error - NDEFReader is not in the TypeScript types yet
      const ndef = new window.NDEFReader();
      
      ndef.addEventListener("reading", (event: { message: { records: Array<{ recordType: string, data: BufferSource }> } }) => {
        for (const record of event.message.records) {
          if (record.recordType === "text") {
            const textDecoder = new TextDecoder();
            const text = textDecoder.decode(record.data);
            resolve(text);
          }
        }
      });
      
      ndef.scan().catch((error: Error) => {
        reject(error);
      });
    } catch (error) {
      console.error('Error reading from NFC tag:', error);
      reject(error);
    }
  });
}; 