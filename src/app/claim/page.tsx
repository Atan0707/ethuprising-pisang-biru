"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { Eip1193Provider, ethers } from "ethers";
import NFCScanner from "@/app/components/claim/NFCScanner";
import ClaimSuccess from "@/app/components/claim/ClaimSuccess";
import { toast } from "sonner";
import { BLOCKNOGOTCHI_CONTRACT_ADDRESS } from "@/app/utils/config";
import Blockmon from "@/contract/Blockmon.json";


// Type for event logs
interface EventLog {
  name?: string;
  args?: unknown[];
}

export default function ClaimPage() {
  const { address, isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider("eip155");
  const [mounted, setMounted] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [claimResult, setClaimResult] = useState<{
    tokenId: string;
    petName: string;
    image: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  // const [debugHash, setDebugHash] = useState<string | null>(null);

  // Ensure component is mounted to avoid hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Debug function to get the latest claim hash
  // const getLatestClaimHash = async () => {
  //   if (!isConnected || !address || !walletProvider) {
  //     setError("Please connect your wallet to debug");
  //     return;
  //   }

  //   try {
  //     const provider = new ethers.BrowserProvider(
  //       walletProvider as Eip1193Provider
  //     );
  //     const signer = await provider.getSigner();
  //     const contract = new ethers.Contract(
  //       CONTRACT_ADDRESS,
  //       CONTRACT_ABI,
  //       signer
  //     );

  //     // Create a new pet to get the claim hash
  //     const createTx = await contract.createPokemon(
  //       "Debug Pokemon",
  //       0, // FIRE species
  //       0, // COMMON rarity
  //       "https://plum-tough-mongoose-147.mypinata.cloud/ipfs/bafkreigryiqie52hop6px6afkv4bzixkcxjp5izl2fehcotjnvbmgdpwnq"
  //     );

  //     // Wait for transaction to be mined
  //     const receipt = await createTx.wait();

  //     // Parse the event to get tokenId and claimHash
  //     const event = receipt.logs
  //       .map((log: unknown) => {
  //         try {
  //           return contract.interface.parseLog(
  //             log as { topics: string[]; data: string }
  //           );
  //         } catch {
  //           return null;
  //         }
  //       })
  //       .find(
  //         (event: EventLog | null) => event && event.name === "PokemonCreated"
  //       );

  //     if (event && event.args && event.args.length >= 2) {
  //       const tokenId = event.args[0].toString();
  //       const claimHash = event.args[1];

  //       setDebugHash(claimHash);
  //       toast.info("New Claim Hash Created", {
  //         description: `Token ID: ${tokenId}, Hash: ${claimHash.slice(
  //           0,
  //           10
  //         )}...`,
  //         duration: 10000,
  //       });

  //       console.log("New token ID:", tokenId);
  //       console.log("Claim hash:", claimHash);

  //       return claimHash;
  //     } else {
  //       throw new Error("Failed to parse PokemonCreated event");
  //     }
  //   } catch (err) {
  //     console.error("Error getting claim hash:", err);
  //     setError(
  //       "Error getting claim hash: " +
  //         (err instanceof Error ? err.message : String(err))
  //     );
  //     return null;
  //   }
  // };

  // Handle claim with hash from NFC card
  const handleClaim = async (claimHash: string) => {
    if (!isConnected || !address || !walletProvider) {
      setError("Please connect your wallet to claim");
      return;
    }

    setIsScanning(false);
    setError(null);

    // Show transaction pending toast
    const pendingToastId = toast.loading("Transaction Pending", {
      description:
        "Claiming your Blocknogotchi pet. Please wait while the transaction is being processed...",
      icon: "⏳",
      duration: Infinity,
    });

    try {
      const provider = new ethers.BrowserProvider(
        walletProvider as Eip1193Provider
      );
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        BLOCKNOGOTCHI_CONTRACT_ADDRESS,
        Blockmon.abi,
        signer
      );

      // Call claimPokemon function with the hash from NFC card
      const tx = await contract.claimPokemon(claimHash);

      // Show transaction submitted toast
      toast.dismiss(pendingToastId);
      const submittedToastId = toast.loading("Transaction Submitted", {
        description: `Transaction hash: ${tx.hash.slice(
          0,
          10
        )}...${tx.hash.slice(-8)}`,
        icon: "📝",
        duration: Infinity,
      });

      // Wait for transaction to be mined
      const receipt = await tx.wait();

      // Show transaction confirmed toast
      toast.dismiss(submittedToastId);
      toast.success("Transaction Confirmed", {
        description:
          "Your claim transaction has been confirmed on the blockchain.",
        icon: "✅",
      });

      // Parse the event to get tokenId
      const event = receipt.logs
        .map((log: unknown) => {
          try {
            return contract.interface.parseLog(
              log as { topics: string[]; data: string }
            );
          } catch {
            return null;
          }
        })
        .find(
          (event: EventLog | null) => event && event.name === "PokemonClaimed"
        );

      if (event && event.args) {
        const tokenId = event.args[0].toString();

        // Get pet details
        const pokemon = await contract.getPokemon(tokenId);

        setClaimResult({
          tokenId,
          petName: pokemon.name,
          image: pokemon.tokenURI,
        });
      }
    } catch (err) {
      console.error("Error claiming:", err);

      // Dismiss pending toast and show error toast
      toast.dismiss(pendingToastId);
      toast.error("Transaction Failed", {
        description: err instanceof Error ? err.message : String(err),
        icon: "❌",
      });

      setError(
        "Error claiming: " + (err instanceof Error ? err.message : String(err))
      );
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen pt-20 pb-10">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-8 text-blue-600">
          Claim Your Blocknogotchi
        </h1>

        {!isConnected ? (
          <div className="bg-white/80 dark:bg-gray-800/80 rounded-xl p-8 shadow-xl backdrop-blur-sm">
            <p className="text-center text-lg mb-4">
              Please connect your wallet to claim your Blocknogotchi
            </p>
            <div className="flex justify-center">
              <Image
                src="/pokeball.svg"
                alt="Pokeball"
                width={100}
                height={100}
                className="animate-bounce"
              />
            </div>
          </div>
        ) : claimResult ? (
          <ClaimSuccess
            tokenId={claimResult.tokenId}
            petName={claimResult.petName}
            image={claimResult.image}
            onReset={() => setClaimResult(null)}
          />
        ) : (
          <>
            <NFCScanner
              isScanning={isScanning}
              setIsScanning={setIsScanning}
              onScan={handleClaim}
              error={error}
            />

            {/* <div className="mt-6 flex justify-center">
              <button
                onClick={getLatestClaimHash}
                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Debug: Get Latest Claim Hash
              </button>
            </div>

            {debugHash && (
              <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <p className="font-semibold mb-1">Latest Claim Hash:</p>
                <p className="font-mono text-sm break-all">{debugHash}</p>
                <button
                  onClick={() => handleClaim(debugHash)}
                  className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Use This Hash
                </button>
              </div>
            )} */}
          </>
        )}
      </div>
    </div>
  );
}
