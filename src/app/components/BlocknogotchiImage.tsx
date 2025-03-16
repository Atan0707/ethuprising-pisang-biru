'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface BlocknogotchiImageProps {
  tokenURI: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
}

export default function BlocknogotchiImage({ 
  tokenURI, 
  alt, 
  className = "w-full h-full object-cover",
  width = 300,
  height = 300
}: BlocknogotchiImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchImage = async () => {
      console.log(`BlocknogotchiImage: Attempting to load image from tokenURI: ${tokenURI}`);
      
      if (!tokenURI) {
        console.error('BlocknogotchiImage: No tokenURI provided');
        setError(true);
        setIsLoading(false);
        return;
      }

      // If it's already a default image path, use it directly
      if (tokenURI.startsWith('/blockmon/')) {
        console.log(`BlocknogotchiImage: Using default image path: ${tokenURI}`);
        setImageUrl(tokenURI);
        setIsLoading(false);
        return;
      }

      // Check if the URI is likely an image by extension
      const isLikelyImage = tokenURI.match(/\.(jpg|jpeg|png|gif|svg|webp)($|\?)/i) !== null;
      
      if (isLikelyImage || tokenURI.includes('https://plum-tough-mongoose-147.mypinata.cloud/ipfs/')) {
        console.log(`BlocknogotchiImage: URI appears to be a direct image: ${tokenURI}`);
        setImageUrl(tokenURI);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // Handle different URL formats
        let httpUrl = tokenURI;
        
        // Convert IPFS URL to HTTP URL using Pinata gateway
        if (tokenURI.startsWith('ipfs://')) {
          httpUrl = tokenURI.replace('ipfs://', 'https://plum-tough-mongoose-147.mypinata.cloud/ipfs/');
          console.log(`BlocknogotchiImage: Converted IPFS URL: ${httpUrl}`);
        } else if (tokenURI.includes('/ipfs/')) {
          const cid = tokenURI.split('/ipfs/')[1];
          httpUrl = `https://plum-tough-mongoose-147.mypinata.cloud/ipfs/${cid}`;
          console.log(`BlocknogotchiImage: Converted /ipfs/ URL: ${httpUrl}`);
        }

        // Check content type before trying to parse as JSON
        try {
          const headResponse = await fetch(httpUrl, { method: 'HEAD' });
          const contentType = headResponse.headers.get('content-type');
          console.log(`BlocknogotchiImage: Content type for ${httpUrl}: ${contentType}`);
          
          if (contentType && contentType.includes('image/')) {
            // It's an image, use it directly
            console.log(`BlocknogotchiImage: URI is a direct image: ${httpUrl}`);
            setImageUrl(httpUrl);
            setIsLoading(false);
            return;
          }
        } catch (headError) {
          console.error('BlocknogotchiImage: Error checking content type:', headError);
          // Continue with normal flow
        }

        // Try to fetch and parse as JSON first
        try {
          console.log(`BlocknogotchiImage: Fetching from ${httpUrl}`);
          const response = await fetch(httpUrl);
          
          if (!response.ok) {
            console.error(`BlocknogotchiImage: Failed to fetch from ${httpUrl}: ${response.status} ${response.statusText}`);
            throw new Error(`Failed to fetch: ${response.status}`);
          }
          
          const contentType = response.headers.get('content-type');
          console.log(`BlocknogotchiImage: Response content type: ${contentType}`);
          
          // If it's JSON, parse it and get the image URL
          if (contentType?.includes('application/json')) {
            const metadata = await response.json();
            console.log('BlocknogotchiImage: Parsed metadata:', metadata);
            
            if (!metadata.image) {
              console.error('BlocknogotchiImage: No image field in metadata');
              throw new Error('No image field in metadata');
            }
            
            let imageUrl = metadata.image;
            console.log(`BlocknogotchiImage: Image URL from metadata: ${imageUrl}`);
            
            // Handle different IPFS URL formats in the image field
            if (imageUrl.startsWith('ipfs://')) {
              imageUrl = imageUrl.replace('ipfs://', 'https://plum-tough-mongoose-147.mypinata.cloud/ipfs/');
              console.log(`BlocknogotchiImage: Converted image URL: ${imageUrl}`);
            } else if (imageUrl.includes('/ipfs/')) {
              const cid = imageUrl.split('/ipfs/')[1];
              imageUrl = `https://plum-tough-mongoose-147.mypinata.cloud/ipfs/${cid}`;
              console.log(`BlocknogotchiImage: Converted /ipfs/ image URL: ${imageUrl}`);
            }
            
            setImageUrl(imageUrl);
          } else {
            // If it's not JSON, assume it's a direct image URL
            console.log(`BlocknogotchiImage: Not JSON, using direct URL: ${httpUrl}`);
            setImageUrl(httpUrl);
          }
        } catch (parseError) {
          // If parsing as JSON fails, assume it's a direct image URL
          console.error('BlocknogotchiImage: Error parsing JSON:', parseError);
          console.log(`BlocknogotchiImage: Falling back to direct URL: ${httpUrl}`);
          setImageUrl(httpUrl);
        }
      } catch (error) {
        console.error('BlocknogotchiImage: Error fetching image:', error);
        // Fallback to default image
        setImageUrl('/blockmon/default.png');
        setError(false); // Don't show error state if we have a fallback
      } finally {
        setIsLoading(false);
      }
    };

    fetchImage();
  }, [tokenURI]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-700 animate-pulse">
        <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  if (error || !imageUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-600">
        <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  return (
    <Image
      src={imageUrl}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={() => {
        console.error(`BlocknogotchiImage: Error loading image from URL: ${imageUrl}`);
        // Fallback to default image on error
        setImageUrl('/blockmon/default.png');
      }}
    />
  );
} 