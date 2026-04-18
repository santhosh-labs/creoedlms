const { pool } = require('./config/db');

async function migrate() {
    try {
        await pool.query('ALTER TABLE Courses ADD COLUMN ShowLessons TINYINT(1) DEFAULT 1');
        console.log('Migration successful: Added ShowLessons to Courses table');
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log('Column ShowLessons already exists, skipping.');
        } else {
            console.error('Migration failed:', e);
        }
    } finally {
        process.exit();
    }
}
migrate();
