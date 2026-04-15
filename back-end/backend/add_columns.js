const { pool } = require('./config/db');

async function main() {
  try {
    console.log('Adding columns...');
    await pool.query('ALTER TABLE Users ADD COLUMN Designation VARCHAR(255) NULL;');
    await pool.query('ALTER TABLE Users ADD COLUMN Organisation VARCHAR(255) NULL;');
    console.log('Columns added successfully');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('Columns already exist');
    } else {
      console.error(err);
    }
  } finally {
    process.exit(0);
  }
}

main();
