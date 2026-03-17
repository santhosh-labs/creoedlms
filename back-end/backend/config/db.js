const mysql = require('mysql2/promise');
require('dotenv').config();

// Create connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 4000,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: { rejectUnauthorized: true }
});

const connectDB = async () => {
    try {
        const connection = await pool.getConnection();
        await connection.query("SET SESSION sql_mode=(SELECT REPLACE(@@sql_mode,'ONLY_FULL_GROUP_BY',''))");
        console.log('TiDB Cloud Database connected successfully');
        connection.release();
    } catch (err) {
        console.error('TiDB Connection Failed:', err.message);
        console.log('Ensure your TiDB Cloud cluster is active and credentials in .env are correct.');
    }
};

module.exports = { pool, connectDB };
