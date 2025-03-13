import { NextRequest, NextResponse } from 'next/server';
import { gameStore } from '@/lib/gameStore';

export async function POST(request: NextRequest) {
  const { gameId, playerId, gesture } = await request.json();
  
  // Validate input
  if (!gameId || !playerId || !gesture) {
    return NextResponse.json({ error: 'Game ID, player ID, and gesture are required' }, { status: 400 });
  }
  
  // Validate gesture
  if (!['rock', 'paper', 'scissors'].includes(gesture)) {
    return NextResponse.json({ error: 'Invalid gesture' }, { status: 400 });
  }
  
  // Get game
  const game = gameStore.games[gameId];
  if (!game) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 });
  }
  
  // Check if game is active
  if (game.state !== 'active') {
    return NextResponse.json({ error: 'Game is not active' }, { status: 400 });
  }
  
  // Check if player is in the game
  const playerIndex = game.players.findIndex(p => p.id === playerId);
  if (playerIndex === -1) {
    return NextResponse.json({ error: 'Player not in this game' }, { status: 403 });
  }
  
  // Update player's gesture
  game.players[playerIndex].gesture = gesture;
  game.updatedAt = Date.now();
  
  // Check if both players have submitted gestures
  if (game.players.every(p => p.gesture)) {
    // Determine winner
    const player1 = game.players[0];
    const player2 = game.players[1];
    
    let winnerId = null;
    let message = '';
    
    if (player1.gesture === player2.gesture) {
      message = "It's a tie!";
    } else if (
      (player1.gesture === 'rock' && player2.gesture === 'scissors') ||
      (player1.gesture === 'paper' && player2.gesture === 'rock') ||
      (player1.gesture === 'scissors' && player2.gesture === 'paper')
    ) {
      winnerId = player1.id;
      message = `${player1.name} wins!`;
    } else {
      winnerId = player2.id;
      message = `${player2.name} wins!`;
    }
    
    // Update game state
    game.state = 'complete';
    game.result = {
      winner: winnerId,
      message
    };
  }
  
  return NextResponse.json({ 
    success: true, 
    gameComplete: game.state === 'complete',
    result: game.result
  }, { status: 200 });
} 