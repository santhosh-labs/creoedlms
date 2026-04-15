const { pool } = require('./config/db');
async function run() {
    try {
        const [courses] = await pool.query('SELECT Description FROM Courses WHERE Name LIKE "%DEV%" LIMIT 1');
        console.log('Description in DB:', courses[0].Description);
    } catch(err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}
run();
