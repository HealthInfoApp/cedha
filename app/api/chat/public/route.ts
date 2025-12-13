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
    
    // Create a transform stream for streaming the response
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    const encoder = new TextEncoder();
    
    // Start processing in the background
    (async () => {
      try {
        // Simulate AI processing with streaming
        const aiResponse = await generateAIResponse(message);
        
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

// Simulated AI response function
async function generateAIResponse(userMessage: string): Promise<string> {
  // In a real implementation, this would call an AI service
  // For now, we'll simulate a response based on the user's message
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
  
  // Return a response based on the message count to provide variety
  const randomIndex = Math.floor(Math.random() * responses.length);
  return responses[randomIndex];
}
