import { NextResponse } from 'next/server';

// Mock data for listings - will be replaced with actual contract calls
const MOCK_LISTINGS = [
  {
    id: 1,
    name: 'Fire Blockmon',
    image: '/blockmon/fire.png',
    price: '0.05',
    seller: '0x1234...5678',
    attribute: 'FIRE',
    rarity: 'RARE',
    level: 5,
    description: 'A powerful fire-type Blockmon with exceptional attack capabilities. This rare creature has been trained to level 5 and is ready for battle.',
    stats: {
      hp: 120,
      attack: 85,
      defense: 60,
      speed: 75
    },
    history: [
      { event: 'Minted', date: '2023-12-15', by: '0x1234...5678' },
      { event: 'Battle Won', date: '2023-12-20', against: 'Water Blockmon' },
      { event: 'Listed', date: '2023-12-25', price: '0.05 ETH' }
    ]
  },
  {
    id: 2,
    name: 'Water Blockmon',
    image: '/blockmon/water.png',
    price: '0.08',
    seller: '0x8765...4321',
    attribute: 'WATER',
    rarity: 'UNCOMMON',
    level: 3,
    description: 'A versatile water-type Blockmon with balanced stats. This uncommon creature excels in defensive battles and has great potential for growth.',
    stats: {
      hp: 100,
      attack: 65,
      defense: 80,
      speed: 60
    },
    history: [
      { event: 'Minted', date: '2023-12-10', by: '0x8765...4321' },
      { event: 'Battle Lost', date: '2023-12-20', against: 'Fire Blockmon' },
      { event: 'Listed', date: '2023-12-22', price: '0.08 ETH' }
    ]
  },
  {
    id: 3,
    name: 'Plant Blockmon',
    image: '/blockmon/plant.jpg',
    price: '0.12',
    seller: '0x5678...1234',
    attribute: 'PLANT',
    rarity: 'EPIC',
    level: 7,
    description: 'An exceptional plant-type Blockmon with impressive stats across the board. This epic creature has been carefully trained to level 7 and has a proven battle record.',
    stats: {
      hp: 150,
      attack: 90,
      defense: 85,
      speed: 70
    },
    history: [
      { event: 'Minted', date: '2023-12-05', by: '0x5678...1234' },
      { event: 'Battle Won', date: '2023-12-12', against: 'Electric Blockmon' },
      { event: 'Battle Won', date: '2023-12-18', against: 'Earth Blockmon' },
      { event: 'Listed', date: '2023-12-20', price: '0.12 ETH' }
    ]
  }
];

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = parseInt((await params).id);
    
    // In a real implementation, this would fetch data from the blockchain
    // For now, we'll use mock data
    const listing = MOCK_LISTINGS.find(item => item.id === id);
    
    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(listing);
  } catch (error) {
    console.error('Error fetching listing:', error);
    return NextResponse.json(
      { error: 'Failed to fetch listing' },
      { status: 500 }
    );
  }
} 