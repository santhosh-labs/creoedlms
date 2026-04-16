const { pool } = require('./config/db');
async function test() {
    try {
        const [rows] = await pool.query("SELECT ID, StudentCode, Name, Email FROM Users WHERE Email='harish@gmail.com'");
        console.log(rows);
    } catch(e) { console.log(e); }
    process.exit();
}
test();
