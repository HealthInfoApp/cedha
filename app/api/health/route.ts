import { NextResponse } from 'next/server';
import { checkDatabaseHealth } from '@/lib/dbHealth';

export async function GET() {
  try {
    const dbHealth = await checkDatabaseHealth();
    
    if (!dbHealth.healthy) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Database connection failed',
          error: dbHealth.error,
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      status: 'ok',
      message: 'All systems operational',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Health check endpoint error:', error);
    
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Health check failed',
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}