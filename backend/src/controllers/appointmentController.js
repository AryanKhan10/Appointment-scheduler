import db from '../db/index.js';

const createAppointment = async (req, res) => {
    try {
        const { service_name, scheduled_at, duration_minutes, notes, business_id, chat_session_id } = req.body;
        const customer_id = req.user.id;

        if (!service_name || !scheduled_at) {
            return res.status(400).json({ error: 'Service name and scheduled_at are required' });
        }

        const scheduledDate = new Date(scheduled_at);
        if (isNaN(scheduledDate.getTime())) {
            return res.status(400).json({ error: 'Invalid date/time format for scheduled_at' });
        }

        const duration = parseInt(duration_minutes, 10) || 60;

        // MULTI-TENANT CONFLICT CHECK: Check if the slot is already booked for this specific business
        const conflictRes = await db.query(
            `SELECT id, service_name, scheduled_at, duration_minutes, business_id 
             FROM appointments 
             WHERE status != 'cancelled'
               AND (business_id = $3 OR ($3 IS NULL AND business_id IS NULL))
               AND (
                 scheduled_at < ($1::timestamptz + ($2 || ' minutes')::interval)
                 AND ($1::timestamptz) < (scheduled_at + (duration_minutes || ' minutes')::interval)
               ) LIMIT 1`,
            [scheduledDate.toISOString(), duration, business_id || null]
        );

        if (conflictRes.rows.length > 0) {
            const conflict = conflictRes.rows[0];
            return res.status(409).json({ 
                error: 'This date and time is already booked for this business. Please select another date.',
                isBooked: true,
                conflicting_slot: conflict.scheduled_at,
                service_name: conflict.service_name,
                business_id: conflict.business_id
            });
        }

        const result = await db.query(
            `INSERT INTO appointments (business_id, customer_id, chat_session_id, service_name, scheduled_at, duration_minutes, status, notes) 
             VALUES ($1, $2, $3, $4, $5, $6, 'confirmed', $7) RETURNING *`,
            [business_id || null, customer_id, chat_session_id || null, service_name, scheduledDate.toISOString(), duration, notes || '']
        );

        // Fetch with business details
        const enriched = await db.query(
            `SELECT a.*, b.name as business_name 
             FROM appointments a 
             LEFT JOIN businesses b ON a.business_id = b.id 
             WHERE a.id = $1`,
            [result.rows[0].id]
        );

        res.status(201).json(enriched.rows[0]);
    } catch (error) {
        console.error("Create Appointment Error:", error);
        res.status(500).json({ error: 'Server error creating appointment' });
    }
};

const checkAvailability = async (req, res) => {
    try {
        let { date, duration, business_id } = req.query;
        if (!date) {
            return res.status(400).json({ error: 'Date is required' });
        }

        // Handle space-decoded '+' in ISO query parameter (e.g. 2026-10-05T15:00:00 05:00 -> +05:00)
        if (date.includes(' ') && !date.includes('+')) {
            date = date.replace(' ', '+');
        }

        const scheduledDate = new Date(date);
        if (isNaN(scheduledDate.getTime())) {
            return res.status(400).json({ error: 'Invalid date format' });
        }

        const dur = parseInt(duration, 10) || 60;

        // Conflict check scoped by business_id
        const conflictRes = await db.query(
            `SELECT id, scheduled_at, duration_minutes, service_name, business_id 
             FROM appointments 
             WHERE status != 'cancelled'
               AND (business_id = $3 OR ($3 IS NULL AND business_id IS NULL))
               AND (
                 scheduled_at < ($1::timestamptz + ($2 || ' minutes')::interval)
                 AND ($1::timestamptz) < (scheduled_at + (duration_minutes || ' minutes')::interval)
               ) LIMIT 1`,
            [scheduledDate.toISOString(), dur, business_id || null]
        );

        if (conflictRes.rows.length > 0) {
            return res.json({ 
                available: false, 
                message: 'This date and time is already booked for this business. Please select another date.',
                conflicting_slot: conflictRes.rows[0].scheduled_at 
            });
        }

        return res.json({ 
            available: true, 
            message: 'This date and time slot is available!' 
        });
    } catch (error) {
        console.error("Check availability error:", error);
        res.status(500).json({ error: 'Server error checking date availability' });
    }
};

const getBookedSlots = async (req, res) => {
    try {
        const { business_id } = req.query;
        let query = `SELECT a.id, a.scheduled_at, a.duration_minutes, a.service_name, a.status, a.business_id, b.name as business_name 
                     FROM appointments a 
                     LEFT JOIN businesses b ON a.business_id = b.id 
                     WHERE a.status != 'cancelled'`;
        const params = [];

        if (business_id) {
            query += ` AND a.business_id = $1`;
            params.push(business_id);
        }

        query += ` ORDER BY a.scheduled_at ASC`;

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error("Get Booked Slots Error:", error);
        res.status(500).json({ error: 'Server error retrieving booked slots' });
    }
};

const getAppointments = async (req, res) => {
    try {
        const customer_id = req.user.id;
        const result = await db.query(
            `SELECT a.*, b.name as business_name 
             FROM appointments a 
             LEFT JOIN businesses b ON a.business_id = b.id 
             WHERE a.customer_id = $1 
             ORDER BY a.scheduled_at DESC`,
            [customer_id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error("Get Appointments Error:", error);
        res.status(500).json({ error: 'Server error retrieving appointments' });
    }
};

const cancelAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const customer_id = req.user.id;
        const result = await db.query(
            `UPDATE appointments 
             SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP 
             WHERE id = $1 AND customer_id = $2 RETURNING *`,
            [id, customer_id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Appointment not found or unauthorized' });
        }
        res.json({ message: 'Appointment cancelled successfully', appointment: result.rows[0] });
    } catch (error) {
        console.error("Cancel Appointment Error:", error);
        res.status(500).json({ error: 'Server error cancelling appointment' });
    }
};

export default {
    createAppointment,
    checkAvailability,
    getBookedSlots,
    getAppointments,
    cancelAppointment
};
