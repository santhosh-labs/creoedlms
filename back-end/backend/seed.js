const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function seed() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        console.log('Connecting to database...');

        // Ensure default roles exist
        await pool.query(`INSERT IGNORE INTO Roles (RoleName) VALUES ('Super Admin'), ('Admin'), ('Tutor'), ('Student')`);

        // Fetch Role IDs
        const [roles] = await pool.query('SELECT ID, RoleName FROM Roles');
        const roleMap = {};
        roles.forEach(r => roleMap[r.RoleName] = r.ID);

        const salt = await bcrypt.genSalt(10);
        const pass = await bcrypt.hash('password123', salt);

        const testUsers = [
            { name: 'Super Admin User', email: 'super@creoed.com', roleId: roleMap['Super Admin'] },
            { name: 'Admin User', email: 'admin@creoed.com', roleId: roleMap['Admin'] },
            { name: 'Tutor User', email: 'tutor@creoed.com', roleId: roleMap['Tutor'] },
            { name: 'Student User', email: 'student@creoed.com', roleId: roleMap['Student'] }
        ];

        for (const user of testUsers) {
            // Check if user already exists
            const [existing] = await pool.query('SELECT ID FROM Users WHERE Email = ?', [user.email]);
            if (existing.length === 0) {
                await pool.query('INSERT INTO Users (Name, Email, PasswordHash, RoleID) VALUES (?, ?, ?, ?)',
                    [user.name, user.email, pass, user.roleId]);
                console.log(`Created user: ${user.email} (Role: ${Object.keys(roleMap).find(key => roleMap[key] === user.roleId)})`);
            } else {
                console.log(`User ${user.email} already exists. Skipping.`);
            }
        }

        console.log('\\n--- Seed Complete ---');
        console.log('You can now log in using the following credentials:');
        console.log('Email: admin@creoed.com  | Password: password123');
        console.log('Email: super@creoed.com  | Password: password123');
        console.log('Email: tutor@creoed.com  | Password: password123');
        console.log('Email: student@creoed.com| Password: password123');

    } catch (err) {
        console.error('Seed Error:', err);
    } finally {
        pool.end();
    }
}

seed();
