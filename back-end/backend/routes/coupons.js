const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

// @route   POST api/coupons/validate-public
// @desc    Validate a coupon and return its discount percentage
// @access  Public 
router.post('/validate-public', async (req, res) => {
    const { couponCode } = req.body;
    if (!couponCode) return res.status(400).json({ message: 'Missing coupon code' });

    try {
        const [coupons] = await pool.query('SELECT * FROM Coupons WHERE Code = ? AND IsActive = 1', [couponCode]);
        if (coupons.length === 0) return res.status(400).json({ message: 'Invalid or inactive coupon' });
        
        const coupon = coupons[0];
        if (coupon.UsageCount >= coupon.UsageLimit) return res.status(400).json({ message: 'Coupon usage limit reached' });
        if (coupon.ValidUntil && new Date() > new Date(coupon.ValidUntil)) return res.status(400).json({ message: 'Coupon has expired' });

        res.json({ success: true, discountPercentage: parseFloat(coupon.DiscountPercentage), id: coupon.ID });
    } catch(err) {
        console.error(err);
        res.status(500).json({ message: 'Server Issue' });
    }
});

// @route   POST api/coupons/apply-public
// @desc    Apply a coupon during the public eCommerce checkout
// @access  Public
router.post('/apply-public', async (req, res) => {
    const { studentCode, courseId, couponCode } = req.body;

    if (!studentCode || !courseId || !couponCode) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Validate the coupon
        const [coupons] = await connection.query(
            'SELECT * FROM Coupons WHERE Code = ? AND IsActive = 1 FOR UPDATE',
            [couponCode]
        );

        if (coupons.length === 0) {
            await connection.rollback();
            return res.status(400).json({ message: 'Invalid or inactive coupon' });
        }

        const coupon = coupons[0];

        if (coupon.UsageCount >= coupon.UsageLimit) {
            await connection.rollback();
            return res.status(400).json({ message: 'Coupon usage limit reached' });
        }

        if (coupon.ValidUntil && new Date() > new Date(coupon.ValidUntil)) {
            await connection.rollback();
            return res.status(400).json({ message: 'Coupon has expired' });
        }

        // 2. Locate the student
        const [users] = await connection.query('SELECT ID FROM Users WHERE StudentCode = ?', [studentCode]);
        if (users.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Student not found' });
        }
        const studentId = users[0].ID;

        // 3. Mark the transaction as paid (only 100% discount supported currently per req)
        if (parseFloat(coupon.DiscountPercentage) === 100) {
            // Update FeeManagement
            const [feeCheck] = await connection.query('SELECT * FROM FeeManagement WHERE StudentID = ? AND CourseID = ?', [studentId, courseId]);
            
            if (feeCheck.length > 0) {
                await connection.query(
                    'UPDATE FeeManagement SET AmountPaid = TotalFee, PaymentStatus = "Paid" WHERE StudentID = ? AND CourseID = ?',
                    [studentId, courseId]
                );
            } else {
                // Failsafe in case Fee row didn't exist
                const [courseRows] = await connection.query('SELECT TotalFee FROM Courses WHERE ID = ?', [courseId]);
                const totalFee = courseRows[0] ? parseFloat(courseRows[0].TotalFee) : 0;
                // Since 100% discount, AmountPaid is 0, but TotalFee is recorded (or AmountPaid=totalFee depending on ledger preference). We'll set AmountPaid to 0. 
                // Wait, previous logic set AmountPaid to totalFee to mark it "Paid". Let's keep it 0 or totalFee. We'll set AmountPaid to 0 but status 'Completed' (100% scholarship).
                await connection.query(
                    'INSERT INTO FeeManagement (StudentID, CourseID, TotalFee, AmountPaid, PaymentStatus) VALUES (?, ?, ?, ?, "Completed")',
                    [studentId, courseId, totalFee, 0]
                );
            }

            // Enroll them in the latest/active batch for this course automatically
            const [classes] = await connection.query('SELECT ID FROM Classes WHERE CourseID = ? ORDER BY CreatedAt DESC LIMIT 1', [courseId]);
            if (classes.length > 0) {
                const classId = classes[0].ID;
                const [enrollCheck] = await connection.query('SELECT * FROM ClassStudents WHERE ClassID = ? AND StudentID = ?', [classId, studentId]);
                if (enrollCheck.length === 0) {
                    await connection.query('INSERT INTO ClassStudents (ClassID, StudentID) VALUES (?, ?)', [classId, studentId]);
                }
            }
        } else {
            // If we ever allow partial coupons, logic goes here
             await connection.rollback();
             return res.status(400).json({ message: 'Only 100% free coupons are currently supported via the website.' });
        }

        // 4. Update coupon usage
        await connection.query(
            'UPDATE Coupons SET UsageCount = UsageCount + 1 WHERE ID = ?',
            [coupon.ID]
        );

        // 5. Log history
        await connection.query(
            'INSERT INTO CouponUsage (CouponID, StudentID, CourseID) VALUES (?, ?, ?)',
            [coupon.ID, studentId, courseId]
        );

        await connection.commit();
        res.json({ message: 'Coupon applied successfully and course unlocked!', success: true });

    } catch (err) {
        await connection.rollback();
        console.error(err);
        res.status(500).json({ message: 'Server Issue' });
    } finally {
        connection.release();
    }
});

// @route   GET api/coupons
// @desc    Get all coupons
// @access  Private (Admin, Super Admin)
router.get('/', verifyToken, authorizeRoles('Admin', 'Super Admin'), async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM Coupons ORDER BY CreatedAt DESC');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/coupons/logs
// @desc    Get coupon usage history logs
// @access  Private (Admin, Super Admin)
router.get('/logs', verifyToken, authorizeRoles('Admin', 'Super Admin'), async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT cu.ID, c.Code, u.Name as StudentName, u.StudentCode, 
                   co.Name as CourseName, cu.UsedAt, c.DiscountPercentage
            FROM CouponUsage cu
            JOIN Coupons c ON cu.CouponID = c.ID
            JOIN Users u ON cu.StudentID = u.ID
            JOIN Courses co ON cu.CourseID = co.ID
            ORDER BY cu.UsedAt DESC
        `);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/coupons
// @desc    Create a new coupon
// @access  Private (Admin, Super Admin)
router.post('/', verifyToken, authorizeRoles('Admin', 'Super Admin'), async (req, res) => {
    const { code, discountPercentage, usageLimit, validUntil } = req.body;
    
    if (!code) return res.status(400).json({ message: 'Coupon code is required' });

    try {
        await pool.query(
            'INSERT INTO Coupons (Code, DiscountPercentage, UsageLimit, ValidUntil) VALUES (?, ?, ?, ?)',
            [code.toUpperCase(), discountPercentage || 100, usageLimit || 1, validUntil || null]
        );
        res.status(201).json({ message: 'Coupon Created successfully' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
             return res.status(400).json({ message: 'Coupon code already exists' });
        }
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/coupons/:id
// @desc    Toggle coupon status
// @access  Private (Admin, Super Admin)
router.put('/:id', verifyToken, authorizeRoles('Admin', 'Super Admin'), async (req, res) => {
    const { isActive } = req.body;
    try {
        await pool.query('UPDATE Coupons SET IsActive = ? WHERE ID = ?', [isActive, req.params.id]);
        res.json({ message: 'Status updated' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
