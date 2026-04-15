const { pool } = require('./config/db');
async function run() {
    try {
        const [courses] = await pool.query('SELECT ID FROM Courses WHERE Name LIKE "%DEV%" LIMIT 1');
        const courseId = courses[0].ID;
        console.log('Course ID:', courseId);

        const [classes] = await pool.query('SELECT c.ID, u.Name as TutorName FROM Classes c LEFT JOIN Users u ON c.TutorID = u.ID WHERE c.CourseID = ? ORDER BY c.ID DESC LIMIT 1', [courseId]);
        console.log('Classes:', classes);

        const [lessonCountResult] = await pool.query('SELECT COUNT(l.ID) as total FROM Lessons l JOIN Modules m ON l.ModuleID = m.ID JOIN Classes c ON m.ClassID = c.ID WHERE c.CourseID = ?', [courseId]);
        console.log('Total Lessons:', lessonCountResult);
    } catch(err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}
run();
