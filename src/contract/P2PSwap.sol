// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title P2PSwap
 * @dev Contract for P2P swapping of physical NFT cards with escrow functionality
 */
contract P2PSwap is Ownable, ReentrancyGuard {
    // Structure to store listing information
    struct Listing {
        address seller;
        uint256 price;
        bool active;
        bytes32 nfcHash;
    }

    // Mapping from token ID to its listing
    mapping(uint256 => Listing) private _listings;
    
    // Mapping to track used NFC hashes
    mapping(bytes32 => bool) private _usedNfcHashes;
    
    // Fee percentage (in basis points, e.g., 200 = 2%)
    uint256 public feePercentage = 200; // 2% fee
    
    // Address of the Blockmon NFT contract
    address private _blockmonContract;
    
    // Accumulated fees
    uint256 private _accumulatedFees;

    // Events
    event ListingCreated(uint256 indexed tokenId, address indexed seller, uint256 price);
    event ListingPurchased(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price);
    event ListingCancelled(uint256 indexed tokenId, address indexed seller);
    event ListingClaimed(uint256 indexed tokenId, address indexed seller);

    /**
     * @dev Constructor
     */
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Set the Blockmon contract address
     * @param blockmonContract Address of the Blockmon NFT contract
     */
    function setBlockmonContract(address blockmonContract) external onlyOwner {
        require(blockmonContract != address(0), "Invalid contract address");
        _blockmonContract = blockmonContract;
    }
    
    /**
     * @dev Set the fee percentage (in basis points)
     * @param _feePercentage New fee percentage
     */
    function setFeePercentage(uint256 _feePercentage) external onlyOwner {
        require(_feePercentage <= 1000, "Fee cannot exceed 10%");
        feePercentage = _feePercentage;
    }
    
    /**
     * @dev Create a new listing for a physical NFT
     * @param tokenId ID of the token to list
     * @param price Price in wei
     * @param nfcHash Hash of the NFC card to verify physical ownership
     */
    function createListing(uint256 tokenId, uint256 price, bytes32 nfcHash) external {
        require(_blockmonContract != address(0), "Blockmon contract not set");
        require(price > 0, "Price must be greater than zero");
        require(!_usedNfcHashes[nfcHash], "NFC hash already used");
        
        // Verify the caller owns the token
        IERC721 blockmon = IERC721(_blockmonContract);
        require(blockmon.ownerOf(tokenId) == msg.sender, "Not the token owner");
        
        // Create the listing
        _listings[tokenId] = Listing({
            seller: msg.sender,
            price: price,
            active: true,
            nfcHash: nfcHash
        });
        
        // Mark the NFC hash as used
        _usedNfcHashes[nfcHash] = true;
        
        emit ListingCreated(tokenId, msg.sender, price);
    }
    
    /**
     * @dev Purchase a listed NFT
     * @param tokenId ID of the token to purchase
     * @param nfcHash Hash of the NFC card to verify physical ownership
     */
    function purchaseListing(uint256 tokenId, bytes32 nfcHash) external payable nonReentrant {
        Listing storage listing = _listings[tokenId];
        
        require(listing.active, "Listing not active");
        require(msg.value >= listing.price, "Insufficient payment");
        require(listing.nfcHash == nfcHash, "Invalid NFC hash");
        require(msg.sender != listing.seller, "Cannot buy your own listing");
        
        // Calculate fee
        uint256 fee = (listing.price * feePercentage) / 10000;
        uint256 sellerAmount = listing.price - fee;
        
        // Update accumulated fees
        _accumulatedFees += fee;
        
        // Mark listing as inactive
        listing.active = false;
        
        // Transfer funds to seller
        (bool success, ) = payable(listing.seller).call{value: sellerAmount}("");
        require(success, "Transfer to seller failed");
        
        // Transfer NFT to buyer
        IERC721 blockmon = IERC721(_blockmonContract);
        blockmon.transferFrom(listing.seller, msg.sender, tokenId);
        
        emit ListingPurchased(tokenId, listing.seller, msg.sender, listing.price);
        
        // Refund excess payment
        if (msg.value > listing.price) {
            (bool refundSuccess, ) = payable(msg.sender).call{value: msg.value - listing.price}("");
            require(refundSuccess, "Refund failed");
        }
    }
    
    /**
     * @dev Cancel a listing
     * @param tokenId ID of the token to cancel
     */
    function cancelListing(uint256 tokenId) external {
        Listing storage listing = _listings[tokenId];
        
        require(listing.active, "Listing not active");
        require(listing.seller == msg.sender, "Not the seller");
        
        // Mark listing as inactive
        listing.active = false;
        
        // Free up the NFC hash for reuse
        _usedNfcHashes[listing.nfcHash] = false;
        
        emit ListingCancelled(tokenId, msg.sender);
    }
    
    /**
     * @dev Claim back a listing (for the original owner)
     * @param tokenId ID of the token to claim back
     * @param nfcHash Hash of the NFC card to verify physical ownership
     */
    function claimBackListing(uint256 tokenId, bytes32 nfcHash) external {
        Listing storage listing = _listings[tokenId];
        
        require(listing.active, "Listing not active");
        require(listing.seller == msg.sender, "Not the seller");
        require(listing.nfcHash == nfcHash, "Invalid NFC hash");
        
        // Mark listing as inactive
        listing.active = false;
        
        // Free up the NFC hash for reuse
        _usedNfcHashes[listing.nfcHash] = false;
        
        emit ListingClaimed(tokenId, msg.sender);
    }
    
    /**
     * @dev Get listing details
     * @param tokenId ID of the token
     * @return Listing details
     */
    function getListing(uint256 tokenId) external view returns (Listing memory) {
        return _listings[tokenId];
    }
    
    /**
     * @dev Withdraw accumulated fees (owner only)
     */
    function withdrawFees() external onlyOwner {
        require(_accumulatedFees > 0, "No fees to withdraw");
        
        uint256 amount = _accumulatedFees;
        _accumulatedFees = 0;
        
        (bool success, ) = payable(owner()).call{value: amount}("");
        require(success, "Fee withdrawal failed");
    }
} 