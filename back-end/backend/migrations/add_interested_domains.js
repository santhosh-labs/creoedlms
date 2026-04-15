const { pool, connectDB } = require('../config/db');

async function run() {
    await connectDB();
    const conn = await pool.getConnection();
    try {
        await conn.query('ALTER TABLE Users ADD COLUMN IF NOT EXISTS InterestedDomains TEXT DEFAULT NULL');
        console.log('✅ Migration OK: InterestedDomains column added to Users table.');
    } catch (e) {
        console.error('❌ Migration error:', e.message);
    } finally {
        conn.release();
        process.exit(0);
    }
}

run();
