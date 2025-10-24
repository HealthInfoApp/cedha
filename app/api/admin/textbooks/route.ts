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

    // Get all textbooks
    const [textbooks] = await connection.execute(`
      SELECT t.id, t.title, t.filename, t.file_size, t.upload_date, t.is_processed, t.processed_at,
             u.full_name as uploaded_by_name
      FROM textbooks t
      LEFT JOIN users u ON t.uploaded_by = u.id
      ORDER BY t.upload_date DESC
    `);

    return NextResponse.json({ 
      textbooks 
    });

  } catch (error: any) {
    console.error('Admin textbooks API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}