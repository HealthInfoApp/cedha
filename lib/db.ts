import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

// Read SSL certificate
const sslCA = fs.readFileSync(
  path.resolve(process.env.TIDB_SSL_CA_PATH || './certs/isrgrootx1.pem')
);

const dbConfig = {
  host: process.env.TIDB_HOST,
  port: parseInt(process.env.TIDB_PORT || '4000'),
  user: process.env.TIDB_USER,
  password: process.env.TIDB_PASSWORD,
  database: process.env.TIDB_DATABASE,
  ssl: {
    ca: sslCA,
    rejectUnauthorized: true,
  },
  // Add connection pool settings for better performance
  connectionLimit: 10,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
};

let connection: mysql.Pool;

declare global {
  var __db: mysql.Pool | undefined;
}

if (!global.__db) {
  global.__db = mysql.createPool(dbConfig);
  
  // Test connection on startup
  global.__db.getConnection()
    .then((conn) => {
      console.log('✅ Database connected successfully');
      conn.release();
    })
    .catch((error) => {
      console.error('❌ Database connection failed:', error);
    });
}

connection = global.__db;

// Add error handling for the pool
connection.on('error', (err) => {
  console.error('Database pool error:', err);
});

export default connection;