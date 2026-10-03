import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import db from './db/index.js';
import { processChatWithAI } from './services/aiService.js';
import { BUSINESS_SERVICES_MAP } from './controllers/businessController.js';

let io;

export const init = (server) => {
    io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    // Middleware for socket authentication
    io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    if (!token) {
        return next(new Error('Authentication error'));
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return next(new Error('Authentication error'));
        socket.user = decoded;
        next();
    });
});

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.id}`);

    socket.on('sendMessage', async (data, callback) => {
        try {
            const { session_id, message, tz_offset, business_id } = data;
            const user_id = socket.user.id;
            
            // Default to selected business_id, user's business_id, or primary seeded business
            const activeBusinessId = business_id || socket.user.business_id || 'b1111111-1111-1111-1111-111111111111';

            if (!message) return;
            console.log(`[Socket] Message from ${user_id}: "${message}" for business: ${activeBusinessId}`);

            // Fetch business info for multi-tenancy
            let businessInfo = { id: activeBusinessId, name: 'Acme Dental Clinic', services: [] };
            try {
                const bRes = await db.query('SELECT * FROM businesses WHERE id = $1', [activeBusinessId]);
                if (bRes.rows.length > 0) {
                    const b = bRes.rows[0];
                    const meta = BUSINESS_SERVICES_MAP[b.id] || {};
                    businessInfo = { id: b.id, name: b.name, services: meta.services || [] };
                }
            } catch (bErr) {
                console.warn("[Socket] Error fetching business details:", bErr.message);
            }

            let sessionId = session_id;
            let messagesArray = [];

            if (sessionId) {
                const sessionRes = await db.query('SELECT messages FROM chat_sessions WHERE id = $1 AND user_id = $2', [sessionId, user_id]);
                if (sessionRes.rows.length === 0) {
                    if(callback) callback({ error: 'Session not found' });
                    return;
                }
                messagesArray = sessionRes.rows[0].messages || [];
            } else {
                const newSession = await db.query(
                    'INSERT INTO chat_sessions (user_id, business_id, title, messages) VALUES ($1, $2, $3, $4) RETURNING id',
                    [user_id, activeBusinessId, `${businessInfo.name} Booking`, JSON.stringify([])]
                );
                sessionId = newSession.rows[0].id;
            }

            // Add user message
            const userMsg = { role: 'user', content: message, timestamp: new Date().toISOString() };
            messagesArray.push(userMsg);

            // Acknowledge receipt to sender immediately with the user message and session id
            if(callback) callback({ session_id: sessionId, message: userMsg, status: 'processing' });
            
            // Emitting the user message back to the sender socket for UI update if not using callback
            socket.emit('newMessage', { session_id: sessionId, message: userMsg });

            // Fetch active booked slots scoped by business_id to prevent conflicts for this business
            let bookedSlots = [];
            try {
                const bookedRes = await db.query(
                    `SELECT scheduled_at, duration_minutes, service_name 
                     FROM appointments 
                     WHERE status != 'cancelled' 
                       AND (business_id = $1 OR ($1 IS NULL AND business_id IS NULL))
                       AND scheduled_at >= CURRENT_TIMESTAMP - INTERVAL '1 day'
                     ORDER BY scheduled_at ASC LIMIT 15`,
                    [activeBusinessId]
                );
                bookedSlots = bookedRes.rows;
            } catch (err) {
                console.warn("[Socket] Could not fetch booked slots for AI context:", err.message);
            }

            // Call AI with context, business info, booked slots, and client timezone offset
            const aiContext = messagesArray.map(m => ({ role: m.role, content: m.content }));
            let aiResponseContent = '';
            let usedModel = 'unknown';
            let latencyMs = 0;
            
            try {
                const aiResult = await processChatWithAI(aiContext, bookedSlots, tz_offset, businessInfo);
                aiResponseContent = aiResult.content;
                usedModel = aiResult.model;
                latencyMs = aiResult.latencyMs;
            } catch (error) {
                console.error("[Socket] AI Error:", error.message);
                aiResponseContent = "I'm having trouble connecting right now. Could you please try again in a moment?";
            }

            let parsedCommand = null;
            try {
                // Remove any markdown code blocks if the model wrapped it
                const cleanedContent = aiResponseContent.replace(/```json/g, '').replace(/```/g, '').trim();
                parsedCommand = JSON.parse(cleanedContent);
            } catch (e) {
                // conversational text response
            }

            // CRITICAL VERIFICATION: If AI attempts to book, verify date is NOT already booked for this business
            if (parsedCommand && parsedCommand.action === 'BOOK_APPOINTMENT') {
                const scheduledAt = parsedCommand.scheduled_at;
                const duration = parsedCommand.duration_minutes || 60;
                
                // Ensure business_id is set
                parsedCommand.business_id = activeBusinessId;
                parsedCommand.business_name = businessInfo.name;

                try {
                    const conflictCheck = await db.query(
                        `SELECT id, scheduled_at, service_name FROM appointments 
                         WHERE status != 'cancelled'
                           AND (business_id = $3 OR ($3 IS NULL AND business_id IS NULL))
                           AND (
                             scheduled_at < ($1::timestamptz + ($2 || ' minutes')::interval)
                             AND ($1::timestamptz) < (scheduled_at + (duration_minutes || ' minutes')::interval)
                           ) LIMIT 1`,
                        [scheduledAt, duration, activeBusinessId]
                    );

                    if (conflictCheck.rows.length > 0) {
                        const conflictDate = new Date(conflictCheck.rows[0].scheduled_at);
                        const formatted = conflictDate.toLocaleDateString('en-US', {
                            weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        });
                        aiResponseContent = `That date and time (${formatted}) is already booked at ${businessInfo.name}! Please select another date or time.`;
                        parsedCommand = null; // Prevent booking action!
                        console.log(`[Socket] Prevented duplicate booking on already taken slot: ${scheduledAt} for business: ${activeBusinessId}`);
                    } else {
                        // REPLACE RAW JSON with the friendly confirmation message!
                        const formatted = new Date(scheduledAt).toLocaleString('en-US', {
                            weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        });
                        aiResponseContent = parsedCommand.message || `I have scheduled your ${parsedCommand.service_name} at ${businessInfo.name} for ${formatted}.`;
                        console.log(`[Socket] AI proposed valid booking at ${businessInfo.name} for ${scheduledAt}`);
                    }
                } catch (dbErr) {
                    console.error("[Socket] Conflict verification error:", dbErr);
                }
            }

            // Detect if input is incomplete or ambiguous to offer structured form fallback
            const isAmbiguousOrIncomplete = !parsedCommand && (
                aiResponseContent.includes('?') || 
                aiResponseContent.toLowerCase().includes('what') || 
                aiResponseContent.toLowerCase().includes('which') || 
                aiResponseContent.toLowerCase().includes('date') ||
                aiResponseContent.toLowerCase().includes('time') ||
                aiResponseContent.toLowerCase().includes('schedule')
            );

            // Persist AI interaction to database for analytics & observability
            try {
                await db.query(
                    `INSERT INTO ai_logs (user_id, business_id, session_id, model, user_message, ai_response, action_type, latency_ms)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                    [
                        user_id, 
                        activeBusinessId, 
                        sessionId, 
                        usedModel, 
                        message, 
                        aiResponseContent, 
                        parsedCommand ? parsedCommand.action : (isAmbiguousOrIncomplete ? 'INCOMPLETE_INPUT' : 'CONVERSATIONAL'), 
                        latencyMs
                    ]
                );
            } catch (logErr) {
                console.warn("[Socket] Could not log to ai_logs table:", logErr.message);
            }

            const aiMsg = { 
                role: 'assistant', 
                content: aiResponseContent, 
                timestamp: new Date().toISOString(),
                suggest_form: isAmbiguousOrIncomplete
            };
            messagesArray.push(aiMsg);

            // Update DB
            await db.query(
                'UPDATE chat_sessions SET messages = $1, last_active_at = CURRENT_TIMESTAMP WHERE id = $2',
                [JSON.stringify(messagesArray), sessionId]
            );

            // Emit AI response back to the user
            socket.emit('newMessage', { 
                session_id: sessionId, 
                message: aiMsg,
                command: parsedCommand,
                suggest_form: isAmbiguousOrIncomplete
            });

        } catch (error) {
            console.error("Socket Chat Error:", error);
            socket.emit('error', { error: 'Server error processing chat' });
        }
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.user.id}`);
    });
});

return io;
};

export const getIo = () => {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
};

