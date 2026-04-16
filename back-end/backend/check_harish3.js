const { pool } = require('./config/db');
async function test() {
    try {
        const [students] = await pool.query("SELECT ID, StudentCode, Name FROM Users WHERE ID=7");
        const [fees] = await pool.query("SELECT fm.StudentID, fm.CourseID, c.Name as CourseName, fm.TotalFee, fm.AmountPaid, fm.PaymentStatus FROM FeeManagement fm LEFT JOIN Courses c ON c.ID = fm.CourseID");
        const [classes] = await pool.query("SELECT cs.StudentID, cl.CourseID, c.Name as CourseName, cl.BatchName FROM ClassStudents cs JOIN Classes cl ON cs.ClassID = cl.ID LEFT JOIN Courses c ON c.ID = cl.CourseID");
        
        const results = students.map(st => {
            const stFees = fees.filter(f => f.StudentID === st.ID);
            const stClasses = classes.filter(c => c.StudentID === st.ID);
            const enrollmentMap = {};
            stFees.forEach(f => { enrollmentMap[f.CourseID] = { ...f, BatchName: null }; });
            stClasses.forEach(c => {
                if (!enrollmentMap[c.CourseID]) {
                    enrollmentMap[c.CourseID] = { StudentID: st.ID, CourseID: c.CourseID, CourseName: c.CourseName, TotalFee: null, AmountPaid: null, PaymentStatus: null, BatchName: c.BatchName };
                } else {
                    enrollmentMap[c.CourseID].BatchName = c.BatchName;
                    if (!enrollmentMap[c.CourseID].CourseName) enrollmentMap[c.CourseID].CourseName = c.CourseName;
                }
            });
            return { ...st, Enrollments: Object.values(enrollmentMap) };
        });
        console.log(JSON.stringify(results, null, 2));
    } catch(e) { console.log(e); }
    process.exit();
}
test();
