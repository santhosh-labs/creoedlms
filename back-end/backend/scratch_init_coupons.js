const { pool } = require('./config/db');

async function init() {
  try {
    const conn = await pool.getConnection();
    
    await conn.query(`
      CREATE TABLE IF NOT EXISTS Coupons (
        ID INT AUTO_INCREMENT PRIMARY KEY,
        Code VARCHAR(50) UNIQUE NOT NULL,
        DiscountPercentage DECIMAL(5,2) DEFAULT 100,
        UsageLimit INT DEFAULT 1,
        UsageCount INT DEFAULT 0,
        ValidUntil DATETIME NULL,
        IsActive BOOLEAN DEFAULT true,
        CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS CouponUsage (
        ID INT AUTO_INCREMENT PRIMARY KEY,
        CouponID INT NOT NULL,
        StudentID INT NOT NULL,
        CourseID INT NOT NULL,
        UsedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (CouponID) REFERENCES Coupons(ID) ON DELETE CASCADE,
        FOREIGN KEY (StudentID) REFERENCES Users(ID) ON DELETE CASCADE,
        FOREIGN KEY (CourseID) REFERENCES Courses(ID) ON DELETE CASCADE
      )
    `);

    console.log("Coupons tables created!");
    conn.release();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

init();
