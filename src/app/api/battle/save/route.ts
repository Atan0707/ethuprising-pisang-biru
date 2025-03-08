import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const battleData = await request.json();
    console.log("Received battle data:", battleData);
    
    const filePath = path.join(process.cwd(), 'public', 'battle.json');
    console.log("Writing to file:", filePath);
    
    // Write the updated data to the file
    await fs.writeFile(filePath, JSON.stringify(battleData, null, 2));
    
    // Verify the file was written by reading it back
    const verifyData = await fs.readFile(filePath, 'utf8');
    console.log("Verification - File contents after write:", verifyData);
    
    return NextResponse.json({ 
      success: true,
      savedData: JSON.parse(verifyData) // Send back the saved data
    });
  } catch (error) {
    console.error('Error saving battle data:', error);
    return NextResponse.json(
      { error: 'Failed to save battle data'},
      { status: 500 }
    );
  }
}