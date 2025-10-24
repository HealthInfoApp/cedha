import { NextRequest, NextResponse } from 'next/server';
import { userService } from '@/services/userService';
import { generateToken } from '@/lib/auth';
import { checkDatabaseHealth } from '@/lib/dbHealth';

export async function POST(request: NextRequest) {
  try {
    // Check database health first
    const dbHealth = await checkDatabaseHealth();
    if (!dbHealth.healthy) {
      return NextResponse.json(
        { error: 'Database connection unavailable. Please try again later.' },
        { status: 503 }
      );
    }

    const { email, password } = await request.json();

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    if (!email.includes('@')) {
      return NextResponse.json(
        { error: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    // Verify credentials
    let user;
    try {
      user = await userService.verifyUserCredentials(email, password);
    } catch (dbError: any) {
      console.error('Database error during login:', dbError);
      return NextResponse.json(
        { error: 'Service temporarily unavailable. Please try again later.' },
        { status: 503 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password. Please check your credentials and try again.' },
        { status: 401 }
      );
    }

    // Generate token
    const token = generateToken(user.id);

    // Get user data without password
    let userData;
    try {
      userData = await userService.getUserById(user.id);
    } catch (dbError: any) {
      console.error('Database error fetching user data:', dbError);
      return NextResponse.json(
        { error: 'Service temporarily unavailable. Please try again later.' },
        { status: 503 }
      );
    }

    if (!userData) {
      return NextResponse.json(
        { error: 'User account not found.' },
        { status: 404 }
      );
    }

    const response = NextResponse.json(
      { 
        message: 'Login successful! Welcome back.', 
        user: userData,
        token 
      },
      { status: 200 }
    );

    // Set HTTP-only cookie
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;

  } catch (error: any) {
    console.error('Login endpoint error:', error);
    
    // Handle specific database errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return NextResponse.json(
        { error: 'Database connection failed. Please try again later.' },
        { status: 503 }
      );
    }
    
    if (error.code === 'ETIMEDOUT') {
      return NextResponse.json(
        { error: 'Database connection timeout. Please try again.' },
        { status: 503 }
      );
    }

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid request format.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again later.' },
      { status: 500 }
    );
  }
}