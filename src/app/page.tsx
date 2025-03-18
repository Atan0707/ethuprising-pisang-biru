'use client'

import Image from "next/image";
import Link from "next/link";
// import { useState, useEffect } from 'react'
// import { subscribeUser, unsubscribeUser, sendNotification } from './actions'


// function urlBase64ToUint8Array(base64String: string) {
//   const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
//   const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
 
//   const rawData = window.atob(base64)
//   const outputArray = new Uint8Array(rawData.length)
 
//   for (let i = 0; i < rawData.length; ++i) {
//     outputArray[i] = rawData.charCodeAt(i)
//   }
//   return outputArray
// }

// function PushNotificationManager() {
//   const [isSupported, setIsSupported] = useState(false)
//   const [subscription, setSubscription] = useState<PushSubscription | null>(
//     null
//   )
//   const [message, setMessage] = useState('')
 
//   useEffect(() => {
//     if ('serviceWorker' in navigator && 'PushManager' in window) {
//       setIsSupported(true)
//       registerServiceWorker()
//     }
//   }, [])
 
//   async function registerServiceWorker() {
//     const registration = await navigator.serviceWorker.register('/sw.js', {
//       scope: '/',
//       updateViaCache: 'none',
//     })
//     const sub = await registration.pushManager.getSubscription()
//     setSubscription(sub)
//   }
 
//   async function subscribeToPush() {
//     const registration = await navigator.serviceWorker.ready
//     const sub = await registration.pushManager.subscribe({
//       userVisibleOnly: true,
//       applicationServerKey: urlBase64ToUint8Array(
//         process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
//       ),
//     })
//     setSubscription(sub)
//     const serializedSub = JSON.parse(JSON.stringify(sub))
//     await subscribeUser(serializedSub)
//   }
 
//   async function unsubscribeFromPush() {
//     await subscription?.unsubscribe()
//     setSubscription(null)
//     await unsubscribeUser()
//   }
 
//   async function sendTestNotification() {
//     if (subscription) {
//       await sendNotification(message)
//       setMessage('')
//     }
//   }
 
//   if (!isSupported) {
//     return <p>Push notifications are not supported in this browser.</p>
//   }
 
//   return (
//     <div>
//       <h3>Push Notifications</h3>
//       {subscription ? (
//         <>
//           <p>You are subscribed to push notifications.</p>
//           <button onClick={unsubscribeFromPush}>Unsubscribe</button>
//           <input
//             type="text"
//             placeholder="Enter notification message"
//             value={message}
//             onChange={(e) => setMessage(e.target.value)}
//           />
//           <button onClick={sendTestNotification}>Send Test</button>
//         </>
//       ) : (
//         <>
//           <p>You are not subscribed to push notifications.</p>
//           <button onClick={subscribeToPush}>Subscribe</button>
//         </>
//       )}
//     </div>
//   )
// }

// function InstallPrompt() {
//   const [isIOS, setIsIOS] = useState(false)
//   const [isStandalone, setIsStandalone] = useState(false)
 
//   useEffect(() => {
//     setIsIOS(
//       /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream: unknown }).MSStream
//     )
 
//     setIsStandalone(window.matchMedia('(display-mode: standalone)').matches)
//   }, [])
 
//   if (isStandalone) {
//     return null // Don't show install button if already installed
//   }
 
//   return (
//     <div>
//       <h3>Install App</h3>
//       <button>Add to Home Screen</button>
//       {isIOS && (
//         <p>
//           To install this app on your iOS device, tap the share button
//           <span role="img" aria-label="share icon">
//             {' '}
//             ⎋{' '}
//           </span>
//           and then &quot;Add to Home Screen&quot;
//           <span role="img" aria-label="plus icon">
//             {' '}
//             ➕{' '}
//           </span>.
//         </p>
//       )}
//     </div>
//   )
// }
 

export default function Home() {
  return (
    <div className="min-h-screen pt-20 pb-10 relative">
      {/* <PushNotificationManager />
      <InstallPrompt /> */}
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
        
      </div>
      
      <div className="max-w-4xl mx-auto px-4">
        <main className="flex flex-col items-center justify-center gap-12 px-6 text-center lg:gap-16 py-16">
          <div className="flex flex-col gap-4 lg:gap-6">
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
              Welcome to <span className="text-blue-600">Blocknogotchi</span>
            </h1>
            <p className="mx-auto max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
              Adopt and care for your virtual pet on the blockchain!
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full shadow-lg transition-all transform hover:scale-105 flex items-center gap-2"
              href="/mint"
            >
              <Image
                src="/pokeball.svg"
                alt="Pokeball"
                width={24}
                height={24}
              />
              Mint a Blocknogotchi
            </Link>
            <Link
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-full shadow-lg transition-all transform hover:scale-105 flex items-center gap-2"
              href="/claim"
            >
              <Image
                src="/nfc-card.svg"
                alt="NFC Card"
                width={24}
                height={24}
              />
              Claim with NFC
            </Link>
            <Link
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-full shadow-lg transition-all transform hover:scale-105 flex items-center gap-2"
              href="/p2p"
            >
              <Image src="/marketplace.svg" alt="Marketplace" width={24} height={24} />
              Trade Blockmon
            </Link>
            <Link
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-full shadow-lg transition-all transform hover:scale-105 flex items-center gap-2"
              href="/choose"
            >
              <Image src="/battle.png" alt="Battle" width={24} height={24} />
              Battle Arena
            </Link>
          </div>

          <div className="mt-12 bg-white/80 dark:bg-gray-800/80 rounded-xl p-8 shadow-xl backdrop-blur-sm w-full max-w-2xl">
            <h2 className="text-2xl font-bold mb-4 text-blue-600">
              What is Blocknogotchi?
            </h2>
            <p className="mb-4">
              Blocknogotchi is a blockchain-based virtual pet game inspired by
              the classic Tamagotchi. Mint your own unique pet, care for it, and
              watch it grow!
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-lg">
                <h3 className="font-bold mb-2">Mint</h3>
                <p className="text-sm">
                  Create your unique pet with different species and traits
                </p>
              </div>
              <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-lg">
                <h3 className="font-bold mb-2">Claim</h3>
                <p className="text-sm">
                  Use NFC cards to claim and transfer pets to your wallet
                </p>
              </div>
              {/* <div className="bg-purple-100 dark:bg-purple-900/30 p-4 rounded-lg">
                <h3 className="font-bold mb-2">Care</h3>
                <p className="text-sm">
                  Feed, play, and interact with your pet to keep it happy
                </p>
              </div> */}
              <div className="bg-purple-100 dark:bg-purple-900/30 p-4 rounded-lg">
                <h3 className="font-bold mb-2">Trade</h3>
                <p className="text-sm">Buy and sell Blockmon in the marketplace</p>
              </div>
              <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-lg">
                <h3 className="font-bold mb-2">Battle</h3>
                <p className="text-sm">
                  Challenge other players and battle your Blockmon
                </p>
              </div>
            </div>
          </div>

          <div className="mt-16 max-w-2xl">
            <h2 className="text-2xl font-bold mb-4 text-blue-600">Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/80 dark:bg-gray-800/80 p-6 rounded-lg shadow-md backdrop-blur-sm">
                <div className="flex items-center mb-3">
                  <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-full mr-3">
                    <Image src="/pokeball.svg" alt="Mint" width={24} height={24} />
                  </div>
                  <h3 className="text-lg font-bold">Mint Your Pet</h3>
                </div>
                <p>Create a unique blockchain pet with its own personality and traits. Every Blocknogotchi is one-of-a-kind!</p>
              </div>
              
              <div className="bg-white/80 dark:bg-gray-800/80 p-6 rounded-lg shadow-md backdrop-blur-sm">
                <div className="flex items-center mb-3">
                  <div className="bg-green-100 dark:bg-green-900/50 p-2 rounded-full mr-3">
                    <Image src="/nfc-card.svg" alt="NFC" width={24} height={24} />
                  </div>
                  <h3 className="text-lg font-bold">NFC Integration</h3>
                </div>
                <p>Use NFC cards to easily claim and transfer your digital pets. A seamless bridge between physical and digital worlds.</p>
              </div>
              
              <div className="bg-white/80 dark:bg-gray-800/80 p-6 rounded-lg shadow-md backdrop-blur-sm">
                <div className="flex items-center mb-3">
                  <div className="bg-purple-100 dark:bg-purple-900/50 p-2 rounded-full mr-3">
                    <Image src="/marketplace.svg" alt="Trade" width={24} height={24} />
                  </div>
                  <h3 className="text-lg font-bold">P2P Trading</h3>
                </div>
                <p>Trade your Blockmon with other players in our secure peer-to-peer marketplace. Collect rare species!</p>
              </div>
              
              {/* <div className="bg-white/80 dark:bg-gray-800/80 p-6 rounded-lg shadow-md backdrop-blur-sm">
                <div className="flex items-center mb-3">
                  <div className="bg-indigo-100 dark:bg-indigo-900/50 p-2 rounded-full mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                      <path d="M2 17l10 5 10-5"/>
                      <path d="M2 12l10 5 10-5"/>
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold">Blockchain Powered</h3>
                </div>
                <p>Built on blockchain technology for true ownership and provable rarity of your virtual pets.</p>
              </div> */}
              
              <div className="bg-white/80 dark:bg-gray-800/80 p-6 rounded-lg shadow-md backdrop-blur-sm">
                <div className="flex items-center mb-3">
                  <div className="bg-red-100 dark:bg-red-900/50 p-2 rounded-full mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m8 6 4-4 4 4"></path>
                      <path d="M12 2v10.3"></path>
                      <path d="M4 10c0 6 8 10 8 10s8-4 8-10a4 4 0 0 0-4-4c-2 0-4 2-4 4 0-2-2-4-4-4a4 4 0 0 0-4 4Z"></path>
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold">Battle Arena</h3>
                </div>
                <p>Challenge other players to exciting battles! Train your Blockmon, develop strategies, and become the ultimate champion.</p>
              </div>
            </div>
          </div>

          <div className="mt-16 bg-white/80 dark:bg-gray-800/80 rounded-xl p-8 shadow-xl backdrop-blur-sm w-full max-w-2xl">
            <h2 className="text-2xl font-bold mb-6 text-red-600">Battle System</h2>
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="md:w-1/2">
                <Image 
                  src="/images/events/battle-theme/background-battle.gif" 
                  alt="Battle Arena" 
                  width={300} 
                  height={200} 
                  className="rounded-lg shadow-md"
                  style={{objectFit: 'cover'}}
                />
              </div>
              <div className="md:w-1/2 text-left">
                <h3 className="text-xl font-bold mb-3">Epic Battles Await!</h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <svg className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Train and level up your Blockmon</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Develop unique battle strategies</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Compete in tournaments for exclusive rewards</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Climb the global leaderboard</span>
                  </li>
                </ul>
                <div className="mt-4">
                  <Link href="/battle" className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">
                    Enter Battle Arena
                    <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/mint"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg text-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Image src="/pokeball.svg" alt="Pokeball" width={20} height={20} />
              Get Started
            </Link>
            <a 
              href="https://discord.gg/blocknogotchi" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-6 py-3 bg-purple-600 text-white rounded-lg text-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              Join Community
            </a>
          </div> */}
        </main>
      </div>
    </div>
  );
}
