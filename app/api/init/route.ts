import { NextResponse } from 'next/server';
import { initDatabase } from '@/lib/init-db';

export async function GET() {
  try {
    const result = await initDatabase();
    
    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully',
      ...result
    });
    
  } catch (error: any) {
    console.error('Database initialization endpoint error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Database initialization failed',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}