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

// Create a hosted game (created by a third party)
export async function POST(request: NextRequest) {
  const { hostId, hostName } = await request.json();
  
  console.log('Creating hosted game:', { hostId, hostName });
  console.log('Current games before creation:', Object.keys(gameStore.games));
  
  // Validate input
  if (!hostId || !hostName) {
    return NextResponse.json({ error: 'Host ID and name are required' }, { status: 400 });
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
  
  // Create the game without adding the host as a player
  const gameId = gameCode;
  gameStore.games[gameId] = {
    id: gameId,
    players: [], // Start with no players
    hostId: hostId, // Track the host ID
    hostName: hostName, // Track the host name
    state: 'waiting', // Waiting for players
    result: null,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  
  // Verify the game was actually created
  console.log('Games after creation:', Object.keys(gameStore.games));
  console.log('New game exists:', gameId in gameStore.games);
  
  return NextResponse.json({ 
    gameId, 
    gameCode, 
    state: 'waiting',
    message: 'Game created. Share the code with players.'
  }, { status: 201 });
} 