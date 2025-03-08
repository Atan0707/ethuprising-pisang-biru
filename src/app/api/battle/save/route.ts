import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const battleData = await request.json();
    const filePath = path.join(process.cwd(), 'public', 'battle.json');
    
    // Validate required fields
    if (!battleData.code) {
      return NextResponse.json(
        { error: 'Missing required field: code' },
        { status: 400 }
      );
    }

    // Write the updated data to the file
    await fs.writeFile(filePath, JSON.stringify(battleData, null, 2));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving battle data:', error);
    return NextResponse.json(
      { error: 'Failed to save battle data' },
      { status: 500 }
    );
  }
} 