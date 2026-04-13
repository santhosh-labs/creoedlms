const { pool } = require('./config/db');

async function test() {
    try {
        const [users] = await pool.query('SELECT * FROM Users JOIN Roles r ON Users.RoleID = r.ID WHERE r.RoleName = "Student"');
        console.log("Students:", users.map(u => ({id: u.ID, name: u.Name})));
        
        const [cs] = await pool.query('SELECT * FROM ClassStudents');
        console.log("ClassStudents:", cs);
        
        const [classes] = await pool.query('SELECT * FROM Classes');
        console.log("Classes:", classes);

    } catch (e) {
        console.error("Error:", e);
    } finally {
        process.exit();
    }
}
test();
