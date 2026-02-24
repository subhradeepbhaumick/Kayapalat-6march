const mysql = require('mysql2/promise');

async function check() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'Tony@26062002',
    database: 'kayapalat_db'
  });

  try {
    const [rows] = await pool.execute('SELECT COUNT(*) as count FROM projects');
    console.log('Projects count:', rows[0].count);
    const [sample] = await pool.execute('SELECT * FROM projects LIMIT 5');
    console.log('Sample projects:', sample);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    pool.end();
  }
}

check();
