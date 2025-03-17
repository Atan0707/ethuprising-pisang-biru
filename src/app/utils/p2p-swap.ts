import { ethers, Eip1193Provider } from "ethers";
import BlocknogotchiContract from "@/contract/BlocknogotchiContract.json";
import P2PSwapABI from "@/contract/P2PSwap.json";
import { ApolloClient, InMemoryCache, HttpLink, gql } from "@apollo/client";
import { getAttributeString, getRarityString } from "./marketplace";
import {
  GRAPH_P2P_URL,
  BLOCKNOGOTCHI_CONTRACT_ADDRESS,
  P2P_SWAP_CONTRACT_ADDRESS,
  RPC_URL,
} from "./config";
// Create an Apollo Client instance for The Graph (P2P Swap data)
const p2pSwapGraphClient = new ApolloClient({
  link: new HttpLink({
    uri: GRAPH_P2P_URL,
  }),
  cache: new InMemoryCache(),
});

// Add this constant at the top with other imports
const PINATA_GATEWAY = "https://plum-tough-mongoose-147.mypinata.cloud/ipfs/";
console.log("PINATA_GATEWAY URL:", PINATA_GATEWAY);

// GraphQL query to get P2P swap listings
const GET_P2P_LISTINGS = gql`
  query GetP2PListings {
    listingCreateds(orderBy: blockTimestamp, orderDirection: desc) {
      id
      tokenId
      seller
      price
      blockTimestamp
    }
    listingPurchaseds(orderBy: blockTimestamp, orderDirection: desc) {
      id
      tokenId
      seller
      buyer
      price
      blockTimestamp
    }
    listingCancelleds(orderBy: blockTimestamp, orderDirection: desc) {
      id
      tokenId
      seller
      blockTimestamp
    }
    listingClaimeds(orderBy: blockTimestamp, orderDirection: desc) {
      id
      tokenId
      seller
      blockTimestamp
    }
  }
`;

// GraphQL query to get a specific P2P swap listing
const GET_P2P_LISTING = gql`
  query GetP2PListing($tokenId: String!) {
    listingCreateds(
      where: { tokenId: $tokenId }
      orderBy: blockTimestamp
      orderDirection: desc
      first: 1
    ) {
      id
      tokenId
      seller
      price
      blockTimestamp
    }
  }
`;

/**
 * Interface for GraphQL listing data
 */
interface GraphQLListing {
  id: string;
  tokenId: string;
  seller: string;
  price: string;
  blockTimestamp: string;
  buyer?: string;
}

/**
 * Get a signer for the current user
 */
export const getSigner = async (walletProvider: Eip1193Provider) => {
  if (!walletProvider) {
    throw new Error("Wallet provider not available");
  }

  const provider = new ethers.BrowserProvider(walletProvider);
  return provider.getSigner();
};

/**
 * Get the P2P Swap contract instance
 */
export const getP2PSwapContract = async (signer?: ethers.Signer) => {
  if (!signer) {
    throw new Error("Signer not available");
  }

  return new ethers.Contract(P2P_SWAP_CONTRACT_ADDRESS, P2PSwapABI.abi, signer);
};

/**
 * Get the Blockmon contract instance
 */
export const getBlockmonContract = async (signer?: ethers.Signer) => {
  if (!signer) {
    throw new Error("Signer not available");
  }

  return new ethers.Contract(
    BLOCKNOGOTCHI_CONTRACT_ADDRESS,
    BlocknogotchiContract.abi,
    signer
  );
};

/**
 * Interface for P2P swap listing data
 */
export interface P2PListing {
  id: number;
  name: string;
  image: string;
  price: string;
  seller: string;
  attribute: number;
  rarity: number;
  level: number;
  status: "active" | "sold" | "cancelled" | "claimed";
}

/**
 * Interface for detailed P2P listing data
 */
export interface DetailedP2PListing {
  id: number;
  name: string;
  image: string;
  price: string;
  seller: string;
  attribute: string;
  rarity: string;
  level: number;
  description: string;
  status: "active" | "sold" | "cancelled" | "claimed";
  stats: {
    hp: number;
    attack: number;
    defense: number;
    speed: number;
  };
  history: P2PHistoryItem[];
  rawData: {
    name: string;
    attribute: number;
    rarity: number;
    level: number;
    hp: number;
    baseDamage: number;
    battleCount: number;
    battleWins: number;
    birthTime: number;
    lastBattleTime: number;
    claimed: boolean;
    owner: string;
    tokenURI: string;
    age: number;
    experience: number;
  };
}

/**
 * Interface for P2P history item
 */
export interface P2PHistoryItem {
  event: string;
  date: string;
  by?: string;
  against?: string;
  price?: string;
  txHash?: string;
}

/**
 * Helper function to determine if a listing is active
 */
const isListingActive = (
  tokenId: string,
  createdListings: GraphQLListing[],
  purchasedListings: GraphQLListing[],
  cancelledListings: GraphQLListing[],
  claimedListings: GraphQLListing[]
): boolean => {
  // Check if the token has been purchased, cancelled, or claimed
  const isPurchased = purchasedListings.some(
    (item) => item.tokenId === tokenId
  );
  const isCancelled = cancelledListings.some(
    (item) => item.tokenId === tokenId
  );
  const isClaimed = claimedListings.some((item) => item.tokenId === tokenId);

  // The listing is active if it has been created but not purchased, cancelled, or claimed
  return !isPurchased && !isCancelled && !isClaimed;
};

/**
 * Get active P2P swap listings
 */
export const getP2PListings = async (): Promise<P2PListing[]> => {
  try {
    // Fetch listings data from The Graph
    const { data } = await p2pSwapGraphClient.query({
      query: GET_P2P_LISTINGS,
    });

    // Extract listings data
    const createdListings = data.listingCreateds || [];
    const purchasedListings = data.listingPurchaseds || [];
    const cancelledListings = data.listingCancelleds || [];
    const claimedListings = data.listingClaimeds || [];

    // Filter for active listings (created but not purchased, cancelled, or claimed)
    const activeListingIds = createdListings
      .filter((listing: GraphQLListing) =>
        isListingActive(
          listing.tokenId,
          createdListings,
          purchasedListings,
          cancelledListings,
          claimedListings
        )
      )
      .map((listing: GraphQLListing) => listing.tokenId);

    // Create a provider to interact with the blockchain
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const blockmonContract = new ethers.Contract(
      BLOCKNOGOTCHI_CONTRACT_ADDRESS,
      BlocknogotchiContract.abi,
      provider
    );

    // Fetch details for each active listing
    const listingsPromises = activeListingIds.map(async (tokenId: string) => {
      const listing = createdListings.find(
        (item: GraphQLListing) => item.tokenId === tokenId
      );

      try {
        // Get Blockmon data from the contract
        const blockmonData = await blockmonContract.getBlocknogotchi(tokenId);

        // Get token URI and fetch metadata if available
        let name = `Blockmon #${tokenId}`;
        let image = `/blockmon/default.png`;

        try {
          const tokenURI = blockmonData.tokenURI;
          console.log(`Token ${tokenId} - Original tokenURI:`, tokenURI);

          if (!tokenURI || tokenURI === "") {
            console.warn(
              `Token ${tokenId} - Empty tokenURI, using default image`
            );
            // Try to get tokenURI directly from contract
            try {
              const directTokenURI = await blockmonContract.tokenURI(tokenId);
              console.log(
                `Token ${tokenId} - Direct tokenURI from contract:`,
                directTokenURI
              );

              if (directTokenURI && directTokenURI !== "") {
                // Check if the URI is likely an image by extension or content type
                const isLikelyImage =
                  directTokenURI.match(
                    /\.(jpg|jpeg|png|gif|svg|webp)($|\?)/i
                  ) !== null;

                if (isLikelyImage) {
                  console.log(
                    `Token ${tokenId} - Direct tokenURI appears to be an image:`,
                    directTokenURI
                  );
                  image = directTokenURI;
                } else {
                  // Convert IPFS URI to Pinata gateway URL
                  const formattedURI = directTokenURI.replace(
                    "ipfs://",
                    PINATA_GATEWAY
                  );
                  console.log(
                    `Token ${tokenId} - Formatted URI from direct call:`,
                    formattedURI
                  );

                  try {
                    // Check content type before trying to parse as JSON
                    const headResponse = await fetch(formattedURI, {
                      method: "HEAD",
                    });
                    const contentType =
                      headResponse.headers.get("content-type");
                    console.log(
                      `Token ${tokenId} - Content type:`,
                      contentType
                    );

                    if (contentType && contentType.includes("image/")) {
                      // It's an image, use it directly
                      console.log(
                        `Token ${tokenId} - URI is a direct image:`,
                        formattedURI
                      );
                      image = formattedURI;
                    } else if (
                      contentType &&
                      contentType.includes("application/json")
                    ) {
                      // It's JSON, try to parse it
                      const metadataResponse = await fetch(formattedURI);
                      console.log(
                        `Token ${tokenId} - Metadata response status from direct call:`,
                        metadataResponse.status
                      );

                      if (metadataResponse.ok) {
                        const metadata = await metadataResponse.json();
                        console.log(
                          `Token ${tokenId} - Metadata from direct call:`,
                          metadata
                        );

                        name = metadata.name || name;
                        image = metadata.image || image;
                        console.log(
                          `Token ${tokenId} - Image from direct call metadata:`,
                          image
                        );

                        // Handle different IPFS URL formats
                        if (image.startsWith("ipfs://")) {
                          image = image.replace("ipfs://", PINATA_GATEWAY);
                          console.log(
                            `Token ${tokenId} - Converted IPFS image URL from direct call:`,
                            image
                          );
                        } else if (image.includes("/ipfs/")) {
                          const cid = image.split("/ipfs/")[1];
                          image = `${PINATA_GATEWAY}${cid}`;
                          console.log(
                            `Token ${tokenId} - Converted /ipfs/ image URL from direct call:`,
                            image
                          );
                        }
                      }
                    } else {
                      // Try to use the URI directly as image
                      console.log(
                        `Token ${tokenId} - Using URI directly as image:`,
                        formattedURI
                      );
                      image = formattedURI;
                    }
                  } catch (parseError) {
                    console.error(
                      `Token ${tokenId} - Error processing URI:`,
                      parseError
                    );
                    // Use the URI directly as image
                    image = formattedURI;
                  }
                }
              }
            } catch (directError) {
              console.error(
                `Token ${tokenId} - Error fetching direct tokenURI:`,
                directError
              );
            }
          } else {
            // Check if the URI is likely an image by extension or content type
            const isLikelyImage =
              tokenURI.match(/\.(jpg|jpeg|png|gif|svg|webp)($|\?)/i) !== null;

            if (isLikelyImage) {
              console.log(
                `Token ${tokenId} - TokenURI appears to be an image:`,
                tokenURI
              );
              image = tokenURI;
            } else {
              // Convert IPFS URI to Pinata gateway URL
              const formattedURI = tokenURI.replace("ipfs://", PINATA_GATEWAY);
              console.log(`Token ${tokenId} - Formatted URI:`, formattedURI);

              try {
                // Check content type before trying to parse as JSON
                const headResponse = await fetch(formattedURI, {
                  method: "HEAD",
                });
                const contentType = headResponse.headers.get("content-type");
                console.log(`Token ${tokenId} - Content type:`, contentType);

                if (contentType && contentType.includes("image/")) {
                  // It's an image, use it directly
                  console.log(
                    `Token ${tokenId} - URI is a direct image:`,
                    formattedURI
                  );
                  image = formattedURI;
                } else if (
                  contentType &&
                  contentType.includes("application/json")
                ) {
                  // It's JSON, try to parse it
                  const metadataResponse = await fetch(formattedURI);
                  console.log(
                    `Token ${tokenId} - Metadata response status:`,
                    metadataResponse.status
                  );

                  if (!metadataResponse.ok) {
                    console.error(
                      `Token ${tokenId} - Failed to fetch metadata: ${metadataResponse.status} ${metadataResponse.statusText}`
                    );
                    throw new Error(
                      `Failed to fetch metadata: ${metadataResponse.status}`
                    );
                  }

                  const metadata = await metadataResponse.json();
                  console.log(`Token ${tokenId} - Metadata:`, metadata);

                  name = metadata.name || name;
                  image = metadata.image || image;
                  console.log(`Token ${tokenId} - Image from metadata:`, image);

                  // Handle different IPFS URL formats
                  if (image.startsWith("ipfs://")) {
                    image = image.replace("ipfs://", PINATA_GATEWAY);
                    console.log(
                      `Token ${tokenId} - Converted IPFS image URL:`,
                      image
                    );
                  } else if (image.includes("/ipfs/")) {
                    const cid = image.split("/ipfs/")[1];
                    image = `${PINATA_GATEWAY}${cid}`;
                    console.log(
                      `Token ${tokenId} - Converted /ipfs/ image URL:`,
                      image
                    );
                  }
                } else {
                  // Try to use the URI directly as image
                  console.log(
                    `Token ${tokenId} - Using URI directly as image:`,
                    formattedURI
                  );
                  image = formattedURI;
                }
              } catch (parseError) {
                console.error(
                  `Token ${tokenId} - Error processing URI:`,
                  parseError
                );
                // Use the URI directly as image
                image = formattedURI;
              }
            }
          }
        } catch (error) {
          console.warn(`Error fetching metadata for token ${tokenId}:`, error);
          // Try to get tokenURI directly as a fallback
          try {
            const directTokenURI = await blockmonContract.tokenURI(tokenId);
            console.log(
              `Token ${tokenId} - Fallback direct tokenURI:`,
              directTokenURI
            );

            if (directTokenURI && directTokenURI !== "") {
              // Convert IPFS URI to Pinata gateway URL
              const formattedURI = directTokenURI.replace(
                "ipfs://",
                PINATA_GATEWAY
              );

              const metadataResponse = await fetch(formattedURI);
              if (metadataResponse.ok) {
                const metadata = await metadataResponse.json();

                name = metadata.name || name;
                image = metadata.image || image;

                // Handle different IPFS URL formats
                if (image.startsWith("ipfs://")) {
                  image = image.replace("ipfs://", PINATA_GATEWAY);
                } else if (image.includes("/ipfs/")) {
                  const cid = image.split("/ipfs/")[1];
                  image = `${PINATA_GATEWAY}${cid}`;
                }
              }
            }
          } catch (fallbackError) {
            console.error(
              `Token ${tokenId} - Fallback tokenURI fetch failed:`,
              fallbackError
            );
          }
        }

        return {
          id: Number(tokenId),
          name,
          image,
          price: ethers.formatEther(listing.price),
          seller: listing.seller,
          attribute: Number(blockmonData.attribute),
          rarity: Number(blockmonData.rarity),
          level: Number(blockmonData.level),
          status: "active" as const,
        };
      } catch (error) {
        console.error(`Error fetching details for token ${tokenId}:`, error);
        return null;
      }
    });

    // Wait for all promises to resolve and filter out any null results
    const listings = (await Promise.all(listingsPromises)).filter(
      Boolean
    ) as P2PListing[];
    return listings;
  } catch (error) {
    console.error("Error fetching P2P listings:", error);
    throw error;
  }
};

/**
 * Get details of a specific P2P swap listing
 */
export const getP2PListingDetails = async (
  tokenId: number
): Promise<DetailedP2PListing | null> => {
  try {
    // Fetch listing data from The Graph
    const { data } = await p2pSwapGraphClient.query({
      query: GET_P2P_LISTING,
      variables: { tokenId: tokenId.toString() },
    });

    // Check if listing exists
    const listing = data.listingCreateds[0];
    if (!listing) {
      return null;
    }

    // Create a provider to interact with the blockchain
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const blocknogotchiContract = new ethers.Contract(
      BLOCKNOGOTCHI_CONTRACT_ADDRESS,
      BlocknogotchiContract.abi,
      provider
    );

    // Get Blockmon data from the contract
    const blockmonData = await blocknogotchiContract.getBlocknogotchi(tokenId);

    // Get token URI and fetch metadata if available
    let name = `Blockmon #${tokenId}`;
    let image = `/blockmon/default.png`;
    let description = "A mysterious Blockmon.";

    try {
      const tokenURI = blockmonData.tokenURI;
      if (tokenURI) {
        // Convert IPFS URI to Pinata gateway URL
        const formattedURI = tokenURI.replace("ipfs://", PINATA_GATEWAY);
        const metadataResponse = await fetch(formattedURI);
        const metadata = await metadataResponse.json();

        name = metadata.name || name;
        image = metadata.image || image;
        description = metadata.description || description;

        // Handle different IPFS URL formats
        if (image.startsWith("ipfs://")) {
          image = image.replace("ipfs://", PINATA_GATEWAY);
        } else if (image.includes("/ipfs/")) {
          const cid = image.split("/ipfs/")[1];
          image = `${PINATA_GATEWAY}${cid}`;
        }
      }
    } catch (error) {
      console.warn(`Error fetching metadata for token ${tokenId}:`, error);
      // Use default values if metadata fetch fails
    }

    // Fetch listing history from The Graph
    const { data: historyData } = await p2pSwapGraphClient.query({
      query: GET_P2P_LISTINGS,
    });

    // Process history data
    const history: P2PHistoryItem[] = [];

    // Add listing creation event
    const creationEvent = historyData.listingCreateds.find(
      (item: GraphQLListing) => item.tokenId === tokenId.toString()
    );
    if (creationEvent) {
      history.push({
        event: "Listed",
        date: new Date(
          Number(creationEvent.blockTimestamp) * 1000
        ).toISOString(),
        by: creationEvent.seller,
        price: ethers.formatEther(creationEvent.price),
        txHash: creationEvent.id.split("-")[0],
      });
    }

    // Add purchase event if exists
    const purchaseEvent = historyData.listingPurchaseds.find(
      (item: GraphQLListing) => item.tokenId === tokenId.toString()
    );
    if (purchaseEvent) {
      history.push({
        event: "Purchased",
        date: new Date(
          Number(purchaseEvent.blockTimestamp) * 1000
        ).toISOString(),
        by: purchaseEvent.buyer,
        price: ethers.formatEther(purchaseEvent.price),
        txHash: purchaseEvent.id.split("-")[0],
      });
    }

    // Add cancellation event if exists
    const cancellationEvent = historyData.listingCancelleds.find(
      (item: GraphQLListing) => item.tokenId === tokenId.toString()
    );
    if (cancellationEvent) {
      history.push({
        event: "Cancelled",
        date: new Date(
          Number(cancellationEvent.blockTimestamp) * 1000
        ).toISOString(),
        by: cancellationEvent.seller,
        txHash: cancellationEvent.id.split("-")[0],
      });
    }

    // Add claim event if exists
    const claimEvent = historyData.listingClaimeds.find(
      (item: GraphQLListing) => item.tokenId === tokenId.toString()
    );
    if (claimEvent) {
      history.push({
        event: "Claimed",
        date: new Date(Number(claimEvent.blockTimestamp) * 1000).toISOString(),
        by: claimEvent.seller,
        txHash: claimEvent.id.split("-")[0],
      });
    }

    // Sort history by date
    history.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Determine listing status
    let status: "active" | "sold" | "cancelled" | "claimed" = "active";
    if (purchaseEvent) status = "sold";
    if (cancellationEvent) status = "cancelled";
    if (claimEvent) status = "claimed";

    // Calculate stats based on blockmon data - convert BigInt to number
    const stats = {
      hp: Number(blockmonData.hp),
      attack: Number(blockmonData.baseDamage),
      defense: Math.floor(Number(blockmonData.hp) * 0.5), // Example calculation
      speed: Math.floor(Number(blockmonData.level) * 5), // Example calculation
    };

    // Create the detailed listing object
    const detailedListing: DetailedP2PListing = {
      id: Number(tokenId),
      name,
      image,
      price: ethers.formatEther(listing.price),
      seller: listing.seller,
      attribute: getAttributeString(Number(blockmonData.attribute)),
      rarity: getRarityString(Number(blockmonData.rarity)),
      level: Number(blockmonData.level),
      description,
      status,
      stats,
      history,
      rawData: {
        name,
        attribute: Number(blockmonData.attribute),
        rarity: Number(blockmonData.rarity),
        level: Number(blockmonData.level),
        hp: Number(blockmonData.hp),
        baseDamage: Number(blockmonData.baseDamage),
        battleCount: Number(blockmonData.battleCount),
        battleWins: Number(blockmonData.battleWins),
        birthTime: Number(blockmonData.birthTime),
        lastBattleTime: Number(blockmonData.lastBattleTime),
        claimed: blockmonData.claimed,
        owner: blockmonData.owner,
        tokenURI: await blocknogotchiContract.tokenURI(tokenId),
        age: Math.floor(Date.now() / 1000 - Number(blockmonData.birthTime)),
        experience: Number(blockmonData.level) * 100, // Example calculation
      },
    };

    return detailedListing;
  } catch (error) {
    console.error("Error fetching P2P listing details:", error);
    throw error;
  }
};

/**
 * Create a new P2P swap listing
 */
export const createP2PListing = async (
  tokenId: number,
  price: string,
  nfcHash: string,
  walletProvider: Eip1193Provider,
): Promise<boolean> => {
  try {
    // Get signer and contract instances
    const signer = await getSigner(walletProvider);
    const blockmonContract = await getBlockmonContract(signer);
    const p2pSwapContract = await getP2PSwapContract(signer);

    // Check if the user owns the token
    const owner = await blockmonContract.ownerOf(tokenId);
    const signerAddress = await signer.getAddress();

    if (owner.toLowerCase() !== signerAddress.toLowerCase()) {
      throw new Error("You do not own this Blockmon");
    }

    // Check if the token is already approved for the P2P Swap contract
    const isApproved = await blockmonContract.isApprovedForAll(
      signerAddress,
      P2P_SWAP_CONTRACT_ADDRESS
    );

    // If not approved, request approval
    if (!isApproved) {
      const approveTx = await blockmonContract.setApprovalForAll(
        P2P_SWAP_CONTRACT_ADDRESS,
        true
      );
      await approveTx.wait();
    }

    // Convert price to wei
    const priceInWei = ethers.parseEther(price);

    // If we have a serial number, combine it with the hash for extra security
    const hashData = nfcHash;

    // Create the listing
    const createTx = await p2pSwapContract.createListing(
      tokenId,
      priceInWei,
      ethers.keccak256(ethers.toUtf8Bytes(hashData))
    );
    await createTx.wait();

    return true;
  } catch (error) {
    console.error("Error creating P2P listing:", error);
    throw error;
  }
};

/**
 * Purchase a P2P swap listing
 */
export const purchaseP2PListing = async (
  tokenId: number,
  price: string,
  nfcHash: string,
  walletProvider: Eip1193Provider,
): Promise<boolean> => {
  try {
    // Get signer and contract instance
    const signer = await getSigner(walletProvider);
    const p2pSwapContract = await getP2PSwapContract(signer);

    // Convert price to wei
    const priceInWei = ethers.parseEther(price);

    // Clean up and format the hash properly
    let cleanHash = nfcHash
      .replace("blocknogotchi-hash:", "")
      .split(":")[0]
      .trim();

    // The hash should be used directly if it's already in bytes format
    if (!cleanHash.startsWith("0x")) {
      cleanHash = `0x${cleanHash}`;
    }

    console.log("Purchase hash (before):", cleanHash); // Debug log

    // Purchase the listing with the properly formatted hash
    const purchaseTx = await p2pSwapContract.purchaseListing(
      tokenId,
      cleanHash, // Use the clean hash directly, no need for additional encoding
      { value: priceInWei }
    );
    await purchaseTx.wait();

    return true;
  } catch (error) {
    console.error("Error purchasing P2P listing:", error);
    throw error;
  }
};

/**
 * Cancel a P2P swap listing
 */
export const cancelP2PListing = async (
  tokenId: number,
  walletProvider: Eip1193Provider
): Promise<boolean> => {
  try {
    // Get signer and contract instance
    const signer = await getSigner(walletProvider);
    const p2pSwapContract = await getP2PSwapContract(signer);

    // Cancel the listing
    const cancelTx = await p2pSwapContract.cancelListing(tokenId);
    await cancelTx.wait();

    return true;
  } catch (error) {
    console.error("Error cancelling P2P listing:", error);
    throw error;
  }
};

/**
 * Claim back a P2P swap listing
 */
export const claimBackP2PListing = async (
  tokenId: number,
  nfcHash: string,
  walletProvider: Eip1193Provider,
  nfcSerialNumber?: string
): Promise<boolean> => {
  try {
    // Get signer and contract instance
    const signer = await getSigner(walletProvider);
    const p2pSwapContract = await getP2PSwapContract(signer);

    // If we have a serial number, combine it with the hash for extra security
    let hashData = nfcHash;
    if (nfcSerialNumber) {
      hashData = `${nfcHash}`;
    }

    // Claim back the listing
    const claimTx = await p2pSwapContract.claimListing(
      tokenId,
      ethers.keccak256(ethers.toUtf8Bytes(hashData))
    );
    await claimTx.wait();

    return true;
  } catch (error) {
    console.error("Error claiming back P2P listing:", error);
    throw error;
  }
};
