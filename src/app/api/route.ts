import { NextRequest, NextResponse } from 'next/server';

// GET handler
export async function GET(request: NextRequest) {
  // Get query parameters
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('query');
  
  // Your logic to fetch data
  const data = { message: 'This is GET data', query };
  
  // Return response
  return NextResponse.json(data);
}

// POST handler
export async function POST(request: NextRequest) {
  // Get request body
  const body = await request.json();
  
  // Your logic to process the data
  const result = { message: 'Data received successfully', data: body };
  
  // Return response
  return NextResponse.json(result, { status: 201 });
}