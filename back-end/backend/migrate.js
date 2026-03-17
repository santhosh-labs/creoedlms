const { pool } = require('./config/db');

async function run() {
    await pool.query(`CREATE TABLE IF NOT EXISTS Quizzes (
        ID INT PRIMARY KEY AUTO_INCREMENT,
        ModuleID INT NOT NULL,
        Title VARCHAR(150) NOT NULL,
        Description TEXT,
        TotalMarks INT DEFAULT 0,
        CreatedAt DATETIME DEFAULT NOW(),
        FOREIGN KEY (ModuleID) REFERENCES Modules(ID) ON DELETE CASCADE
    )`);

    await pool.query(`CREATE TABLE IF NOT EXISTS QuizQuestions (
        ID INT PRIMARY KEY AUTO_INCREMENT,
        QuizID INT NOT NULL,
        Question TEXT NOT NULL,
        OptionA VARCHAR(255) NOT NULL,
        OptionB VARCHAR(255) NOT NULL,
        OptionC VARCHAR(255),
        OptionD VARCHAR(255),
        CorrectOption CHAR(1) NOT NULL,
        Marks INT DEFAULT 1,
        FOREIGN KEY (QuizID) REFERENCES Quizzes(ID) ON DELETE CASCADE
    )`);

    await pool.query(`CREATE TABLE IF NOT EXISTS QuizAttempts (
        ID INT PRIMARY KEY AUTO_INCREMENT,
        QuizID INT NOT NULL,
        StudentID INT NOT NULL,
        Score INT DEFAULT 0,
        TotalMarks INT NOT NULL,
        AttemptedAt DATETIME DEFAULT NOW(),
        FOREIGN KEY (QuizID) REFERENCES Quizzes(ID) ON DELETE CASCADE,
        FOREIGN KEY (StudentID) REFERENCES Users(ID) ON DELETE CASCADE
    )`);

    await pool.query(`CREATE TABLE IF NOT EXISTS QuizAnswers (
        ID INT PRIMARY KEY AUTO_INCREMENT,
        AttemptID INT NOT NULL,
        QuestionID INT NOT NULL,
        SelectedOption CHAR(1),
        IsCorrect TINYINT(1) DEFAULT 0,
        FOREIGN KEY (AttemptID) REFERENCES QuizAttempts(ID) ON DELETE CASCADE,
        FOREIGN KEY (QuestionID) REFERENCES QuizQuestions(ID) ON DELETE CASCADE
    )`);

    // Add ModuleID to Sessions table (links session to a specific module)
    await pool.query('ALTER TABLE Sessions ADD COLUMN ModuleID INT NULL')
        .catch(e => e.code === 'ER_DUP_FIELDNAME' ? null : Promise.reject(e));

    console.log('✓ All quiz + attendance tables ready');
    process.exit(0);
}

run().catch(e => { console.error('ERR:', e.message); process.exit(1); });
