import { ethers, Eip1193Provider } from 'ethers';
import BlockmonABI from '@/contract/Blockmon.json';
import P2PSwapABI from '@/contract/P2PSwap.json';
import { ApolloClient, InMemoryCache, HttpLink, gql } from '@apollo/client';
import { getAttributeString, getRarityString } from './marketplace';

// Create an Apollo Client instance for The Graph (P2P Swap data)
const p2pSwapGraphClient = new ApolloClient({
  link: new HttpLink({
    uri: process.env.NEXT_PUBLIC_GRAPH_P2P_URL || 'https://api.studio.thegraph.com/query/105196/blocknogotchi-escrow/version/latest',
  }),
  cache: new InMemoryCache(),
});

// Contract addresses from environment variables
const BLOCKMON_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0xe1e52a36E15eBf6785842e55b6d1D901819985ec';
const P2P_SWAP_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_P2P_SWAP_CONTRACT_ADDRESS || '0xE3512091dfCc852fd8c053153f2a8dF70170ce77'; // Replace with actual address

// GraphQL query to get P2P swap listings
const GET_P2P_LISTINGS = gql`
  query GetP2PListings {
    listingCreateds(
      orderBy: blockTimestamp
      orderDirection: desc
    ) {
      id
      tokenId
      seller
      price
      blockTimestamp
    }
    listingPurchaseds(
      orderBy: blockTimestamp
      orderDirection: desc
    ) {
      id
      tokenId
      seller
      buyer
      price
      blockTimestamp
    }
    listingCancelleds(
      orderBy: blockTimestamp
      orderDirection: desc
    ) {
      id
      tokenId
      seller
      blockTimestamp
    }
    listingClaimeds(
      orderBy: blockTimestamp
      orderDirection: desc
    ) {
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
    throw new Error('Wallet provider not available');
  }
  
  const provider = new ethers.BrowserProvider(walletProvider);
  return provider.getSigner();
};

/**
 * Get the P2P Swap contract instance
 */
export const getP2PSwapContract = async (signer?: ethers.Signer) => {
  if (!signer) {
    throw new Error('Signer not available');
  }
  
  return new ethers.Contract(P2P_SWAP_CONTRACT_ADDRESS, P2PSwapABI.abi, signer);
};

/**
 * Get the Blockmon contract instance
 */
export const getBlockmonContract = async (signer?: ethers.Signer) => {
  if (!signer) {
    throw new Error('Signer not available');
  }
  
  return new ethers.Contract(BLOCKMON_CONTRACT_ADDRESS, BlockmonABI.abi, signer);
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
  status: 'active' | 'sold' | 'cancelled' | 'claimed';
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
  status: 'active' | 'sold' | 'cancelled' | 'claimed';
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
  const isPurchased = purchasedListings.some(item => item.tokenId === tokenId);
  const isCancelled = cancelledListings.some(item => item.tokenId === tokenId);
  const isClaimed = claimedListings.some(item => item.tokenId === tokenId);
  
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
      .filter((listing: GraphQLListing) => isListingActive(
        listing.tokenId,
        createdListings,
        purchasedListings,
        cancelledListings,
        claimedListings
      ))
      .map((listing: GraphQLListing) => listing.tokenId);

    // Create a provider to interact with the blockchain
    const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL || 'https://sepolia.infura.io/v3/your-infura-key');
    const blockmonContract = new ethers.Contract(BLOCKMON_CONTRACT_ADDRESS, BlockmonABI.abi, provider);

    // Fetch details for each active listing
    const listingsPromises = activeListingIds.map(async (tokenId: string) => {
      const listing = createdListings.find((item: GraphQLListing) => item.tokenId === tokenId);
      
      try {
        // Get Blockmon data from the contract
        const blockmonData = await blockmonContract.getBlockmon(tokenId);
        
        // Get token URI and fetch metadata if available
        let name = `Blockmon #${tokenId}`;
        let image = `/blockmon/default.png`;
        
        try {
          const tokenURI = await blockmonContract.tokenURI(tokenId);
          if (tokenURI) {
            // If the tokenURI is an IPFS URI, convert it to a gateway URL
            const formattedURI = tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/');
            const metadataResponse = await fetch(formattedURI);
            const metadata = await metadataResponse.json();
            
            name = metadata.name || name;
            image = metadata.image || image;
            
            // If the image is an IPFS URI, convert it to a gateway URL
            if (image.startsWith('ipfs://')) {
              image = image.replace('ipfs://', 'https://ipfs.io/ipfs/');
            }
          }
        } catch (error) {
          console.warn(`Error fetching metadata for token ${tokenId}:`, error);
          // Use default values if metadata fetch fails
        }
        
        return {
          id: Number(tokenId),
          name,
          image,
          price: ethers.formatEther(listing.price),
          seller: listing.seller,
          attribute: blockmonData.attribute,
          rarity: blockmonData.rarity,
          level: blockmonData.level,
          status: 'active' as const
        };
      } catch (error) {
        console.error(`Error fetching details for token ${tokenId}:`, error);
        return null;
      }
    });

    // Wait for all promises to resolve and filter out any null results
    const listings = (await Promise.all(listingsPromises)).filter(Boolean) as P2PListing[];
    return listings;
  } catch (error) {
    console.error('Error fetching P2P listings:', error);
    throw error;
  }
};

/**
 * Get details of a specific P2P swap listing
 */
export const getP2PListingDetails = async (tokenId: number): Promise<DetailedP2PListing | null> => {
  try {
    // Fetch listing data from The Graph
    const { data } = await p2pSwapGraphClient.query({
      query: GET_P2P_LISTING,
      variables: { tokenId: tokenId.toString() }
    });

    // Check if listing exists
    const listing = data.listingCreateds[0];
    if (!listing) {
      return null;
    }

    // Create a provider to interact with the blockchain
    const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL || 'https://sepolia.infura.io/v3/your-infura-key');
    const blockmonContract = new ethers.Contract(BLOCKMON_CONTRACT_ADDRESS, BlockmonABI.abi, provider);
    
    // Get Blockmon data from the contract
    const blockmonData = await blockmonContract.getBlockmon(tokenId);
    
    // Get token URI and fetch metadata if available
    let name = `Blockmon #${tokenId}`;
    let image = `/blockmon/default.png`;
    let description = "A mysterious Blockmon.";
    
    try {
      const tokenURI = await blockmonContract.tokenURI(tokenId);
      if (tokenURI) {
        // If the tokenURI is an IPFS URI, convert it to a gateway URL
        const formattedURI = tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/');
        const metadataResponse = await fetch(formattedURI);
        const metadata = await metadataResponse.json();
        
        name = metadata.name || name;
        image = metadata.image || image;
        description = metadata.description || description;
        
        // If the image is an IPFS URI, convert it to a gateway URL
        if (image.startsWith('ipfs://')) {
          image = image.replace('ipfs://', 'https://ipfs.io/ipfs/');
        }
      }
    } catch (error) {
      console.warn(`Error fetching metadata for token ${tokenId}:`, error);
      // Use default values if metadata fetch fails
    }
    
    // Fetch listing history from The Graph
    const { data: historyData } = await p2pSwapGraphClient.query({
      query: GET_P2P_LISTINGS
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
        date: new Date(Number(creationEvent.blockTimestamp) * 1000).toISOString(),
        by: creationEvent.seller,
        price: ethers.formatEther(creationEvent.price),
        txHash: creationEvent.id.split('-')[0]
      });
    }
    
    // Add purchase event if exists
    const purchaseEvent = historyData.listingPurchaseds.find(
      (item: GraphQLListing) => item.tokenId === tokenId.toString()
    );
    if (purchaseEvent) {
      history.push({
        event: "Purchased",
        date: new Date(Number(purchaseEvent.blockTimestamp) * 1000).toISOString(),
        by: purchaseEvent.buyer,
        price: ethers.formatEther(purchaseEvent.price),
        txHash: purchaseEvent.id.split('-')[0]
      });
    }
    
    // Add cancellation event if exists
    const cancellationEvent = historyData.listingCancelleds.find(
      (item: GraphQLListing) => item.tokenId === tokenId.toString()
    );
    if (cancellationEvent) {
      history.push({
        event: "Cancelled",
        date: new Date(Number(cancellationEvent.blockTimestamp) * 1000).toISOString(),
        by: cancellationEvent.seller,
        txHash: cancellationEvent.id.split('-')[0]
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
        txHash: claimEvent.id.split('-')[0]
      });
    }
    
    // Sort history by date
    history.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Determine listing status
    let status: 'active' | 'sold' | 'cancelled' | 'claimed' = 'active';
    if (purchaseEvent) status = 'sold';
    if (cancellationEvent) status = 'cancelled';
    if (claimEvent) status = 'claimed';
    
    // Calculate stats based on blockmon data
    const stats = {
      hp: blockmonData.hp,
      attack: blockmonData.baseDamage,
      defense: Math.floor(blockmonData.hp * 0.5), // Example calculation
      speed: Math.floor(blockmonData.level * 5) // Example calculation
    };
    
    // Create the detailed listing object
    const detailedListing: DetailedP2PListing = {
      id: Number(tokenId),
      name,
      image,
      price: ethers.formatEther(listing.price),
      seller: listing.seller,
      attribute: getAttributeString(blockmonData.attribute),
      rarity: getRarityString(blockmonData.rarity),
      level: blockmonData.level,
      description,
      status,
      stats,
      history,
      rawData: {
        name,
        attribute: blockmonData.attribute,
        rarity: blockmonData.rarity,
        level: blockmonData.level,
        hp: blockmonData.hp,
        baseDamage: blockmonData.baseDamage,
        battleCount: blockmonData.battleCount,
        battleWins: blockmonData.battleWins,
        birthTime: blockmonData.birthTime,
        lastBattleTime: blockmonData.lastBattleTime,
        claimed: blockmonData.claimed,
        owner: blockmonData.owner,
        tokenURI: await blockmonContract.tokenURI(tokenId),
        age: Math.floor((Date.now() / 1000) - blockmonData.birthTime),
        experience: blockmonData.level * 100 // Example calculation
      }
    };
    
    return detailedListing;
  } catch (error) {
    console.error('Error fetching P2P listing details:', error);
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
  nfcSerialNumber?: string
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
      throw new Error('You do not own this Blockmon');
    }
    
    // Check if the token is already approved for the P2P Swap contract
    const isApproved = await blockmonContract.isApprovedForAll(signerAddress, P2P_SWAP_CONTRACT_ADDRESS);
    
    // If not approved, request approval
    if (!isApproved) {
      const approveTx = await blockmonContract.setApprovalForAll(P2P_SWAP_CONTRACT_ADDRESS, true);
      await approveTx.wait();
    }
    
    // Convert price to wei
    const priceInWei = ethers.parseEther(price);
    
    // If we have a serial number, combine it with the hash for extra security
    let hashData = nfcHash;
    if (nfcSerialNumber) {
      hashData = `${nfcHash}:${nfcSerialNumber}`;
    }
    
    // Create the listing
    const createTx = await p2pSwapContract.createListing(tokenId, priceInWei, ethers.keccak256(ethers.toUtf8Bytes(hashData)));
    await createTx.wait();
    
    return true;
  } catch (error) {
    console.error('Error creating P2P listing:', error);
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
  nfcSerialNumber?: string
): Promise<boolean> => {
  try {
    // Get signer and contract instance
    const signer = await getSigner(walletProvider);
    const p2pSwapContract = await getP2PSwapContract(signer);
    
    // Convert price to wei
    const priceInWei = ethers.parseEther(price);
    
    // If we have a serial number, combine it with the hash for extra security
    let hashData = nfcHash;
    if (nfcSerialNumber) {
      hashData = `${nfcHash}:${nfcSerialNumber}`;
    }
    
    // Purchase the listing
    const purchaseTx = await p2pSwapContract.purchaseListing(
      tokenId, 
      ethers.keccak256(ethers.toUtf8Bytes(hashData)), 
      { value: priceInWei }
    );
    await purchaseTx.wait();
    
    return true;
  } catch (error) {
    console.error('Error purchasing P2P listing:', error);
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
    console.error('Error cancelling P2P listing:', error);
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
      hashData = `${nfcHash}:${nfcSerialNumber}`;
    }
    
    // Claim back the listing
    const claimTx = await p2pSwapContract.claimListing(tokenId, ethers.keccak256(ethers.toUtf8Bytes(hashData)));
    await claimTx.wait();
    
    return true;
  } catch (error) {
    console.error('Error claiming back P2P listing:', error);
    throw error;
  }
}; 