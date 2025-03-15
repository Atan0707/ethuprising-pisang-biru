import { ethers, Eip1193Provider } from 'ethers';
import BlockmonABI from '@/contract/Blockmon.json';
import MarketplaceABI from '@/contract/BlockmonMarketplace.json';
import { getSigner } from './contractUtils';
import { blockmonGraphClient, marketplaceGraphClient } from './apollo-client';
import { gql } from '@apollo/client';
import { BLOCKNOGOTCHI_CONTRACT_ADDRESS, MARKETPLACE_CONTRACT_ADDRESS } from './config';

// GraphQL query to get user's Blockmons
const GET_USER_BLOCKMONS = gql`
  query GetUserBlockmons($owner: String!) {
    transfers(
      where: {to: $owner}
      orderBy: blockTimestamp
      orderDirection: desc
    ) {
      id
      tokenId
      blockTimestamp
    }
    pokemonClaimeds(
      where: {claimer: $owner}
      orderBy: blockTimestamp
      orderDirection: desc
    ) {
      id
      tokenId
      blockTimestamp
    }
  }
`;

// GraphQL query to get marketplace listings
const GET_MARKETPLACE_LISTINGS = gql`
  query GetMarketplaceListings {
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
  }
`;

// GraphQL query to get a specific marketplace listing
const GET_MARKETPLACE_LISTING = gql`
  query GetMarketplaceListing($tokenId: String!) {
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

// GraphQL query to get listing history
const GET_LISTING_HISTORY = gql`
  query GetListingHistory($tokenId: String!) {
    listingCreateds(
      where: { tokenId: $tokenId }
      orderBy: blockTimestamp
      orderDirection: desc
    ) {
      id
      tokenId
      seller
      price
      blockTimestamp
      transactionHash
    }
    listingCancelleds(
      where: { tokenId: $tokenId }
      orderBy: blockTimestamp
      orderDirection: desc
    ) {
      id
      tokenId
      seller
      blockTimestamp
      transactionHash
    }
    listingPurchaseds(
      where: { tokenId: $tokenId }
      orderBy: blockTimestamp
      orderDirection: desc
    ) {
      id
      tokenId
      seller
      buyer
      price
      blockTimestamp
      transactionHash
    }
  }
`;


/**
 * Get the Blockmon contract instance
 */
export const getBlockmonContract = async (signer?: ethers.Signer) => {
  if (!signer) {
    throw new Error('Signer not available');
  }
  
  return new ethers.Contract(BLOCKNOGOTCHI_CONTRACT_ADDRESS, BlockmonABI.abi, signer);
};

/**
 * Get the Marketplace contract instance
 */
export const getMarketplaceContract = async (signer?: ethers.Signer) => {
  if (!signer) {
    throw new Error('Signer not available');
  }
  
  return new ethers.Contract(MARKETPLACE_CONTRACT_ADDRESS, MarketplaceABI.abi, signer);
};

/**
 * Interface for Blockmon data
 */
export interface BlockmonData {
  id: number;
  name: string;
  attribute: number;
  rarity: number;
  level: number;
  owner: string;
  tokenURI: string;
  claimed: boolean;
}

/**
 * Interface for marketplace listing data
 */
export interface MarketplaceListing {
  id: number;
  name: string;
  image: string;
  price: string;
  seller: string;
  attribute: number;
  rarity: number;
  level: number;
}

/**
 * Interface for detailed listing data
 */
export interface DetailedListing {
  id: number;
  name: string;
  image: string;
  price: string;
  seller: string;
  attribute: string;
  rarity: string;
  level: number;
  description: string;
  stats: {
    hp: number;
    attack: number;
    defense: number;
    speed: number;
  };
  history: HistoryItem[];
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
 * Interface for history item
 */
export interface HistoryItem {
  event: string;
  date: string;
  by?: string;
  against?: string;
  price?: string;
  txHash?: string;
}

// Helper function to convert attribute number to string
export const getAttributeString = (attribute: number): string => {
  const attributes = ['NORMAL', 'FIRE', 'WATER', 'ELECTRIC', 'GRASS', 'ICE', 'FIGHTING', 'POISON', 'GROUND', 'FLYING', 'PSYCHIC', 'BUG', 'ROCK', 'GHOST', 'DRAGON', 'DARK', 'STEEL', 'FAIRY'];
  return attributes[attribute] || 'UNKNOWN';
};

// Helper function to convert rarity number to string
export const getRarityString = (rarity: number): string => {
  const rarities = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC'];
  return rarities[rarity] || 'UNKNOWN';
};

/**
 * Get NFTs owned by the current user using The Graph and blockchain data
 */
export const getOwnedNFTs = async (userAddress: string): Promise<BlockmonData[]> => {
  try {
    // Query The Graph for tokens owned by the user
    const { data } = await blockmonGraphClient.query({
      query: GET_USER_BLOCKMONS,
      variables: { owner: userAddress.toLowerCase() },
    });
    
    // Get unique token IDs from GraphQL data
    const tokenIds = new Set<number>();
    
    // Add tokens from transfers
    if (data.transfers) {
      data.transfers.forEach((transfer: { tokenId: string }) => {
        tokenIds.add(Number(transfer.tokenId));
      });
    }
    
    // Add tokens from claims
    if (data.pokemonClaimeds) {
      data.pokemonClaimeds.forEach((claim: { tokenId: string }) => {
        tokenIds.add(Number(claim.tokenId));
      });
    }
    
    console.log(`Found ${tokenIds.size} potential tokens from The Graph`);
    
    if (tokenIds.size === 0) {
      return [];
    }
    
    // Get active marketplace listings to filter out listed NFTs
    const { data: marketplaceData } = await marketplaceGraphClient.query({
      query: GET_MARKETPLACE_LISTINGS,
      fetchPolicy: 'network-only',
    });
    
    // Create a map to track the most recent event for each token ID
    const tokenEventMap = new Map<string, { event: string, timestamp: number }>();
    
    // Process listing created events
    if (marketplaceData.listingCreateds) {
      marketplaceData.listingCreateds.forEach((listing: { tokenId: string, blockTimestamp: string }) => {
        const timestamp = parseInt(listing.blockTimestamp);
        const currentEvent = tokenEventMap.get(listing.tokenId);
        
        if (!currentEvent || timestamp > currentEvent.timestamp) {
          tokenEventMap.set(listing.tokenId, { event: 'created', timestamp });
        }
      });
    }
    
    // Process listing cancelled events
    if (marketplaceData.listingCancelleds) {
      marketplaceData.listingCancelleds.forEach((cancelled: { tokenId: string, blockTimestamp: string }) => {
        const timestamp = parseInt(cancelled.blockTimestamp);
        const currentEvent = tokenEventMap.get(cancelled.tokenId);
        
        if (!currentEvent || timestamp > currentEvent.timestamp) {
          tokenEventMap.set(cancelled.tokenId, { event: 'cancelled', timestamp });
        }
      });
    }
    
    // Process listing purchased events
    if (marketplaceData.listingPurchaseds) {
      marketplaceData.listingPurchaseds.forEach((purchased: { tokenId: string, blockTimestamp: string }) => {
        const timestamp = parseInt(purchased.blockTimestamp);
        const currentEvent = tokenEventMap.get(purchased.tokenId);
        
        if (!currentEvent || timestamp > currentEvent.timestamp) {
          tokenEventMap.set(purchased.tokenId, { event: 'purchased', timestamp });
        }
      });
    }
    
    // Create a set of currently listed token IDs to filter them out
    const listedTokenIds = new Set<number>();
    tokenEventMap.forEach((eventData, tokenId) => {
      if (eventData.event === 'created') {
        listedTokenIds.add(Number(tokenId));
      }
    });
    
    console.log(`Found ${listedTokenIds.size} currently listed tokens to filter out`);
    
    // Connect to the blockchain to get token details
    const provider = new ethers.JsonRpcProvider('https://sepolia-rpc.scroll.io/');
    const contract = new ethers.Contract(BLOCKNOGOTCHI_CONTRACT_ADDRESS, BlockmonABI.abi, provider);
    
    // Fetch details for each token
    const ownedTokens: BlockmonData[] = [];
    const tokenPromises = Array.from(tokenIds).map(async (tokenId) => {
      try {
        // Skip tokens that are currently listed on the marketplace
        if (listedTokenIds.has(tokenId)) {
          console.log(`Skipping token ${tokenId} as it is currently listed on the marketplace`);
          return;
        }
        
        const data = await contract.getPokemon(tokenId);
        const owner = data[11];
        
        // Double-check if this token is still owned by the current user and is claimed
        if (owner.toLowerCase() === userAddress.toLowerCase() && data[10]) {
          ownedTokens.push({
            id: tokenId,
            name: data[0],
            attribute: Number(data[1]),
            rarity: Number(data[2]),
            level: Number(data[3]),
            owner: data[11],
            tokenURI: data[12],
            claimed: data[10]
          });
        }
      } catch (err) {
        console.log(`Token ${tokenId} not found or error:`, err);
      }
    });
    
    // Wait for all token details to be fetched
    await Promise.all(tokenPromises);
    
    return ownedTokens;
  } catch (error) {
    console.error('Error fetching owned NFTs:', error);
    throw error;
  }
};

/**
 * Get active marketplace listings using The Graph and blockchain data
 */
export const getActiveListings = async (): Promise<MarketplaceListing[]> => {
  try {
    // Query The Graph for listings
    const { data } = await marketplaceGraphClient.query({
      query: GET_MARKETPLACE_LISTINGS,
      fetchPolicy: 'network-only',
    });
    
    if (!data.listingCreateds || data.listingCreateds.length === 0) {
      return [];
    }
    
    // Create a map to track the most recent event for each token ID
    // This will help us determine the current state of each token
    const tokenEventMap = new Map<string, { 
      event: string, 
      timestamp: number,
      seller?: string,
      price?: string 
    }>();
    
    // Process listing created events
    if (data.listingCreateds) {
      data.listingCreateds.forEach((listing: { tokenId: string, blockTimestamp: string, seller: string, price: string }) => {
        const timestamp = parseInt(listing.blockTimestamp);
        const currentEvent = tokenEventMap.get(listing.tokenId);
        
        // If we don't have an event for this token yet, or this event is more recent
        if (!currentEvent || timestamp > currentEvent.timestamp) {
          tokenEventMap.set(listing.tokenId, { 
            event: 'created', 
            timestamp,
            seller: listing.seller,
            price: listing.price
          });
        }
      });
    }
    
    // Process listing cancelled events
    if (data.listingCancelleds) {
      data.listingCancelleds.forEach((cancelled: { tokenId: string, blockTimestamp: string }) => {
        const timestamp = parseInt(cancelled.blockTimestamp);
        const currentEvent = tokenEventMap.get(cancelled.tokenId);
        
        // If this cancel event is more recent than what we have, update the state
        if (!currentEvent || timestamp > currentEvent.timestamp) {
          tokenEventMap.set(cancelled.tokenId, { event: 'cancelled', timestamp });
        }
      });
    }
    
    // Process listing purchased events
    if (data.listingPurchaseds) {
      data.listingPurchaseds.forEach((purchased: { tokenId: string, blockTimestamp: string }) => {
        const timestamp = parseInt(purchased.blockTimestamp);
        const currentEvent = tokenEventMap.get(purchased.tokenId);
        
        // If this purchase event is more recent than what we have, update the state
        if (!currentEvent || timestamp > currentEvent.timestamp) {
          tokenEventMap.set(purchased.tokenId, { event: 'purchased', timestamp });
        }
      });
    }
    
    // Find tokens that are currently listed (most recent event is 'created')
    const activeListingTokens: Array<{ tokenId: string, seller: string, price: string }> = [];
    
    tokenEventMap.forEach((eventData, tokenId) => {
      if (eventData.event === 'created' && eventData.seller && eventData.price) {
        activeListingTokens.push({
          tokenId,
          seller: eventData.seller,
          price: eventData.price
        });
      }
    });
    
    console.log(`Found ${activeListingTokens.length} active listings out of ${data.listingCreateds.length} total listings`);
    
    if (activeListingTokens.length === 0) {
      return [];
    }
    
    // Connect to the blockchain to get token details
    const provider = new ethers.JsonRpcProvider('https://sepolia-rpc.scroll.io/');
    const contract = new ethers.Contract(BLOCKNOGOTCHI_CONTRACT_ADDRESS, BlockmonABI.abi, provider);
    
    // Fetch details for each listed token
    const listings: MarketplaceListing[] = [];
    const listingPromises = activeListingTokens.map(async (listing) => {
      try {
        const tokenId = Number(listing.tokenId);
        const data = await contract.getPokemon(tokenId);
        
        listings.push({
          id: tokenId,
          name: data[0],
          image: data[12] || `/blockmon/${data[1]}.png`, // Use tokenURI or fallback to attribute-based image
          price: ethers.formatEther(listing.price),
          seller: listing.seller,
          attribute: Number(data[1]),
          rarity: Number(data[2]),
          level: Number(data[3])
        });
      } catch (err) {
        console.log(`Error fetching details for listing ${listing.tokenId}:`, err);
      }
    });
    
    // Wait for all listing details to be fetched
    await Promise.all(listingPromises);
    
    return listings;
  } catch (error) {
    console.error('Error fetching marketplace listings:', error);
    throw error;
  }
};

/**
 * Get detailed information for a specific listing
 */
export const getListingDetails = async (tokenId: number): Promise<DetailedListing | null> => {
  try {
    // Query The Graph for the listing
    const { data: listingData } = await marketplaceGraphClient.query({
      query: GET_MARKETPLACE_LISTING,
      variables: { tokenId: tokenId.toString() },
    });
    
    if (!listingData.listingCreateds || listingData.listingCreateds.length === 0) {
      return null;
    }
    
    // Get listing history
    const { data: historyData } = await marketplaceGraphClient.query({
      query: GET_LISTING_HISTORY,
      variables: { tokenId: tokenId.toString() },
    });
    
    // Get all events for this token
    const createEvents = historyData.listingCreateds || [];
    const cancelEvents = historyData.listingCancelleds || [];
    const purchaseEvents = historyData.listingPurchaseds || [];
    
    // Find the most recent event by timestamp
    let mostRecentTimestamp = 0;
    let mostRecentEventType = '';
    
    // Check created events
    for (const event of createEvents) {
      const timestamp = parseInt(event.blockTimestamp);
      if (timestamp > mostRecentTimestamp) {
        mostRecentTimestamp = timestamp;
        mostRecentEventType = 'created';
      }
    }
    
    // Check cancelled events
    for (const event of cancelEvents) {
      const timestamp = parseInt(event.blockTimestamp);
      if (timestamp > mostRecentTimestamp) {
        mostRecentTimestamp = timestamp;
        mostRecentEventType = 'cancelled';
      }
    }
    
    // Check purchased events
    for (const event of purchaseEvents) {
      const timestamp = parseInt(event.blockTimestamp);
      if (timestamp > mostRecentTimestamp) {
        mostRecentTimestamp = timestamp;
        mostRecentEventType = 'purchased';
      }
    }
    
    // If the most recent event is not a 'created' event, the listing is not active
    if (mostRecentEventType !== 'created') {
      console.log(`Listing ${tokenId} is not active. Most recent event: ${mostRecentEventType}`);
      return null;
    }
    
    // Find the most recent listing created event
    let mostRecentListing = null;
    let mostRecentListingTimestamp = 0;
    
    for (const event of createEvents) {
      const timestamp = parseInt(event.blockTimestamp);
      if (timestamp > mostRecentListingTimestamp) {
        mostRecentListingTimestamp = timestamp;
        mostRecentListing = event;
      }
    }
    
    if (!mostRecentListing) {
      return null;
    }
    
    // Connect to the blockchain to get token details
    const provider = new ethers.JsonRpcProvider('https://sepolia-rpc.scroll.io/');
    const contract = new ethers.Contract(BLOCKNOGOTCHI_CONTRACT_ADDRESS, BlockmonABI.abi, provider);
    
    // Get Blockmon details directly from the blockchain
    const blockmonData = await contract.getPokemon(tokenId);
    
    console.log('Raw blockchain data:', blockmonData);
    
    // Process history data
    const history: HistoryItem[] = [];
    
    // Add listing created events
    if (historyData.listingCreateds) {
      historyData.listingCreateds.forEach((event: { tokenId: string; seller: string; price: string; blockTimestamp: string; transactionHash: string }) => {
        history.push({
          event: 'Listed',
          date: new Date(Number(event.blockTimestamp) * 1000).toISOString().split('T')[0],
          by: event.seller,
          price: ethers.formatEther(event.price) + ' ETH',
          txHash: event.transactionHash
        });
      });
    }
    
    // Add listing cancelled events
    if (historyData.listingCancelleds) {
      historyData.listingCancelleds.forEach((event: { tokenId: string; seller: string; blockTimestamp: string; transactionHash: string }) => {
        history.push({
          event: 'Cancelled',
          date: new Date(Number(event.blockTimestamp) * 1000).toISOString().split('T')[0],
          by: event.seller,
          txHash: event.transactionHash
        });
      });
    }
    
    // Add listing purchased events
    if (historyData.listingPurchaseds) {
      historyData.listingPurchaseds.forEach((event: { tokenId: string; seller: string; buyer: string; price: string; blockTimestamp: string; transactionHash: string }) => {
        history.push({
          event: 'Purchased',
          date: new Date(Number(event.blockTimestamp) * 1000).toISOString().split('T')[0],
          by: event.buyer,
          against: event.seller,
          price: ethers.formatEther(event.price) + ' ETH',
          txHash: event.transactionHash
        });
      });
    }
    
    // Sort history by date (newest first)
    history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Get attribute and rarity as raw numbers from the blockchain
    const attribute = Number(blockmonData[1]);
    const rarity = Number(blockmonData[2]);
    const level = Number(blockmonData[3]);
    
    // Use the raw attribute and rarity values
    const attributeString = getAttributeString(attribute);
    const rarityString = getRarityString(rarity);
    
    // Use raw stats from the blockchain
    const stats = {
      hp: Number(blockmonData[4]),
      attack: Number(blockmonData[5]),
      defense: Number(blockmonData[6]),
      speed: Number(blockmonData[7])
    };
    
    return {
      id: tokenId,
      name: blockmonData[0],
      image: blockmonData[12] || `/blockmon/${attribute}.png`,
      price: mostRecentListing.price ? ethers.formatEther(mostRecentListing.price) : '0',
      seller: mostRecentListing.seller,
      attribute: attributeString,
      rarity: rarityString,
      level: level,
      description: blockmonData[11] || '',
      stats: stats,
      history: history,
      rawData: {
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
        claimed: blockmonData[10],
        owner: blockmonData[11],
        tokenURI: blockmonData[12],
        age: Number(blockmonData[13]),
        experience: Number(blockmonData[14])
      }
    };
  } catch (error) {
    console.error('Error fetching listing details:', error);
    throw error;
  }
};

/**
 * List an NFT for sale
 */
export const listNFT = async (tokenId: number, price: string, walletProvider: Eip1193Provider) => {
  try {
    const signer = await getSigner(walletProvider);
    const blockmonContract = await getBlockmonContract(signer);
    const marketplaceContract = await getMarketplaceContract(signer);
    
    // Check if the marketplace is approved to transfer the NFT
    const approved = await blockmonContract.getApproved(tokenId);
    const signerAddress = await signer.getAddress();
    const isApprovedForAll = await blockmonContract.isApprovedForAll(signerAddress, MARKETPLACE_CONTRACT_ADDRESS);
    
    // If not approved, approve the marketplace
    if (approved !== MARKETPLACE_CONTRACT_ADDRESS && !isApprovedForAll) {
      console.log('Approving marketplace to transfer NFT...');
      const approveTx = await blockmonContract.approve(MARKETPLACE_CONTRACT_ADDRESS, tokenId);
      await approveTx.wait();
      console.log('Marketplace approved');
    }
    
    // Create the listing
    console.log(`Creating listing for token ${tokenId} at price ${price} ETH...`);
    const priceInWei = ethers.parseEther(price);
    const listingTx = await marketplaceContract.createListing(tokenId, priceInWei);
    await listingTx.wait();
    console.log('Listing created successfully');
    
    return true;
  } catch (error) {
    console.error('Error listing NFT:', error);
    throw error;
  }
};

/**
 * Cancel an NFT listing
 */
export const cancelListing = async (tokenId: number, walletProvider: Eip1193Provider) => {
  try {
    const signer = await getSigner(walletProvider);
    const marketplaceContract = await getMarketplaceContract(signer);
    
    console.log(`Cancelling listing for token ${tokenId}...`);
    const cancelTx = await marketplaceContract.cancelListing(tokenId);
    await cancelTx.wait();
    console.log('Listing cancelled successfully');
    
    return true;
  } catch (error) {
    console.error('Error cancelling listing:', error);
    throw error;
  }
};

/**
 * Purchase an NFT
 */
export const purchaseNFT = async (tokenId: number, price: string, walletProvider: Eip1193Provider) => {
  try {
    const signer = await getSigner(walletProvider);
    const marketplaceContract = await getMarketplaceContract(signer);
    
    console.log(`Purchasing token ${tokenId} for ${price} ETH...`);
    const priceInWei = ethers.parseEther(price);
    const purchaseTx = await marketplaceContract.purchaseListing(tokenId, { value: priceInWei });
    await purchaseTx.wait();
    console.log('Purchase successful');
    
    return true;
  } catch (error) {
    console.error('Error purchasing NFT:', error);
    throw error;
  }
}; 