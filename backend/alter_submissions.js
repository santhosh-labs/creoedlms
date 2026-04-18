require('dotenv').config();
const { pool } = require('./config/db');

(async () => {
    try {
        await pool.query("ALTER TABLE Submissions ADD COLUMN Status VARCHAR(20) DEFAULT 'Submitted'");
        console.log("Status column added.");
    } catch (e) {
        if (!e.message.includes('Duplicate column name')) {
            console.error(e);
        } else {
            console.log("Status column already exists.");
        }
    }
    process.exit();
})();
