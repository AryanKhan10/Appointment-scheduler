import db from './index.js';

export const migrateAiLogs = async () => {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS ai_logs (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID REFERENCES users(id) ON DELETE SET NULL,
                business_id UUID REFERENCES businesses(id) ON DELETE SET NULL,
                session_id UUID REFERENCES chat_sessions(id) ON DELETE SET NULL,
                model VARCHAR(100),
                user_message TEXT,
                ai_response TEXT,
                action_type VARCHAR(50) DEFAULT 'CONVERSATIONAL',
                latency_ms INTEGER,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_ai_logs_business_id ON ai_logs(business_id);
            CREATE INDEX IF NOT EXISTS idx_ai_logs_created_at ON ai_logs(created_at);
        `);
        console.log('[DB] ai_logs table verified and indexed.');
    } catch (err) {
        console.error('[DB] Migration error on ai_logs:', err.message);
    }
};

if (process.argv[1]?.endsWith('migrateAiLogs.js')) {
    migrateAiLogs().then(() => process.exit(0));
}
