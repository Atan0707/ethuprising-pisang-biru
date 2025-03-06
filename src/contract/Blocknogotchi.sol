// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Blocknogotchi is ERC721, ERC721URIStorage, Ownable {
    uint256 private _currentTokenId;
    
    // Pet attributes
    struct Pet {
        string name;
        Species species;
        Rarity rarity;
        uint8 stage;        // Evolution stage (1-3)
        uint256 birthTime;  // When the pet was claimed
        uint256 lastCaredTime; // Last time the pet was interacted with
        uint256 happiness;  // 0-100
        uint256 hunger;     // 0-100 (100 = full)
        uint256 energy;     // 0-100
        uint256 health;     // 0-100
        bool isSick;        // Whether the pet is sick
        bool isSleeping;    // Whether the pet is sleeping
        bool claimed;       // Whether the pet has been claimed
    }

    // Full pet data for external view
    struct PetData {
        string name;
        Species species;
        Rarity rarity;
        uint8 stage;
        uint256 birthTime;
        uint256 lastCaredTime;
        uint256 happiness;
        uint256 hunger;
        uint256 energy;
        uint256 health;
        bool isSick;
        bool isSleeping;
        bool claimed;
        address owner;
        string tokenURI;
        uint256 age;
    }

    enum Rarity { COMMON, UNCOMMON, RARE, EPIC, LEGENDARY }
    enum Species { FIRE, WATER, PLANT, ELECTRIC, EARTH, AIR, LIGHT, DARK }

    // Time constants (in seconds)
    uint256 constant SECONDS_PER_HOUR = 3600;
    uint256 constant STAGE_2_TIME = 2 days;
    uint256 constant STAGE_3_TIME = 7 days;
    
    // Stat decay rates (per hour)
    uint256 constant HUNGER_DECAY = 5;   // Hunger decreases by 5 per hour
    uint256 constant ENERGY_DECAY = 3;   // Energy decreases by 3 per hour
    uint256 constant HAPPINESS_DECAY = 2; // Happiness decreases by 2 per hour

    mapping(uint256 => Pet) public pets;
    mapping(bytes32 => bool) public usedHashes;

    event PetCreated(uint256 indexed tokenId, bytes32 claimHash);
    event PetClaimed(uint256 indexed tokenId, address indexed claimer);
    event PetFed(uint256 indexed tokenId, uint256 newHunger);
    event PetPlayed(uint256 indexed tokenId, uint256 newHappiness);
    event PetHealed(uint256 indexed tokenId, uint256 newHealth);
    event PetSleepStatusChanged(uint256 indexed tokenId, bool isSleeping);
    event PetEvolved(uint256 indexed tokenId, uint8 newStage);

    constructor() ERC721("Blocknogotchi", "BNG") Ownable(msg.sender) {}

    /**
     * Admin function to create new pets that can be claimed
     */
    function createPet(
        string memory name,
        Species species,
        Rarity rarity,
        string memory uri
    ) public onlyOwner returns (uint256, bytes32) {
        _currentTokenId += 1;
        uint256 newTokenId = _currentTokenId;

        bytes32 claimHash = keccak256(abi.encodePacked(newTokenId, block.timestamp, msg.sender));
        
        pets[newTokenId] = Pet({
            name: name,
            species: species,
            rarity: rarity,
            stage: 1,
            birthTime: 0, // Will be set when claimed
            lastCaredTime: 0, // Will be set when claimed
            happiness: 100,
            hunger: 100,
            energy: 100,
            health: 100,
            isSick: false,
            isSleeping: false,
            claimed: false
        });

        _setTokenURI(newTokenId, uri);
        
        emit PetCreated(newTokenId, claimHash);
        return (newTokenId, claimHash);
    }

    /**
     * User function to claim a pet using a hash from an NFC card
     */
    function claimPet(bytes32 hash) public {
        require(!usedHashes[hash], "Hash already used");
        
        // Find the Pet with this hash
        uint256 tokenId;
        bool found = false;
        
        // Regenerate hash for each unclaimed Pet to find a match
        for(uint256 i = 1; i <= _currentTokenId; i++) {
            if (!pets[i].claimed) {
                bytes32 checkHash = keccak256(abi.encodePacked(i, block.timestamp, owner()));
                if (checkHash == hash) {
                    tokenId = i;
                    found = true;
                    break;
                }
            }
        }
        
        require(found, "Invalid or expired hash");
        
        usedHashes[hash] = true;
        pets[tokenId].claimed = true;
        pets[tokenId].birthTime = block.timestamp;
        pets[tokenId].lastCaredTime = block.timestamp;
        
        _safeMint(msg.sender, tokenId);

        emit PetClaimed(tokenId, msg.sender);
    }

    /**
     * Feed the pet to increase hunger and happiness
     */
    function feedPet(uint256 tokenId) public {
        require(_isOwner(tokenId), "Not the pet owner");
        require(pets[tokenId].claimed, "Pet not claimed yet");
        require(!pets[tokenId].isSleeping, "Pet is sleeping");
        
        _updatePetStatus(tokenId);
        
        // Increase hunger (capped at 100)
        uint256 newHunger = pets[tokenId].hunger + 30;
        if (newHunger > 100) newHunger = 100;
        pets[tokenId].hunger = newHunger;
        
        // Increase happiness a bit too
        uint256 newHappiness = pets[tokenId].happiness + 5;
        if (newHappiness > 100) newHappiness = 100;
        pets[tokenId].happiness = newHappiness;
        
        // Update last cared time
        pets[tokenId].lastCaredTime = block.timestamp;
        
        emit PetFed(tokenId, newHunger);
    }

    /**
     * Play with the pet to increase happiness but decrease energy
     */
    function playWithPet(uint256 tokenId) public {
        require(_isOwner(tokenId), "Not the pet owner");
        require(pets[tokenId].claimed, "Pet not claimed yet");
        require(!pets[tokenId].isSleeping, "Pet is sleeping");
        require(pets[tokenId].energy >= 10, "Pet is too tired to play");
        
        _updatePetStatus(tokenId);
        
        // Increase happiness
        uint256 newHappiness = pets[tokenId].happiness + 15;
        if (newHappiness > 100) newHappiness = 100;
        pets[tokenId].happiness = newHappiness;
        
        // Decrease energy
        pets[tokenId].energy = pets[tokenId].energy > 10 ? pets[tokenId].energy - 10 : 0;
        
        // Decrease hunger slightly (playing makes you hungry)
        pets[tokenId].hunger = pets[tokenId].hunger > 5 ? pets[tokenId].hunger - 5 : 0;
        
        // Update last cared time
        pets[tokenId].lastCaredTime = block.timestamp;
        
        emit PetPlayed(tokenId, newHappiness);
    }

    /**
     * Toggle sleep status
     */
    function toggleSleep(uint256 tokenId) public {
        require(_isOwner(tokenId), "Not the pet owner");
        require(pets[tokenId].claimed, "Pet not claimed yet");
        
        _updatePetStatus(tokenId);
        
        pets[tokenId].isSleeping = !pets[tokenId].isSleeping;
        
        // If waking up, increase energy
        if (!pets[tokenId].isSleeping) {
            uint256 newEnergy = pets[tokenId].energy + 50;
            if (newEnergy > 100) newEnergy = 100;
            pets[tokenId].energy = newEnergy;
        }
        
        pets[tokenId].lastCaredTime = block.timestamp;
        
        emit PetSleepStatusChanged(tokenId, pets[tokenId].isSleeping);
    }

    /**
     * Heal the pet if it's sick
     */
    function healPet(uint256 tokenId) public {
        require(_isOwner(tokenId), "Not the pet owner");
        require(pets[tokenId].claimed, "Pet not claimed yet");
        require(pets[tokenId].isSick, "Pet is not sick");
        
        _updatePetStatus(tokenId);
        
        pets[tokenId].isSick = false;
        uint256 newHealth = pets[tokenId].health + 30;
        if (newHealth > 100) newHealth = 100;
        pets[tokenId].health = newHealth;
        
        pets[tokenId].lastCaredTime = block.timestamp;
        
        emit PetHealed(tokenId, newHealth);
    }

    /**
     * Update the pet's stats based on time passed
     */
    function _updatePetStatus(uint256 tokenId) internal {
        Pet storage pet = pets[tokenId];
        
        if (!pet.claimed) return;
        
        uint256 timePassed = block.timestamp - pet.lastCaredTime;
        uint256 hoursPassed = timePassed / SECONDS_PER_HOUR;
        
        if (hoursPassed == 0) return;
        
        // Update hunger (decreases over time)
        if (pet.hunger >= HUNGER_DECAY * hoursPassed) {
            pet.hunger -= HUNGER_DECAY * hoursPassed;
        } else {
            pet.hunger = 0;
        }
        
        // Update energy (decreases if not sleeping, increases if sleeping)
        if (!pet.isSleeping) {
            if (pet.energy >= ENERGY_DECAY * hoursPassed) {
                pet.energy -= ENERGY_DECAY * hoursPassed;
            } else {
                pet.energy = 0;
            }
        } else {
            // Sleeping restores energy
            uint256 newEnergy = pet.energy + (5 * hoursPassed);
            if (newEnergy > 100) newEnergy = 100;
            pet.energy = newEnergy;
        }
        
        // Update happiness (decreases over time)
        if (pet.happiness >= HAPPINESS_DECAY * hoursPassed) {
            pet.happiness -= HAPPINESS_DECAY * hoursPassed;
        } else {
            pet.happiness = 0;
        }
        
        // Health decreases if hunger is low
        if (pet.hunger < 20) {
            uint256 healthDrop = hoursPassed * 2;
            if (pet.health > healthDrop) {
                pet.health -= healthDrop;
            } else {
                pet.health = 0;
            }
            
            // Pet can get sick if health is low
            if (pet.health < 30 && !pet.isSick) {
                // 10% chance per hour of getting sick when health is low
                uint256 sickRoll = uint256(keccak256(abi.encodePacked(block.timestamp, tokenId))) % 10;
                if (sickRoll == 0) {
                    pet.isSick = true;
                }
            }
        }
        
        // Check for evolution based on age
        uint256 petAge = block.timestamp - pet.birthTime;
        
        if (pet.stage == 1 && petAge >= STAGE_2_TIME && pet.health > 50 && pet.happiness > 50) {
            pet.stage = 2;
            emit PetEvolved(tokenId, 2);
        } else if (pet.stage == 2 && petAge >= STAGE_3_TIME && pet.health > 70 && pet.happiness > 70) {
            pet.stage = 3;
            emit PetEvolved(tokenId, 3);
        }
    }

    /**
     * Get all data for a specific pet
     */
    function getPet(uint256 tokenId) public view returns (PetData memory) {
        require(_exists(tokenId), "Pet doesn't exist");
        Pet memory pet = pets[tokenId];
        
        address owner = address(0);
        if (pet.claimed) {
            owner = ownerOf(tokenId);
        }

        // Calculate current age
        uint256 age = 0;
        if (pet.birthTime > 0) {
            age = block.timestamp - pet.birthTime;
        }

        return PetData({
            name: pet.name,
            species: pet.species,
            rarity: pet.rarity,
            stage: pet.stage,
            birthTime: pet.birthTime,
            lastCaredTime: pet.lastCaredTime,
            happiness: pet.happiness,
            hunger: pet.hunger,
            energy: pet.energy,
            health: pet.health,
            isSick: pet.isSick,
            isSleeping: pet.isSleeping,
            claimed: pet.claimed,
            owner: owner,
            tokenURI: _getTokenURISafe(tokenId),
            age: age
        });
    }

    function _getTokenURISafe(uint256 tokenId) internal view returns (string memory) {
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
        require(_exists(tokenId), "Pet doesn't exist");
        return pets[tokenId].claimed;
    }

    // Required overrides
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
} 