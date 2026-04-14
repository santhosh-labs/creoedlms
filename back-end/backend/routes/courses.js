const express = require('express');
const router = express.Router();
const { verifyToken, authorizeRoles } = require('../middleware/auth');
const { pool } = require('../config/db');

// @route   POST api/courses
// @desc    Create a new course
// @access  Private (Admin, Super Admin)
router.post('/', verifyToken, authorizeRoles('Super Admin', 'Admin'), async (req, res) => {
    const { name, overview, totalFee, courseCode, image, coverImage, targetAudience, skillLevel, language, courseOutcome, category, visibility, duration, startingDate, description } = req.body;

    if (!name || !totalFee) return res.status(400).json({ message: 'Name and Total Fee are required' });
    if (!courseCode) return res.status(400).json({ message: 'Course Code is required' });

    try {
        const [result] = await pool.query(
            'INSERT INTO Courses (CourseCode, Name, Overview, TotalFee, Image, CoverImage, TargetAudience, SkillLevel, Language, CourseOutcome, Category, Visibility, Duration, StartingDate, Description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [courseCode, name, overview || null, totalFee, image || null, coverImage || null, targetAudience || null, skillLevel || null, language || null, courseOutcome || null, category || null, visibility !== undefined ? visibility : 1, duration || null, startingDate || null, description || null]
        );

        res.status(201).json({ id: result.insertId, courseCode, name, overview, totalFee, image, coverImage, targetAudience, skillLevel, language, courseOutcome, category, visibility, duration, startingDate, description });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: `Course Code "${courseCode}" already exists. Please use a unique code.` });
        }
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/courses/public
// @desc    Get all courses for public display on the Creoed website (no auth required)
// @access  Public
router.get('/public', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT ID, CourseCode, Name, Overview, Description, TotalFee, CreatedAt, Image, CoverImage, TargetAudience, SkillLevel, Language, CourseOutcome, Category, Duration, StartingDate FROM Courses WHERE Visibility = 1 OR Visibility IS NULL ORDER BY CreatedAt DESC'
        );
        res.json(rows);
    } catch (err) {
        console.error('[Public Courses]', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET api/courses/public/:id
// @desc    Get single course details including curriculum (modules/lessons) for public display
// @access  Public
router.get('/public/:id', async (req, res) => {
    try {
        const courseId = req.params.id;
        // Fetch course details
        const [courses] = await pool.query('SELECT ID, CourseCode, Name, Overview, Description, TotalFee, CreatedAt, Image, CoverImage, TargetAudience, SkillLevel, Language, CourseOutcome, Category, Duration, StartingDate FROM Courses WHERE ID = ? AND (Visibility = 1 OR Visibility IS NULL)', [courseId]);
        
        if (courses.length === 0) {
            return res.status(404).json({ message: 'Course not found' });
        }
        const course = courses[0];

        // Fetch first class for this course (for curriculum display)
        const [classes] = await pool.query(`
            SELECT c.ID, u.Name as TutorName
            FROM Classes c 
            LEFT JOIN Users u ON c.TutorID = u.ID 
            WHERE c.CourseID = ? LIMIT 1
        `, [courseId]);

        let modulesData = [];
        let tutorName = null;
        let totalLessons = 0;
        
        if (classes.length > 0) {
            const classInfo = classes[0];
            const classId = classInfo.ID;
            tutorName = classInfo.TutorName || null;

            const [modules] = await pool.query('SELECT ID, Title, Description FROM Modules WHERE ClassID = ?', [classId]);
            const [lessons] = await pool.query(`
                SELECT l.ID, l.ModuleID, l.Title, l.Type 
                FROM Lessons l 
                JOIN Modules m ON l.ModuleID = m.ID 
                WHERE m.ClassID = ?
            `, [classId]);

            modulesData = modules.map(mod => {
                const moduleLessons = lessons.filter(l => l.ModuleID === mod.ID);
                totalLessons += moduleLessons.length;
                return { ...mod, lessons: moduleLessons };
            });

            // If no lessons found, count modules as a fallback
            if (totalLessons === 0 && modules.length > 0) {
                totalLessons = modules.length;
            }
        }

        // Also count total lessons across ALL classes for this course for accuracy
        const [lessonCountResult] = await pool.query(`
            SELECT COUNT(l.ID) as total
            FROM Lessons l
            JOIN Modules m ON l.ModuleID = m.ID
            JOIN Classes c ON m.ClassID = c.ID
            WHERE c.CourseID = ?
        `, [courseId]);
        const dbLessonCount = lessonCountResult[0]?.total || 0;
        if (dbLessonCount > 0) totalLessons = dbLessonCount;

        course.curriculum = modulesData;
        course.TutorName = tutorName;
        course.TotalLessons = totalLessons;
        res.json(course);
    } catch (err) {
        console.error('[Public Course Details]', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET api/courses
// @desc    Get all courses
// @access  Private
router.get('/', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT ID, CourseCode, Name, Overview, Description, TotalFee, CreatedAt, Image, CoverImage, TargetAudience, SkillLevel, Language, CourseOutcome, Category, Visibility, Duration, StartingDate FROM Courses ORDER BY CreatedAt DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/courses/:id
// @desc    Update an existing course
// @access  Private (Admin, Super Admin)
router.put('/:id', verifyToken, authorizeRoles('Super Admin', 'Admin'), async (req, res) => {
    const { name, overview, totalFee, courseCode, image, coverImage, targetAudience, skillLevel, language, courseOutcome, category, visibility, duration, startingDate, description } = req.body;
    const courseId = req.params.id;

    if (!name || !totalFee) return res.status(400).json({ message: 'Name and Total Fee are required' });

    try {
        await pool.query(
            'UPDATE Courses SET CourseCode=?, Name=?, Overview=?, Description=?, TotalFee=?, TargetAudience=?, SkillLevel=?, Language=?, CourseOutcome=?, Category=?, Visibility=?, Duration=?, StartingDate=?, Image=COALESCE(?,Image), CoverImage=COALESCE(?,CoverImage) WHERE ID=?',
            [courseCode, name, overview || null, description || null, totalFee, targetAudience || null, skillLevel || null, language || null, courseOutcome || null, category || null, visibility !== undefined ? visibility : 1, duration || null, startingDate || null, image || null, coverImage || null, courseId]
        );
        res.json({ message: 'Course updated successfully' });
    } catch (err) {
        console.error(err);
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

// @route   DELETE api/courses/:id
// @desc    Delete a course
// @access  Private (Admin, Super Admin)
router.delete('/:id', verifyToken, authorizeRoles('Super Admin', 'Admin'), async (req, res) => {
    try {
        const courseId = req.params.id;
        const [result] = await pool.query('DELETE FROM Courses WHERE ID = ?', [courseId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Course not found.' });
        }
        res.json({ message: 'Course deleted successfully.' });
    } catch (err) {
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({ message: 'Cannot delete course because it has active batches/classes attached to it. Delete the classes first.' });
        }
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/courses/classes/:classId
// @desc    Delete a class batch
// @access  Private (Admin, Super Admin)
router.delete('/classes/:classId', verifyToken, authorizeRoles('Super Admin', 'Admin'), async (req, res) => {
    try {
        const classId = req.params.classId;
        const [result] = await pool.query('DELETE FROM Classes WHERE ID = ?', [classId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Class batch not found.' });
        }
        res.json({ message: 'Class batch deleted successfully.' });
    } catch (err) {
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({ message: 'Cannot delete batch. Students or modules are already enrolled/assigned here.' });
        }
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
