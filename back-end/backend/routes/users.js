const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { verifyToken, authorizeRoles } = require('../middleware/auth');
const { pool } = require('../config/db');

// ─── Unique User Code Generator ───────────────────────────────────────────
// Format by role:
//   Student    → CR26XXXX   (8 chars)  CR + YY + 4 random
//   Tutor      → CRINS26XXX (10 chars) CR + INS + YY + 3 random
//   Admin      → CRADN26XXX (10 chars) CR + ADN + YY + 3 random
//   Super Admin→ CRSUP26XXX (10 chars) CR + SUP + YY + 3 random
async function generateUserCode(connection, roleName) {
    const year = new Date().getFullYear().toString().slice(-2); // e.g. "26"
    const prefixMap = {
        'Student':     { pre: `CR${year}`,       digits: 4 },
        'Tutor':       { pre: `CRINS${year}`,    digits: 3 },
        'Admin':       { pre: `CRADN${year}`,    digits: 3 },
        'Super Admin': { pre: `CRSUP${year}`,    digits: 3 },
    };
    const cfg = prefixMap[roleName] || { pre: `CR${year}`, digits: 4 };
    const max = Math.pow(10, cfg.digits);
    const min = Math.pow(10, cfg.digits - 1);

    let code, exists = true, attempts = 0;
    while (exists && attempts < 20) {
        const rand = Math.floor(min + Math.random() * (max - min));
        code = `${cfg.pre}${rand}`;
        const [rows] = await connection.query('SELECT ID FROM Users WHERE StudentCode = ?', [code]);
        exists = rows.length > 0;
        attempts++;
    }
    if (exists) throw new Error(`Could not generate unique code for role ${roleName}`);
    return code;
}

// @route   POST api/users/register
// @desc    Register a new user
// @access  Private (Admin, Super Admin)
router.post('/register', verifyToken, authorizeRoles('Super Admin', 'Admin'), async (req, res) => {
    const { name, email, phone, password, roleId, courseId, classId, totalFee, dob, gender, city, country, feePaid } = req.body;

    if (!name || !email || !password || !roleId) {
        return res.status(400).json({ message: 'Please provide required fields' });
    }

    // Resolve courseId — accept numeric ID OR CourseCode string (e.g. "DSC2026")
    let resolvedCourseId = null;
    if (courseId) {
        if (!isNaN(String(courseId).trim())) {
            resolvedCourseId = parseInt(courseId);
        } else {
            const [[course]] = await pool.query('SELECT ID FROM Courses WHERE UPPER(CourseCode) = ?', [String(courseId).trim().toUpperCase()]);
            if (!course) return res.status(400).json({ message: `Course code "${courseId}" not found.` });
            resolvedCourseId = course.ID;
        }
    }

    // Resolve classId — accept numeric ID OR BatchCode string (e.g. "BCH001")
    let resolvedClassId = null;
    if (classId) {
        if (!isNaN(String(classId).trim())) {
            resolvedClassId = parseInt(classId);
        } else {
            const [[cls]] = await pool.query('SELECT ID FROM Classes WHERE UPPER(BatchCode) = ?', [String(classId).trim().toUpperCase()]);
            if (cls) resolvedClassId = cls.ID;
        }
    }

    const connection = await pool.getConnection();
    try {
        const [roleResult] = await connection.query('SELECT RoleName FROM Roles WHERE ID = ?', [roleId]);
        if (roleResult.length === 0) return res.status(400).json({ message: 'Invalid Role ID' });

        const roleName = roleResult[0].RoleName;

        if (['Admin', 'Tutor', 'Super Admin'].includes(roleName) && req.user.role !== 'Super Admin') {
            return res.status(403).json({ message: 'You are not authorized to create this role.' });
        }
        if (roleName === 'Student' && !['Super Admin', 'Admin'].includes(req.user.role)) {
            return res.status(403).json({ message: 'You are not authorized to register students.' });
        }

        const [userExists] = await connection.query('SELECT ID FROM Users WHERE Email = ?', [email]);
        if (userExists.length > 0) return res.status(400).json({ message: 'User already exists' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(String(password), salt);

        await connection.beginTransaction();
        try {
            const [insertUserResult] = await connection.query(
                `INSERT INTO Users (Name, Email, Phone, PasswordHash, RoleID, DateOfBirth, Gender, City, Country)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [name, email, phone || null, hashedPassword, roleId, dob || null, gender || null, city || null, country || null]
            );
            const newUserId = insertUserResult.insertId;

            // Auto-generate role-based unique code
            const userCode = await generateUserCode(connection, roleName);
            await connection.query('UPDATE Users SET StudentCode = ? WHERE ID = ?', [userCode, newUserId]);

            // Student: enroll in course and optionally class, record fee
            if (roleName === 'Student' && resolvedCourseId) {
                // Auto-fetch totalFee from course if not provided
                let resolvedTotal = parseFloat(totalFee) || 0;
                if (!resolvedTotal) {
                    const [[courseRow]] = await connection.query('SELECT TotalFee FROM Courses WHERE ID = ?', [resolvedCourseId]);
                    if (courseRow) resolvedTotal = parseFloat(courseRow.TotalFee) || 0;
                }
                // Assign to class (optional)
                if (resolvedClassId) {
                    await connection.query('INSERT INTO ClassStudents (ClassID, StudentID) VALUES (?, ?)', [resolvedClassId, newUserId]);
                }
                // Record fee
                const paid = parseFloat(feePaid) || 0;
                const status = paid >= resolvedTotal && resolvedTotal > 0 ? 'Paid' : paid > 0 ? 'Partial' : 'Pending';
                await connection.query(
                    'INSERT INTO FeeManagement (StudentID, CourseID, TotalFee, AmountPaid, PaymentStatus) VALUES (?, ?, ?, ?, ?)',
                    [newUserId, resolvedCourseId, resolvedTotal, paid, status]
                );
            }

            await connection.commit();
            res.status(201).json({ message: 'User registered successfully', userId: newUserId, userCode });

        } catch (err) {
            await connection.rollback();
            throw err;
        }

    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    } finally {
        connection.release();
    }
});

// @route   GET api/users/my-tutors
// @desc    Get tutors for the logged-in student's classes
// @access  Private (Student)
router.get('/my-tutors', verifyToken, authorizeRoles('Student'), async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT DISTINCT u.ID, u.Name
            FROM Users u
            JOIN Classes c ON c.TutorID = u.ID
            JOIN ClassStudents cs ON cs.ClassID = c.ID
            WHERE cs.StudentID = ?
            ORDER BY u.Name
        `, [req.user.id]);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/users/students
// @desc    Get all students
// @access  Private (Admin, Super Admin, Tutor)
router.get('/students', verifyToken, authorizeRoles('Super Admin', 'Admin', 'Tutor'), async (req, res) => {
    try {
        let query = `
            SELECT u.ID, u.StudentCode, u.Name, u.Email, u.Phone,
                   u.IsActive, u.CollegeName,
                   COALESCE(u.Designation, '') as Designation,
                   COALESCE(u.Organisation, '') as Organisation,
                   COALESCE(u.InterestedDomains, '') as InterestedDomains,
                   fm.CourseID, c.Name as CourseName, c2.BatchName, c2.BatchCode,
                   fm.TotalFee, fm.AmountPaid, fm.PaymentStatus
            FROM Users u
            JOIN Roles r ON u.RoleID = r.ID
            LEFT JOIN ClassStudents cs ON cs.StudentID = u.ID
            LEFT JOIN Classes c2 ON c2.ID = cs.ClassID
            LEFT JOIN Courses c ON c.ID = c2.CourseID
            LEFT JOIN FeeManagement fm ON fm.StudentID = u.ID AND fm.CourseID = c.ID
            WHERE r.RoleName = 'Student'
        `;
        if (req.user.role === 'Tutor') {
            query += ` AND c2.TutorID = ?`;
            const [rows] = await pool.query(query, [req.user.id]);
            return res.json(rows);
        }
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/users/tutors
// @desc    Get all staff (Tutors + Admins) with Staff ID, Email, Role
// @access  Private
router.get('/tutors', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT u.ID, u.StudentCode, u.Name, u.Email, r.RoleName
            FROM Users u
            JOIN Roles r ON u.RoleID = r.ID
            WHERE r.RoleName IN ('Tutor', 'Admin')
            ORDER BY r.RoleName, u.Name
        `);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/users/students/bulk-assign
// @desc    Assign multiple students to a class
// @access  Private (Admin, Super Admin)
router.post('/students/bulk-assign', verifyToken, authorizeRoles('Super Admin', 'Admin'), async (req, res) => {
    const { studentIds, classId, courseId, totalFee } = req.body;
    if (!studentIds || !studentIds.length || !classId || !courseId) {
        return res.status(400).json({ message: 'Provide studentIds, classId, and courseId' });
    }
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        for (const studentId of studentIds) {
            const [existing] = await conn.query('SELECT * FROM ClassStudents WHERE ClassID = ? AND StudentID = ?', [classId, studentId]);
            if (existing.length === 0) {
                await conn.query('INSERT INTO ClassStudents (ClassID, StudentID) VALUES (?, ?)', [classId, studentId]);
                const [feeExists] = await conn.query('SELECT * FROM FeeManagement WHERE StudentID = ? AND CourseID = ?', [studentId, courseId]);
                if (feeExists.length === 0) {
                    await conn.query('INSERT INTO FeeManagement (StudentID, CourseID, TotalFee, AmountPaid, PaymentStatus) VALUES (?, ?, ?, 0.00, "Pending")', [studentId, courseId, totalFee || 0]);
                }
            }
        }
        await conn.commit();
        res.json({ message: 'Students assigned successfully' });
    } catch (err) {
        await conn.rollback();
        console.error(err);
        res.status(500).send('Server Error');
    } finally {
        conn.release();
    }
});

// @route   DELETE api/users/students/:id
// @desc    Delete a student
// @access  Private (Admin, Super Admin)
router.delete('/students/:id', verifyToken, authorizeRoles('Super Admin', 'Admin'), async (req, res) => {
    const studentId = req.params.id;
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        await conn.query('DELETE FROM FeeManagement WHERE StudentID = ?', [studentId]);
        await conn.query('DELETE FROM ClassStudents WHERE StudentID = ?', [studentId]);
        await conn.query('DELETE FROM Submissions WHERE StudentID = ?', [studentId]);
        await conn.query('DELETE FROM Attendance WHERE StudentID = ?', [studentId]);
        const [tickets] = await conn.query('SELECT ID FROM Tickets WHERE StudentID = ?', [studentId]);
        for (const t of tickets) await conn.query('DELETE FROM TicketReplies WHERE TicketID = ?', [t.ID]);
        await conn.query('DELETE FROM Tickets WHERE StudentID = ?', [studentId]);
        await conn.query('DELETE FROM Users WHERE ID = ? AND RoleID = (SELECT ID FROM Roles WHERE RoleName = "Student")', [studentId]);
        await conn.commit();
        res.json({ message: 'Student removed successfully' });
    } catch (err) {
        await conn.rollback();
        console.error(err);
        res.status(500).send('Server Error');
    } finally {
        conn.release();
    }
});

// @route   POST api/users/staff
// @desc    Create a new Staff member (Admin or Tutor)
// @access  Private (Super Admin only)
router.post('/staff', verifyToken, authorizeRoles('Super Admin'), async (req, res) => {
    const { name, email, phone, password, roleId, dob, gender, city, country } = req.body;

    if (!name || !email || !password || !roleId) {
        return res.status(400).json({ message: 'Name, Email, Password and Role are required' });
    }

    const connection = await pool.getConnection();
    try {
        const [existing] = await connection.query('SELECT ID FROM Users WHERE Email = ?', [email]);
        if (existing.length > 0) return res.status(400).json({ message: 'A user with this email already exists' });

        const [[role]] = await connection.query('SELECT RoleName FROM Roles WHERE ID = ?', [roleId]);
        if (!role) return res.status(400).json({ message: 'Invalid Role ID' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await connection.beginTransaction();

        const [result] = await connection.query(
            'INSERT INTO Users (Name, Email, Phone, PasswordHash, RoleID, DateOfBirth, Gender, City, Country) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [name, email, phone || null, hashedPassword, roleId, dob || null, gender || null, city || null, country || null]
        );
        const newUserId = result.insertId;

        const staffCode = await generateUserCode(connection, role.RoleName);
        await connection.query('UPDATE Users SET StudentCode = ? WHERE ID = ?', [staffCode, newUserId]);

        await connection.commit();
        res.status(201).json({ message: 'Staff member created successfully', staffCode });
    } catch (err) {
        await connection.rollback().catch(() => {});
        console.error(err);
        res.status(500).send('Server Error');
    } finally {
        connection.release();
    }
});

// @route   DELETE api/users/staff/:id
// @desc    Delete a staff member (Tutor/Admin)
// @access  Private (Super Admin only)
router.delete('/staff/:id', verifyToken, authorizeRoles('Super Admin'), async (req, res) => {
    const staffId = req.params.id;
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Check if tutor is assigned to any classes
        const [classes] = await connection.query('SELECT ID FROM Classes WHERE TutorID = ?', [staffId]);
        if (classes.length > 0) {
            await connection.rollback();
            return res.status(400).json({ message: 'Cannot delete staff: This tutor is assigned to one or more active classes. Reassign the classes first.' });
        }

        // Handle other dependencies
        await connection.query('DELETE FROM Announcements WHERE UserID = ?', [staffId]);
        await connection.query('DELETE FROM TicketReplies WHERE UserID = ?', [staffId]);
        await connection.query('UPDATE Tickets SET TutorID = NULL WHERE TutorID = ?', [staffId]);
        await connection.query('DELETE FROM Messages WHERE SenderID = ? OR ReceiverID = ?', [staffId, staffId]);

        // Finally delete the user
        const [result] = await connection.query('DELETE FROM Users WHERE ID = ? AND RoleID IN (SELECT ID FROM Roles WHERE RoleName IN ("Tutor", "Admin"))', [staffId]);
        
        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Staff member not found or is not a staff member.' });
        }

        await connection.commit();
        res.json({ message: 'Staff member deleted successfully' });
    } catch (err) {
        await connection.rollback();
        console.error(err);
        res.status(500).send('Server Error');
    } finally {
        connection.release();
    }
});

// @route   PUT api/users/students/:id/activate
// @desc    Activate a student account (Super Admin)
// @access  Private (Super Admin)
router.put('/students/:id/activate', verifyToken, authorizeRoles('Super Admin', 'Admin'), async (req, res) => {
    try {
        await pool.query('UPDATE Users SET IsActive = 1, ActivationToken = NULL WHERE ID = ?', [req.params.id]);
        res.json({ message: 'Account activated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/users/:id
// @desc    Update user profile fields (from website ProfilePage)
// @access  Private
router.put('/:id', verifyToken, async (req, res) => {
    const { Name, Phone, Gender, DateOfBirth, City, Country, CollegeName, interestedDomains } = req.body;
    try {
        // interestedDomains from onboarding survey — save as comma-separated string
        const domainsStr = Array.isArray(interestedDomains)
            ? interestedDomains.join(',')
            : (interestedDomains || null);

        await pool.query(
            `UPDATE Users SET 
                Name = COALESCE(?, Name),
                Phone = COALESCE(?, Phone),
                Gender = COALESCE(?, Gender),
                DateOfBirth = COALESCE(?, DateOfBirth),
                City = COALESCE(?, City),
                Country = COALESCE(?, Country),
                CollegeName = COALESCE(?, CollegeName),
                InterestedDomains = COALESCE(?, InterestedDomains)
            WHERE ID = ?`,
            [Name || null, Phone || null, Gender || null, DateOfBirth || null,
             City || null, Country || null, CollegeName || null,
             domainsStr, req.params.id]
        );
        res.json({ message: 'Profile updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/users/students/:id/change-course
// @desc    Change a student's course/batch assignment
// @access  Private (Super Admin)
router.put('/students/:id/change-course', verifyToken, authorizeRoles('Super Admin'), async (req, res) => {
    const studentId = req.params.id;
    const { courseId, classId, amountPaid } = req.body;

    if (!courseId || !classId) {
        return res.status(400).json({ message: 'courseId and classId are required' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        await connection.query('DELETE FROM ClassStudents WHERE StudentID = ?', [studentId]);
        await connection.query('INSERT INTO ClassStudents (ClassID, StudentID) VALUES (?, ?)', [classId, studentId]);

        const [[course]] = await connection.query('SELECT TotalFee FROM Courses WHERE ID = ?', [courseId]);
        const totalFee = parseFloat(course ? course.TotalFee : 0);

        const paid = parseFloat(amountPaid || 0);
        const safePaid = Math.min(paid, totalFee);
        const status = safePaid >= totalFee && totalFee > 0 ? 'Paid' : safePaid > 0 ? 'Partial' : 'Pending';

        const [existing] = await connection.query('SELECT ID FROM FeeManagement WHERE StudentID = ?', [studentId]);
        if (existing.length > 0) {
            await connection.query(
                'UPDATE FeeManagement SET CourseID = ?, TotalFee = ?, AmountPaid = ?, PaymentStatus = ?, LastUpdated = NOW() WHERE StudentID = ?',
                [courseId, totalFee, safePaid, status, studentId]
            );
        } else {
            await connection.query(
                'INSERT INTO FeeManagement (StudentID, CourseID, TotalFee, AmountPaid, PaymentStatus) VALUES (?, ?, ?, ?, ?)',
                [studentId, courseId, totalFee, safePaid, status]
            );
        }

        await connection.commit();
        res.json({ message: 'Course changed successfully', paymentStatus: status });
    } catch (err) {
        await connection.rollback();
        console.error(err);
        res.status(500).send('Server Error');
    } finally {
        connection.release();
    }
});

// @route   PUT api/users/profile
// @desc    Update editable user profile fields
// @access  Private
router.put('/profile', verifyToken, async (req, res) => {
    const { dateOfBirth, gender, city, country, collegeName } = req.body;
    try {
        await pool.query(
            `UPDATE Users SET DateOfBirth = ?, Gender = ?, City = ?, Country = ?, CollegeName = ? WHERE ID = ?`,
            [dateOfBirth || null, gender || null, city || null, country || null, collegeName || null, req.user.id]
        );
        res.json({ message: 'Profile updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/users/change-password
// @desc    Change password for logged in user
// @access  Private
router.put('/change-password', verifyToken, async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Both current and new passwords are required' });
    }

    try {
        const [rows] = await pool.query(`SELECT PasswordHash FROM Users WHERE ID = ?`, [req.user.id]);
        if (rows.length === 0) return res.status(404).json({ message: 'User not found' });

        const isMatch = await bcrypt.compare(currentPassword, rows[0].PasswordHash);
        if (!isMatch) return res.status(400).json({ message: 'Incorrect current password' });

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(newPassword, salt);
        await pool.query(`UPDATE Users SET PasswordHash = ? WHERE ID = ?`, [hash, req.user.id]);

        res.json({ message: 'Password changed successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
