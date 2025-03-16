"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { toast } from "sonner";
import { readFromNfcTag } from "@/app/utils/nfc";
import { listNFT, getOwnedNFTs, BlockmonData } from "@/app/utils/marketplace";
import { ethers } from "ethers";
import Blocknogotchi from "@/contract/BlocknogotchiContract.json";

// Enum mapping for attributes
const attributeMap = [
  { name: "FIRE", color: "text-red-500", bgColor: "bg-red-100", icon: "🔥" },
  { name: "WATER", color: "text-blue-500", bgColor: "bg-blue-100", icon: "💧" },
  {
    name: "PLANT",
    color: "text-green-500",
    bgColor: "bg-green-100",
    icon: "🌿",
  },
  {
    name: "ELECTRIC",
    color: "text-yellow-500",
    bgColor: "bg-yellow-100",
    icon: "⚡",
  },
  {
    name: "EARTH",
    color: "text-amber-700",
    bgColor: "bg-amber-100",
    icon: "🌍",
  },
  { name: "AIR", color: "text-sky-500", bgColor: "bg-sky-100", icon: "💨" },
  {
    name: "LIGHT",
    color: "text-yellow-400",
    bgColor: "bg-yellow-50",
    icon: "✨",
  },
  {
    name: "DARK",
    color: "text-purple-700",
    bgColor: "bg-purple-100",
    icon: "🌑",
  },
];

// Enum mapping for rarity
const rarityMap = [
  { name: "COMMON", color: "text-gray-600", bgColor: "bg-gray-100" },
  { name: "UNCOMMON", color: "text-green-600", bgColor: "bg-green-100" },
  { name: "RARE", color: "text-blue-600", bgColor: "bg-blue-100" },
  { name: "EPIC", color: "text-purple-600", bgColor: "bg-purple-100" },
  { name: "LEGENDARY", color: "text-yellow-600", bgColor: "bg-yellow-100" },
];

export default function ListNFTPage() {
  const [ownedNFTs, setOwnedNFTs] = useState<BlockmonData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNFT, setSelectedNFT] = useState<number | null>(null);
  const [price, setPrice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [nfcSupported, setNfcSupported] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedNFT, setScannedNFT] = useState<number | null>(null);
  const requireNfcVerification = false; //testing purposes
  const router = useRouter();

  // Use reown wallet integration
  const { isConnected, address } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider("eip155");

  // Ensure component is mounted to avoid hydration issues
  useEffect(() => {
    setMounted(true);

    // Check if NFC is supported
    if (typeof window !== "undefined") {
      setNfcSupported("NDEFReader" in window);
    }
  }, []);

  // Fetch owned NFTs from blockchain when wallet is connected
  useEffect(() => {
    const fetchOwnedNFTs = async () => {
      if (!mounted || !isConnected || !address) return;

      setIsLoading(true);
      try {
        // Use the getOwnedNFTs function from marketplace.ts
        const ownedTokens = await getOwnedNFTs(address);

        if (ownedTokens.length === 0) {
          console.log("No owned tokens found");
          toast.info("No Blockmons found", {
            description:
              "You don't own any Blockmons yet. Try minting one first!",
            icon: "🔍",
          });
        } else {
          console.log(`Found ${ownedTokens.length} owned tokens`);
        }

        setOwnedNFTs(ownedTokens);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching owned NFTs:", error);
        toast.error(
          `Failed to fetch your Blockmons: ${(error as Error).message}`
        );
        setIsLoading(false);
      }
    };

    fetchOwnedNFTs();
  }, [mounted, isConnected, address]);

  // Check if wallet is connected and redirect if not
  useEffect(() => {
    if (mounted && !isConnected) {
      router.push("/marketplace");
      toast.error("Please connect your wallet first");
    }
  }, [mounted, isConnected, router]);

  // Function to handle NFT selection
  const handleSelectNFT = (id: number) => {
    setSelectedNFT(id === selectedNFT ? null : id);
    // Reset scanned NFT when selection changes
    setScannedNFT(null);
  };

  // Function to handle price input
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only numbers and decimals
    const value = e.target.value;
    if (value === "" || /^[0-9]*\.?[0-9]*$/.test(value)) {
      setPrice(value);
    }
  };

  // Function to start NFC scanning
  const startNfcScan = async () => {
    if (!selectedNFT) {
      toast.error("Please select a Blockmon first");
      return;
    }

    setIsScanning(true);
    const scanToastId = toast.loading("Scanning for NFC Card", {
      description: "Bring your Blockmon NFC card close to your device...",
      icon: "📡",
      duration: Infinity,
    });

    try {
      // Get the claim hash from NFC card
      const claimHash = await readFromNfcTag();

      if (!claimHash) {
        toast.dismiss(scanToastId);
        toast.error("Invalid NFC Card", {
          description: "Could not read claim hash from NFC card.",
          icon: "❌",
        });
        setIsScanning(false);
        return;
      }

      // Get the contract instance
      const provider = new ethers.BrowserProvider(
        walletProvider as ethers.Eip1193Provider
      );
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        "0xe1e52a36E15eBf6785842e55b6d1D901819985ec",
        Blocknogotchi.abi,
        signer
      );

      // Get token ID from claim hash
      const tokenId = await contract.hashToToken(claimHash);

      if (tokenId.toString() !== selectedNFT.toString()) {
        toast.dismiss(scanToastId);
        toast.error("Verification Failed", {
          description:
            "This NFC card is not associated with the selected Blockmon.",
          icon: "❌",
        });
        setIsScanning(false);
        return;
      }

      // Get Pokemon data to verify ownership
      const pokemonData = await contract.getBlocknogotchi(tokenId);
      const owner = pokemonData[11]; // owner is at index 11 in the return tuple

      if (owner.toLowerCase() !== address?.toLowerCase()) {
        toast.dismiss(scanToastId);
        toast.error("Ownership Verification Failed", {
          description: "You are not the owner of this Blockmon.",
          icon: "❌",
        });
        setIsScanning(false);
        return;
      }

      // If we get here, the verification was successful
      toast.dismiss(scanToastId);
      toast.success("Blockmon Verified", {
        description: `Successfully verified Blockmon #${tokenId}`,
        icon: "✅",
      });

      setScannedNFT(Number(tokenId));
      setIsScanning(false);
    } catch (error) {
      console.error("Error scanning NFC:", error);
      toast.dismiss(scanToastId);
      toast.error("Scanning Failed", {
        description: "Failed to scan NFC card. Please try again.",
        icon: "❌",
      });
      setIsScanning(false);
    }
  };

  // Function to handle listing submission
  const handleSubmitListing = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedNFT) {
      toast.error("Please select a Blockmon to list");
      return;
    }

    if (!price || parseFloat(price) <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    // Check if the selected NFT has been verified with NFC, only if verification is required
    if (requireNfcVerification && scannedNFT !== selectedNFT) {
      toast.error("Ownership Verification Required", {
        description:
          "Please scan your NFC card to verify ownership before listing.",
        icon: "🔒",
      });
      return;
    }

    if (!walletProvider) {
      toast.error("Wallet not connected", {
        description: "Please make sure your wallet is connected.",
        icon: "🔒",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const loadingToast = toast.loading("Processing your listing...");

      // Call the listNFT function from marketplace.ts with the wallet provider
      // Use a more specific type assertion
      await listNFT(
        selectedNFT,
        price,
        walletProvider as import("ethers").Eip1193Provider
      );

      toast.dismiss(loadingToast);
      toast.success(
        `Successfully listed Blockmon #${selectedNFT} for ${price} ETH!`
      );

      // Remove the listed NFT from the display
      setOwnedNFTs(ownedNFTs.filter((nft) => nft.id !== selectedNFT));
      setSelectedNFT(null);
      setScannedNFT(null);
      setPrice("");

      // Redirect to marketplace after a short delay
      setTimeout(() => {
        router.push("/marketplace");
      }, 1500);
    } catch (error) {
      console.error("Error listing NFT:", error);
      toast.error("Failed to list Blockmon", {
        description:
          "There was an error listing your Blockmon. Please try again.",
      });
      setIsSubmitting(false);
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 pb-10 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!mounted) return null;

  return (
    <div className="min-h-screen pt-20 pb-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            List Your Blockmon
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Select a Blockmon from your collection
            {requireNfcVerification
              ? ", verify ownership with your NFC card,"
              : ""}{" "}
            and list it on the marketplace
          </p>
        </div>

        {ownedNFTs.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
              No Blockmon available
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              You don&apos;t have any Blockmon to list on the marketplace.
            </p>
            <div className="mt-6">
              <button
                onClick={() => router.push("/mint")}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Mint a Blockmon
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Step 1: Select a Blockmon to list
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {ownedNFTs.map((nft) => (
                  <div
                    key={nft.id}
                    className={`border rounded-lg overflow-hidden cursor-pointer transition-all ${
                      selectedNFT === nft.id
                        ? "border-blue-500 ring-2 ring-blue-500 transform scale-105"
                        : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700"
                    }`}
                    onClick={() => handleSelectNFT(nft.id)}
                  >
                    <div className="relative h-40 w-full bg-gray-200 dark:bg-gray-700">
                      {nft.tokenURI ? (
                        <Image
                          src={nft.tokenURI}
                          alt={nft.name}
                          layout="fill"
                          objectFit="cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <span className="text-6xl">
                            {attributeMap[nft.attribute].icon}
                          </span>
                        </div>
                      )}
                      <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                        Lvl {nft.level}
                      </div>
                      {scannedNFT === nft.id && (
                        <div className="absolute bottom-2 right-2 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3 w-3 mr-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          Verified
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <div className="flex justify-between items-start">
                        <h3 className="text-md font-semibold text-gray-900 dark:text-white">
                          {nft.name}
                        </h3>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            attributeMap[nft.attribute].bgColor
                          } ${attributeMap[nft.attribute].color}`}
                        >
                          {attributeMap[nft.attribute].name}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Rarity:{" "}
                        <span className="font-medium">
                          {rarityMap[nft.rarity].name}
                        </span>
                      </p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        ID: <span className="font-medium">#{nft.id}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {selectedNFT &&
                requireNfcVerification &&
                scannedNFT !== selectedNFT && (
                  <div className="mt-8">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      Step 2: Verify ownership with NFC card
                    </h2>

                    {nfcSupported === false ? (
                      <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 p-4 rounded-lg mb-4">
                        <p className="font-medium">NFC not supported!</p>
                        <p className="mt-1">
                          Your device or browser doesn&apos;t support NFC
                          scanning. Please use a compatible device (like an
                          Android phone with Chrome).
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col md:flex-row items-center gap-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="w-32 h-32 relative flex-shrink-0">
                          <Image
                            src="/nfc-scan.svg"
                            alt="NFC Scan"
                            width={128}
                            height={128}
                            className={`${isScanning ? "animate-pulse" : ""}`}
                          />
                        </div>

                        <div className="flex-1">
                          <p className="mb-4 text-gray-600 dark:text-gray-300">
                            To verify ownership, please scan the NFC card
                            associated with your Blockmon. This ensures that
                            only the rightful owner can list the Blockmon for
                            sale.
                          </p>

                          <button
                            onClick={startNfcScan}
                            disabled={isScanning || !selectedNFT}
                            className={`w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md flex items-center justify-center gap-2 ${
                              isScanning ? "opacity-70 cursor-not-allowed" : ""
                            }`}
                          >
                            {isScanning ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Scanning...
                              </>
                            ) : (
                              <>
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5 mr-1"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"
                                  />
                                </svg>
                                Scan NFC Card
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

              {selectedNFT &&
                (!requireNfcVerification || scannedNFT === selectedNFT) && (
                  <form onSubmit={handleSubmitListing} className="mt-8">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      Step {requireNfcVerification ? "3" : "2"}: Set your price
                    </h2>

                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-grow">
                        <label
                          htmlFor="price"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                        >
                          Price (ETH)
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">Ξ</span>
                          </div>
                          <input
                            type="text"
                            name="price"
                            id="price"
                            className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-8 pr-12 sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                            placeholder="0.00"
                            value={price}
                            onChange={handlePriceChange}
                            disabled={isSubmitting}
                          />
                        </div>
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          Set a fair price for your Blockmon. A marketplace fee
                          of 2.5% will be applied to the sale.
                        </p>
                      </div>

                      <div className="flex items-end">
                        <button
                          type="submit"
                          className={`w-full sm:w-auto px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                            !price || isSubmitting
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                          disabled={!price || isSubmitting}
                        >
                          {isSubmitting ? "Processing..." : "List for Sale"}
                        </button>
                      </div>
                    </div>
                  </form>
                )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
