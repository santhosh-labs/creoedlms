const { pool } = require('./config/db');

async function run() {
    try {
        // Force-update ALL user codes based on their role
        const [result] = await pool.query(`
            UPDATE Users u JOIN Roles r ON u.RoleID = r.ID
            SET u.StudentCode = CASE r.RoleName
                WHEN 'Student'     THEN CONCAT('CR26', LPAD(u.ID, 4, '0'))
                WHEN 'Tutor'       THEN CONCAT('CRINS26', LPAD(u.ID, 3, '0'))
                WHEN 'Admin'       THEN CONCAT('CRADN26', LPAD(u.ID, 3, '0'))
                WHEN 'Super Admin' THEN CONCAT('CRSUP26', LPAD(u.ID, 3, '0'))
                ELSE CONCAT('CR26', LPAD(u.ID, 4, '0'))
            END
        `);
        console.log('Updated', result.affectedRows, 'user codes');

        // Show what the codes are now
        const [users] = await pool.query(`
            SELECT u.ID, u.StudentCode, u.Name, r.RoleName 
            FROM Users u JOIN Roles r ON u.RoleID = r.ID 
            ORDER BY r.RoleName, u.ID
        `);
        console.table(users);
    } catch (e) {
        console.log(e.message);
    }
    process.exit();
}
run();
