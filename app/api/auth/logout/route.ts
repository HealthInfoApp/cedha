import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const response = NextResponse.json(
      { message: 'Logged out successfully.' },
      { status: 200 }
    );

    // Clear the token cookie
    response.cookies.set('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
    });

    return response;

  } catch (error: any) {
    console.error('Logout endpoint error:', error);
    
    return NextResponse.json(
      { error: 'An error occurred during logout. Please try again.' },
      { status: 500 }
    );
  }
}