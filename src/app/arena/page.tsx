'use client'

import Link from 'next/link'
import { PixelCanvas } from '@/components/ui/pixel-canvas'
import { RetroButton } from '@/components/ui/retro-button'

export default function ArenaPage() {
  return (
    <div className="relative">
      {/* Background image - positioned to respect navbar */}
      <div 
        className="fixed inset-0 top-16 -z-10" 
        style={{
          backgroundImage: "url('/images/back.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/70 to-purple-900/70"></div>
        
        {/* Pattern overlay */}
        <div 
          className="absolute inset-0 opacity-10" 
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 relative z-10">
        <h1 className="text-3xl font-bold mb-6 text-white font-retro tracking-wide uppercase">
          Arena
        </h1>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Card 1: Scan Arena */}
          <div className="group relative overflow-hidden bg-white/90 dark:bg-gray-800/90 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 backdrop-blur-sm flex flex-col h-full">
            <PixelCanvas
              gap={10}
              speed={25}
              colors={["#e0f2fe", "#7dd3fc", "#0ea5e9"]}
              variant="icon"
            />
            <div className="p-6 relative z-10 flex flex-col flex-grow">
              <div className="flex-grow">
                <h2 className="text-xl font-semibold mb-3 font-retro tracking-wide uppercase">
                  Scan Arena
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4 font-pixel tracking-wide">
                  Scan for nearby Blocknogotchi and challenge them to battles.
                </p>
              </div>
              <div className="mt-auto">
                <Link href="/arena/scan" className="block">
                  <RetroButton variant="blue" size="full" className="w-full">
                    Go to Scanner
                  </RetroButton>
                </Link>
              </div>
            </div>
          </div>
          
          {/* Card 2: Battle History */}
          <div className="group relative overflow-hidden bg-white/90 dark:bg-gray-800/90 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 backdrop-blur-sm flex flex-col h-full">
            <PixelCanvas
              gap={10}
              speed={25}
              colors={["#f0e4ff", "#d8b4fe", "#a855f7"]}
              variant="icon"
            />
            <div className="p-6 relative z-10 flex flex-col flex-grow">
              <div className="flex-grow">
                <h2 className="text-xl font-semibold mb-3 font-retro tracking-wide uppercase">
                  Battle History
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4 font-pixel tracking-wide">
                  View your past battles and performance statistics.
                </p>
              </div>
              <div className="mt-auto">
                <RetroButton variant="darkGray" size="full" className="w-full" disabled>
                  Coming Soon
                </RetroButton>
              </div>
            </div>
          </div>
          
          {/* Card 3: Leaderboard */}
          <div className="group relative overflow-hidden bg-white/90 dark:bg-gray-800/90 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 backdrop-blur-sm flex flex-col h-full">
            <PixelCanvas
              gap={10}
              speed={25}
              colors={["#dcfce7", "#86efac", "#22c55e"]}
              variant="icon"
            />
            <div className="p-6 relative z-10 flex flex-col flex-grow">
              <div className="flex-grow">
                <h2 className="text-xl font-semibold mb-3 font-retro tracking-wide uppercase">
                  Leaderboard
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4 font-pixel tracking-wide">
                  Check the global rankings and top performers.
                </p>
              </div>
              <div className="mt-auto">
                <Link href="/leaderboard" className="block">
                  <RetroButton variant="purple" size="full" className="w-full">
                    Go to Leaderboard
                  </RetroButton>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 