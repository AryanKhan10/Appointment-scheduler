import db from '../db/index.js';

// Business directory and services metadata
export const BUSINESS_SERVICES_MAP = {
    'b1111111-1111-1111-1111-111111111111': {
        category: 'Dental Care',
        description: 'Comprehensive dental checkups, cleaning, and specialist treatments.',
        services: [
            { name: 'Dental Checkup', duration: 30, desc: 'Routine oral examination & cleaning' },
            { name: 'Teeth Whitening', duration: 45, desc: 'Professional cosmetic teeth whitening' },
            { name: 'Root Canal Treatment', duration: 60, desc: 'Endodontic tooth preservation' }
        ]
    },
    'b2222222-2222-2222-2222-222222222222': {
        category: 'Medical & Wellness',
        description: 'General health consultations and comprehensive physical examinations.',
        services: [
            { name: 'General Consultation', duration: 30, desc: 'Primary care and medical assessment' },
            { name: 'Full Health Checkup', duration: 60, desc: 'Comprehensive biometric and diagnostic review' },
            { name: 'Nutrition Advisory', duration: 45, desc: 'Personalized dietary and lifestyle consultation' }
        ]
    },
    'b3333333-3333-3333-3333-333333333333': {
        category: 'Mental Health & Psychology',
        description: 'Confidential psychological therapy and cognitive wellness sessions.',
        services: [
            { name: 'Specialist Therapy', duration: 60, desc: 'One-on-one psychological counseling' },
            { name: 'Stress & Anxiety Session', duration: 45, desc: 'Mindfulness and cognitive coping strategies' },
            { name: 'Follow-up Review', duration: 30, desc: 'Progress evaluation and treatment tracking' }
        ]
    }
};

const getBusinesses = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM businesses ORDER BY name ASC');
        
        // Enrich with services and categories
        const businesses = result.rows.map(b => {
            const meta = BUSINESS_SERVICES_MAP[b.id] || {
                category: 'General Services',
                description: 'Professional appointment booking.',
                services: [
                    { name: 'Standard Consultation', duration: 45, desc: 'General appointment session' }
                ]
            };
            return {
                id: b.id,
                name: b.name,
                category: meta.category,
                description: meta.description,
                services: meta.services,
                created_at: b.created_at
            };
        });

        res.json(businesses);
    } catch (error) {
        console.error("Get Businesses Error:", error);
        res.status(500).json({ error: 'Server error retrieving businesses' });
    }
};

const getBusinessById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query('SELECT * FROM businesses WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Business not found' });
        }
        const b = result.rows[0];
        const meta = BUSINESS_SERVICES_MAP[b.id] || {
            category: 'General Services',
            description: 'Professional appointment booking.',
            services: []
        };
        res.json({
            id: b.id,
            name: b.name,
            category: meta.category,
            description: meta.description,
            services: meta.services
        });
    } catch (error) {
        console.error("Get Business By Id Error:", error);
        res.status(500).json({ error: 'Server error retrieving business' });
    }
};

export default {
    getBusinesses,
    getBusinessById
};
