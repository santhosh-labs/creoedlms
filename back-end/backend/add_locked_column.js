const { pool } = require('./config/db');
async function run() {
    try {
        await pool.query('ALTER TABLE Users ADD COLUMN IsLocked BOOLEAN DEFAULT FALSE;');
        console.log("Column added");
    } catch(e) {
        console.log(e);
    }
    process.exit();
}
run();
