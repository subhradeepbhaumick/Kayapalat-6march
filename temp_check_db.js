const mysql = require('mysql2/promise');

async function checkDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    console.log('Connected to database');

    // Check all rows in showroom a
    const [allRows] = await connection.execute('SELECT * FROM `showroom a`');
    console.log('All rows in showroom a:', allRows);

    // Check available rows
    const [availableRows] = await connection.execute(
      "SELECT space_type, size, price FROM `showroom a` WHERE LOWER(booking_status) = 'available'"
    );
    console.log('Available rows:', availableRows);

    await connection.end();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkDatabase();
