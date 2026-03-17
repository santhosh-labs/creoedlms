-- Microsoft SQL Server Database Schema for Creoed LMS

CREATE TABLE Roles (
    ID INT PRIMARY KEY IDENTITY(1,1),
    RoleName VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO Roles (RoleName) VALUES ('Super Admin'), ('Admin'), ('Tutor'), ('Student');

CREATE TABLE Users (
    ID INT PRIMARY KEY IDENTITY(1,1),
    Name VARCHAR(100) NOT NULL,
    Email VARCHAR(100) NOT NULL UNIQUE,
    Phone VARCHAR(20),
    PasswordHash VARCHAR(255) NOT NULL,
    RoleID INT NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (RoleID) REFERENCES Roles(ID)
);

CREATE TABLE Courses (
    ID INT PRIMARY KEY IDENTITY(1,1),
    Name VARCHAR(150) NOT NULL,
    Description TEXT,
    TotalFee DECIMAL(10, 2) NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE()
);

CREATE TABLE Classes (
    ID INT PRIMARY KEY IDENTITY(1,1),
    CourseID INT NOT NULL,
    TutorID INT NOT NULL,
    BatchName VARCHAR(100) NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (CourseID) REFERENCES Courses(ID),
    FOREIGN KEY (TutorID) REFERENCES Users(ID)
);

CREATE TABLE ClassStudents (
    ClassID INT NOT NULL,
    StudentID INT NOT NULL,
    AssignedAt DATETIME DEFAULT GETDATE(),
    PRIMARY KEY (ClassID, StudentID),
    FOREIGN KEY (ClassID) REFERENCES Classes(ID),
    FOREIGN KEY (StudentID) REFERENCES Users(ID)
);

CREATE TABLE Modules (
    ID INT PRIMARY KEY IDENTITY(1,1),
    ClassID INT NOT NULL,
    Title VARCHAR(150) NOT NULL,
    Description TEXT,
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (ClassID) REFERENCES Classes(ID)
);

CREATE TABLE Lessons (
    ID INT PRIMARY KEY IDENTITY(1,1),
    ModuleID INT NOT NULL,
    Title VARCHAR(150) NOT NULL,
    Type VARCHAR(50) NOT NULL, -- 'Video', 'Document', 'Link'
    ContentUrl VARCHAR(255) NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (ModuleID) REFERENCES Modules(ID)
);

CREATE TABLE Assignments (
    ID INT PRIMARY KEY IDENTITY(1,1),
    ModuleID INT NOT NULL,
    Title VARCHAR(150) NOT NULL,
    Description TEXT,
    DueDate DATETIME,
    AttachmentInstructions TEXT,
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (ModuleID) REFERENCES Modules(ID)
);

CREATE TABLE Submissions (
    ID INT PRIMARY KEY IDENTITY(1,1),
    AssignmentID INT NOT NULL,
    StudentID INT NOT NULL,
    FileUrl VARCHAR(255) NOT NULL,
    Grade DECIMAL(5, 2),
    Feedback TEXT,
    SubmittedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (AssignmentID) REFERENCES Assignments(ID),
    FOREIGN KEY (StudentID) REFERENCES Users(ID)
);

CREATE TABLE Sessions (
    ID INT PRIMARY KEY IDENTITY(1,1),
    ClassID INT NOT NULL,
    Title VARCHAR(150) NOT NULL,
    SessionDate DATE NOT NULL,
    SessionTime TIME NOT NULL,
    MeetingLink VARCHAR(255) NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (ClassID) REFERENCES Classes(ID)
);

CREATE TABLE Attendance (
    ID INT PRIMARY KEY IDENTITY(1,1),
    SessionID INT NOT NULL,
    StudentID INT NOT NULL,
    Status VARCHAR(20) NOT NULL DEFAULT 'Present', -- 'Present', 'Absent'
    RecordedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (SessionID) REFERENCES Sessions(ID),
    FOREIGN KEY (StudentID) REFERENCES Users(ID)
);

CREATE TABLE Tickets (
    ID INT PRIMARY KEY IDENTITY(1,1),
    StudentID INT NOT NULL,
    TutorID INT,
    Subject VARCHAR(150) NOT NULL,
    Description TEXT NOT NULL,
    AttachmentUrl VARCHAR(255),
    Status VARCHAR(20) NOT NULL DEFAULT 'Open', -- 'Open', 'In Progress', 'Resolved'
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (StudentID) REFERENCES Users(ID),
    FOREIGN KEY (TutorID) REFERENCES Users(ID)
);

CREATE TABLE TicketReplies (
    ID INT PRIMARY KEY IDENTITY(1,1),
    TicketID INT NOT NULL,
    UserID INT NOT NULL,
    Message TEXT NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (TicketID) REFERENCES Tickets(ID),
    FOREIGN KEY (UserID) REFERENCES Users(ID)
);

CREATE TABLE Announcements (
    ID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT NOT NULL,
    TargetType VARCHAR(20) NOT NULL, -- 'All', 'Class'
    TargetClassID INT,
    Title VARCHAR(150) NOT NULL,
    Message TEXT NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserID) REFERENCES Users(ID),
    FOREIGN KEY (TargetClassID) REFERENCES Classes(ID)
);

CREATE TABLE FeeManagement (
    ID INT PRIMARY KEY IDENTITY(1,1),
    StudentID INT NOT NULL,
    CourseID INT NOT NULL,
    TotalFee DECIMAL(10, 2) NOT NULL,
    AmountPaid DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    PendingAmount AS (TotalFee - AmountPaid) PERSISTED,
    PaymentStatus VARCHAR(20) NOT NULL DEFAULT 'Pending', -- 'Paid', 'Partial', 'Pending'
    LastUpdated DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (StudentID) REFERENCES Users(ID),
    FOREIGN KEY (CourseID) REFERENCES Courses(ID)
);

-- Creating Indexes for Performance
CREATE INDEX IDX_Users_Email ON Users(Email);
CREATE INDEX IDX_Classes_Course ON Classes(CourseID);
CREATE INDEX IDX_Classes_Tutor ON Classes(TutorID);
CREATE INDEX IDX_ClassStudents_Student ON ClassStudents(StudentID);
CREATE INDEX IDX_Modules_Class ON Modules(ClassID);
CREATE INDEX IDX_Sessions_Class ON Sessions(ClassID);
CREATE INDEX IDX_FeeManagement_Student ON FeeManagement(StudentID);
CREATE INDEX IDX_Tickets_Student ON Tickets(StudentID);
