// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Blockmon is ERC721, ERC721URIStorage, Ownable {
    uint256 private _currentTokenId;

    // Pokemon attributes - single structure for both storage and view
    struct Pokemon {
        string name;
        Attribute attribute;
        Rarity rarity;
        uint8 level; // Pokemon level (starts at 1)
        uint256 hp; // Health points
        uint256 baseDamage; // Base attack damage
        uint256 battleCount; // Total battles participated
        uint256 battleWins; // Total battles won
        uint256 birthTime; // When the pokemon was claimed
        uint256 lastBattleTime; // Last time the pokemon battled
        bool claimed; // Whether the pokemon has been claimed
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

    // Battle cooldown (in seconds)
    uint256 constant BATTLE_COOLDOWN = 1 minutes;

    // Address authorized to record battle results
    address public battleOracleAddress;

    mapping(uint256 => Pokemon) public pokemons;
    mapping(bytes32 => bool) public usedHashes;
    // Store the claim hash for each token ID
    mapping(uint256 => bytes32) public tokenClaimHashes;
    // Reverse mapping to find token by hash
    mapping(bytes32 => uint256) public hashToToken;

    event PokemonCreated(uint256 indexed tokenId, bytes32 claimHash);
    event PokemonClaimed(uint256 indexed tokenId, address indexed claimer);
    event BattleCompleted(
        uint256 indexed tokenId,
        uint256 indexed opponentId,
        bool won
    );
    event PokemonLeveledUp(uint256 indexed tokenId, uint8 newLevel);
    event ExperienceGained(uint256 indexed tokenId, uint256 amount);

    constructor() ERC721("Blockmon", "BMN") Ownable(msg.sender) {}

    /**
     * Admin function to create new pokemons that can be claimed
     */
    function createPokemon(
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
        uint256 baseHp = 50 + (uint256(rarity) * 25);
        uint256 baseDmg = 5 + (uint256(rarity) * 3);

        pokemons[newTokenId] = Pokemon({
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

        emit PokemonCreated(newTokenId, claimHash);
        return (newTokenId, claimHash);
    }

    /**
     * User function to claim a pokemon using a hash from an NFC card
     */
    function claimPokemon(bytes32 hash) public {
        require(!usedHashes[hash], "Hash already used");

        // Find the token ID associated with this hash
        uint256 tokenId = hashToToken[hash];
        require(tokenId > 0, "Invalid or expired hash");
        require(!pokemons[tokenId].claimed, "Pokemon already claimed");

        usedHashes[hash] = true;
        pokemons[tokenId].claimed = true;
        pokemons[tokenId].birthTime = block.timestamp;

        _safeMint(msg.sender, tokenId);

        emit PokemonClaimed(tokenId, msg.sender);
    }

    /**
     * Set the address authorized to record battle results
     */
    function setBattleOracleAddress(
        address _battleOracleAddress
    ) public onlyOwner {
        battleOracleAddress = _battleOracleAddress;
    }

    /**
     * Record a battle win for a pokemon (called by battle oracle)
     */
    function recordBattleWin(
        uint256 winnerTokenId,
        uint256 loserTokenId,
        uint256 experienceGained
    ) public {
        require(
            msg.sender == battleOracleAddress || msg.sender == owner(),
            "Not authorized to record battles"
        );
        require(pokemons[winnerTokenId].claimed, "Winner pokemon not claimed");
        require(pokemons[loserTokenId].claimed, "Loser pokemon not claimed");
        require(winnerTokenId != loserTokenId, "Cannot battle yourself");
        require(
            block.timestamp >=
                pokemons[winnerTokenId].lastBattleTime + BATTLE_COOLDOWN,
            "Battle cooldown not over"
        );

        Pokemon storage winner = pokemons[winnerTokenId];

        // Update battle stats
        winner.battleCount += 1;
        winner.battleWins += 1;
        winner.lastBattleTime = block.timestamp;

        // Award experience
        awardExperience(winnerTokenId, experienceGained);

        emit BattleCompleted(winnerTokenId, loserTokenId, true);
    }

    /**
     * Record a battle loss for a pokemon (called by battle oracle)
     */
    function recordBattleLoss(
        uint256 loserTokenId,
        uint256 winnerTokenId,
        uint256 experienceGained
    ) public {
        require(
            msg.sender == battleOracleAddress || msg.sender == owner(),
            "Not authorized to record battles"
        );
        require(pokemons[loserTokenId].claimed, "Loser pokemon not claimed");
        require(pokemons[winnerTokenId].claimed, "Winner pokemon not claimed");
        require(loserTokenId != winnerTokenId, "Cannot battle yourself");
        require(
            block.timestamp >=
                pokemons[loserTokenId].lastBattleTime + BATTLE_COOLDOWN,
            "Battle cooldown not over"
        );

        Pokemon storage loser = pokemons[loserTokenId];

        // Update battle stats
        loser.battleCount += 1;
        loser.lastBattleTime = block.timestamp;

        // Award some experience even for losing
        awardExperience(loserTokenId, experienceGained);

        emit BattleCompleted(loserTokenId, winnerTokenId, false);
    }

    /**
     * Award experience to a pokemon and handle level ups
     */
    function awardExperience(uint256 tokenId, uint256 amount) internal {
        Pokemon storage pokemon = pokemons[tokenId];

        // Add experience
        pokemon.experience += amount;

        // Check for level up
        uint8 newLevel = uint8(pokemon.experience / XP_PER_LEVEL) + 1;

        // Cap at max level
        if (newLevel > MAX_LEVEL) {
            newLevel = uint8(MAX_LEVEL);
        }

        // If leveled up
        if (newLevel > pokemon.level) {
            uint8 levelsGained = newLevel - pokemon.level;

            // Increase stats based on level gained
            pokemon.hp += levelsGained * (5 + uint256(pokemon.rarity));
            pokemon.baseDamage +=
                levelsGained *
                (1 + uint256(pokemon.rarity) / 2);

            pokemon.level = newLevel;
            emit PokemonLeveledUp(tokenId, newLevel);
        }

        emit ExperienceGained(tokenId, amount);
    }

    /**
     * Get all data for a specific pokemon
     */
    function getPokemon(
        uint256 tokenId
    )
        public
        view
        returns (
            Pokemon memory pokemonData,
            address owner,
            string memory uri,
            uint256 age
        )
    {
        require(_exists(tokenId), "Pokemon doesn't exist");
        Pokemon storage pokemon = pokemons[tokenId];

        address ownerAddress = address(0);
        if (pokemon.claimed) {
            ownerAddress = ownerOf(tokenId);
        }

        // Calculate current age
        uint256 pokemonAge = 0;
        if (pokemon.birthTime > 0) {
            pokemonAge = block.timestamp - pokemon.birthTime;
        }

        return (pokemon, ownerAddress, _getTokenURISafe(tokenId), pokemonAge);
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
        require(_exists(tokenId), "Pokemon doesn't exist");
        return pokemons[tokenId].claimed;
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
