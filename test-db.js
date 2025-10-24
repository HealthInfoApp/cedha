const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function testConnection() {
  try {
    const sslCA = fs.readFileSync(path.resolve('./certs/isrgrootx1.pem'));
    
    const connection = await mysql.createConnection({
      host: process.env.TIDB_HOST,
      port: parseInt(process.env.TIDB_PORT || '4000'),
      user: process.env.TIDB_USER,
      password: process.env.TIDB_PASSWORD,
      database: process.env.TIDB_DATABASE,
      ssl: {
        ca: sslCA,
        rejectUnauthorized: true,
      },
    });

    console.log('✅ Successfully connected to TiDB Cloud!');
    
    // Test query
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Database query test passed:', rows);
    
    await connection.end();
    console.log('✅ Connection closed properly');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('💡 Check your:');
    console.log('   - TiDB Cloud credentials in .env.local');
    console.log('   - SSL certificate file path');
    console.log('   - Network connectivity');
    console.log('   - IP whitelist in TiDB Cloud');
  }
}

testConnection();