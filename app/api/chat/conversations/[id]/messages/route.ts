import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import connection from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    const { id: conversationId } = await params;

    // Verify user owns this conversation
    const [conversations] = await connection.execute(
      'SELECT user_id FROM chat_conversations WHERE id = ?',
      [conversationId]
    );

    const conversationArray = conversations as any[];
    if (conversationArray.length === 0) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    if (conversationArray[0].user_id !== decoded.userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get messages
    const [messages] = await connection.execute(
      `SELECT id, message, is_user_message, created_at 
       FROM chat_messages 
       WHERE conversation_id = ? 
       ORDER BY created_at ASC`,
      [conversationId]
    );

    return NextResponse.json({ 
      messages 
    });

  } catch (error: any) {
    console.error('Get messages API error:', error);
    return NextResponse.json(
      { error: 'Failed to load messages' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    const { id: conversationId } = await params;
    const { message } = await request.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Verify user owns this conversation
    const [conversations] = await connection.execute(
      'SELECT user_id, title FROM chat_conversations WHERE id = ?',
      [conversationId]
    );

    const conversationArray = conversations as any[];
    if (conversationArray.length === 0) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    if (conversationArray[0].user_id !== decoded.userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Start transaction
    await connection.execute('START TRANSACTION');

    try {
      // Add user message
      await connection.execute(
        `INSERT INTO chat_messages (conversation_id, user_id, message, is_user_message) 
         VALUES (?, ?, ?, TRUE)`,
        [conversationId, decoded.userId, message.trim()]
      );

      // Update conversation title if it's the first message
      const [existingMessages] = await connection.execute(
        'SELECT COUNT(*) as count FROM chat_messages WHERE conversation_id = ?',
        [conversationId]
      );

      const messageCount = (existingMessages as any[])[0].count;
      if (messageCount === 1) {
        // First message - use it as title
        const title = message.trim().substring(0, 50) + (message.length > 50 ? '...' : '');
        await connection.execute(
          'UPDATE chat_conversations SET title = ? WHERE id = ?',
          [title, conversationId]
        );
      }

      // Generate AI response (simulated for now)
      const aiResponse = generateAIResponse(message);

      // Add AI response
      await connection.execute(
        `INSERT INTO chat_messages (conversation_id, user_id, message, is_user_message) 
         VALUES (?, ?, ?, FALSE)`,
        [conversationId, decoded.userId, aiResponse]
      );

      // Update conversation timestamp
      await connection.execute(
        'UPDATE chat_conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [conversationId]
      );

      await connection.execute('COMMIT');

      // Get the newly added messages
      const [newMessages] = await connection.execute(
        `SELECT id, message, is_user_message, created_at 
         FROM chat_messages 
         WHERE conversation_id = ? 
         ORDER BY id DESC LIMIT 2`,
        [conversationId]
      );

      return NextResponse.json({ 
        messages: (newMessages as any[]).reverse() 
      });

    } catch (error) {
      await connection.execute('ROLLBACK');
      throw error;
    }

  } catch (error: any) {
    console.error('Send message API error:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

// Simulated AI response function
function generateAIResponse(userMessage: string): string {
  const responses = [
    "I understand you're asking about medical topics. Based on my knowledge, I can provide general information, but please consult with a healthcare professional for personalized medical advice.",
    
    "That's an interesting medical question. I can help you understand the general concepts, but remember that I'm an AI assistant and not a substitute for professional medical consultation.",
    
    "I'd be happy to discuss medical topics with you. Let me provide some general information that might be helpful for your learning and understanding.",
    
    "Thank you for your medical inquiry. I'll do my best to provide accurate and helpful information based on established medical knowledge.",
    
    "I appreciate your question about healthcare. Let me share some insights that could be useful for your medical education and clinical understanding."
  ];

  // Simple keyword-based response variation
  const lowerMessage = userMessage.toLowerCase();
  if (lowerMessage.includes('symptom') || lowerMessage.includes('diagnosis')) {
    return "I can help you understand symptoms and diagnostic approaches. However, please remember that actual diagnosis requires proper medical evaluation by a qualified healthcare provider.";
  } else if (lowerMessage.includes('drug') || lowerMessage.includes('medication')) {
    return "I can provide general information about medications, but always verify drug information with official sources and consult healthcare professionals for specific medical advice.";
  } else if (lowerMessage.includes('treatment') || lowerMessage.includes('therapy')) {
    return "Treatment approaches vary based on individual circumstances. I can discuss general treatment principles, but specific medical decisions should be made by qualified healthcare providers.";
  }

  return responses[Math.floor(Math.random() * responses.length)];
}