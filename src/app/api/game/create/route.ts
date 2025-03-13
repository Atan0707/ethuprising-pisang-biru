import { NextRequest, NextResponse } from 'next/server';
import { gameStore } from '@/lib/gameStore';

// Generate a random game code (5 characters)
function generateGameCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed similar looking characters
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Create a game with a specific code
export async function POST(request: NextRequest) {
  const { playerId, playerName } = await request.json();
  
  console.log('Creating game, request body:', { playerId, playerName });
  console.log('Current games before creation:', Object.keys(gameStore.games));
  
  // Validate input
  if (!playerId || !playerName) {
    return NextResponse.json({ error: 'Player ID and name are required' }, { status: 400 });
  }

  // Generate a unique game code
  let gameCode = generateGameCode();
  let attempts = 0;
  
  // Make sure the code is unique (avoid collisions)
  while (Object.keys(gameStore.games).some(id => id === gameCode) && attempts < 10) {
    gameCode = generateGameCode();
    attempts++;
  }
  
  console.log('Generated game code:', gameCode);
  
  // Create the game
  const gameId = gameCode;
  gameStore.games[gameId] = {
    id: gameId,
    players: [
      { id: playerId, name: playerName, gesture: null }
    ],
    state: 'waiting', // Waiting for the second player
    result: null,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  
  // Verify the game was actually created
  console.log('Games after creation:', Object.keys(gameStore.games));
  console.log('New game exists:', gameId in gameStore.games);
  console.log('New game data:', gameStore.games[gameId]);
  
  return NextResponse.json({ 
    gameId, 
    gameCode, 
    state: 'waiting',
    message: 'Game created. Share the code with your opponent.'
  }, { status: 201 });
} 