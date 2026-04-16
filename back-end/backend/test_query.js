const { pool } = require('./config/db');
async function test() {
    let query = `
        SELECT u.ID, u.StudentCode, u.Name,
               fm.CourseID, c.Name as CourseName, c2.BatchName, c2.BatchCode,
               fm.TotalFee, fm.AmountPaid, fm.PaymentStatus
        FROM Users u
        JOIN Roles r ON u.RoleID = r.ID
        LEFT JOIN (SELECT StudentID, MAX(ClassID) as ClassID FROM ClassStudents GROUP BY StudentID) cs ON cs.StudentID = u.ID
        LEFT JOIN Classes c2 ON c2.ID = cs.ClassID
        LEFT JOIN (SELECT StudentID, MAX(ID) as MaxFeeID FROM FeeManagement GROUP BY StudentID) fm_max ON fm_max.StudentID = u.ID
        LEFT JOIN FeeManagement fm ON fm.ID = fm_max.MaxFeeID
        LEFT JOIN Courses c ON c.ID = COALESCE(fm.CourseID, c2.CourseID)
        WHERE r.RoleName = 'Student'
    `;
    try {
        const [rows] = await pool.query(query);
        console.log(rows);
    } catch(e) {
        console.log(e);
    }
    process.exit();
}
test();
