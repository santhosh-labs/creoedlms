const { pool } = require('./config/db');

async function testActivation() {
    try {
        const [rows] = await pool.query('SHOW COLUMNS FROM Users');
        console.log("Users table columns: ", rows.map(r => r.Field).join(', '));
        process.exit(0);
    } catch(err) {
        console.error(err);
        process.exit(1);
    }
}
testActivation();
