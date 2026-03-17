const { pool } = require('./config/db');

async function migrate() {
    try {
        console.log('Running auth migrations...');

        // Add reset token columns to Users table
        await pool.query(`
            ALTER TABLE Users
            ADD COLUMN IF NOT EXISTS ResetToken VARCHAR(255) NULL,
            ADD COLUMN IF NOT EXISTS ResetTokenExpiry DATETIME NULL
        `);
        console.log('✅ Users table updated with reset token columns.');

        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}
migrate();
