const { pool } = require('./config/db');

async function migrate() {
    try {
        await pool.query('ALTER TABLE Lessons ADD COLUMN Visibility TINYINT(1) DEFAULT 1');
        console.log('Migration successful: Added Visibility to Lessons table');
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log('Column Visibility already exists, skipping.');
        } else {
            console.error('Migration failed:', e);
        }
    } finally {
        process.exit();
    }
}
migrate();
