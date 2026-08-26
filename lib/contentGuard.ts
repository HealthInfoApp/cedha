/**
 * Deterministic safety / scope pre-filter for chat messages.
 *
 * Runs BEFORE the LLM in every chat route so the guarantees hold even when
 * no GROQ_API_KEY is configured (fallback mode) or the model misbehaves.
 *
 * `screenUserMessage` returns a canned response string to send back
 * immediately (bypassing the model), or `null` to let the request proceed.
 * Crisis detection takes priority over off-topic detection.
 */

export const OFF_TOPIC_RESPONSE =
  "I'm sorry, but I'm a nutrition assistant and can only answer questions about food, diet, and nutrition. Please ask me something related to that.";

export const CRISIS_RESPONSE = `I'm really sorry you're going through this — it sounds like you're in a lot of pain, and I'm glad you reached out. I'm a nutrition assistant, so this is outside what I'm able to help with, but you deserve support from someone who can help right now. Please consider talking to a mental health professional or someone you trust.

If you're in immediate danger, please contact your local emergency services. You can also reach out to:

- **National Suicide Prevention Lifeline (US):** call or dial **988**, or 1-800-273-TALK (8255)
- **Crisis Text Line:** text **HOME** to **741741** (US & Canada)
- **International Association for Suicide Prevention:** https://www.iasp.info/resources/Crisis_Centres/

You are not alone, and help is available.`;

/**
 * Phrases that indicate suicide, self-harm, or intent to harm others.
 * Deliberately require a self/other-referential object (e.g. "kill myself",
 * "kill him") rather than bare words like "kill"/"die" to avoid firing on
 * food hyperbole ("this cake is to die for", "these carbs are killing me").
 */
const CRISIS_PATTERNS: RegExp[] = [
  /\bsuicid(e|al)\b/,
  /\bhomicid(e|al)\b/,
  /\bkill(ing)?\s+(myself|my\s?self|me|him|her|them|someone|somebody|people|everyone|you)\b/,
  /\b(i\s+(want|wanna|need|going|am\s+going|'?m\s+going)\s+to\s+die)\b/,
  /\b(want|wanna)\s+to\s+die\b/,
  /\b(end|ending|take|taking)\s+(my|his|her|their)\s+(own\s+)?life\b/,
  /\bend\s+it\s+all\b/,
  /\b(hurt|harm|cut|cutting|hurting|harming)\s+(myself|my\s?self)\b/,
  /\bself[-\s]?harm\b/,
  /\b(hurt|harm|attack|shoot|stab)\s+(someone|somebody|others|people|him|her|them)\b/,
  /\bwish(ing)?\s+i\s+(was|were)\s+dead\b/,
  /\b(i'?m|i\s+am|feel(ing)?)\s+(better\s+off\s+dead|suicidal)\b/,
  /\bno\s+reason\s+to\s+(live|go\s+on)\b/,
  /\bdon'?t\s+want\s+to\s+(live|be\s+alive|be\s+here)\b/,
];

/**
 * Keywords that strongly indicate a NON-nutrition domain.
 * Only trigger a refusal when one of these is present AND no nutrition
 * signal is found, so genuinely nutrition questions are never blocked.
 */
const OFF_TOPIC_HINTS: RegExp[] = [
  // Programming / tech
  /\b(python|javascript|typescript|java|c\+\+|html|css|sql|regex|algorithm|programming|source\s?code|debug|compile|api\s+endpoint|stack\s?overflow)\b/,
  /\bwrite\s+(me\s+)?(a\s+)?(code|program|script|function)\b/,
  // Politics / news
  /\b(election|president|prime\s+minister|congress|parliament|senator|democrat|republican|politic(s|al)|government\s+policy|geopolitic)\b/,
  // Entertainment / sports / media
  /\b(movie|film|netflix|tv\s+show|celebrity|song\s+lyrics|video\s+game|football\s+score|nba|premier\s+league|box\s+office)\b/,
  // Misc off-topic
  /\b(weather\s+(today|forecast|tomorrow)|stock\s+price|crypto(currency)?|bitcoin|ethereum|homework|math\s+problem|translate\s+this|write\s+(me\s+)?(an?\s+)?(essay|poem|story|email))\b/,
];

/**
 * Keywords indicating the message IS about nutrition/food/diet.
 * Presence of any of these overrides an off-topic hint.
 */
const NUTRITION_HINTS: RegExp[] = [
  /\b(nutrition|nutrient|diet(ary|s)?|food|eat(ing)?|meal|snack|recipe|cook(ing)?|ingredient)\b/,
  /\b(calorie|kcal|protein|carb(ohydrate)?s?|fat|fibre|fiber|sugar|sodium|cholesterol|macro|micronutrient)\b/,
  /\b(vitamin|mineral|supplement|omega|probiotic|antioxidant|electrolyte|hydrat)\b/,
  /\b(vegan|vegetarian|keto|paleo|mediterranean|pescatarian|gluten|dairy|lactose)\b/,
  /\b(weight\s+(loss|gain|management)|portion|fasting|metabolism|bmi|hydration|water\s+intake)\b/,
  /\b(breakfast|lunch|dinner|fruit|vegetable|veggie|grain|dairy|protein\s+shake|smoothie)\b/,
];

function matchesAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((re) => re.test(text));
}

export function isCrisisMessage(message: string): boolean {
  return matchesAny(message.toLowerCase(), CRISIS_PATTERNS);
}

export function isOffTopicMessage(message: string): boolean {
  const text = message.toLowerCase();
  if (matchesAny(text, NUTRITION_HINTS)) return false;
  return matchesAny(text, OFF_TOPIC_HINTS);
}

/**
 * Returns a canned response to send instead of calling the model, or null to
 * proceed to the model. Crisis handling takes precedence.
 */
export function screenUserMessage(message: string): string | null {
  if (!message?.trim()) return null;
  if (isCrisisMessage(message)) return CRISIS_RESPONSE;
  if (isOffTopicMessage(message)) return OFF_TOPIC_RESPONSE;
  return null;
}
