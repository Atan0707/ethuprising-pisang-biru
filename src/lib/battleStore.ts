// Type definitions
interface Pokemon {
    tokenId: string;
    name: string;
    attribute: string;
    level: number;
    hp: number;
    maxHp: number;
    baseDamage: number;
    image?: string;
    owner?: string;
    moves?: Array<{
        name: string;
        damage: number;
        type: string;
    }>;
}

interface Player {
    pokemon: Pokemon | null;
    ready: boolean;
    joined: boolean;
    currentHealth: number;
    gesture: string | null;
}

interface BattleMove {
    player: 'player1' | 'player2';
    moveName: string;
    damage: number;
    timestamp: string;
}

interface Battle {
    id: string;
    code: string;
    status: 'waiting' | 'in_progress' | 'completed';
    createdAt: string;
    pokemon1: Pokemon;
    pokemon2: Pokemon;
    player1: Player;
    player2: Player;
    moves: BattleMove[];
    winner: string | null;
    lastUpdated: string;
}

const BATTLE_STORE_KEY = 'blockmon_battles';

// Initialize battle store
function initBattleStore(): Record<string, Battle> {
    if (typeof window === 'undefined') return {};
    const stored = localStorage.getItem(BATTLE_STORE_KEY);
    return stored ? JSON.parse(stored) as Record<string, Battle> : {};
}

// Save battles to localStorage
function saveBattles(battles: Record<string, Battle>) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(BATTLE_STORE_KEY, JSON.stringify(battles));
}

// Get all battles
export function getAllBattles(): Record<string, Battle> {
    return initBattleStore();
}

// Get a battle by ID or code
export function getBattle(idOrCode: string): Battle | null {
    const battles = initBattleStore();
    // Try direct lookup first
    if (battles[idOrCode]) return battles[idOrCode];
    
    // Look for battle with matching code
    return Object.values(battles).find(battle => battle.code === idOrCode) || null;
}

// Create a new battle
export function createBattle(battleData: { pokemon1: Pokemon; pokemon2: Pokemon }): Battle {
    const battles = initBattleStore();
    
    // Generate a unique 6-digit code
    const battleCode = Math.floor(100000 + Math.random() * 900000).toString();
    const battleId = `battle_${battleCode}`;
    
    const battle: Battle = {
        id: battleId,
        code: battleCode,
        status: 'waiting',
        createdAt: new Date().toISOString(),
        pokemon1: battleData.pokemon1,
        pokemon2: battleData.pokemon2,
        player1: {
            pokemon: null,
            ready: false,
            joined: false,
            currentHealth: 0,
            gesture: null
        },
        player2: {
            pokemon: null,
            ready: false,
            joined: false,
            currentHealth: 0,
            gesture: null
        },
        moves: [],
        winner: null,
        lastUpdated: new Date().toISOString()
    };
    
    battles[battleId] = battle;
    saveBattles(battles);
    
    return battle;
}

// Update a battle
export function updateBattle(battleId: string, updates: Partial<Battle>): Battle | null {
    const battles = initBattleStore();
    const battle = battles[battleId];
    
    if (!battle) return null;
    
    const updatedBattle = {
        ...battle,
        ...updates,
        lastUpdated: new Date().toISOString()
    };
    
    battles[battleId] = updatedBattle;
    saveBattles(battles);
    
    return updatedBattle;
}

// Delete a battle
export function deleteBattle(battleId: string): boolean {
    const battles = initBattleStore();
    if (!battles[battleId]) return false;
    
    delete battles[battleId];
    saveBattles(battles);
    
    return true;
} 