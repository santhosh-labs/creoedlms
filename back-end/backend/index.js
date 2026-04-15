const dns = require('dns');
if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
}
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const PORT = process.env.PORT || 7860;
const { connectDB } = require('./config/db');

const app = express();

// Connect Database
connectDB();

// Init Middleware
app.set('trust proxy', 1); // Trust first proxy (Hugging Face / Vercel)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors()); // Allow all origins for Vercel/Spaces connectivity
// Serve uploaded files (chat images, etc.) as static assets
app.use('/uploads', express.static(require('path').join(__dirname, 'uploads')));

// Define Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/modules', require('./routes/modules'));
app.use('/api/assignments', require('./routes/assignments'));
app.use('/api/quizzes', require('./routes/quizzes'));
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/tickets', require('./routes/tickets'));
app.use('/api/fees', require('./routes/fees'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/progress', require('./routes/progress'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/backup', require('./routes/backup'));
app.use('/api/coupons', require('./routes/coupons'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/subscribe', require('./routes/subscribe'));
app.use('/api/payments', require('./routes/payments'));



app.get('/', (req, res) => res.send('Creoed LMS API Running'));

// Emergency DB Fix Endpoint (Internal Use)
app.get('/api/fix-db', async (req, res) => {
    const { pool } = require('./config/db');
    const tables = [
        'Roles', 'Users', 'Courses', 'Classes', 'Modules', 
        'Lessons', 'Assignments', 'Submissions', 'Sessions', 
        'Attendance', 'Tickets', 'TicketReplies', 'Announcements', 'FeeManagement'
    ];
    let results = [];
    try {
        for (const table of tables) {
            try {
                await pool.query(`ALTER TABLE ${table} MODIFY COLUMN ID INT AUTO_INCREMENT;`);
                results.push(`✅ ${table}: Fixed`);
            } catch (err) {
                results.push(`❌ ${table}: ${err.message}`);
            }
        }
        res.json({ message: "Fix process completed", results });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server started on port ${PORT}`);
    console.log(`Binding to 0.0.0.0 for Hugging Face Spaces compatibility`);
});
