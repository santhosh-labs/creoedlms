const { pool } = require('./config/db');

async function migrate() {
    try {
        console.log("--- Starting TiDB Schema Migration (Adding AUTO_INCREMENT) ---");
        
        await pool.query('SET FOREIGN_KEY_CHECKS = 0;');

        const tablesToRemove = [
            'TicketReplies', 'Tickets', 'Attendance', 'Sessions', 
            'Submissions', 'Assignments', 'Lessons', 'Modules', 
            'ClassStudents', 'Classes', 'FeeManagement', 'Courses',
            'Users', 'Roles', 'LessonProgress', 'Messages', 'QuizAnswers', 'QuizAttempts', 'QuizQuestions', 'Quizzes'
        ];

        // We will do this carefully for each table.
        // For efficiency, I will just recreate the core tables that usually need auto_increment.
        
        const schema = {
            'Roles': 'CREATE TABLE Roles_new (ID INT PRIMARY KEY AUTO_INCREMENT, RoleName VARCHAR(50) NOT NULL UNIQUE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;',
            
            'Users': `CREATE TABLE Users_new (
                ID int(11) NOT NULL AUTO_INCREMENT,
                Name varchar(100) NOT NULL,
                Email varchar(100) NOT NULL,
                Phone varchar(20) DEFAULT NULL,
                PasswordHash varchar(255) NOT NULL,
                RoleID int(11) NOT NULL,
                CreatedAt datetime DEFAULT current_timestamp(),
                ResetToken varchar(255) DEFAULT NULL,
                ResetTokenExpiry datetime DEFAULT NULL,
                DateOfBirth date DEFAULT NULL,
                Gender varchar(50) DEFAULT NULL,
                City varchar(150) DEFAULT NULL,
                Country varchar(150) DEFAULT NULL,
                StudentCode varchar(50) DEFAULT NULL,
                CollegeName varchar(200) DEFAULT NULL,
                PRIMARY KEY (ID),
                UNIQUE KEY Email (Email),
                UNIQUE KEY StudentCode (StudentCode),
                KEY RoleID (RoleID)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

            'Courses': `CREATE TABLE Courses_new (
                ID int(11) NOT NULL AUTO_INCREMENT,
                Name varchar(150) NOT NULL,
                Description text DEFAULT NULL,
                TotalFee decimal(10,2) NOT NULL,
                CreatedAt datetime DEFAULT current_timestamp(),
                CourseCode varchar(50) DEFAULT NULL,
                PRIMARY KEY (ID),
                UNIQUE KEY CourseCode (CourseCode)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

            'Classes': `CREATE TABLE Classes_new (
                ID int(11) NOT NULL AUTO_INCREMENT,
                CourseID int(11) NOT NULL,
                TutorID int(11) NOT NULL,
                BatchName varchar(100) NOT NULL,
                CreatedAt datetime DEFAULT current_timestamp(),
                BatchCode varchar(50) DEFAULT NULL,
                PRIMARY KEY (ID),
                UNIQUE KEY BatchCode (BatchCode)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

            'Modules': `CREATE TABLE Modules_new (
                ID int(11) NOT NULL AUTO_INCREMENT,
                ClassID int(11) NOT NULL,
                Title varchar(150) NOT NULL,
                Description text DEFAULT NULL,
                CreatedAt datetime DEFAULT current_timestamp(),
                PRIMARY KEY (ID)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

            'Lessons': `CREATE TABLE Lessons_new (
                ID int(11) NOT NULL AUTO_INCREMENT,
                ModuleID int(11) NOT NULL,
                Title varchar(150) NOT NULL,
                Type varchar(50) NOT NULL,
                ContentUrl varchar(255) NOT NULL,
                CreatedAt datetime DEFAULT current_timestamp(),
                PRIMARY KEY (ID)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

            'Assignments': `CREATE TABLE Assignments_new (
                ID int(11) NOT NULL AUTO_INCREMENT,
                ModuleID int(11) NOT NULL,
                Title varchar(150) NOT NULL,
                Description text DEFAULT NULL,
                DueDate datetime DEFAULT NULL,
                AttachmentInstructions text DEFAULT NULL,
                CreatedAt datetime DEFAULT current_timestamp(),
                PRIMARY KEY (ID)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

            'Submissions': `CREATE TABLE Submissions_new (
                ID int(11) NOT NULL AUTO_INCREMENT,
                AssignmentID int(11) NOT NULL,
                StudentID int(11) NOT NULL,
                FileUrl varchar(255) NOT NULL,
                Grade decimal(5,2) DEFAULT NULL,
                Feedback text DEFAULT NULL,
                SubmittedAt datetime DEFAULT current_timestamp(),
                Status varchar(20) DEFAULT 'Submitted',
                PRIMARY KEY (ID)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

            'Sessions': `CREATE TABLE Sessions_new (
                ID int(11) NOT NULL AUTO_INCREMENT,
                ClassID int(11) NOT NULL,
                Title varchar(150) NOT NULL,
                SessionDate date NOT NULL,
                SessionTime time NOT NULL,
                MeetingLink varchar(255) NOT NULL,
                CreatedAt datetime DEFAULT current_timestamp(),
                ModuleID int(11) DEFAULT NULL,
                PRIMARY KEY (ID)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

            'Attendance': `CREATE TABLE Attendance_new (
                ID int(11) NOT NULL AUTO_INCREMENT,
                SessionID int(11) NOT NULL,
                StudentID int(11) NOT NULL,
                Status varchar(20) NOT NULL DEFAULT 'Present',
                RecordedAt datetime DEFAULT current_timestamp(),
                PRIMARY KEY (ID)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

            'Tickets': `CREATE TABLE Tickets_new (
                ID int(11) NOT NULL AUTO_INCREMENT,
                StudentID int(11) NOT NULL,
                TutorID int(11) DEFAULT NULL,
                Subject varchar(150) NOT NULL,
                Description text NOT NULL,
                AttachmentUrl varchar(255) DEFAULT NULL,
                Status varchar(20) NOT NULL DEFAULT 'Open',
                CreatedAt datetime DEFAULT current_timestamp(),
                PRIMARY KEY (ID)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

            'TicketReplies': `CREATE TABLE TicketReplies_new (
                ID int(11) NOT NULL AUTO_INCREMENT,
                TicketID int(11) NOT NULL,
                UserID int(11) NOT NULL,
                Message text NOT NULL,
                CreatedAt datetime DEFAULT current_timestamp(),
                PRIMARY KEY (ID)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

            'Announcements': `CREATE TABLE Announcements_new (
                ID int(11) NOT NULL AUTO_INCREMENT,
                UserID int(11) NOT NULL,
                TargetType varchar(20) NOT NULL,
                TargetClassID int(11) DEFAULT NULL,
                Title varchar(150) NOT NULL,
                Message text NOT NULL,
                CreatedAt datetime DEFAULT current_timestamp(),
                ActionLabel varchar(50) DEFAULT NULL,
                ActionLink varchar(255) DEFAULT NULL,
                PRIMARY KEY (ID)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

            'FeeManagement': `CREATE TABLE FeeManagement_new (
                ID int(11) NOT NULL AUTO_INCREMENT,
                StudentID int(11) NOT NULL,
                CourseID int(11) NOT NULL,
                TotalFee decimal(10,2) NOT NULL,
                AmountPaid decimal(10,2) NOT NULL DEFAULT 0.00,
                PaymentStatus varchar(20) NOT NULL DEFAULT 'Pending',
                LastUpdated datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
                PRIMARY KEY (ID)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

            'LessonProgress': `CREATE TABLE LessonProgress_new (
                ID int(11) NOT NULL AUTO_INCREMENT,
                StudentID int(11) NOT NULL,
                ClassID int(11) NOT NULL,
                LessonID int(11) NOT NULL,
                IsCompleted tinyint(1) DEFAULT 1,
                CompletedAt timestamp NOT NULL DEFAULT current_timestamp(),
                PRIMARY KEY (ID),
                UNIQUE KEY unique_progress (StudentID, LessonID)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

            'Messages': `CREATE TABLE Messages_new (
                ID int(11) NOT NULL AUTO_INCREMENT,
                SenderID int(11) NOT NULL,
                ReceiverID int(11) NOT NULL,
                Message text NOT NULL,
                ImageUrl varchar(500) DEFAULT NULL,
                IsRead tinyint(1) DEFAULT 0,
                SentAt timestamp NOT NULL DEFAULT current_timestamp(),
                PRIMARY KEY (ID)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

            'Quizzes': `CREATE TABLE Quizzes_new (
                ID int(11) NOT NULL AUTO_INCREMENT,
                ModuleID int(11) NOT NULL,
                Title varchar(150) NOT NULL,
                Description text DEFAULT NULL,
                TotalMarks int(11) DEFAULT 0,
                CreatedAt datetime DEFAULT current_timestamp(),
                PRIMARY KEY (ID)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

            'QuizQuestions': `CREATE TABLE QuizQuestions_new (
                ID int(11) NOT NULL AUTO_INCREMENT,
                QuizID int(11) NOT NULL,
                Question text NOT NULL,
                OptionA varchar(255) NOT NULL,
                OptionB varchar(255) NOT NULL,
                OptionC varchar(255) DEFAULT NULL,
                OptionD varchar(255) DEFAULT NULL,
                CorrectOption char(1) NOT NULL,
                Marks int(11) DEFAULT 1,
                PRIMARY KEY (ID)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

            'QuizAttempts': `CREATE TABLE QuizAttempts_new (
                ID int(11) NOT NULL AUTO_INCREMENT,
                QuizID int(11) NOT NULL,
                StudentID int(11) NOT NULL,
                Score int(11) DEFAULT 0,
                TotalMarks int(11) NOT NULL,
                AttemptedAt datetime DEFAULT current_timestamp(),
                PRIMARY KEY (ID)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

            'QuizAnswers': `CREATE TABLE QuizAnswers_new (
                ID int(11) NOT NULL AUTO_INCREMENT,
                AttemptID int(11) NOT NULL,
                QuestionID int(11) NOT NULL,
                SelectedOption char(1) DEFAULT NULL,
                IsCorrect tinyint(1) DEFAULT 0,
                PRIMARY KEY (ID)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
        };

        for (const [table, createSql] of Object.entries(schema)) {
            console.log(`Migrating ${table}...`);
            try {
                // 1. Create new table
                await pool.query(createSql);
                
                // 2. Copy data if any
                const [check] = await pool.query(`SHOW TABLES LIKE '${table}'`);
                if (check.length > 0) {
                    await pool.query(`INSERT INTO ${table}_new SELECT * FROM ${table}`);
                }
                
                // 3. Drop old table
                await pool.query(`DROP TABLE IF EXISTS ${table}`);
                
                // 4. Rename new to old
                await pool.query(`RENAME TABLE ${table}_new TO ${table}`);
                
                console.log(`✅ ${table} migrated.`);
            } catch (err) {
                console.log(`❌ ${table} migration failed:`, err.message);
            }
        }

        // Add back foreign keys (simplified)
        console.log("Adding essentials constraints...");
        try {
            await pool.query('ALTER TABLE Users ADD CONSTRAINT fk_users_role FOREIGN KEY (RoleID) REFERENCES Roles(ID)');
            await pool.query('ALTER TABLE Classes ADD CONSTRAINT fk_classes_course FOREIGN KEY (CourseID) REFERENCES Courses(ID)');
            await pool.query('ALTER TABLE Classes ADD CONSTRAINT fk_classes_tutor FOREIGN KEY (TutorID) REFERENCES Users(ID)');
            // Other constraints could be added here if needed.
        } catch (fkErr) {
            console.log("Non-critical FK error:", fkErr.message);
        }

        await pool.query('SET FOREIGN_KEY_CHECKS = 1;');
        console.log("--- Migration Complete ---");

    } catch (err) {
        console.error("Critical error:", err);
    } finally {
        process.exit();
    }
}

migrate();
