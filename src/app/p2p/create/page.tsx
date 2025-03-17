"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  useAppKit,
  useAppKitAccount,
  useAppKitProvider,
} from "@reown/appkit/react";
import { toast } from "sonner";
import { Eip1193Provider, ethers } from "ethers";
import { createP2PListing } from "@/app/utils/p2p-swap";
import { BlockmonData } from "@/app/utils/marketplace";
import { Button } from "@/components/ui/button";
import Blocknogotchi from "@/contract/BlocknogotchiContract.json";
import { BLOCKNOGOTCHI_CONTRACT_ADDRESS } from "@/app/utils/config";
import NFCScanner from "@/app/components/p2p/NFCScanner";

// Add BlockmonImage component
const BlockmonImage = ({
  tokenURI,
  alt,
}: {
  tokenURI: string;
  alt: string;
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchImage = async () => {
      try {
        // Convert IPFS URL to HTTP URL using Pinata gateway instead of ipfs.io
        const httpUrl = tokenURI.replace(
          "ipfs://",
          "https://plum-tough-mongoose-147.mypinata.cloud/ipfs/"
        );

        // Try to fetch and parse as JSON first
        try {
          const response = await fetch(httpUrl);
          const contentType = response.headers.get("content-type");

          // If it's JSON, parse it and get the image URL
          if (contentType?.includes("application/json")) {
            const metadata = await response.json();
            let imageUrl = metadata.image;
            if (imageUrl.startsWith("ipfs://")) {
              imageUrl = imageUrl.replace(
                "ipfs://",
                "https://plum-tough-mongoose-147.mypinata.cloud/ipfs/"
              );
            }
            setImageUrl(imageUrl);
          } else {
            // If it's not JSON, assume it's a direct image URL
            setImageUrl(httpUrl);
          }
        } catch {
          // If parsing as JSON fails, assume it's a direct image URL
          setImageUrl(httpUrl);
        }
      } catch (error) {
        console.error("Error fetching image:", error);
        setImageUrl(null);
      }
    };

    fetchImage();
  }, [tokenURI]);

  if (!imageUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-600">
        <svg
          className="w-12 h-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  return (
    <Image
      src={imageUrl}
      alt={alt}
      width={300}
      height={300}
      className="w-full h-full object-cover"
    />
  );
};

export default function CreateP2PListingPage() {
  const [selectedNFT, setSelectedNFT] = useState<BlockmonData | null>(null);
  const [price, setPrice] = useState<string>("");
  const [nfcHash, setNfcHash] = useState<string>("");
  const [isScanning, setIsScanning] = useState(false);
  const [nfcVerified, setNfcVerified] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const router = useRouter();

  // Use reown wallet integration
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider("eip155");

  // Ensure component is mounted to avoid hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle successful NFC scan
  const handleNFCScan = async (hash: string) => {
    if (!isConnected || !walletProvider) {
      setError("Please connect your wallet first");
      return;
    }

    try {
      // Get the contract instance to find the token ID from the hash
      const provider = new ethers.BrowserProvider(
        walletProvider as Eip1193Provider
      );
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        BLOCKNOGOTCHI_CONTRACT_ADDRESS,
        Blocknogotchi.abi,
        signer
      );

      // Clean up the hash by removing the extra encoding characters
      const cleanHash = hash
        .replace("blocknogotchi-hash:", "")
        .split(":")[0] // Take only the first part before any ':'
        .trim(); // Remove any whitespace

      // Get token ID from claim hash using the cleaned hash
      const tokenId = await contract.getTokenIdFromHash(cleanHash);

      if (tokenId.toString() === "0") {
        setError("This NFC card is not associated with any Blockmon");
        return;
      }

      // Get Blockmon data to verify ownership
      const blockmonData = await contract.getBlocknogotchi(tokenId);
      const owner = blockmonData[11];

      if (owner.toLowerCase() !== address?.toLowerCase()) {
        setError("You are not the owner of this Blockmon");
        return;
      }

      // Create a BlockmonData object from the retrieved data
      const nft: BlockmonData = {
        id: Number(tokenId),
        name: blockmonData[0],
        attribute: Number(blockmonData[1]),
        rarity: Number(blockmonData[2]),
        level: Number(blockmonData[3]),
        hp: Number(blockmonData[4]),
        baseDamage: Number(blockmonData[5]),
        battleCount: Number(blockmonData[6]),
        battleWins: Number(blockmonData[7]),
        birthTime: Number(blockmonData[8]),
        lastBattleTime: Number(blockmonData[9]),
        owner: blockmonData[11],
        tokenURI: blockmonData[12],
        claimed: blockmonData[10],
      };

      setSelectedNFT(nft);
      setNfcHash(hash);
      setNfcVerified(true);
      setError(null);

      // Show the details modal
      setShowDetailsModal(true);

      toast.success("NFC card verified successfully!", {
        description: `Found Blocknogotchi: ${nft.name} #${nft.id}`,
      });
    } catch (error) {
      console.error("Error verifying NFC card:", error);

      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to verify NFC card");
      }
    } finally {
      setIsScanning(false);
    }
  };

  // Function to handle price input
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers and decimals
    if (/^\d*\.?\d*$/.test(value)) {
      setPrice(value);
    }
  };

  // Function to set a preset price
  const setPresetPrice = (presetPrice: string) => {
    setPrice(presetPrice);
  };

  // Function to close the details modal
  const closeDetailsModal = () => {
    setShowDetailsModal(false);
  };

  // Function to handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected || !walletProvider) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!selectedNFT) {
      toast.error("Please scan your NFC card to identify your Blockmon");
      return;
    }

    if (!price || parseFloat(price) <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    if (!nfcVerified || !nfcHash) {
      toast.error("Please scan your NFC card to verify ownership");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Creating P2P listing...");

    try {
      // Include the NFC serial number in the listing for additional verification
      const success = await createP2PListing(
        selectedNFT.id,
        price,
        nfcHash,
        walletProvider as Eip1193Provider,
      );

      if (success) {
        toast.dismiss(toastId);
        toast.success("P2P listing created successfully!");

        // Redirect to the P2P swap page after a short delay
        setTimeout(() => {
          router.push("/p2p");
        }, 1500);
      }
    } catch (error) {
      console.error("Error creating P2P listing:", error);
      toast.dismiss(toastId);

      if (error instanceof Error) {
        toast.error(`Failed to create P2P listing: ${error.message}`);
      } else {
        toast.error("Failed to create P2P listing");
      }
    } finally {
      setIsSubmitting(false);
      setShowDetailsModal(false);
    }
  };

  // Function to handle wallet connection
  const handleConnectWallet = () => {
    toast.loading("Connecting Wallet", {
      description: "Please approve the connection request in your wallet.",
      icon: "🔗",
    });
    open();
  };

  if (!mounted) return null;

  // If not connected, show connect wallet prompt
  if (!isConnected) {
    return (
      <div className="min-h-screen pt-20 pb-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
            <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-blue-100 dark:bg-blue-900">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-blue-600 dark:text-blue-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h3 className="mt-6 text-xl font-medium text-gray-900 dark:text-white">
              Connect Your Wallet
            </h3>
            <p className="mt-3 text-base text-gray-500 dark:text-gray-400">
              Please connect your wallet to create a P2P listing for your
              physical NFT card.
            </p>
            <div className="mt-6">
              <Button
                onClick={handleConnectWallet}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Connect Wallet
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <button
            onClick={() => router.push("/p2p")}
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
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
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to P2P Swap
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Create P2P Swap Listing
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              List your physical NFT card for sale with secure escrow
            </p>
          </div>

          <div className="p-6">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Scan Your Physical Card
              </label>
              <NFCScanner
                isScanning={isScanning}
                setIsScanning={setIsScanning}
                onScan={handleNFCScan}
                error={error}
              />
            </div>

            {nfcVerified && selectedNFT && (
              <div className="mb-6">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-green-400"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">
                        Blockmon verified: {selectedNFT.name} #{selectedNFT.id}
                      </p>
                    </div>
                    <div className="ml-auto pl-3">
                      <button
                        type="button"
                        onClick={() => setShowDetailsModal(true)}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 dark:bg-green-800 dark:text-green-100 dark:hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        View Details & List
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Blockmon Details Modal */}
      {showDetailsModal && selectedNFT && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full overflow-hidden">
            <div className="relative">
              <button
                onClick={closeDetailsModal}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Create P2P Listing
                </h3>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-6">
                <div className="flex flex-col md:flex-row gap-6 mb-6">
                  <div className="w-full md:w-1/3">
                    <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-600 mb-2">
                      <BlockmonImage
                        tokenURI={selectedNFT.tokenURI}
                        alt={`${selectedNFT.name} #${selectedNFT.id}`}
                      />
                    </div>
                    <h2 className="text-lg font-bold text-center text-gray-900 dark:text-white">
                      {selectedNFT.name} #{selectedNFT.id}
                    </h2>
                    <p className="text-sm text-center text-gray-500 dark:text-gray-400">
                      Level {selectedNFT.level} •{" "}
                      {["Common", "Uncommon", "Rare", "Epic", "Legendary"][
                        selectedNFT.rarity
                      ] || "Unknown"}
                    </p>
                  </div>

                  <div className="w-full md:w-2/3">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Battle Count
                        </p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {selectedNFT.battleCount || 0}
                        </p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Battle Wins
                        </p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {selectedNFT.battleWins || 0}
                        </p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Birth Time
                        </p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {selectedNFT.birthTime
                            ? new Date(
                                selectedNFT.birthTime * 1000
                              ).toLocaleDateString()
                            : "Unknown"}
                        </p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Last Battle
                        </p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {selectedNFT.lastBattleTime &&
                          selectedNFT.lastBattleTime > 0
                            ? new Date(
                                selectedNFT.lastBattleTime * 1000
                              ).toLocaleDateString()
                            : "Never battled"}
                        </p>
                      </div>
                    </div>

                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Set Price (ETH)
                      </label>

                      {/* Preset price buttons */}
                      <div className="grid grid-cols-4 gap-2 mb-3">
                        <button
                          type="button"
                          onClick={() => setPresetPrice("0.25")}
                          className={`px-3 py-2 text-sm font-medium rounded-md ${
                            price === "0.25"
                              ? "bg-blue-100 text-blue-700 border border-blue-300 dark:bg-blue-800 dark:text-blue-100 dark:border-blue-700"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                          }`}
                        >
                          0.25 ETH
                        </button>
                        <button
                          type="button"
                          onClick={() => setPresetPrice("0.5")}
                          className={`px-3 py-2 text-sm font-medium rounded-md ${
                            price === "0.5"
                              ? "bg-blue-100 text-blue-700 border border-blue-300 dark:bg-blue-800 dark:text-blue-100 dark:border-blue-700"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                          }`}
                        >
                          0.5 ETH
                        </button>
                        <button
                          type="button"
                          onClick={() => setPresetPrice("0.75")}
                          className={`px-3 py-2 text-sm font-medium rounded-md ${
                            price === "0.75"
                              ? "bg-blue-100 text-blue-700 border border-blue-300 dark:bg-blue-800 dark:text-blue-100 dark:border-blue-700"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                          }`}
                        >
                          0.75 ETH
                        </button>
                        <button
                          type="button"
                          onClick={() => setPresetPrice("1")}
                          className={`px-3 py-2 text-sm font-medium rounded-md ${
                            price === "1"
                              ? "bg-blue-100 text-blue-700 border border-blue-300 dark:bg-blue-800 dark:text-blue-100 dark:border-blue-700"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                          }`}
                        >
                          1 ETH
                        </button>
                      </div>

                      {/* Custom price input */}
                      <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Image
                            src="/eth-logo.svg"
                            alt="ETH"
                            width={16}
                            height={16}
                          />
                        </div>
                        <input
                          type="text"
                          name="price"
                          id="price"
                          className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-12 sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                          placeholder="Custom price"
                          value={price}
                          onChange={handlePriceChange}
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 dark:text-gray-400 sm:text-sm">
                            ETH
                          </span>
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        Platform fee: 2% of the sale price
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={closeDetailsModal}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !price || parseFloat(price) <= 0}
                    className={`${
                      price && parseFloat(price) > 0
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {isSubmitting
                      ? "Creating Listing..."
                      : "Create P2P Listing"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
