const { pool } = require('./config/db');

async function migrate() {
    try {
        console.log('Running new migrations...');

        // 1. Lesson Progress Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS LessonProgress (
                ID INT AUTO_INCREMENT PRIMARY KEY,
                StudentID INT NOT NULL,
                ClassID INT NOT NULL,
                LessonID INT NOT NULL,
                IsCompleted BOOLEAN DEFAULT TRUE,
                CompletedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (StudentID) REFERENCES Users(ID) ON DELETE CASCADE,
                FOREIGN KEY (ClassID) REFERENCES Classes(ID) ON DELETE CASCADE,
                FOREIGN KEY (LessonID) REFERENCES Lessons(ID) ON DELETE CASCADE,
                UNIQUE KEY unique_progress (StudentID, LessonID)
            );
        `);
        console.log('✅ LessonProgress table verified/created.');

        // 2. Direct Messages Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS Messages (
                ID INT AUTO_INCREMENT PRIMARY KEY,
                SenderID INT NOT NULL,
                ReceiverID INT NOT NULL,
                Message TEXT NOT NULL,
                IsRead BOOLEAN DEFAULT FALSE,
                SentAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (SenderID) REFERENCES Users(ID) ON DELETE CASCADE,
                FOREIGN KEY (ReceiverID) REFERENCES Users(ID) ON DELETE CASCADE
            );
        `);
        console.log('✅ Messages table verified/created.');

        console.log('🎉 All migrations finished successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}
migrate();
