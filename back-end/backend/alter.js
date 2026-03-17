const { pool } = require('./config/db');

async function run() {
    try {
        await pool.query('ALTER TABLE Users ADD COLUMN DateOfBirth DATE, ADD COLUMN Gender VARCHAR(50), ADD COLUMN City VARCHAR(150), ADD COLUMN Country VARCHAR(150);').catch(e => e.code==='ER_DUP_FIELDNAME'?null:Promise.resolve());
        await pool.query('ALTER TABLE Users ADD COLUMN StudentCode VARCHAR(50) UNIQUE;').catch(e => e.code==='ER_DUP_FIELDNAME'?null:Promise.resolve());
        await pool.query('ALTER TABLE Users ADD COLUMN CollegeName VARCHAR(200);').catch(e => e.code==='ER_DUP_FIELDNAME'?null:Promise.resolve());
        await pool.query('ALTER TABLE Users ADD COLUMN ResetToken VARCHAR(255);').catch(e => e.code==='ER_DUP_FIELDNAME'?null:Promise.resolve());
        await pool.query('ALTER TABLE Users ADD COLUMN ResetTokenExpiry DATETIME;').catch(e => e.code==='ER_DUP_FIELDNAME'?null:Promise.resolve());
        await pool.query('ALTER TABLE Announcements ADD COLUMN ActionLabel VARCHAR(50), ADD COLUMN ActionLink VARCHAR(255);').catch(e => e.code==='ER_DUP_FIELDNAME'?null:Promise.resolve());
        await pool.query('ALTER TABLE Courses ADD COLUMN CourseCode VARCHAR(50) UNIQUE;').catch(e => e.code==='ER_DUP_FIELDNAME'?null:Promise.resolve());
        // Set codes for ALL users using role-based prefixes
        await pool.query(`
            UPDATE Users u JOIN Roles r ON u.RoleID = r.ID
            SET u.StudentCode = CASE r.RoleName
                WHEN 'Student'     THEN CONCAT('CR26', LPAD(u.ID, 4, '0'))
                WHEN 'Tutor'       THEN CONCAT('CRINS26', LPAD(u.ID, 3, '0'))
                WHEN 'Admin'       THEN CONCAT('CRADN26', LPAD(u.ID, 3, '0'))
                WHEN 'Super Admin' THEN CONCAT('CRSUP26', LPAD(u.ID, 3, '0'))
                ELSE CONCAT('CR26', LPAD(u.ID, 4, '0'))
            END
            WHERE u.StudentCode IS NULL
        `);
        await pool.query("UPDATE Courses SET CourseCode = CONCAT('CRS', LPAD(ID, 3, '0')) WHERE CourseCode IS NULL");
        await pool.query('ALTER TABLE Classes ADD COLUMN BatchCode VARCHAR(50) UNIQUE;').catch(e => e.code==='ER_DUP_FIELDNAME'?null:Promise.resolve());
        await pool.query("UPDATE Classes SET BatchCode = CONCAT('BCH', LPAD(ID, 3, '0')) WHERE BatchCode IS NULL");
        console.log("Altered successfully");
    } catch (err) {
        console.log("Err:", err.message);
    }
    process.exit();
}
run();
