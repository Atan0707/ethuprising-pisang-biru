import { NextResponse } from 'next/server';
import { getActiveListings } from '@/app/utils/marketplace';

export async function GET() {
  try {
    // Fetch all active listings from blockchain/subgraph
    const listings = await getActiveListings();
    
    return NextResponse.json(listings);
  } catch (error) {
    console.error('Error fetching listings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch listings' },
      { status: 500 }
    );
  }
} 