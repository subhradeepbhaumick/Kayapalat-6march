const mysql = require('mysql2/promise');

async function testBlogs() {
  try {
    const pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: 'Tony@26062002',
      database: process.env.DB_NAME || 'kayapalat_db',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    console.log('Checking new_blogs table...');
    const [blogs] = await pool.execute('SELECT id, title, status FROM new_blogs LIMIT 5');
    console.log('Blogs:', blogs);

    console.log('Checking blog_categories table...');
    const [cats] = await pool.execute('SELECT id, name, slug FROM blog_categories LIMIT 5');
    console.log('Categories:', cats);

    pool.end();
  } catch (error) {
    console.error('DB Error:', error);
  }
}

testBlogs();
