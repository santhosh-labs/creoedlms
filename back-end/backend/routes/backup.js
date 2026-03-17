const express = require('express');
const router = express.Router();
const { verifyToken, authorizeRoles } = require('../middleware/auth');
const { pool } = require('../config/db');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const BACKUP_DIR = path.join(__dirname, '..', 'backups');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// ─── Programmatic DB Dump (no mysqldump needed) ─────────────────────────────
async function generateSqlDump() {
    let sql = `-- Creoed LMS Database Backup\n-- Generated: ${new Date().toISOString()}\n-- --------------------------------------------------------\n\n`;
    sql += `SET FOREIGN_KEY_CHECKS=0;\n\n`;

    // Get all table names
    const [tables] = await pool.query(`SHOW TABLES`);
    const tableKey = Object.keys(tables[0])[0]; // column name varies by db name

    for (const tableRow of tables) {
        const tableName = tableRow[tableKey];

        // Get CREATE TABLE statement
        const [[createRow]] = await pool.query(`SHOW CREATE TABLE \`${tableName}\``);
        const createStmt = createRow['Create Table'];
        sql += `-- Table: ${tableName}\n`;
        sql += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
        sql += `${createStmt};\n\n`;

        // Get all rows
        const [rows] = await pool.query(`SELECT * FROM \`${tableName}\``);
        if (rows.length > 0) {
            const cols = Object.keys(rows[0]).map(c => `\`${c}\``).join(', ');
            const valuesSql = rows.map(row => {
                const vals = Object.values(row).map(v => {
                    if (v === null) return 'NULL';
                    if (v instanceof Date) return `'${v.toISOString().replace('T', ' ').replace('Z', '').substring(0, 19)}'`;
                    if (typeof v === 'number') return v;
                    return `'${String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n')}'`;
                }).join(', ');
                return `(${vals})`;
            }).join(',\n  ');
            sql += `INSERT INTO \`${tableName}\` (${cols}) VALUES\n  ${valuesSql};\n\n`;
        }
    }

    sql += `SET FOREIGN_KEY_CHECKS=1;\n`;
    return sql;
}

// @route   GET /api/backup/list
// @desc    List all available backups
// @access  Admin, Super Admin
router.get('/list', verifyToken, authorizeRoles('Admin', 'Super Admin'), (req, res) => {
    try {
        const files = fs.readdirSync(BACKUP_DIR)
            .filter(f => f.endsWith('.zip'))
            .map(f => {
                const stat = fs.statSync(path.join(BACKUP_DIR, f));
                return { filename: f, sizeBytes: stat.size, createdAt: stat.birthtime };
            })
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        res.json(files);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to list backups' });
    }
});

// @route   POST /api/backup/create
// @desc    Create a full backup (programmatic DB dump + full codebase zip)
// @access  Admin, Super Admin
router.post('/create', verifyToken, authorizeRoles('Admin', 'Super Admin'), async (req, res) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `backup_${timestamp}`;
    const backupPath = path.join(BACKUP_DIR, `${backupName}.zip`);

    try {
        // 1. Generate DB dump via pool queries (no cli tool needed)
        console.log('Generating database dump...');
        const sqlContent = await generateSqlDump();

        // 2. Create ZIP archive
        await new Promise((resolve, reject) => {
            const output = fs.createWriteStream(backupPath);
            const archive = archiver('zip', { zlib: { level: 6 } });

            output.on('close', resolve);
            archive.on('error', reject);
            archive.pipe(output);

            // Add database_dump.sql from memory
            archive.append(sqlContent, { name: 'database_dump.sql' });

            // Add backend code (excluding node_modules and backups folder)
            const backendDir = path.join(__dirname, '..');
            archive.glob('**/*', {
                cwd: backendDir,
                ignore: ['node_modules/**', 'backups/**', '*.zip'],
                dot: true,
            }, { prefix: 'backend' });

            // Add frontend src code (excluding node_modules/dist)
            const frontendDir = path.join(__dirname, '..', '..', 'frontend');
            if (fs.existsSync(frontendDir)) {
                archive.glob('**/*', {
                    cwd: frontendDir,
                    ignore: ['node_modules/**', 'dist/**', '.vite/**'],
                    dot: true,
                }, { prefix: 'frontend' });
            }

            archive.finalize();
        });

        const stat = fs.statSync(backupPath);
        res.json({
            message: 'Full backup created successfully (database + backend + frontend)',
            filename: `${backupName}.zip`,
            sizeBytes: stat.size,
            createdAt: stat.birthtime,
            dbIncluded: true,
        });
    } catch (err) {
        console.error('Backup error:', err);
        if (fs.existsSync(backupPath)) fs.unlinkSync(backupPath);
        res.status(500).json({ message: 'Failed to create backup: ' + err.message });
    }
});

// @route   GET /api/backup/download/:filename
// @desc    Download a backup zip
// @access  Admin, Super Admin
router.get('/download/:filename', verifyToken, authorizeRoles('Admin', 'Super Admin'), (req, res) => {
    const filename = path.basename(req.params.filename);
    const filePath = path.join(BACKUP_DIR, filename);

    if (!fs.existsSync(filePath) || !filename.endsWith('.zip')) {
        return res.status(404).json({ message: 'Backup file not found' });
    }

    res.download(filePath, filename);
});

// @route   DELETE /api/backup/:filename
// @desc    Delete a backup
// @access  Super Admin only
router.delete('/:filename', verifyToken, authorizeRoles('Super Admin'), (req, res) => {
    const filename = path.basename(req.params.filename);
    const filePath = path.join(BACKUP_DIR, filename);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'Backup not found' });
    }

    try {
        fs.unlinkSync(filePath);
        res.json({ message: 'Backup deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to delete backup' });
    }
});

module.exports = router;
