-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: 127.0.0.1    Database: creoedlms
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `announcements`
--

DROP TABLE IF EXISTS `announcements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `announcements` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `UserID` int(11) NOT NULL,
  `TargetType` varchar(20) NOT NULL,
  `TargetClassID` int(11) DEFAULT NULL,
  `Title` varchar(150) NOT NULL,
  `Message` text NOT NULL,
  `CreatedAt` datetime DEFAULT current_timestamp(),
  `ActionLabel` varchar(50) DEFAULT NULL,
  `ActionLink` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`ID`),
  KEY `UserID` (`UserID`),
  KEY `TargetClassID` (`TargetClassID`),
  CONSTRAINT `announcements_ibfk_1` FOREIGN KEY (`UserID`) REFERENCES `users` (`ID`),
  CONSTRAINT `announcements_ibfk_2` FOREIGN KEY (`TargetClassID`) REFERENCES `classes` (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `announcements`
--

LOCK TABLES `announcements` WRITE;
/*!40000 ALTER TABLE `announcements` DISABLE KEYS */;
INSERT INTO `announcements` VALUES (1,1,'All',NULL,'New Batch Announcement','Creoed announces new batches for Data Science and DevOps courses. Learn industry tools, work on real projects, and gain practical skills guided by experienced instructors. Build an ATS-ready resume and prepare for high-demand tech careers. Limited seats available—enroll now and start your journey toward becoming a skilled tech professional.','2026-03-15 11:05:13','Visit Website','https://creoed.com'),(3,1,'Student',NULL,'Attention Tutors','New batches for the Data Science and DevOps courses are starting soon at Creoed. Please prepare your session plans, project guidelines, and course materials. Ensure timely class scheduling and maintain high-quality instruction to support students in building strong practical skills and industry-ready knowledge.','2026-03-15 11:17:57','Visit Website','https://creoed.com');
/*!40000 ALTER TABLE `announcements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `assignments`
--

DROP TABLE IF EXISTS `assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `assignments` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `ModuleID` int(11) NOT NULL,
  `Title` varchar(150) NOT NULL,
  `Description` text DEFAULT NULL,
  `DueDate` datetime DEFAULT NULL,
  `AttachmentInstructions` text DEFAULT NULL,
  `CreatedAt` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`ID`),
  KEY `ModuleID` (`ModuleID`),
  CONSTRAINT `assignments_ibfk_1` FOREIGN KEY (`ModuleID`) REFERENCES `modules` (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `assignments`
--

LOCK TABLES `assignments` WRITE;
/*!40000 ALTER TABLE `assignments` DISABLE KEYS */;
INSERT INTO `assignments` VALUES (1,1,'Create and Set Up Your GitHub Account','Students are required to create a GitHub account and set up their profile for course activities. After creating the account, update your profile with your name and a short bio. Create your first repository named “data-science-learning” and upload a simple README file introducing yourself and your learning goals for the course. This will help you start managing projects and sharing code using GitHub.','2026-03-15 17:00:00','Upload the account link','2026-03-15 11:22:25');
/*!40000 ALTER TABLE `assignments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `attendance`
--

DROP TABLE IF EXISTS `attendance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `attendance` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `SessionID` int(11) NOT NULL,
  `StudentID` int(11) NOT NULL,
  `Status` varchar(20) NOT NULL DEFAULT 'Present',
  `RecordedAt` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`ID`),
  KEY `SessionID` (`SessionID`),
  KEY `StudentID` (`StudentID`),
  CONSTRAINT `attendance_ibfk_1` FOREIGN KEY (`SessionID`) REFERENCES `sessions` (`ID`),
  CONSTRAINT `attendance_ibfk_2` FOREIGN KEY (`StudentID`) REFERENCES `users` (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendance`
--

LOCK TABLES `attendance` WRITE;
/*!40000 ALTER TABLE `attendance` DISABLE KEYS */;
INSERT INTO `attendance` VALUES (1,2,4,'Present','2026-03-15 12:04:28'),(5,3,4,'Present','2026-03-15 12:04:43'),(7,1,4,'Late','2026-03-15 12:04:58');
/*!40000 ALTER TABLE `attendance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `classes`
--

DROP TABLE IF EXISTS `classes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `classes` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `CourseID` int(11) NOT NULL,
  `TutorID` int(11) NOT NULL,
  `BatchName` varchar(100) NOT NULL,
  `CreatedAt` datetime DEFAULT current_timestamp(),
  `BatchCode` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`ID`),
  UNIQUE KEY `BatchCode` (`BatchCode`),
  KEY `CourseID` (`CourseID`),
  KEY `TutorID` (`TutorID`),
  CONSTRAINT `classes_ibfk_1` FOREIGN KEY (`CourseID`) REFERENCES `courses` (`ID`),
  CONSTRAINT `classes_ibfk_2` FOREIGN KEY (`TutorID`) REFERENCES `users` (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `classes`
--

LOCK TABLES `classes` WRITE;
/*!40000 ALTER TABLE `classes` DISABLE KEYS */;
INSERT INTO `classes` VALUES (1,2,5,'DEVOPS BATCH - I','2026-03-15 10:39:27','BCH001'),(2,1,3,'DATA SCIENCE BATCH - I','2026-03-15 10:39:43','BCH002');
/*!40000 ALTER TABLE `classes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `classstudents`
--

DROP TABLE IF EXISTS `classstudents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `classstudents` (
  `ClassID` int(11) NOT NULL,
  `StudentID` int(11) NOT NULL,
  `AssignedAt` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`ClassID`,`StudentID`),
  KEY `StudentID` (`StudentID`),
  CONSTRAINT `classstudents_ibfk_1` FOREIGN KEY (`ClassID`) REFERENCES `classes` (`ID`),
  CONSTRAINT `classstudents_ibfk_2` FOREIGN KEY (`StudentID`) REFERENCES `users` (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `classstudents`
--

LOCK TABLES `classstudents` WRITE;
/*!40000 ALTER TABLE `classstudents` DISABLE KEYS */;
INSERT INTO `classstudents` VALUES (1,9,'2026-03-15 12:23:30'),(1,12,'2026-03-15 12:23:30'),(2,4,'2026-03-15 10:40:05'),(2,7,'2026-03-15 12:21:49'),(2,8,'2026-03-15 12:21:49');
/*!40000 ALTER TABLE `classstudents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `courses`
--

DROP TABLE IF EXISTS `courses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `courses` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `Name` varchar(150) NOT NULL,
  `Description` text DEFAULT NULL,
  `TotalFee` decimal(10,2) NOT NULL,
  `CreatedAt` datetime DEFAULT current_timestamp(),
  `CourseCode` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`ID`),
  UNIQUE KEY `CourseCode` (`CourseCode`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `courses`
--

LOCK TABLES `courses` WRITE;
/*!40000 ALTER TABLE `courses` DISABLE KEYS */;
INSERT INTO `courses` VALUES (1,'DATA SCIENCE ','Creoed’s Data Science course teaches Python programming, statistics, data analysis, visualization, and machine learning. Students learn to collect, clean, and analyze real-world data using tools like Pandas, NumPy, SQL, and Power BI while completing industry-based projects to build practical skills and become job-ready for data analyst and data science roles.',5000.00,'2026-03-15 10:36:59','DSC2026'),(2,'DEVOPS ','Creoed’s DevOps course teaches the fundamentals of software development, Linux, Git, CI/CD pipelines, Docker, Kubernetes, and cloud deployment. Students gain hands-on experience through real projects, learning to automate development workflows, manage infrastructure, and deploy scalable applications, preparing them for DevOps engineer and cloud operations roles in modern IT environments.',5000.00,'2026-03-15 10:38:00','DVP2026');
/*!40000 ALTER TABLE `courses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `feemanagement`
--

DROP TABLE IF EXISTS `feemanagement`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `feemanagement` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `StudentID` int(11) NOT NULL,
  `CourseID` int(11) NOT NULL,
  `TotalFee` decimal(10,2) NOT NULL,
  `AmountPaid` decimal(10,2) NOT NULL DEFAULT 0.00,
  `PaymentStatus` varchar(20) NOT NULL DEFAULT 'Pending',
  `LastUpdated` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`ID`),
  KEY `StudentID` (`StudentID`),
  KEY `CourseID` (`CourseID`),
  CONSTRAINT `feemanagement_ibfk_1` FOREIGN KEY (`StudentID`) REFERENCES `users` (`ID`),
  CONSTRAINT `feemanagement_ibfk_2` FOREIGN KEY (`CourseID`) REFERENCES `courses` (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `feemanagement`
--

LOCK TABLES `feemanagement` WRITE;
/*!40000 ALTER TABLE `feemanagement` DISABLE KEYS */;
INSERT INTO `feemanagement` VALUES (1,4,1,5000.00,2000.00,'Partial','2026-03-15 10:40:05'),(3,7,1,5000.00,4000.00,'Partial','2026-03-15 12:21:49'),(4,8,1,5000.00,3000.00,'Partial','2026-03-15 12:21:49'),(5,9,2,5000.00,1500.00,'Partial','2026-03-15 12:21:49'),(8,12,2,5000.00,0.00,'Pending','2026-03-15 12:21:50');
/*!40000 ALTER TABLE `feemanagement` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lessonprogress`
--

DROP TABLE IF EXISTS `lessonprogress`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `lessonprogress` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `StudentID` int(11) NOT NULL,
  `ClassID` int(11) NOT NULL,
  `LessonID` int(11) NOT NULL,
  `IsCompleted` tinyint(1) DEFAULT 1,
  `CompletedAt` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`ID`),
  UNIQUE KEY `unique_progress` (`StudentID`,`LessonID`),
  KEY `ClassID` (`ClassID`),
  KEY `LessonID` (`LessonID`),
  CONSTRAINT `lessonprogress_ibfk_1` FOREIGN KEY (`StudentID`) REFERENCES `users` (`ID`) ON DELETE CASCADE,
  CONSTRAINT `lessonprogress_ibfk_2` FOREIGN KEY (`ClassID`) REFERENCES `classes` (`ID`) ON DELETE CASCADE,
  CONSTRAINT `lessonprogress_ibfk_3` FOREIGN KEY (`LessonID`) REFERENCES `lessons` (`ID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lessonprogress`
--

LOCK TABLES `lessonprogress` WRITE;
/*!40000 ALTER TABLE `lessonprogress` DISABLE KEYS */;
/*!40000 ALTER TABLE `lessonprogress` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lessons`
--

DROP TABLE IF EXISTS `lessons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `lessons` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `ModuleID` int(11) NOT NULL,
  `Title` varchar(150) NOT NULL,
  `Type` varchar(50) NOT NULL,
  `ContentUrl` varchar(255) NOT NULL,
  `CreatedAt` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`ID`),
  KEY `ModuleID` (`ModuleID`),
  CONSTRAINT `lessons_ibfk_1` FOREIGN KEY (`ModuleID`) REFERENCES `modules` (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lessons`
--

LOCK TABLES `lessons` WRITE;
/*!40000 ALTER TABLE `lessons` DISABLE KEYS */;
INSERT INTO `lessons` VALUES (2,1,'Introduction to Data Science','Live Class','https://meet.google.com/landing','2026-03-15 11:11:27'),(3,1,'Python Basics for Data Science','Live Class','https://meet.google.com/landing','2026-03-15 11:12:00'),(4,2,'Exploratory Data Analysis (EDA)','Live Class','https://meet.google.com/landing','2026-03-15 11:12:39'),(5,2,'Data Visualization using Matplotlib','Live Class','https://meet.google.com/landing','2026-03-15 11:13:17'),(6,3,'Supervised Learning','Live Class','https://meet.google.com/landing','2026-03-15 11:14:10'),(7,3,'Implementing ML Models using Scikit-learn','Live Class','https://meet.google.com/landing','2026-03-15 11:14:37'),(8,4,'Working with Real Datasets','Live Class','https://meet.google.com/landing','2026-03-15 11:15:10');
/*!40000 ALTER TABLE `lessons` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `messages`
--

DROP TABLE IF EXISTS `messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `messages` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `SenderID` int(11) NOT NULL,
  `ReceiverID` int(11) NOT NULL,
  `Message` text NOT NULL,
  `ImageUrl` varchar(500) DEFAULT NULL,
  `IsRead` tinyint(1) DEFAULT 0,
  `SentAt` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`ID`),
  KEY `SenderID` (`SenderID`),
  KEY `ReceiverID` (`ReceiverID`),
  CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`SenderID`) REFERENCES `users` (`ID`) ON DELETE CASCADE,
  CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`ReceiverID`) REFERENCES `users` (`ID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `messages`
--

LOCK TABLES `messages` WRITE;
/*!40000 ALTER TABLE `messages` DISABLE KEYS */;
INSERT INTO `messages` VALUES (1,3,4,'sending image for testing','/uploads/chat/chat_1773564574208_3vaf2bcsnl3.png',1,'2026-03-15 08:49:34');
/*!40000 ALTER TABLE `messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `modules`
--

DROP TABLE IF EXISTS `modules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `modules` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `ClassID` int(11) NOT NULL,
  `Title` varchar(150) NOT NULL,
  `Description` text DEFAULT NULL,
  `CreatedAt` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`ID`),
  KEY `ClassID` (`ClassID`),
  CONSTRAINT `modules_ibfk_1` FOREIGN KEY (`ClassID`) REFERENCES `classes` (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `modules`
--

LOCK TABLES `modules` WRITE;
/*!40000 ALTER TABLE `modules` DISABLE KEYS */;
INSERT INTO `modules` VALUES (1,2,'Data Science Foundations','This module introduces the fundamentals of data science, including the data lifecycle, real-world applications, and basic statistical thinking. Students learn Python fundamentals and essential libraries like NumPy and Pandas to begin working with data.','2026-03-15 11:08:37'),(2,2,'Data Analysis & Visualization','Students learn how to clean, transform, and explore datasets. The module focuses on exploratory data analysis (EDA) and visualizing insights using tools like Matplotlib and Seaborn to understand patterns and trends in data.','2026-03-15 11:08:54'),(3,2,'Machine Learning Basics','This module introduces core machine learning concepts such as supervised learning, regression, and classification. Students build and test simple machine learning models using Scikit-learn and learn how algorithms make predictions from data.','2026-03-15 11:09:10'),(4,2,'Real-World Data Science Project','Students apply everything learned by working on real datasets. They perform data cleaning, feature engineering, model building, and evaluation to complete an end-to-end data science project and present actionable insights.','2026-03-15 11:09:25');
/*!40000 ALTER TABLE `modules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `quizanswers`
--

DROP TABLE IF EXISTS `quizanswers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `quizanswers` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `AttemptID` int(11) NOT NULL,
  `QuestionID` int(11) NOT NULL,
  `SelectedOption` char(1) DEFAULT NULL,
  `IsCorrect` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`ID`),
  KEY `AttemptID` (`AttemptID`),
  KEY `QuestionID` (`QuestionID`),
  CONSTRAINT `quizanswers_ibfk_1` FOREIGN KEY (`AttemptID`) REFERENCES `quizattempts` (`ID`) ON DELETE CASCADE,
  CONSTRAINT `quizanswers_ibfk_2` FOREIGN KEY (`QuestionID`) REFERENCES `quizquestions` (`ID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quizanswers`
--

LOCK TABLES `quizanswers` WRITE;
/*!40000 ALTER TABLE `quizanswers` DISABLE KEYS */;
INSERT INTO `quizanswers` VALUES (1,1,1,'C',1),(2,1,2,'C',1),(3,1,3,'B',1),(4,1,4,'C',0);
/*!40000 ALTER TABLE `quizanswers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `quizattempts`
--

DROP TABLE IF EXISTS `quizattempts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `quizattempts` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `QuizID` int(11) NOT NULL,
  `StudentID` int(11) NOT NULL,
  `Score` int(11) DEFAULT 0,
  `TotalMarks` int(11) NOT NULL,
  `AttemptedAt` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`ID`),
  KEY `QuizID` (`QuizID`),
  KEY `StudentID` (`StudentID`),
  CONSTRAINT `quizattempts_ibfk_1` FOREIGN KEY (`QuizID`) REFERENCES `quizzes` (`ID`) ON DELETE CASCADE,
  CONSTRAINT `quizattempts_ibfk_2` FOREIGN KEY (`StudentID`) REFERENCES `users` (`ID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quizattempts`
--

LOCK TABLES `quizattempts` WRITE;
/*!40000 ALTER TABLE `quizattempts` DISABLE KEYS */;
INSERT INTO `quizattempts` VALUES (1,1,4,15,20,'2026-03-15 12:42:12');
/*!40000 ALTER TABLE `quizattempts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `quizquestions`
--

DROP TABLE IF EXISTS `quizquestions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `quizquestions` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `QuizID` int(11) NOT NULL,
  `Question` text NOT NULL,
  `OptionA` varchar(255) NOT NULL,
  `OptionB` varchar(255) NOT NULL,
  `OptionC` varchar(255) DEFAULT NULL,
  `OptionD` varchar(255) DEFAULT NULL,
  `CorrectOption` char(1) NOT NULL,
  `Marks` int(11) DEFAULT 1,
  PRIMARY KEY (`ID`),
  KEY `QuizID` (`QuizID`),
  CONSTRAINT `quizquestions_ibfk_1` FOREIGN KEY (`QuizID`) REFERENCES `quizzes` (`ID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quizquestions`
--

LOCK TABLES `quizquestions` WRITE;
/*!40000 ALTER TABLE `quizquestions` DISABLE KEYS */;
INSERT INTO `quizquestions` VALUES (1,1,'Which stage in the data science process focuses on removing missing values, correcting errors, and preparing datasets before analysis begins?','Data Collection','Model Training','Data Cleaning',NULL,'C',5),(2,1,'Which Python library is commonly used in data science for handling structured datasets, performing data manipulation, and analyzing tabular data efficiently?','TensorFlow','Django','Pandas',NULL,'C',5),(3,1,'Data visualization helps analysts understand patterns, trends, and relationships in datasets by representing information using charts, graphs, and dashboards effectively.','Data Cleaning','Data Visualization','Data Encryption',NULL,'B',5),(4,1,'In data science, which process involves examining datasets to summarize main characteristics, discover patterns, and understand data before building machine learning models?','Data Storage','Exploratory Data Analysis','Data Encryption',NULL,'B',5);
/*!40000 ALTER TABLE `quizquestions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `quizzes`
--

DROP TABLE IF EXISTS `quizzes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `quizzes` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `ModuleID` int(11) NOT NULL,
  `Title` varchar(150) NOT NULL,
  `Description` text DEFAULT NULL,
  `TotalMarks` int(11) DEFAULT 0,
  `CreatedAt` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`ID`),
  KEY `ModuleID` (`ModuleID`),
  CONSTRAINT `quizzes_ibfk_1` FOREIGN KEY (`ModuleID`) REFERENCES `modules` (`ID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quizzes`
--

LOCK TABLES `quizzes` WRITE;
/*!40000 ALTER TABLE `quizzes` DISABLE KEYS */;
INSERT INTO `quizzes` VALUES (1,1,'Data Science Fundamentals Quiz','This quiz evaluates students’ basic understanding of core data science concepts, including data analysis, visualization, Python libraries, and machine learning fundamentals learned in the course.',20,'2026-03-15 12:40:29');
/*!40000 ALTER TABLE `quizzes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `roles` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `RoleName` varchar(50) NOT NULL,
  PRIMARY KEY (`ID`),
  UNIQUE KEY `RoleName` (`RoleName`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (2,'Admin'),(4,'Student'),(1,'Super Admin'),(3,'Tutor');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sessions` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `ClassID` int(11) NOT NULL,
  `Title` varchar(150) NOT NULL,
  `SessionDate` date NOT NULL,
  `SessionTime` time NOT NULL,
  `MeetingLink` varchar(255) NOT NULL,
  `CreatedAt` datetime DEFAULT current_timestamp(),
  `ModuleID` int(11) DEFAULT NULL,
  PRIMARY KEY (`ID`),
  KEY `ClassID` (`ClassID`),
  CONSTRAINT `sessions_ibfk_1` FOREIGN KEY (`ClassID`) REFERENCES `classes` (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
INSERT INTO `sessions` VALUES (1,2,'Introduction to Data Science, Data Lifecycle, and Applications','2026-03-15','00:00:00','https://meet.google.com/landing','2026-03-15 11:10:20',NULL),(2,2,'Introduction to Data Science','2026-03-15','00:00:00','https://meet.google.com/landing','2026-03-15 11:11:27',NULL),(3,2,'Python Basics for Data Science','2026-03-16','00:00:00','https://meet.google.com/landing','2026-03-15 11:12:00',NULL),(4,2,'Exploratory Data Analysis (EDA)','2026-03-17','00:00:00','https://meet.google.com/landing','2026-03-15 11:12:39',NULL),(5,2,'Data Visualization using Matplotlib','2026-03-18','00:00:00','https://meet.google.com/landing','2026-03-15 11:13:17',NULL),(6,2,'Supervised Learning','2026-03-19','00:00:00','https://meet.google.com/landing','2026-03-15 11:14:10',NULL),(7,2,'Implementing ML Models using Scikit-learn','2026-03-23','00:00:00','https://meet.google.com/landing','2026-03-15 11:14:37',NULL),(8,2,'Working with Real Datasets','2026-03-23','00:16:00','https://meet.google.com/landing','2026-03-15 11:15:10',NULL);
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `submissions`
--

DROP TABLE IF EXISTS `submissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `submissions` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `AssignmentID` int(11) NOT NULL,
  `StudentID` int(11) NOT NULL,
  `FileUrl` varchar(255) NOT NULL,
  `Grade` decimal(5,2) DEFAULT NULL,
  `Feedback` text DEFAULT NULL,
  `SubmittedAt` datetime DEFAULT current_timestamp(),
  `Status` varchar(20) DEFAULT 'Submitted',
  PRIMARY KEY (`ID`),
  KEY `AssignmentID` (`AssignmentID`),
  KEY `StudentID` (`StudentID`),
  CONSTRAINT `submissions_ibfk_1` FOREIGN KEY (`AssignmentID`) REFERENCES `assignments` (`ID`),
  CONSTRAINT `submissions_ibfk_2` FOREIGN KEY (`StudentID`) REFERENCES `users` (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `submissions`
--

LOCK TABLES `submissions` WRITE;
/*!40000 ALTER TABLE `submissions` DISABLE KEYS */;
INSERT INTO `submissions` VALUES (1,1,4,'https://github.com/santhosh-LABS',80.00,'ENTER YOUR GITHUB ACCOUNT LINK CORRECLTY','2026-03-15 11:58:39','Graded');
/*!40000 ALTER TABLE `submissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ticketreplies`
--

DROP TABLE IF EXISTS `ticketreplies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ticketreplies` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `TicketID` int(11) NOT NULL,
  `UserID` int(11) NOT NULL,
  `Message` text NOT NULL,
  `CreatedAt` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`ID`),
  KEY `TicketID` (`TicketID`),
  KEY `UserID` (`UserID`),
  CONSTRAINT `ticketreplies_ibfk_1` FOREIGN KEY (`TicketID`) REFERENCES `tickets` (`ID`),
  CONSTRAINT `ticketreplies_ibfk_2` FOREIGN KEY (`UserID`) REFERENCES `users` (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ticketreplies`
--

LOCK TABLES `ticketreplies` WRITE;
/*!40000 ALTER TABLE `ticketreplies` DISABLE KEYS */;
/*!40000 ALTER TABLE `ticketreplies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tickets`
--

DROP TABLE IF EXISTS `tickets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tickets` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `StudentID` int(11) NOT NULL,
  `TutorID` int(11) DEFAULT NULL,
  `Subject` varchar(150) NOT NULL,
  `Description` text NOT NULL,
  `AttachmentUrl` varchar(255) DEFAULT NULL,
  `Status` varchar(20) NOT NULL DEFAULT 'Open',
  `CreatedAt` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`ID`),
  KEY `StudentID` (`StudentID`),
  KEY `TutorID` (`TutorID`),
  CONSTRAINT `tickets_ibfk_1` FOREIGN KEY (`StudentID`) REFERENCES `users` (`ID`),
  CONSTRAINT `tickets_ibfk_2` FOREIGN KEY (`TutorID`) REFERENCES `users` (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tickets`
--

LOCK TABLES `tickets` WRITE;
/*!40000 ALTER TABLE `tickets` DISABLE KEYS */;
/*!40000 ALTER TABLE `tickets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `Name` varchar(100) NOT NULL,
  `Email` varchar(100) NOT NULL,
  `Phone` varchar(20) DEFAULT NULL,
  `PasswordHash` varchar(255) NOT NULL,
  `RoleID` int(11) NOT NULL,
  `CreatedAt` datetime DEFAULT current_timestamp(),
  `ResetToken` varchar(255) DEFAULT NULL,
  `ResetTokenExpiry` datetime DEFAULT NULL,
  `DateOfBirth` date DEFAULT NULL,
  `Gender` varchar(50) DEFAULT NULL,
  `City` varchar(150) DEFAULT NULL,
  `Country` varchar(150) DEFAULT NULL,
  `StudentCode` varchar(50) DEFAULT NULL,
  `CollegeName` varchar(200) DEFAULT NULL,
  PRIMARY KEY (`ID`),
  UNIQUE KEY `Email` (`Email`),
  UNIQUE KEY `StudentCode` (`StudentCode`),
  KEY `RoleID` (`RoleID`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`RoleID`) REFERENCES `roles` (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'SANTHOSH','super@creoed.com',NULL,'$2b$10$.VOxHOQUtuct9coRgfPBJ.zhGL3GW9MHy45QyPNaFR65YU7dyves6',1,'2026-03-15 09:52:54',NULL,NULL,'2004-08-30','Male','Chennai','Country','CRSUP26001','Prince College'),(2,'HEMANTH','admin@creoed.com',NULL,'$2b$10$.VOxHOQUtuct9coRgfPBJ.zhGL3GW9MHy45QyPNaFR65YU7dyves6',2,'2026-03-15 09:52:54',NULL,NULL,NULL,NULL,NULL,NULL,'CRADN26002',NULL),(3,'NANDHA GOPAL','tutor@creoed.com',NULL,'$2b$10$.VOxHOQUtuct9coRgfPBJ.zhGL3GW9MHy45QyPNaFR65YU7dyves6',3,'2026-03-15 09:52:54',NULL,NULL,NULL,NULL,NULL,NULL,'CRINS26003',NULL),(4,'VISHWA','student@creoed.com','8745230159','$2b$10$.VOxHOQUtuct9coRgfPBJ.zhGL3GW9MHy45QyPNaFR65YU7dyves6',4,'2026-03-15 09:52:54',NULL,NULL,NULL,NULL,NULL,NULL,'CR260004',NULL),(5,'ADHISH KUMAR','adhish@gmail.com','9874563210','$2b$10$mxzv36QmapjH4GBuMaM7HunfPzYcTiCJax.qAfDoginYa6EvD3wj2',3,'2026-03-15 10:38:47',NULL,NULL,NULL,'Male','chennai','india','CRINS26638',NULL),(7,'HARISH','harish@gmail.com','9876543210','$2b$10$xTwQ6LqbZdKkzX6kXtmuzu.6/PLxSQi9T8ceD9nGQ/rLlq3an9OrW',4,'2026-03-15 12:21:49',NULL,NULL,NULL,'Male','Mumbai','India','CR269530',NULL),(8,'SUNIL KUMAR','san.cloudx.io@gmail.com','9876543547','$2b$10$2IFEFo9wChzdr6und/wjAeXgZyVOssrAHeD3aWzkk/Y1V3l3RUt3S',4,'2026-03-15 12:21:49','aaadde5cb17fc21bd26c0bd74749547571eb476dbcd670eaca47e77b1463c6e6','2026-03-16 11:29:26',NULL,'Male','Delhi','India','CR264899',NULL),(9,'KISHORE','kishore@gmail.com','9876544747','$2b$10$5JwjdODKS3uqfttWcfG09eb/S/stbpKi/NmQePWQ6mU/zh9.4ZZse',4,'2026-03-15 12:21:49',NULL,NULL,NULL,'Male',NULL,NULL,'CR265877',NULL),(12,'Nithya','nithya@gamil.com','7582545347','$2b$10$gSEid3SOP3DrIUJp3mD1vOLeBoGslWj46hFHxoUZjXlS53z86d.hy',4,'2026-03-15 12:21:50',NULL,NULL,NULL,NULL,NULL,NULL,'CR267919',NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-16 20:37:01
