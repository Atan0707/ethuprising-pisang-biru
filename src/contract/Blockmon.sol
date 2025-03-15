// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Blocknogotchi is ERC721, ERC721URIStorage, Ownable {
    uint256 private _currentTokenId;

    // Blocknogotchi attributes - single structure for both storage and view
    struct Blocknogotchi {
        string name;
        Attribute attribute;
        Rarity rarity;
        uint8 level; // Blocknogotchi level (starts at 1)
        uint256 hp; // Health points
        uint256 baseDamage; // Base attack damage
        uint256 battleCount; // Total battles participated
        uint256 battleWins; // Total battles won
        uint256 birthTime; // When the blocknogotchi was claimed
        uint256 lastBattleTime; // Last time the blocknogotchi battled
        bool claimed; // Whether the blocknogotchi has been claimed
        uint256 experience; // Experience points
    }

    enum Rarity {
        COMMON,
        UNCOMMON,
        RARE,
        EPIC,
        LEGENDARY
    }
    enum Attribute {
        FIRE,
        WATER,
        PLANT,
        ELECTRIC,
        EARTH,
        AIR,
        LIGHT,
        DARK
    }

    // Level up constants
    uint256 constant XP_PER_LEVEL = 100;
    uint256 constant MAX_LEVEL = 100;

    // Battle cooldown 
    uint256 BATTLE_COOLDOWN = 1 minutes;

    // Address authorized to record battle results
    address public battleOracleAddress;

    mapping(uint256 => Blocknogotchi) public blocknogotchis;
    mapping(bytes32 => bool) public usedHashes;
    // Store the claim hash for each token ID
    mapping(uint256 => bytes32) private tokenClaimHashes;
    // Reverse mapping to find token by hash
    mapping(bytes32 => uint256) private hashToToken;

    event BlocknogotchiCreated(uint256 indexed tokenId, bytes32 claimHash);
    event BlocknogotchiClaimed(uint256 indexed tokenId, address indexed claimer);
    event BattleCompleted(
        uint256 indexed tokenId,
        uint256 indexed opponentId,
        bool won
    );
    event BlocknogotchiLeveledUp(uint256 indexed tokenId, uint8 newLevel);
    event ExperienceGained(uint256 indexed tokenId, uint256 amount);

    constructor() ERC721("Blocknogotchi", "BGC") Ownable(msg.sender) {}

    /**
     * Admin function to create new blocknogotchis that can be claimed
     */
    function createBlocknogotchi(
        string memory name,
        Attribute attribute,
        Rarity rarity,
        string memory uri
    ) public onlyOwner returns (uint256, bytes32) {
        _currentTokenId += 1;
        uint256 newTokenId = _currentTokenId;

        // Generate a unique claim hash
        bytes32 claimHash = keccak256(
            abi.encodePacked(newTokenId, block.timestamp, msg.sender)
        );

        // Base stats depend on rarity
        uint256 baseHp = 30 + (uint256(rarity) * 4);
        uint256 baseDmg = 5 + (uint256(rarity) * 2);

        blocknogotchis[newTokenId] = Blocknogotchi({
            name: name,
            attribute: attribute,
            rarity: rarity,
            level: 1,
            hp: baseHp,
            baseDamage: baseDmg,
            battleCount: 0,
            battleWins: 0,
            birthTime: 0, // Will be set when claimed
            lastBattleTime: 0, // Will be set when claimed
            claimed: false,
            experience: 0
        });

        // Store the claim hash for this token
        tokenClaimHashes[newTokenId] = claimHash;
        hashToToken[claimHash] = newTokenId;

        _setTokenURI(newTokenId, uri);

        emit BlocknogotchiCreated(newTokenId, claimHash);
        return (newTokenId, claimHash);
    }

    /**
     * User function to claim a blocknogotchi using a hash from an NFC card
     */
    function claimBlocknogotchi(bytes32 hash) public {
        require(!usedHashes[hash], "Hash already used");

        // Find the token ID associated with this hash
        uint256 tokenId = hashToToken[hash];
        require(tokenId > 0, "Invalid or expired hash");
        require(!blocknogotchis[tokenId].claimed, "Blocknogotchi already claimed");

        usedHashes[hash] = true;
        blocknogotchis[tokenId].claimed = true;
        blocknogotchis[tokenId].birthTime = block.timestamp;

        _safeMint(msg.sender, tokenId);

        emit BlocknogotchiClaimed(tokenId, msg.sender);
    }

    function checkCooldown(uint256 tokenId) public view returns (bool) {
        return block.timestamp >= blocknogotchis[tokenId].lastBattleTime + BATTLE_COOLDOWN;
    }
    /**
     * Record a battle result between two blocknogotchis (called by battle oracle)
     * @param winnerTokenId The token ID of the winning blocknogotchi
     * @param loserTokenId The token ID of the losing blocknogotchi
     * @param winnerExperience Experience gained by the winner
     * @param loserExperience Experience gained by the loser (typically less than winner)
     */
    function recordBattle(
        uint256 winnerTokenId,
        uint256 loserTokenId,
        uint256 winnerExperience,
        uint256 loserExperience
    ) public {
        require(blocknogotchis[winnerTokenId].claimed, "Blocknogotchi not claimed");
        require(blocknogotchis[loserTokenId].claimed, "Blocknogotchi not claimed");

        Blocknogotchi storage winner = blocknogotchis[winnerTokenId];
        Blocknogotchi storage loser = blocknogotchis[loserTokenId];

        // Update winner stats
        winner.battleCount += 1;
        winner.battleWins += 1;
        winner.lastBattleTime = block.timestamp;

        // Update loser stats
        loser.battleCount += 1;
        loser.lastBattleTime = block.timestamp;

        // Award experience to both blocknogotchis
        awardExperience(winnerTokenId, winnerExperience);
        awardExperience(loserTokenId, loserExperience);

        // Emit events for both blocknogotchis
        emit BattleCompleted(winnerTokenId, loserTokenId, true);
        emit BattleCompleted(loserTokenId, winnerTokenId, false);
    }

    /**
     * Award experience to a blocknogotchi and handle level ups
     */
    function awardExperience(uint256 tokenId, uint256 amount) internal {
        Blocknogotchi storage blocknogotchi = blocknogotchis[tokenId];

        // Add experience
        blocknogotchi.experience += amount;

        // Check for level up
        uint8 newLevel = uint8(blocknogotchi.experience / XP_PER_LEVEL) + 1;

        // Cap at max level
        if (newLevel > MAX_LEVEL) {
            newLevel = uint8(MAX_LEVEL);
        }

        // If leveled up
        if (newLevel > blocknogotchi.level) {
            uint8 levelsGained = newLevel - blocknogotchi.level;

            // Increase stats based on level gained
            blocknogotchi.hp += levelsGained * (5 + uint256(blocknogotchi.rarity));
            blocknogotchi.baseDamage +=
                levelsGained *
                (1 + uint256(blocknogotchi.rarity) / 2);

            blocknogotchi.level = newLevel;
            emit BlocknogotchiLeveledUp(tokenId, newLevel);
        }

        emit ExperienceGained(tokenId, amount);
    }

    /**
     * Get all data for a specific blocknogotchi
     */
    function getBlocknogotchi(
        uint256 tokenId
    )
        public
        view
        returns (
            string memory name,
            Attribute attribute,
            Rarity rarity,
            uint8 level,
            uint256 hp,
            uint256 baseDamage,
            uint256 battleCount,
            uint256 battleWins,
            uint256 birthTime,
            uint256 lastBattleTime,
            bool claimed,
            address owner,
            string memory tokenURI,
            uint256 age,
            uint256 experience
        )
    {
        require(_exists(tokenId), "Blocknogotchi doesn't exist");
        Blocknogotchi storage blocknogotchi = blocknogotchis[tokenId];

        address ownerAddress = address(0);
        if (blocknogotchi.claimed) {
            ownerAddress = ownerOf(tokenId);
        }

        // Calculate current age
        uint256 blocknogotchiAge = 0;
        if (blocknogotchi.birthTime > 0) {
            blocknogotchiAge = block.timestamp - blocknogotchi.birthTime;
        }

        return (
            blocknogotchi.name,
            blocknogotchi.attribute,
            blocknogotchi.rarity,
            blocknogotchi.level,
            blocknogotchi.hp,
            blocknogotchi.baseDamage,
            blocknogotchi.battleCount,
            blocknogotchi.battleWins,
            blocknogotchi.birthTime,
            blocknogotchi.lastBattleTime,
            blocknogotchi.claimed,
            ownerAddress,
            _getTokenURISafe(tokenId),
            blocknogotchiAge,
            blocknogotchi.experience
        );
    }

    function _getTokenURISafe(
        uint256 tokenId
    ) internal view returns (string memory) {
        try this.tokenURI(tokenId) returns (string memory uri) {
            return uri;
        } catch {
            return "";
        }
    }

    function _exists(uint256 tokenId) internal view returns (bool) {
        return tokenId > 0 && tokenId <= _currentTokenId;
    }

    function _isOwner(uint256 tokenId) internal view returns (bool) {
        return ownerOf(tokenId) == msg.sender;
    }

    function isPetClaimed(uint256 tokenId) public view returns (bool) {
        require(_exists(tokenId), "Blocknogotchi doesn't exist");
        return blocknogotchis[tokenId].claimed;
    }

    /**
     * Get the claim hash for a token - only callable by contract owner
     * @param tokenId The token ID to get the claim hash for
     * @return The claim hash for the token
     */
    function getTokenClaimHash(uint256 tokenId) public view onlyOwner returns (bytes32) {
        require(_exists(tokenId), "Blocknogotchi doesn't exist");
        return tokenClaimHashes[tokenId];
    }

    function getTokenIdFromHash(bytes32 hash) public view returns (uint256) {
        return hashToToken[hash];
    }

    function setBattleCooldown(uint256 newCooldown) public onlyOwner {
        BATTLE_COOLDOWN = newCooldown;
    }

    /**
     * Verify if a hash is valid for claiming a token
     * @param hash The hash to verify
     * @return Whether the hash is valid and not used
     */
    function isValidClaimHash(bytes32 hash) public view returns (bool) {
        uint256 tokenId = hashToToken[hash];
        return tokenId > 0 && !usedHashes[hash] && !blocknogotchis[tokenId].claimed;
    }

    // Required overrides
    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
