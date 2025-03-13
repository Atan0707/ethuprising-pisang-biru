// Game state types
export type GameState = 'waiting' | 'active' | 'complete';
export type Gesture = 'rock' | 'paper' | 'scissors' | null;

export interface Player {
  id: string;
  name: string;
  gesture: Gesture;
  createdAt?: number;
}

export interface Game {
  id: string;
  players: Player[];
  state: GameState;
  result: {
    winner: string | null;
    message: string;
  } | null;
  createdAt: number;
  updatedAt: number;
  hostId?: string;   // ID of the third-party host (if any)
  hostName?: string; // Name of the third-party host (if any)
  code?: string;     // Game code for easy reference and joining
  battleData?: {
    pokemon1?: {
      tokenId: string;
      name: string;
      attribute: string;
    };
    pokemon2?: {
      tokenId: string;
      name: string;
      attribute: string;
    };
  };  // Additional data for the battle
}

// Global store for games
// Using global variables in the Node.js process
// In production, you would use Redis or a database

// Define the shape of our global store
interface GameStoreData {
  games: Record<string, Game>;
  waitingPlayers: Player[];
}

// Properly declare the global variable
declare global {
  // eslint-disable-next-line no-var
  var gameStoreData: GameStoreData | undefined;
}

// Initialize the global store if it doesn't exist
if (!global.gameStoreData) {
  global.gameStoreData = {
    games: {},
    waitingPlayers: []
  };
  
  // Set up cleanup job for old games
  setInterval(() => {
    const now = Date.now();
    
    // Clean up old games
    Object.keys(global.gameStoreData!.games).forEach(gameId => {
      if (now - global.gameStoreData!.games[gameId].updatedAt > 30 * 60 * 1000) { // 30 minutes
        delete global.gameStoreData!.games[gameId];
      }
    });
    
    // Clean up waiting players who have been waiting for more than 10 minutes
    while (
      global.gameStoreData!.waitingPlayers.length > 0 && 
      global.gameStoreData!.waitingPlayers[0].createdAt && 
      now - global.gameStoreData!.waitingPlayers[0].createdAt > 10 * 60 * 1000
    ) {
      global.gameStoreData!.waitingPlayers.shift();
    }
    
    console.log('Cleanup job ran. Current games:', Object.keys(global.gameStoreData!.games));
  }, 5 * 60 * 1000); // Run every 5 minutes
}

// Create a class to provide a typed interface to the global store
export class GameStore {
  // Getter for games
  get games(): Record<string, Game> {
    return global.gameStoreData!.games;
  }
  
  // Getter for waitingPlayers
  get waitingPlayers(): Player[] {
    return global.gameStoreData!.waitingPlayers;
  }
  
  // Check if a game exists by ID
  exists(gameId: string): boolean {
    return !!global.gameStoreData!.games[gameId];
  }
  
  // Get a game by ID
  get(gameId: string): Game {
    return global.gameStoreData!.games[gameId];
  }
  
  // Find a game by code (typically the last 6 chars of the gameId in uppercase)
  findByCode(code: string): Game | null {
    console.log(`Looking for game with code: ${code}`);
    
    // First, check for games with the dedicated code property
    const gameWithCode = Object.values(this.games).find(game => game.code === code);
    if (gameWithCode) {
      console.log(`Found game by dedicated code property: ${gameWithCode.id}`);
      return gameWithCode;
    }
    
    // Fall back to the legacy method (checking game IDs)
    const gameIdWithCode = Object.keys(this.games).find(gameId => {
      // Extract the code from gameId (last part after the hyphen)
      const idParts = gameId.split('-');
      const extractedCode = idParts[idParts.length - 1];
      return extractedCode === code;
    });
    
    console.log(`Available games: ${JSON.stringify(Object.keys(this.games))}`);
    
    if (gameIdWithCode) {
      console.log(`Found game by ID with code part: ${gameIdWithCode}`);
      return this.games[gameIdWithCode];
    }
    
    console.log(`No matching game found for code: ${code}`);
    return null;
  }
  
  // Add a player to a game
  addPlayer(gameId: string, player: Omit<Player, 'gesture'>): Game {
    if (!this.exists(gameId)) {
      throw new Error(`Game with ID ${gameId} not found`);
    }
    
    const game = this.get(gameId);
    
    // Create a full player object with gesture set to null
    const fullPlayer: Player = {
      ...player,
      gesture: null
    };
    
    // Add player to the game
    game.players.push(fullPlayer);
    
    // Update game state if we have two players
    if (game.players.length === 2) {
      game.state = 'active';
    }
    
    // Update the timestamp
    game.updatedAt = Date.now();
    
    return game;
  }
}

// Export a singleton instance
export const gameStore = new GameStore(); 