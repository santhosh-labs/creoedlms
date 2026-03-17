require('dotenv').config();
const { pool } = require('./config/db');

async function migrate() {
    try {
        await pool.query(`ALTER TABLE Messages ADD COLUMN IF NOT EXISTS ImageUrl VARCHAR(500) NULL AFTER Message`);
        console.log('✅ ImageUrl column added to Messages table');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}
migrate();
