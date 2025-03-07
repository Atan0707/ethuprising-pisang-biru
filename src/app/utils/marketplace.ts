import { ethers, Eip1193Provider } from 'ethers';
import BlockmonABI from '@/contract/Blockmon.json';
import MarketplaceABI from '@/contract/BlockmonMarketplace.json';
import { ApolloClient, InMemoryCache, HttpLink, gql } from '@apollo/client';

// Create an Apollo Client instance for The Graph (Blockmon data)
const blockmonGraphClient = new ApolloClient({
  link: new HttpLink({
    uri: 'https://api.studio.thegraph.com/query/105196/ethuprising/version/latest',
  }),
  cache: new InMemoryCache(),
});

// Create an Apollo Client instance for The Graph (Marketplace data)
const marketplaceGraphClient = new ApolloClient({
  link: new HttpLink({
    uri: 'https://api.studio.thegraph.com/query/105196/blockmon-marketplace/version/latest',
  }),
  cache: new InMemoryCache(),
});

// Contract addresses from environment variables
const BLOCKMON_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0xe1e52a36E15eBf6785842e55b6d1D901819985ec';
const MARKETPLACE_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS || '0xb5960bDa72Dba8693c4376bca91C166E10CDe75A';

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
 * Get the Blockmon contract instance
 */
export const getBlockmonContract = async (signer?: ethers.Signer) => {
  if (!signer) {
    throw new Error('Signer not available');
  }
  
  return new ethers.Contract(BLOCKMON_CONTRACT_ADDRESS, BlockmonABI.abi, signer);
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
    
    // Connect to the blockchain to get token details
    const provider = new ethers.JsonRpcProvider('https://sepolia-rpc.scroll.io/');
    const contract = new ethers.Contract(BLOCKMON_CONTRACT_ADDRESS, BlockmonABI.abi, provider);
    
    // Fetch details for each token
    const ownedTokens: BlockmonData[] = [];
    const tokenPromises = Array.from(tokenIds).map(async (tokenId) => {
      try {
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
    });
    
    if (!data.listingCreateds || data.listingCreateds.length === 0) {
      return [];
    }
    
    // Get cancelled and purchased listings to filter out inactive ones
    const cancelledTokenIds = new Set<string>();
    if (data.listingCancelleds) {
      data.listingCancelleds.forEach((cancelled: { tokenId: string }) => {
        cancelledTokenIds.add(cancelled.tokenId);
      });
    }
    
    const purchasedTokenIds = new Set<string>();
    if (data.listingPurchaseds) {
      data.listingPurchaseds.forEach((purchased: { tokenId: string }) => {
        purchasedTokenIds.add(purchased.tokenId);
      });
    }
    
    // Filter out inactive listings
    const activeListings = data.listingCreateds.filter((listing: { tokenId: string }) => {
      return !cancelledTokenIds.has(listing.tokenId) && !purchasedTokenIds.has(listing.tokenId);
    });
    
    if (activeListings.length === 0) {
      return [];
    }
    
    // Connect to the blockchain to get token details
    const provider = new ethers.JsonRpcProvider('https://sepolia-rpc.scroll.io/');
    const contract = new ethers.Contract(BLOCKMON_CONTRACT_ADDRESS, BlockmonABI.abi, provider);
    
    // Fetch details for each listed token
    const listings: MarketplaceListing[] = [];
    const listingPromises = activeListings.map(async (listing: { tokenId: string, seller: string, price: string }) => {
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
    
    // Get listing history to check if it's still active
    const { data: historyData } = await marketplaceGraphClient.query({
      query: GET_LISTING_HISTORY,
      variables: { tokenId: tokenId.toString() },
    });
    
    // Check if the listing has been cancelled or purchased
    const isCancelled = historyData.listingCancelleds && historyData.listingCancelleds.some(
      (event: { tokenId: string }) => event.tokenId === tokenId.toString()
    );
    
    const isPurchased = historyData.listingPurchaseds && historyData.listingPurchaseds.some(
      (event: { tokenId: string }) => event.tokenId === tokenId.toString()
    );
    
    // If the listing is not active, return null
    if (isCancelled || isPurchased) {
      return null;
    }
    
    const listing = listingData.listingCreateds[0];
    
    // Connect to the blockchain to get token details
    const provider = new ethers.JsonRpcProvider('https://sepolia-rpc.scroll.io/');
    const contract = new ethers.Contract(BLOCKMON_CONTRACT_ADDRESS, BlockmonABI.abi, provider);
    
    // Get Blockmon details
    const blockmonData = await contract.getPokemon(tokenId);
    
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
    
    // Calculate stats based on attribute and rarity
    const attribute = Number(blockmonData[1]);
    const rarity = Number(blockmonData[2]);
    const level = Number(blockmonData[3]);
    
    // Base stats multiplied by level and rarity
    const rarityMultiplier = [1, 1.2, 1.5, 1.8, 2.2, 2.5][rarity] || 1;
    const baseStats = {
      hp: Math.floor(100 * rarityMultiplier * (1 + level * 0.1)),
      attack: Math.floor(70 * rarityMultiplier * (1 + level * 0.1)),
      defense: Math.floor(70 * rarityMultiplier * (1 + level * 0.1)),
      speed: Math.floor(70 * rarityMultiplier * (1 + level * 0.1))
    };
    
    // Adjust stats based on attribute
    const stats = { ...baseStats };
    switch (attribute) {
      case 1: // FIRE
        stats.attack = Math.floor(stats.attack * 1.2);
        stats.defense = Math.floor(stats.defense * 0.9);
        break;
      case 2: // WATER
        stats.hp = Math.floor(stats.hp * 1.1);
        stats.defense = Math.floor(stats.defense * 1.1);
        break;
      case 3: // ELECTRIC
        stats.speed = Math.floor(stats.speed * 1.3);
        break;
      case 4: // GRASS
        stats.hp = Math.floor(stats.hp * 1.2);
        stats.speed = Math.floor(stats.speed * 0.9);
        break;
      // Add more attribute adjustments as needed
    }
    
    // Generate a description based on attributes
    const attributeString = getAttributeString(attribute);
    const rarityString = getRarityString(rarity);
    const description = `A ${rarityString.toLowerCase()} ${attributeString.toLowerCase()}-type Blockmon at level ${level}. ${
      attribute === 1 ? 'It has exceptional attack capabilities but slightly lower defense.' :
      attribute === 2 ? 'It has increased health and defense, making it durable in battles.' :
      attribute === 3 ? 'It is extremely fast, allowing it to strike first in most encounters.' :
      attribute === 4 ? 'It has high health but moves somewhat slower than other types.' :
      'It has balanced stats across all categories.'
    }`;
    
    return {
      id: tokenId,
      name: blockmonData[0],
      image: blockmonData[12] || `/blockmon/${attribute}.png`,
      price: ethers.formatEther(listing.price),
      seller: listing.seller,
      attribute: attributeString,
      rarity: rarityString,
      level: level,
      description: description,
      stats: stats,
      history: history
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