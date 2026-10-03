/**
 * Request validation middleware functions for input validation and sanitization.
 */

// Simple email regex for validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateRegister = (req, res, next) => {
    const { email, password, full_name } = req.body;
    const errors = [];

    if (!full_name || typeof full_name !== 'string' || full_name.trim().length < 2) {
        errors.push('Full name is required and must be at least 2 characters.');
    }

    if (!email || !EMAIL_REGEX.test(email)) {
        errors.push('A valid email address is required.');
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
        errors.push('Password is required and must be at least 6 characters.');
    }

    if (errors.length > 0) {
        return res.status(400).json({ error: errors.join(' ') });
    }

    // Sanitize
    req.body.full_name = full_name.trim();
    req.body.email = email.trim().toLowerCase();
    next();
};

export const validateLogin = (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    if (!EMAIL_REGEX.test(email)) {
        return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    req.body.email = email.trim().toLowerCase();
    next();
};

export const validateAppointment = (req, res, next) => {
    const { service_name, scheduled_at, duration_minutes } = req.body;
    const errors = [];

    if (!service_name || typeof service_name !== 'string' || service_name.trim().length === 0) {
        errors.push('Service name is required.');
    }

    if (!scheduled_at) {
        errors.push('scheduled_at timestamp is required.');
    } else {
        const d = new Date(scheduled_at);
        if (isNaN(d.getTime())) {
            errors.push('scheduled_at must be a valid ISO date/time format.');
        }
    }

    if (duration_minutes !== undefined) {
        const duration = parseInt(duration_minutes, 10);
        if (isNaN(duration) || duration < 10 || duration > 480) {
            errors.push('duration_minutes must be an integer between 10 and 480.');
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({ error: errors.join(' ') });
    }

    next();
};
