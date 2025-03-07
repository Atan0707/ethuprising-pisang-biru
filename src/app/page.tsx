import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen pt-20 pb-10 relative">
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
        {/* <div className="absolute inset-0 bg-gradient-to-b from-blue-900/70 to-purple-900/70"></div>
         */}
        {/* Pattern overlay */}
        {/* <div 
          className="absolute inset-0 opacity-10" 
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }} */}
        />
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
            <a
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full shadow-lg transition-all transform hover:scale-105 flex items-center gap-2"
              href="/mint"
            >
              <Image src="/pokeball.svg" alt="Pokeball" width={24} height={24} />
              Mint a Blocknogotchi
            </a>
            <a
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-full shadow-lg transition-all transform hover:scale-105 flex items-center gap-2"
              href="/claim"
            >
              <Image src="/nfc-card.svg" alt="NFC Card" width={24} height={24} />
              Claim with NFC
            </a>
          </div>
          
          <div className="mt-12 bg-white/80 dark:bg-gray-800/80 rounded-xl p-8 shadow-xl backdrop-blur-sm w-full max-w-2xl">
            <h2 className="text-2xl font-bold mb-4 text-blue-600">What is Blocknogotchi?</h2>
            <p className="mb-4">
              Blocknogotchi is a blockchain-based virtual pet game inspired by the classic Tamagotchi. 
              Mint your own unique pet, care for it, and watch it grow!
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-lg">
                <h3 className="font-bold mb-2">Mint</h3>
                <p className="text-sm">Create your unique pet with different species and traits</p>
              </div>
              <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-lg">
                <h3 className="font-bold mb-2">Claim</h3>
                <p className="text-sm">Use NFC cards to claim and transfer pets to your wallet</p>
              </div>
              <div className="bg-purple-100 dark:bg-purple-900/30 p-4 rounded-lg">
                <h3 className="font-bold mb-2">Care</h3>
                <p className="text-sm">Feed, play, and interact with your pet to keep it happy</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
