require('dotenv').config();
const mysql = require('mysql2/promise');

async function addImageColumn() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 4000,
        ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true }
    });

    try {
        console.log("Adding Image column to Courses table...");
        await connection.query('ALTER TABLE Courses ADD COLUMN Image LONGTEXT NULL;');
        console.log("Column added successfully!");
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log("Column 'Image' already exists.");
        } else {
            console.error("Error:", err);
        }
    } finally {
        await connection.end();
    }
}

addImageColumn();
