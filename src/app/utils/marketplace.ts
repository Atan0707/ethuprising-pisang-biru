import { ethers, Eip1193Provider } from 'ethers';
import BlockmonABI from '@/contract/Blockmon.json';
import { ApolloClient, InMemoryCache, HttpLink, gql } from '@apollo/client';

// Create an Apollo Client instance for The Graph
const graphClient = new ApolloClient({
  link: new HttpLink({
    uri: 'https://api.studio.thegraph.com/query/105196/ethuprising/version/latest',
  }),
  cache: new InMemoryCache(),
});

// Contract addresses from environment variables
const BLOCKMON_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0xe1e52a36E15eBf6785842e55b6d1D901819985ec';
const MARKETPLACE_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS || '0x123456789...'; // Replace with actual address

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
      where: { active: true }
    ) {
      id
      tokenId
      seller
      price
      blockTimestamp
    }
  }
`;

// ABI for the Marketplace contract - simplified for this example
const MARKETPLACE_ABI = [
  'function createListing(uint256 tokenId, uint256 price)',
  'function cancelListing(uint256 tokenId)',
  'function purchaseListing(uint256 tokenId) payable',
  'function checkListing(uint256 tokenId) view returns (bool isListed, uint256 price, address seller)',
  'function getActiveListings(uint256[] calldata tokenIds) view returns (tuple(address seller, uint256 price, bool active)[] memory)'
];

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
  
  return new ethers.Contract(MARKETPLACE_CONTRACT_ADDRESS, MARKETPLACE_ABI, signer);
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
 * Get NFTs owned by the current user using The Graph and blockchain data
 */
export const getOwnedNFTs = async (userAddress: string): Promise<BlockmonData[]> => {
  try {
    // Query The Graph for tokens owned by the user
    const { data } = await graphClient.query({
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
    // Query The Graph for active listings
    const { data } = await graphClient.query({
      query: GET_MARKETPLACE_LISTINGS,
    });
    
    if (!data.listingCreateds || data.listingCreateds.length === 0) {
      return [];
    }
    
    // Connect to the blockchain to get token details
    const provider = new ethers.JsonRpcProvider('https://sepolia-rpc.scroll.io/');
    const contract = new ethers.Contract(BLOCKMON_CONTRACT_ADDRESS, BlockmonABI.abi, provider);
    
    // Fetch details for each listed token
    const listings: MarketplaceListing[] = [];
    const listingPromises = data.listingCreateds.map(async (listing: { tokenId: string, seller: string, price: string }) => {
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