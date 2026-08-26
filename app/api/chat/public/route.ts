import { NextRequest, NextResponse } from 'next/server';
import connection from '@/lib/db';
import { screenUserMessage } from '@/lib/contentGuard';

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

    // Deterministic safety / scope pre-filter (runs before the model, so
    // crisis and off-topic handling hold even without an API key).
    const guarded = screenUserMessage(message);

    // Generate AI response using Groq (unless the guard already answered)
    const aiResponse = guarded ?? await getNutritionAIResponse(message);
    
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
