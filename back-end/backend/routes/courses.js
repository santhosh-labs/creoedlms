const express = require('express');
const router = express.Router();
const { verifyToken, authorizeRoles } = require('../middleware/auth');
const { pool } = require('../config/db');

// @route   POST api/courses
// @desc    Create a new course
// @access  Private (Admin, Super Admin)
router.post('/', verifyToken, authorizeRoles('Super Admin', 'Admin'), async (req, res) => {
    const { name, description, totalFee, courseCode } = req.body;

    if (!name || !totalFee) return res.status(400).json({ message: 'Name and Total Fee are required' });
    if (!courseCode) return res.status(400).json({ message: 'Course Code is required' });

    try {
        const [result] = await pool.query(
            'INSERT INTO Courses (CourseCode, Name, Description, TotalFee) VALUES (?, ?, ?, ?)',
            [courseCode, name, description || null, totalFee]
        );

        res.status(201).json({ id: result.insertId, courseCode, name, description, totalFee });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: `Course Code "${courseCode}" already exists. Please use a unique code.` });
        }
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/courses
// @desc    Get all courses
// @access  Private
router.get('/', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT ID, CourseCode, Name, Description, TotalFee, CreatedAt FROM Courses ORDER BY CreatedAt DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route   POST api/courses/:courseId/classes
// @desc    Create a new class batch
// @access  Private (Admin, Super Admin)
router.post('/:courseId/classes', verifyToken, authorizeRoles('Super Admin', 'Admin'), async (req, res) => {
    const { tutorId, batchName } = req.body;
    const courseId = req.params.courseId;

    if (!tutorId || !batchName) return res.status(400).json({ message: 'Tutor ID and Batch Name are required' });

    try {
        const [result] = await pool.query(
            'INSERT INTO Classes (CourseID, TutorID, BatchName) VALUES (?, ?, ?)',
            [courseId, tutorId, batchName]
        );

        res.status(201).json({ id: result.insertId, courseId, tutorId, batchName });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route   GET api/courses/classes/my
// @desc    Get classes for current user (Tutor -> their classes, Student -> their enrolled class)
// @access  Private
router.get('/classes/my', verifyToken, async (req, res) => {
    try {
        let query;
        let params = [req.user.id];

        if (req.user.role === 'Tutor') {
            query = `
                SELECT c.ID as ClassID, c.BatchName, c.BatchCode, cr.Name as CourseName,
                       (SELECT COUNT(*) FROM ClassStudents cs WHERE cs.ClassID = c.ID) as StudentCount,
                       (SELECT COUNT(*) FROM Modules m WHERE m.ClassID = c.ID) as ModuleCount
                FROM Classes c
                JOIN Courses cr ON c.CourseID = cr.ID
                WHERE c.TutorID = ?
            `;
        } else if (req.user.role === 'Student') {
            query = `
                SELECT cs.ClassID, c.BatchName, c.BatchCode, cr.Name as CourseName, c.TutorID, t.Name as TutorName
                FROM ClassStudents cs
                JOIN Classes c ON cs.ClassID = c.ID
                JOIN Courses cr ON c.CourseID = cr.ID
                JOIN Users t ON c.TutorID = t.ID
                WHERE cs.StudentID = ?
            `;
        } else {
            // Admin/Super Admin see all classes — include CourseID for client-side filtering
            query = `
                 SELECT c.ID as ClassID, c.CourseID, c.BatchName, c.BatchCode, cr.Name as CourseName, t.ID as TutorID, t.Name as TutorName
                 FROM Classes c
                 JOIN Courses cr ON c.CourseID = cr.ID
                 JOIN Users t ON c.TutorID = t.ID
                 ORDER BY c.CreatedAt DESC
            `;
            params = [];
        }

        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/courses/tutors
// @desc    Get all tutors (for batch creation dropdown)
// @access  Private (Admin, Super Admin)
router.get('/tutors', verifyToken, authorizeRoles('Super Admin', 'Admin'), async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT u.ID, u.Name, u.Email
            FROM Users u
            JOIN Roles r ON u.RoleID = r.ID
            WHERE r.RoleName = 'Tutor'
            ORDER BY u.Name ASC
        `);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/courses/classes/:classId/tutor
// @desc    Change the assigned tutor for a specific batch/class
// @access  Private (Admin, Super Admin)
router.put('/classes/:classId/tutor', verifyToken, authorizeRoles('Super Admin', 'Admin'), async (req, res) => {
    try {
        const classId = req.params.classId;
        const { tutorId } = req.body;

        if (!tutorId) {
            return res.status(400).json({ message: 'New Tutor ID is required.' });
        }

        const [result] = await pool.query('UPDATE Classes SET TutorID = ? WHERE ID = ?', [tutorId, classId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Class not found.' });
        }

        res.json({ message: 'Tutor updated successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
