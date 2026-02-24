import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Log request metadata
  console.log(`Request received: ${request.method} ${request.url}`);

  // Return welcome message
  return NextResponse.json({
    message: 'Welcome to the API Service!'
  });
}
