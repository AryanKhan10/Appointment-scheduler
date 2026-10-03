import db from './index.js';

export const seedBusinesses = async () => {
    try {
        await db.query(`
            INSERT INTO businesses (id, name) VALUES 
            ('b1111111-1111-1111-1111-111111111111', 'Acme Dental Clinic'),
            ('b2222222-2222-2222-2222-222222222222', 'Apex Health & Wellness'),
            ('b3333333-3333-3333-3333-333333333333', 'Mind Therapy Studio')
            ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
        `);
        const res = await db.query('SELECT * FROM businesses ORDER BY name ASC');
        console.log('Seeded businesses:', res.rows);
        return res.rows;
    } catch (err) {
        console.error('Seed businesses error:', err.message);
    }
};

if (process.argv[1]?.endsWith('seedBusinesses.js')) {
    seedBusinesses().then(() => process.exit(0));
}
