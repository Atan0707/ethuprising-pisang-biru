"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
// import Link from 'next/link';
import {
  useAppKit,
  useAppKitAccount,
  useAppKitProvider,
} from "@reown/appkit/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
// import { getAttributeString, getRarityString } from '@/app/utils/marketplace';
import {
  getP2PListingDetails,
  // P2PListing,
  DetailedP2PListing,
  purchaseP2PListing,
} from "@/app/utils/p2p-swap";
import { getBlocknogotchiContract } from "../utils/contractUtils";
import NFCScanner from "@/app/components/p2p/NFCScanner";
import ListingsGrid from "@/app/components/p2p/ListingsGrid";
import BlocknogotchiImage from "@/app/components/BlocknogotchiImage";
import { Eip1193Provider, ethers } from "ethers";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function P2PSwapPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedListing, setScannedListing] =
    useState<DetailedP2PListing | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nfcHash, setNfcHash] = useState<string>("");
  const [nfcSerialNumber, setNfcSerialNumber] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // Use reown wallet integration
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider("eip155");

  // Ensure component is mounted
  useEffect(() => {
    setMounted(true);
  }, []);

  // Function to handle NFC scanning or manual hash input
  const handleScan = async (hash: string, serialNumber: string) => {
    if (!isConnected || !walletProvider) {
      setError("Please connect your wallet first");
      return;
    }

    setIsLoading(true);
    setScannedListing(null);
    setError(null);

    try {
      // Clean up the hash by removing the prefix and any extra characters
      const cleanHash = hash
        .replace("blocknogotchi-hash:", "")
        .split(":")[0]
        .trim();

      // Ensure the hash has 0x prefix
      const formattedHash = cleanHash.startsWith("0x")
        ? cleanHash
        : `0x${cleanHash}`;
      console.log("Scan hash:", formattedHash); // Debug log

      setNfcHash(formattedHash); // Store the formatted hash
      setNfcSerialNumber(serialNumber);

      // Get the contract instance with signer
      const provider = new ethers.BrowserProvider(
        walletProvider as Eip1193Provider
      );
      const signer = await provider.getSigner();
      const contract = await getBlocknogotchiContract(signer);

      // Get token ID from hash using the formatted hash
      const tokenId = await contract.getTokenIdFromHash(formattedHash);
      console.log("Token ID:", tokenId);

      if (tokenId.toString() === "0") {
        throw new Error("This NFC card is not associated with any Blockmon");
      }

      // Get Blockmon data to verify it exists
      const blockmonData = await contract.getBlocknogotchi(tokenId);
      console.log("Blockmon Data:", blockmonData);

      if (!blockmonData) {
        throw new Error("Failed to fetch Blockmon data");
      }

      // Store the serial number for future verification if provided
      if (serialNumber) {
        localStorage.setItem(`nft_${tokenId}_serial`, serialNumber);
      }

      // Fetch the listing details for this token ID
      const listing = await getP2PListingDetails(tokenId);

      if (listing && listing.status === "active") {
        setScannedListing(listing);
        setIsModalOpen(true);
        toast.success("Found an active listing!");
      } else if (listing) {
        toast.info(
          `This NFT is not currently for sale (Status: ${listing.status}).`
        );
      } else {
        toast.info("No active listing found for this NFT.");
      }
    } catch (error) {
      console.error("Error processing scan:", error);

      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to process scan");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle purchasing the NFT
  const handlePurchase = async () => {
    if (!isConnected || !walletProvider) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!scannedListing) {
      toast.error("Listing details not available");
      return;
    }

    if (!nfcHash) {
      toast.error("NFC verification required");
      return;
    }

    setIsSubmitting(true);
    toast.loading("Processing purchase...");

    try {
      console.log("Purchase hash:", nfcHash); // Debug log

      const success = await purchaseP2PListing(
        scannedListing.id,
        scannedListing.price,
        nfcHash, // Use the already formatted hash from handleScan
        walletProvider as Eip1193Provider,
        nfcSerialNumber
      );

      if (success) {
        toast.dismiss();
        toast.success(`Successfully purchased Blockmon #${scannedListing.id}!`);
        setIsModalOpen(false);
        setScannedListing(null);
      }
    } catch (error) {
      console.error("Error purchasing P2P listing:", error);
      toast.dismiss();
      if (error instanceof Error) {
        toast.error(`Failed to purchase NFT: ${error.message}`);
      } else {
        toast.error("Failed to purchase NFT");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to handle creating a new P2P swap listing
  const handleCreateListing = () => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    router.push("/p2p/create");
  };

  // Function to handle wallet connection
  const handleConnectWallet = () => {
    toast.loading("Connecting Wallet", {
      description: "Please approve the connection request in your wallet.",
      icon: "🔗",
    });
    open();
  };

  // Format address for display
  const formatAddress = (address: string | undefined) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Person-to-Person NFT Swap
            </h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Swap your Blocknogotchi with others!
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-4">
            {!isConnected ? (
              <Button
                onClick={handleConnectWallet}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Connect Wallet
              </Button>
            ) : (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {formatAddress(address)}
                </span>
                <Button
                  onClick={handleCreateListing}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Trade Blocknogotchi
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* NFC Scan Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Find Blocknogotchi Listings
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              Scan your NFC card or enter its hash to find available listings.
            </p>
          </div>

          <NFCScanner
            isScanning={isScanning}
            setIsScanning={setIsScanning}
            onScan={handleScan}
            error={error}
          />
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">
              Loading listing details...
            </p>
          </div>
        )}

        {/* Transaction Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-gray-900 text-white border border-gray-800">
            {scannedListing && (
              <>
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-800">
                  <DialogTitle className="text-xl font-bold text-white">
                    Blocknogotchi #{scannedListing.id}
                  </DialogTitle>
                  <DialogDescription className="text-sm text-gray-400">
                    Review the details before purchasing this Blockmon
                  </DialogDescription>
                </DialogHeader>

                <div className="p-6">
                  {/* NFT Image */}
                  <div className="relative aspect-square bg-gray-800 rounded-lg overflow-hidden mb-6 max-w-[200px] mx-auto">
                    <BlocknogotchiImage
                      tokenURI={
                        scannedListing.rawData?.tokenURI || scannedListing.image
                      }
                      alt={scannedListing.name}
                      width={200}
                      height={200}
                    />
                  </div>

                  {/* NFT Details */}
                  <div className="space-y-4">
                    {/* Attribute Badge */}
                    <div className="flex justify-center mb-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-900 text-blue-200 uppercase">
                        {scannedListing.attribute}
                      </span>
                    </div>

                    {/* Main Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-400">Rarity</p>
                        <p className="font-medium text-white uppercase">
                          {scannedListing.rarity}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Level</p>
                        <p className="font-medium text-white">
                          {scannedListing.level}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Seller</p>
                        <p className="font-medium text-white">
                          {formatAddress(scannedListing.seller)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Price</p>
                        <p className="font-medium text-white flex items-center">
                          <Image
                            src="/eth-logo.svg"
                            alt="ETH"
                            width={16}
                            height={16}
                            className="mr-1"
                          />
                          {scannedListing.price} ETH
                        </p>
                      </div>
                    </div>

                    {/* Blocknogotchi Stats */}
                    <div className="bg-gray-800 rounded-lg p-4 mt-4">
                      <h3 className="text-sm font-semibold text-white mb-3">
                        Blocknogotchi Stats
                      </h3>
                      <div className="grid grid-cols-2 gap-y-2">
                        <div className="flex items-center">
                          <span className="text-sm text-gray-400">HP:</span>
                        </div>
                        <div className="flex items-center justify-end">
                          <span className="text-sm font-medium text-white">
                            {scannedListing.rawData?.hp || 0}
                          </span>
                        </div>

                        <div className="flex items-center">
                          <span className="text-sm text-gray-400">
                            Base Damage:
                          </span>
                        </div>
                        <div className="flex items-center justify-end">
                          <span className="text-sm font-medium text-white">
                            {scannedListing.rawData?.baseDamage || 0}
                          </span>
                        </div>

                        <div className="flex items-center">
                          <span className="text-sm text-gray-400">
                            Experience:
                          </span>
                        </div>
                        <div className="flex items-center justify-end">
                          <span className="text-sm font-medium text-white">
                            {scannedListing.rawData?.experience || 0}
                          </span>
                        </div>

                        <div className="flex items-center">
                          <span className="text-sm text-gray-400">
                            Birth Time:
                          </span>
                        </div>
                        <div className="flex items-center justify-end">
                          <span className="text-sm font-medium text-white">
                            {scannedListing.rawData?.birthTime
                              ? new Date(
                                  Number(scannedListing.rawData.birthTime) *
                                    1000
                                ).toLocaleDateString()
                              : "Unknown"}
                          </span>
                        </div>

                        <div className="flex items-center">
                          <span className="text-sm text-gray-400">
                            Battle Count:
                          </span>
                        </div>
                        <div className="flex items-center justify-end">
                          <span className="text-sm font-medium text-white">
                            {scannedListing.rawData?.battleCount || 0}
                          </span>
                        </div>

                        <div className="flex items-center">
                          <span className="text-sm text-gray-400">
                            Battle Wins:
                          </span>
                        </div>
                        <div className="flex items-center justify-end">
                          <span className="text-sm font-medium text-white">
                            {scannedListing.rawData?.battleWins || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <DialogFooter className="px-6 py-4 border-t border-gray-800 flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                    className="text-gray-300 border-gray-700 hover:bg-gray-800"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handlePurchase}
                    disabled={isSubmitting}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isSubmitting
                      ? "Processing..."
                      : `Buy for ${scannedListing.price} ETH`}
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Available Listings Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Available Blocknogotchi
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              Browse all Blocknogotchi currently available for trade
            </p>
          </div>

          <ListingsGrid />
        </div>
      </div>
    </div>
  );
}
