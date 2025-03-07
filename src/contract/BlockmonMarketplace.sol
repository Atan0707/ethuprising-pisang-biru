// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title BlockmonMarketplace
 * @dev A marketplace contract for trading Blockmon NFTs
 */
contract BlockmonMarketplace is ReentrancyGuard, Ownable {
    // The Blockmon NFT contract
    IERC721 public blockmonContract;
    
    // Fee percentage (in basis points, 100 = 1%)
    uint256 public feePercentage;
    
    // Listing structure
    struct Listing {
        address seller;
        uint256 price;
        bool active;
    }
    
    // Mapping from token ID to its listing
    mapping(uint256 => Listing) public listings;
    
    // Events
    event ListingCreated(uint256 indexed tokenId, address indexed seller, uint256 price);
    event ListingCancelled(uint256 indexed tokenId, address indexed seller);
    event ListingPurchased(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price);
    event FeePercentageUpdated(uint256 oldFeePercentage, uint256 newFeePercentage);
    
    /**
     * @dev Constructor
     * @param _blockmonContract Address of the Blockmon NFT contract
     * @param _feePercentage Initial fee percentage in basis points (100 = 1%)
     */
    constructor(address _blockmonContract, uint256 _feePercentage) Ownable(msg.sender) {
        require(_blockmonContract != address(0), "Invalid Blockmon contract address");
        require(_feePercentage <= 1000, "Fee percentage cannot exceed 10%");
        
        blockmonContract = IERC721(_blockmonContract);
        feePercentage = _feePercentage;
    }
    
    /**
     * @dev Creates a listing for a Blockmon NFT
     * @param tokenId The ID of the token to list
     * @param price The price in wei
     */
    function createListing(uint256 tokenId, uint256 price) external {
        require(blockmonContract.ownerOf(tokenId) == msg.sender, "Not the owner of this token");
        require(price > 0, "Price must be greater than zero");
        require(blockmonContract.getApproved(tokenId) == address(this) || 
                blockmonContract.isApprovedForAll(msg.sender, address(this)), 
                "Marketplace not approved to transfer token");
        
        listings[tokenId] = Listing({
            seller: msg.sender,
            price: price,
            active: true
        });
        
        emit ListingCreated(tokenId, msg.sender, price);
    }
    
    /**
     * @dev Cancels a listing
     * @param tokenId The ID of the token to cancel listing for
     */
    function cancelListing(uint256 tokenId) external {
        Listing storage listing = listings[tokenId];
        require(listing.active, "Listing not active");
        require(listing.seller == msg.sender, "Not the seller");
        
        listing.active = false;
        
        emit ListingCancelled(tokenId, msg.sender);
    }
    
    /**
     * @dev Purchases a listed Blockmon NFT
     * @param tokenId The ID of the token to purchase
     */
    function purchaseListing(uint256 tokenId) external payable nonReentrant {
        Listing storage listing = listings[tokenId];
        require(listing.active, "Listing not active");
        require(msg.value >= listing.price, "Insufficient payment");
        require(msg.sender != listing.seller, "Cannot buy your own listing");
        
        address seller = listing.seller;
        uint256 price = listing.price;
        
        // Mark listing as inactive
        listing.active = false;
        
        // Calculate fee
        uint256 fee = (price * feePercentage) / 10000;
        uint256 sellerAmount = price - fee;
        
        // Transfer NFT to buyer
        blockmonContract.safeTransferFrom(seller, msg.sender, tokenId);
        
        // Transfer payment to seller
        (bool success, ) = payable(seller).call{value: sellerAmount}("");
        require(success, "Failed to send payment to seller");
        
        emit ListingPurchased(tokenId, seller, msg.sender, price);
        
        // Refund excess payment if any
        if (msg.value > price) {
            (bool refundSuccess, ) = payable(msg.sender).call{value: msg.value - price}("");
            require(refundSuccess, "Failed to refund excess payment");
        }
    }
    
    /**
     * @dev Updates the fee percentage
     * @param _feePercentage New fee percentage in basis points (100 = 1%)
     */
    function updateFeePercentage(uint256 _feePercentage) external onlyOwner {
        require(_feePercentage <= 1000, "Fee percentage cannot exceed 10%");
        
        uint256 oldFeePercentage = feePercentage;
        feePercentage = _feePercentage;
        
        emit FeePercentageUpdated(oldFeePercentage, _feePercentage);
    }
    
    /**
     * @dev Withdraws accumulated fees to the contract owner
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Failed to withdraw fees");
    }
    
    /**
     * @dev Gets all active listings
     * @param tokenIds Array of token IDs to check
     * @return activeListings Array of active listings
     */
    function getActiveListings(uint256[] calldata tokenIds) external view returns (Listing[] memory) {
        uint256 count = 0;
        
        // Count active listings
        for (uint256 i = 0; i < tokenIds.length; i++) {
            if (listings[tokenIds[i]].active) {
                count++;
            }
        }
        
        // Create array of active listings
        Listing[] memory activeListings = new Listing[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < tokenIds.length; i++) {
            if (listings[tokenIds[i]].active) {
                activeListings[index] = listings[tokenIds[i]];
                index++;
            }
        }
        
        return activeListings;
    }
    
    /**
     * @dev Checks if a token is listed
     * @param tokenId The ID of the token to check
     * @return isListed Whether the token is listed
     * @return price The price of the listing
     * @return seller The seller of the listing
     */
    function checkListing(uint256 tokenId) external view returns (bool isListed, uint256 price, address seller) {
        Listing storage listing = listings[tokenId];
        return (listing.active, listing.price, listing.seller);
    }
} 