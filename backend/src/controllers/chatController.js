import db from '../db/index.js';

const getSession = async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user.id;

        const sessionRes = await db.query('SELECT * FROM chat_sessions WHERE id = $1 AND user_id = $2', [id, user_id]);
        if (sessionRes.rows.length === 0) {
            return res.status(404).json({ error: 'Session not found' });
        }

        res.json(sessionRes.rows[0]);
    } catch (error) {
        console.error("Get Session Error:", error);
        res.status(500).json({ error: 'Server error retrieving session' });
    }
};

export default {
    getSession
};
