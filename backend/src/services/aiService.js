import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Models to try in order of preference (fallback chain)
const MODELS = [
    'openai/gpt-oss-20b',
    'openai/gpt-oss-120b',
    'qwen/qwen3.8-27b'
];

/**
 * Extracts booking details from the chat or responds conversationally.
 * @param {Array} messages - Chat history in the format { role: "user"|"assistant", content: "..." }
 * @param {Array} bookedSlots - List of existing booked slots [{ scheduled_at, service_name }]
 * @param {String} userTimezoneOffset - Optional timezone offset like '+05:00'
 * @param {Object} businessInfo - Optional business context { id, name, services: [...] }
 */
const processChatWithAI = async (messages, bookedSlots = [], userTimezoneOffset = null, businessInfo = null) => {
    const now = new Date();
    const businessName = businessInfo?.name || 'our booking concierge';
    const servicesList = businessInfo?.services && businessInfo.services.length > 0
        ? businessInfo.services.map(s => `- ${s.name} (${s.duration || 45} mins): ${s.desc || ''}`).join('\n')
        : '- General Consultation (45 mins)';
    
    // Determine timezone offset string, e.g. "+05:00"
    let tzOffset = userTimezoneOffset;
    if (!tzOffset) {
        const offsetMinutes = -now.getTimezoneOffset();
        const sign = offsetMinutes >= 0 ? '+' : '-';
        const pad = (n) => String(Math.floor(Math.abs(n))).padStart(2, '0');
        tzOffset = `${sign}${pad(offsetMinutes / 60)}:${pad(offsetMinutes % 60)}`;
    }

    // Generate explicit 14-day calendar for date reasoning
    const calendarLines = [];
    for (let i = 0; i <= 14; i++) {
        const d = new Date(now.getTime() + i * 86400000);
        const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;
        let label = '';
        if (i === 0) label = ' (TODAY)';
        else if (i === 1) label = ' (TOMORROW)';
        else if (i <= 7 && dayName === 'Monday') label = ' (Upcoming Monday)';
        else if (i > 7 && dayName === 'Monday') label = ' (Monday Next Week)';
        calendarLines.push(`- ${dayName}${label}: ${dateStr}`);
    }
    const calendarText = calendarLines.join('\n');

    let bookedNotice = '';
    if (bookedSlots && bookedSlots.length > 0) {
        const slotsStr = bookedSlots.map(s => {
            const d = new Date(s.scheduled_at);
            return `${d.toISOString()} (${d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })})`;
        }).join(', ');
        bookedNotice = `\nCRITICAL - THE FOLLOWING DATES/TIMES ARE ALREADY BOOKED AND UNAVAILABLE FOR THIS BUSINESS: ${slotsStr}.
If the user requests an appointment on or near any of these booked dates/times, DO NOT output a BOOK_APPOINTMENT JSON. Instead, inform the user: "That date is already booked for ${businessName}. Please select another date." and suggest choosing a different time or date.`;
    }

    // System prompt with explicit calendar reasoning, business context, & timezone awareness
    const systemPrompt = {
        role: 'system',
        content: `You are an AI assistant for "${businessName}". Your goal is to help users schedule appointments specifically for this business.

Services offered by ${businessName}:
${servicesList}

=== CURRENT REFERENCE CALENDAR ===
Today's Date: ${calendarLines[0]}
User's Local Timezone Offset: ${tzOffset}

Upcoming 14 Days Reference:
${calendarText}

CRITICAL DATE REASONING RULES:
1. When user asks for a day like 'Monday', 'next Monday', 'tomorrow', 'Friday', use the Reference Calendar above to pick the exact YYYY-MM-DD date.
2. For example, if today is Saturday 2026-10-03, 'next Monday' or 'Monday' refers to the upcoming Monday: 2026-10-05.
3. When user specifies a time (e.g. 2:00 PM = 14:00, 10:00 AM = 10:00), schedule it using the user's timezone offset:
   Format: YYYY-MM-DDTHH:mm:ss${tzOffset}
   Example: For 2:00 PM on 2026-10-05, use: "2026-10-05T14:00:00${tzOffset}"
   DO NOT convert 2:00 PM to UTC manually and DO NOT output Z. Always keep the user's local hour (14:00) with their offset ${tzOffset}.
${bookedNotice}

If the user provides all necessary details (service name, date, time) AND the slot is NOT already booked:
Reply ONLY with a raw JSON object in this format:
{
  "action": "BOOK_APPOINTMENT",
  "service_name": "...",
  "business_id": "${businessInfo?.id || ''}",
  "scheduled_at": "YYYY-MM-DDTHH:mm:ss${tzOffset}",
  "message": "I have scheduled your [service name] at ${businessName} for [Day of week, Date at Time]."
}

If details are missing, or if the requested date is already booked:
Reply conversationally in plain text to ask for missing details or tell them to select another date.
DO NOT return JSON if you are asking for details or if the date is booked. Return plain text.`
    };

    const aiMessages = [systemPrompt, ...messages];

    // Try each model in the fallback chain
    for (const model of MODELS) {
        const startTime = Date.now();
        try {
            console.log(`[AI] Processing chat with model: ${model}`);
            const chatCompletion = await groq.chat.completions.create({
                messages: aiMessages,
                model: model,
                temperature: 0.1,
            });

            const latencyMs = Date.now() - startTime;
            console.log(`[AI] Success with model: ${model} in ${latencyMs}ms`);
            return {
                content: chatCompletion.choices[0]?.message?.content || "",
                model: model,
                latencyMs: latencyMs
            };
        } catch (error) {
            console.error(`[AI] Groq Error with model ${model}:`, error.message);
            if (model === MODELS[MODELS.length - 1]) {
                throw new Error('AI processing failed - all models unavailable');
            }
            console.log(`[AI] Falling back to next model...`);
        }
    }
};

export { processChatWithAI };
