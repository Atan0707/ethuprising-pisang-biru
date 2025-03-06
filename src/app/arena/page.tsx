'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ArenaPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Arena</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-3">Scan Arena</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Scan for nearby Blocknogotchi and challenge them to battles.
            </p>
            <Link 
              href="/arena/scan" 
              className="block w-full py-2 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-center font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all"
            >
              Go to Scanner
            </Link>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-3">Battle History</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              View your past battles and performance statistics.
            </p>
            <button 
              className="block w-full py-2 px-4 bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-center font-medium rounded-lg cursor-not-allowed"
              disabled
            >
              Coming Soon
            </button>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-3">Leaderboard</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Check the global rankings and top performers.
            </p>
            <button 
              className="block w-full py-2 px-4 bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-center font-medium rounded-lg cursor-not-allowed"
              disabled
            >
              Coming Soon
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 