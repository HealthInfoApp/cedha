import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import connection from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    
    // Check if user is admin
    const [users] = await connection.execute(
      'SELECT user_type FROM users WHERE id = ?',
      [decoded.userId]
    );

    const userArray = users as any[];
    if (userArray.length === 0 || userArray[0].user_type !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get all users
    const [allUsers] = await connection.execute(`
      SELECT id, email, full_name, user_type, specialization, phone_number, is_active, created_at
      FROM users 
      ORDER BY created_at DESC
    `);

    return NextResponse.json({ 
      users: allUsers 
    });

  } catch (error: any) {
    console.error('Admin users API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Verify admin access
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    
    // Check if user is admin
    const [users] = await connection.execute(
      'SELECT user_type FROM users WHERE id = ?',
      [decoded.userId]
    );

    const userArray = users as any[];
    if (userArray.length === 0 || userArray[0].user_type !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { userId, isActive } = await request.json();

    if (!userId || typeof isActive !== 'boolean') {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Update user status
    await connection.execute(
      'UPDATE users SET is_active = ? WHERE id = ?',
      [isActive, userId]
    );

    return NextResponse.json({ 
      message: 'User status updated successfully' 
    });

  } catch (error: any) {
    console.error('Admin update user API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}