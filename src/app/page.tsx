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
              href="/marketplace"
            >
              <Image src="/marketplace.svg" alt="Marketplace" width={24} height={24} />
              Trade Blockmon
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
              <div className="bg-purple-100 dark:bg-purple-900/30 p-4 rounded-lg">
                <h3 className="font-bold mb-2">Care</h3>
                <p className="text-sm">
                  Feed, play, and interact with your pet to keep it happy
                </p>
              </div>
              <div className="bg-indigo-100 dark:bg-indigo-900/30 p-4 rounded-lg">
                <h3 className="font-bold mb-2">Trade</h3>
                <p className="text-sm">Buy and sell Blockmon in the marketplace</p>
              </div>
            </div>
          </div>

          <div className="mt-16 max-w-2xl">
            <h2 className="text-2xl font-bold mb-4">How to Play</h2>
            <ol className="list-decimal pl-6 space-y-2">
              <li>
                <strong>Host a Game:</strong> Have a third person create a game
                code by clicking &quot;Host a Game&quot;
              </li>
              <li>
                <strong>Join the Game:</strong> Both players join using the same
                game code
              </li>
              <li>
                <strong>Make Your Gesture:</strong> After the countdown, you&apos;ll
                have 5 seconds to make your rock, paper, or scissors gesture
              </li>
              <li>
                <strong>See the Results:</strong> Find out who won after both
                players have chosen
              </li>
            </ol>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <Link
              href="/host"
              className="px-6 py-3 bg-purple-600 text-white rounded-lg text-lg hover:bg-purple-700 transition-colors"
            >
              Host a Game
            </Link>
            <Link
              href="/multiplayer"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg text-lg hover:bg-blue-700 transition-colors"
            >
              Join a Game
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
