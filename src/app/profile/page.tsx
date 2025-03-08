'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppKitAccount } from '@reown/appkit/react';
import { toast } from 'sonner';

export default function ProfilePage() {
  const router = useRouter();
  const { address, isConnected } = useAppKitAccount();
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted to avoid hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect to owner page with user's address when component mounts
  useEffect(() => {
    if (mounted) {
      if (isConnected && address) {
        router.push(`/owner/${address}`);
      } else {
        toast.error('Wallet not connected', {
          description: 'Please connect your wallet to view your profile.',
          icon: '🦊',
        });
        router.push('/');
      }
    }
  }, [mounted, isConnected, address, router]);

  // Show loading state while redirecting
  return (
    <div className="min-h-screen pt-20 pb-10 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">Loading your profile...</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Please wait while we redirect you to your Blockmon collection.</p>
      </div>
    </div>
  );
} 