'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

// Dummy Pokémon data for testing
const DUMMY_POKEMON = [
  {
    id: 1,
    name: "Pikachu",
    level: 25,
    hp: 100,
    maxHp: 100,
    type: "Electric",
    image: "/images/pokemon/pika.png",
    owner: "Player 1",
    moves: ["Thunder Shock", "Quick Attack", "Thunderbolt", "Agility"]
  },
  {
    id: 2,
    name: "Charmander",
    level: 20,
    hp: 90,
    maxHp: 90,
    type: "Fire",
    image: "/images/pokemon/charmander.png",
    owner: "Player 2",
    moves: ["Ember", "Scratch", "Flamethrower", "Dragon Breath"]
  }
];

export default function BattleArenaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State for battle
  const [firstPokemon, setFirstPokemon] = useState(DUMMY_POKEMON[0]);
  const [secondPokemon, setSecondPokemon] = useState(DUMMY_POKEMON[1]);
  const [countdown, setCountdown] = useState(3);
  const [battleStarted, setBattleStarted] = useState(false);
  const [currentTurn, setCurrentTurn] = useState(1);
  const [battleLog, setBattleLog] = useState<string[]>([]);
  
  // Start countdown when component mounts
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setBattleStarted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  // Execute a move
  const executeMove = (moveIndex: number) => {
    if (!battleStarted) return;
    
    const attacker = currentTurn === 1 ? firstPokemon : secondPokemon;
    const defender = currentTurn === 1 ? secondPokemon : firstPokemon;
    const move = attacker.moves[moveIndex];
    
    // Calculate random damage between 10-25
    const damage = Math.floor(Math.random() * 16) + 10;
    
    // Update HP
    if (currentTurn === 1) {
      setSecondPokemon(prev => ({
        ...prev,
        hp: Math.max(0, prev.hp - damage)
      }));
    } else {
      setFirstPokemon(prev => ({
        ...prev,
        hp: Math.max(0, prev.hp - damage)
      }));
    }
    
    // Add to battle log
    setBattleLog(prev => [...prev, `${attacker.name} used ${move} and dealt ${damage} damage to ${defender.name}!`]);
    
    // Check if battle ended
    if (defender.hp - damage <= 0) {
      setBattleLog(prev => [...prev, `${defender.name} fainted! ${attacker.name} wins the battle!`]);
      setBattleStarted(false);
    } else {
      // Switch turns
      setCurrentTurn(currentTurn === 1 ? 2 : 1);
    }
  };
  
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-blue-900 to-purple-900">
      {/* Battle arena layout */}
      <div className="container mx-auto px-4 py-8 pt-20">
        <div className="relative flex flex-col items-center">
          {/* Health bars and countdown */}
          <div className="w-full flex justify-between items-center mb-8">
            {/* Player 1 health bar */}
            <div className="w-1/3">
              <div className="bg-gray-700 rounded-full h-6 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-green-500 to-emerald-400 h-full"
                  style={{ width: `${(firstPokemon.hp / firstPokemon.maxHp) * 100}%` }}
                ></div>
              </div>
              <div className="text-white text-center mt-1">
                {firstPokemon.hp}/{firstPokemon.maxHp} HP
              </div>
            </div>
            
            {/* Countdown */}
            <div className="bg-gray-700/80 rounded-full w-24 h-24 flex items-center justify-center">
              {!battleStarted && countdown > 0 ? (
                <div className="text-white text-4xl font-bold">{countdown}</div>
              ) : (
                <div className="text-white text-sm font-bold">
                  {battleStarted ? (
                    `Turn: ${currentTurn === 1 ? firstPokemon.owner : secondPokemon.owner}`
                  ) : (
                    "Battle End"
                  )}
                </div>
              )}
            </div>
            
            {/* Player 2 health bar */}
            <div className="w-1/3">
              <div className="bg-gray-700 rounded-full h-6 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-red-500 to-orange-400 h-full"
                  style={{ width: `${(secondPokemon.hp / secondPokemon.maxHp) * 100}%` }}
                ></div>
              </div>
              <div className="text-white text-center mt-1">
                {secondPokemon.hp}/{secondPokemon.maxHp} HP
              </div>
            </div>
          </div>
          
          {/* Pokémon battle area */}
          <div className="w-full flex justify-between items-center mb-8">
            {/* Player 1 Pokémon */}
            <div className="w-1/3 bg-gray-700/50 rounded-3xl p-6 backdrop-blur-sm">
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-white">{firstPokemon.name}</h3>
                <p className="text-blue-300">Lv. {firstPokemon.level} • {firstPokemon.type}</p>
                <p className="text-xs text-gray-300 mt-1">Owner: {firstPokemon.owner}</p>
              </div>
              
              <div className="w-48 h-48 mx-auto relative bg-gray-800/50 rounded-full mb-4 flex items-center justify-center">
                {firstPokemon.image ? (
                  <div className="w-36 h-36 relative">
                    <Image 
                      src={firstPokemon.image}
                      alt={firstPokemon.name}
                      width={144}
                      height={144}
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <div className="text-gray-400">No Image</div>
                )}
              </div>
              
              {/* Moves for Player 1 */}
              {battleStarted && currentTurn === 1 && (
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {firstPokemon.moves.map((move, index) => (
                    <button 
                      key={index}
                      onClick={() => executeMove(index)}
                      className="py-2 px-3 bg-blue-600/70 hover:bg-blue-700/90 text-white rounded-lg text-sm transition-colors"
                    >
                      {move}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* VS indicator */}
            <div className="text-white text-6xl font-bold opacity-30">VS</div>
            
            {/* Player 2 Pokémon */}
            <div className="w-1/3 bg-gray-700/50 rounded-3xl p-6 backdrop-blur-sm">
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-white">{secondPokemon.name}</h3>
                <p className="text-red-300">Lv. {secondPokemon.level} • {secondPokemon.type}</p>
                <p className="text-xs text-gray-300 mt-1">Owner: {secondPokemon.owner}</p>
              </div>
              
              <div className="w-48 h-48 mx-auto relative bg-gray-800/50 rounded-full mb-4 flex items-center justify-center">
                {secondPokemon.image ? (
                  <div className="w-36 h-36 relative">
                    <Image 
                      src={secondPokemon.image}
                      alt={secondPokemon.name}
                      width={144}
                      height={144}
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <div className="text-gray-400">No Image</div>
                )}
              </div>
              
              {/* Moves for Player 2 */}
              {battleStarted && currentTurn === 2 && (
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {secondPokemon.moves.map((move, index) => (
                    <button 
                      key={index}
                      onClick={() => executeMove(index)}
                      className="py-2 px-3 bg-red-600/70 hover:bg-red-700/90 text-white rounded-lg text-sm transition-colors"
                    >
                      {move}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Battle log */}
          <div className="w-full bg-gray-900/70 rounded-xl p-4 backdrop-blur-sm">
            <h3 className="text-white font-bold mb-2">Battle Log</h3>
            <div 
              id="battle-log"
              className="h-32 overflow-y-auto text-gray-300 text-sm"
            >
              {battleLog.length > 0 ? (
                battleLog.map((log, index) => (
                  <div key={index} className="mb-1 pb-1 border-b border-gray-800">
                    {log}
                  </div>
                ))
              ) : (
                <div className="text-gray-500 italic">Battle will begin shortly...</div>
              )}
            </div>
          </div>
          
          {/* Back button or restart */}
          <div className="mt-6">
            {!battleStarted && countdown === 0 && (
              <div className="flex gap-4">
                <Link 
                  href="/arena"
                  className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Back to Arena
                </Link>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Battle Again
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 