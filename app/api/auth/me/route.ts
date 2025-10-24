import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { userService } from '@/services/userService';
import { checkDatabaseHealth } from '@/lib/dbHealth';

export async function GET(request: NextRequest) {
  try {
    // Check database health first
    const dbHealth = await checkDatabaseHealth();
    if (!dbHealth.healthy) {
      return NextResponse.json(
        { error: 'Database connection unavailable.' },
        { status: 503 }
      );
    }

    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated. Please login again.' },
        { status: 401 }
      );
    }

    // Verify token
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (jwtError: any) {
      console.error('JWT verification error:', jwtError);
      
      // Clear invalid token
      const response = NextResponse.json(
        { error: 'Invalid or expired session. Please login again.' },
        { status: 401 }
      );
      
      response.cookies.set('token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 0,
      });

      return response;
    }

    // Get user data
    let user;
    try {
      user = await userService.getUserById(decoded.userId);
    } catch (dbError: any) {
      console.error('Database error fetching user:', dbError);
      return NextResponse.json(
        { error: 'Service temporarily unavailable.' },
        { status: 503 }
      );
    }

    if (!user) {
      // Clear token if user not found
      const response = NextResponse.json(
        { error: 'User account not found.' },
        { status: 404 }
      );
      
      response.cookies.set('token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 0,
      });

      return response;
    }

    return NextResponse.json({ user }, { status: 200 });

  } catch (error: any) {
    console.error('Get user endpoint error:', error);
    
    // Handle specific errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return NextResponse.json(
        { error: 'Database connection failed.' },
        { status: 503 }
      );
    }

    // Clear token on any unexpected error
    const response = NextResponse.json(
      { error: 'An unexpected error occurred. Please login again.' },
      { status: 500 }
    );
    
    response.cookies.set('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
    });

    return response;
  }
}