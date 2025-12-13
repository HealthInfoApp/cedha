import { NextRequest, NextResponse } from 'next/server';
import connection from '@/lib/db';

// In-memory store for demo purposes
// In production, consider using a proper caching solution like Redis
const messageCounts = new Map<string, { count: number; lastReset: number }>();
const MESSAGE_LIMIT = 5;
const RESET_HOURS = 24;

// Reset counts every 24 hours
function resetOldCounts() {
  const now = Date.now();
  const oneDayAgo = now - RESET_HOURS * 60 * 60 * 1000;
  
  for (const [key, value] of messageCounts.entries()) {
    if (value.lastReset < oneDayAgo) {
      messageCounts.delete(key);
    }
  }
}

// Run cleanup every hour
setInterval(resetOldCounts, 60 * 60 * 1000);

// Groq-backed nutrition AI response
async function getNutritionAIResponse(userMessage: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
  const maxTokens = Number(process.env.GROQ_MAX_TOKENS || 2048);
  const endpoint = 'https://api.groq.com/openai/v1/chat/completions';

  const systemPrompt = `You are DietechAI, a clinical nutrition and personalized medicine assistant.
Provide concise, evidence-based guidance for:
- Medical nutrition therapy (eg, T2DM, CKD, CVD, obesity, oncology)
- Energy/protein needs, macro/micronutrients, and meal planning
- Diet–drug and nutrient interactions and monitoring
Always include safety notes and contraindications when relevant. Keep responses factual and succinct.`;

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
    return 'Network error contacting AI service. Please try again.';
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    
    // Initialize or get count for this IP
    if (!messageCounts.has(ip)) {
      messageCounts.set(ip, { count: 0, lastReset: Date.now() });
    }
    
    const ipData = messageCounts.get(ip)!;
    
    // Check message limit
    if (ipData.count >= MESSAGE_LIMIT) {
      return NextResponse.json(
        { error: 'Message limit reached. Please login to continue.' },
        { status: 429 }
      );
    }
    
    // Increment message count
    ipData.count += 1;
    
    // Generate AI response using Groq
    const aiResponse = await getNutritionAIResponse(message);
    
    // Create a transform stream for streaming response
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    const encoder = new TextEncoder();
    
    // Start processing in background
    (async () => {
      try {
        // Stream the response in chunks
        const chunkSize = 5;
        for (let i = 0; i < aiResponse.length; i += chunkSize) {
          const chunk = aiResponse.slice(i, i + chunkSize);
          await writer.write(encoder.encode(chunk));
          // Add a small delay between chunks for streaming effect
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      } catch (error) {
        console.error('Error generating AI response:', error);
        await writer.write(encoder.encode('Sorry, I encountered an error. Please try again.'));
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
    console.error('Public chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}

// Simulated AI response function (fallback)
async function generateAIResponse(userMessage: string): Promise<string> {
  // In a real implementation, this would call an AI service
  // For now, we'll simulate a response based on user's message
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing time
  
  const responses = [
    "I'm an AI assistant here to help with your nutrition and health questions. " +
    "For personalized advice, consider creating an account to chat with our certified nutritionists.",
    
    "That's an interesting question! While I can provide general information, " +
    "for personalized nutrition advice, I recommend signing up for a free account.",
    
    "Thanks for your question! I can help with general nutrition information. " +
    "For more detailed, personalized advice, you might want to create an account.",
    
    "I'd be happy to help with that! Keep in mind that I can only provide general information. " +
    "For personalized nutrition advice, please consider signing up for an account.",
    
    "Great question! I can provide some general guidance on this topic. " +
    "Would you like me to share some resources or would you prefer to sign up for more personalized advice?"
  ];
  
  // Return a response based on message count to provide variety
  const randomIndex = Math.floor(Math.random() * responses.length);
  return responses[randomIndex];
}
