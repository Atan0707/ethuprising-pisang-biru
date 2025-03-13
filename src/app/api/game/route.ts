import { NextRequest, NextResponse } from 'next/server';
import { gameStore } from '@/lib/gameStore';

// Get game status
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const gameId = searchParams.get('gameId');
  const playerId = searchParams.get('playerId');
  
  console.log('GET game status', { gameId, playerId });
  console.log('Available games:', Object.keys(gameStore.games));
  
  // If we have a game ID, check that specific game
  if (gameId && playerId) {
    // Get game
    const game = gameStore.games[gameId];
    if (!game) {
      return NextResponse.json({ error: 'Game not found', gameId }, { status: 404 });
    }
    
    // Check if player is in the game
    const playerIndex = game.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) {
      return NextResponse.json({ error: 'Player not in this game' }, { status: 403 });
    }
    
    // Get opponent
    const opponentIndex = playerIndex === 0 ? 1 : 0;
    const opponent = game.players[opponentIndex];
    
    // Prepare response (hide opponent's gesture if game is active)
    const response = {
      gameId: game.id,
      state: game.state,
      opponent: {
        name: opponent ? opponent.name : null,
        gesture: game.state === 'complete' && opponent ? opponent.gesture : null
      },
      result: game.result
    };
    
    return NextResponse.json(response, { status: 200 });
  }
  
  // Check for waiting status in random matchmaking
  if (!gameId && playerId) {
    const isWaiting = gameStore.waitingPlayers.some(p => p.id === playerId);
    if (isWaiting) {
      return NextResponse.json({ state: 'waiting' }, { status: 200 });
    } else {
      // Check if the player is already in a game
      const existingGameId = Object.keys(gameStore.games).find(gId => 
        gameStore.games[gId].players.some(p => p.id === playerId) && 
        gameStore.games[gId].state !== 'complete'
      );
      
      if (existingGameId) {
        const game = gameStore.games[existingGameId];
        const playerIndex = game.players.findIndex(p => p.id === playerId);
        const opponentIndex = playerIndex === 0 ? 1 : 0;
        
        // If the game has two players
        if (game.players.length > 1) {
          const opponent = game.players[opponentIndex];
          
          return NextResponse.json({
            gameId: existingGameId,
            state: game.state,
            opponent: {
              name: opponent.name,
              gesture: game.state === 'complete' ? opponent.gesture : null
            },
            result: game.result
          }, { status: 200 });
        } else {
          return NextResponse.json({
            gameId: existingGameId,
            state: 'waiting'
          }, { status: 200 });
        }
      }
      
      return NextResponse.json({ error: 'Player not in waiting list' }, { status: 404 });
    }
  }
  
  // If we don't have either a game ID or a player ID
  return NextResponse.json({ error: 'Game ID or player ID is required' }, { status: 400 });
}

// Create or join a game
export async function POST(request: NextRequest) {
  const { playerId, playerName } = await request.json();
  
  // Validate input
  if (!playerId || !playerName) {
    return NextResponse.json({ error: 'Player ID and name are required' }, { status: 400 });
  }

  // Check if player is already in a game
  const existingGameId = Object.keys(gameStore.games).find(gameId => 
    gameStore.games[gameId].players.some(p => p.id === playerId) && 
    gameStore.games[gameId].state !== 'complete'
  );

  if (existingGameId) {
    return NextResponse.json({ gameId: existingGameId }, { status: 200 });
  }

  // Look for waiting players
  if (gameStore.waitingPlayers.length > 0 && !gameStore.waitingPlayers.some(p => p.id === playerId)) {
    const opponent = gameStore.waitingPlayers.shift()!;
    
    // Create a new game
    const gameId = `game_${Date.now()}`;
    gameStore.games[gameId] = {
      id: gameId,
      players: [
        opponent,
        { id: playerId, name: playerName, gesture: null }
      ],
      state: 'active',
      result: null,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    console.log('Created game via random matchmaking:', gameId);
    console.log('Current games:', Object.keys(gameStore.games));
    
    return NextResponse.json({ gameId, state: 'active', opponent: opponent.name }, { status: 201 });
  } else {
    // Add player to waiting list
    const existingPlayerIndex = gameStore.waitingPlayers.findIndex(p => p.id === playerId);
    if (existingPlayerIndex >= 0) {
      gameStore.waitingPlayers[existingPlayerIndex] = { id: playerId, name: playerName, gesture: null, createdAt: Date.now() };
    } else {
      gameStore.waitingPlayers.push({ id: playerId, name: playerName, gesture: null, createdAt: Date.now() });
    }
    
    return NextResponse.json({ state: 'waiting' }, { status: 200 });
  }
} 