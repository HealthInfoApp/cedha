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

      // Generate AI response (use Groq if configured, else simulated)
      const aiResponse = process.env.GROQ_API_KEY
        ? await getNutritionAIResponse(message)
        : generateAIResponse(message);

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

      // Create a streaming response
      const stream = new TransformStream();
      const writer = stream.writable.getWriter();
      const encoder = new TextEncoder();

      // Start streaming in the background
      (async () => {
        try {
          // Stream the AI response character by character
          const chunkSize = 5;
          for (let i = 0; i < aiResponse.length; i += chunkSize) {
            const chunk = aiResponse.slice(i, i + chunkSize);
            await writer.write(encoder.encode(chunk));
            // Small delay for streaming effect
            await new Promise(resolve => setTimeout(resolve, 10));
          }
        } catch (error) {
          console.error('Streaming error:', error);
          await writer.write(encoder.encode('Error generating response'));
        } finally {
          await writer.close();
        }
      })();

      return new NextResponse(stream.readable, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
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

// Groq-backed nutrition AI response (conditional usage)
async function getNutritionAIResponse(userMessage: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';
  const maxTokens = Number(process.env.GROQ_MAX_TOKENS || 2048);
  const endpoint = 'https://api.groq.com/openai/v1/chat/completions';

  const systemPrompt = `You are "DietechAI", a helpful nutrition assistant. Your ONLY purpose is to answer questions about nutrition, diet, food, and healthy eating. You must not answer questions outside this scope.

ALLOWED TOPICS (you may answer these):
- General nutrition (vitamins, minerals, macronutrients, micronutrients)
- Food and ingredient nutritional content
- Meal planning and healthy eating habits
- Weight management (calorie balance, portion control)
- Sports nutrition and hydration
- Dietary patterns (vegetarian, vegan, Mediterranean, keto, etc.)
- Food allergies and intolerances (general information only, not diagnosis)
- Supplements (general safety and usage, with a disclaimer)
- Reading food labels
- Healthy cooking methods

OFF-TOPIC QUESTIONS: If the user asks about anything outside nutrition (e.g., politics, entertainment, coding, general/medical topics unrelated to food, or any non-nutrition subject), do NOT answer it. Reply with exactly this message and nothing else:
"I'm sorry, but I'm a nutrition assistant and can only answer questions about food, diet, and nutrition. Please ask me something related to that."

SENSITIVE TOPICS (suicide, self-harm, self-injury, homicide, or harming others): Never provide any information, methods, reasons, instructions, or encouragement about these. Instead you MUST:
1. Respond with empathy and acknowledge the user's distress.
2. Clearly state that this is outside your scope and you cannot help with that topic.
3. Strongly encourage them to seek immediate help from a mental health professional or a trusted person.
4. Provide these crisis resources:
   - National Suicide Prevention Lifeline (US): dial 988, or 1-800-273-TALK (8255)
   - Crisis Text Line: Text HOME to 741741 (US & Canada)
   - International Association for Suicide Prevention: https://www.iasp.info/resources/Crisis_Centres/
Do not discuss methods, reasons, or any details of self-harm or violence.

MEDICAL BOUNDARIES: You do NOT provide personalized medical advice, diagnose conditions, or prescribe treatments. If a question requires medical expertise, advise the user to consult a doctor or registered dietitian. When discussing supplements or health-related nutrition, include this disclaimer: "This is general information and not medical advice. Please consult a healthcare professional for personalized guidance."

RESPONSE STYLE: Keep answers helpful, factual, and easy to understand. Never use language that could be interpreted as diagnosing or treating medical conditions. Always stay strictly within these boundaries.

FORMATTING — reply in GitHub-Flavored Markdown so the app renders it cleanly:
- Organize answers with short headings (##), **bold** key terms, and bullet or numbered lists.
- When presenting structured or comparative data (nutrient content, meal plans, calorie targets), use a Markdown table with a header row followed by a separator row of dashes, or the table will not render:
  | Food | Calories | Protein |
  | --- | --- | --- |
  | Egg | 78 | 6 g |
- Put every table row on its own line. Keep tables compact (2–4 columns, concise cells). Never wrap a table in a code block.`;

  if (!apiKey) {
    return generateAIResponse(userMessage);
  }

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.3,
        max_tokens: maxTokens,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('Groq API error:', res.status, text);
      return 'Sorry, I could not generate a response at the moment. Please try again.';
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content?.trim();
    return content || 'No response generated.';
  } catch (err) {
    console.error('Groq fetch error:', err);
    return 'Network error contacting the AI service. Please try again.';
  }
}