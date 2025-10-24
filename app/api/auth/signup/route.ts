import { NextRequest, NextResponse } from 'next/server';
import { userService } from '@/services/userService';
import { generateToken } from '@/lib/auth';
import { initDatabase } from '@/lib/init-db';
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

    // Initialize database if needed
    try {
      await initDatabase();
    } catch (initError) {
      console.error('Database initialization error:', initError);
      // Continue anyway - tables might already exist
    }

    const { fullName, email, password, userType, specialization } = await request.json();

    // Validation
    if (!fullName || !email || !password || !userType) {
      return NextResponse.json(
        { error: 'Missing required fields: fullName, email, password, and userType are required.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    if (!email.includes('@')) {
      return NextResponse.json(
        { error: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    // Check if email already exists
    try {
      if (await userService.isEmailTaken(email)) {
        return NextResponse.json(
          { error: 'Email address is already registered. Please use a different email or login.' },
          { status: 409 }
        );
      }
    } catch (dbError: any) {
      console.error('Database error checking email:', dbError);
      return NextResponse.json(
        { error: 'Service temporarily unavailable. Please try again later.' },
        { status: 503 }
      );
    }

    // Create user
    let user;
    try {
      user = await userService.createUser({
        full_name: fullName,
        email,
        password,
        user_type: userType,
        specialization: specialization || null,
      });
    } catch (createError: any) {
      console.error('User creation error:', createError);
      
      if (createError.code === 'ER_DUP_ENTRY') {
        return NextResponse.json(
          { error: 'Email address is already registered.' },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to create user account. Please try again.' },
        { status: 500 }
      );
    }

    // Generate token
    const token = generateToken(user.id);

    // Return user data (without password) and token
    const response = NextResponse.json(
      { 
        message: 'Account created successfully! Welcome to MediAI.', 
        user,
        token 
      },
      { status: 201 }
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
    console.error('Signup endpoint error:', error);
    
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

    // Handle network errors
    if (error.name === 'FetchError' || error.message?.includes('fetch')) {
      return NextResponse.json(
        { error: 'Network error. Please check your connection and try again.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again later.' },
      { status: 500 }
    );
  }
}