import { NextResponse } from 'next/server';
import { executeReadOnlyQuery } from '@/lib/db-readonly';

// Simple test route to verify the setup
export async function GET() {
  try {
    // Just test if environment variables are accessible
    const hasGroqKey = !!process.env.GROQ_API_KEY;
    const hasDbUrl = !!process.env.READ_ONLY_DATABASE_URL;
    
    return NextResponse.json({
      success: true,
      hasGroqKey,
      hasDbUrl,
      message: "Test endpoint working"
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export async function POST(request: Request) {
  // For now, just return a simple response to test if the route loads
  return NextResponse.json({
    success: true,
    message: "POST route loaded successfully"
  });
}