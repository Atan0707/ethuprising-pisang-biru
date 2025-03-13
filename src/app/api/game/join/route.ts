import { NextRequest, NextResponse } from 'next/server';
import { gameStore } from '@/lib/gameStore';

// Join a game with a specific code
export async function POST(request: NextRequest) {
  const { gameCode, playerId, playerName } = await request.json();
  
  // Validate input
  if (!gameCode || !playerId || !playerName) {
    return NextResponse.json({ error: 'Game code, player ID, and name are required' }, { status: 400 });
  }

  console.log('Joining game with code:', gameCode);
  console.log('Available games:', Object.keys(gameStore.games));

  // Find the game with this code
  const game = gameStore.games[gameCode];
  
  if (!game) {
    return NextResponse.json({ error: 'Game not found. Check the code and try again.' }, { status: 404 });
  }
  
  // Check if the game is waiting for players
  if (game.state !== 'waiting') {
    return NextResponse.json({ error: 'Game is not in waiting state' }, { status: 400 });
  }
  
  // Check if player is already in this game
  if (game.players.some(p => p.id === playerId)) {
    const opponent = game.players.find(p => p.id !== playerId);
    
    return NextResponse.json({ 
      gameId: gameCode, 
      state: game.state,
      opponent: opponent ? opponent.name : null 
    }, { status: 200 });
  }
  
  // Add the player to the game
  game.players.push({ id: playerId, name: playerName, gesture: null });
  
  // Update game state if we have two players
  if (game.players.length === 2) {
    game.state = 'active';
  }
  
  game.updatedAt = Date.now();
  
  // Get opponent (if any)
  const opponent = game.players.find(p => p.id !== playerId);
  
  return NextResponse.json({ 
    gameId: gameCode, 
    state: game.state, 
    opponent: opponent ? opponent.name : null
  }, { status: 200 });
} 