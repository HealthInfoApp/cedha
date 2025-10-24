import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import connection from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = verifyToken(token);

    // Get user's conversations
    const [conversations] = await connection.execute(
      `SELECT id, title, created_at, updated_at 
       FROM chat_conversations 
       WHERE user_id = ? 
       ORDER BY updated_at DESC`,
      [decoded.userId]
    );

    return NextResponse.json({ 
      conversations 
    });

  } catch (error: any) {
    console.error('Get conversations API error:', error);
    return NextResponse.json(
      { error: 'Failed to load conversations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    const { title } = await request.json();

    // Create new conversation
    const [result] = await connection.execute(
      `INSERT INTO chat_conversations (user_id, title) 
       VALUES (?, ?)`,
      [decoded.userId, title || 'New Chat']
    );

    const [newConversation] = await connection.execute(
      `SELECT id, title, created_at, updated_at 
       FROM chat_conversations 
       WHERE id = ?`,
      [(result as any).insertId]
    );

    return NextResponse.json({ 
      conversation: (newConversation as any[])[0] 
    });

  } catch (error: any) {
    console.error('Create conversation API error:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}