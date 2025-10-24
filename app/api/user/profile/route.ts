import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import connection from '@/lib/db';

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    const { full_name, phone_number, specialization } = await request.json();

    if (!full_name?.trim()) {
      return NextResponse.json({ error: 'Full name is required' }, { status: 400 });
    }

    // Update user profile
    await connection.execute(
      `UPDATE users 
       SET full_name = ?, phone_number = ?, specialization = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [full_name.trim(), phone_number?.trim() || null, specialization?.trim() || null, decoded.userId]
    );

    // Get updated user data
    const [users] = await connection.execute(
      `SELECT id, email, full_name, user_type, specialization, phone_number, profile_image, created_at 
       FROM users 
       WHERE id = ?`,
      [decoded.userId]
    );

    const user = (users as any[])[0];

    return NextResponse.json({ 
      message: 'Profile updated successfully',
      user 
    });

  } catch (error: any) {
    console.error('Update profile API error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}