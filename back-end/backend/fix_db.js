const { pool } = require('./config/db');

async function fix() {
    try {
        console.log("--- Starting DB Fixes ---");
        
        // List of tables with ID as PK that should be AUTO_INCREMENT
        const tables = [
            'Roles', 'Users', 'Courses', 'Classes', 'Modules', 
            'Lessons', 'Assignments', 'Submissions', 'Sessions', 
            'Attendance', 'Tickets', 'TicketReplies', 'Announcements', 'FeeManagement'
        ];

        for (const table of tables) {
            console.log(`Checking/Fixing table: ${table}...`);
            try {
                // Modify ID column to the correct state: INT PRIMARY KEY AUTO_INCREMENT
                // Since PK's are already defined, modifying column to AUTO_INCREMENT is what we need.
                // Note: We avoid 'PRIMARY KEY' if it already exists to prevent duplicate PK errors.
                // Just MODIFY COLUMN to add AUTO_INCREMENT.
                await pool.query(`ALTER TABLE ${table} MODIFY COLUMN ID INT AUTO_INCREMENT;`);
                console.log(`✅ ${table} fixed (or already OK)`);
            } catch (err) {
                console.log(`❌ Error fixing ${table}:`, err);
                // If it fails because of missing column or other issues, we log it but continue
            }
        }

        console.log("--- DB Fixes Complete ---");
    } catch (err) {
        console.error("Critical error during fix:", err.message);
    } finally {
        process.exit();
    }
}

fix();
