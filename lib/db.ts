import mysql from 'mysql2/promise';

// For development with file system
let sslConfig: any = undefined;

if (process.env.NODE_ENV === 'development') {
  // Only try to use file system in development
  try {
    const fs = require('fs');
    const path = require('path');
    const certPath = process.env.TIDB_SSL_CA_PATH || './certs/isrgrootx1.pem';
    const fullPath = path.resolve(certPath);
    
    if (fs.existsSync(fullPath)) {
      const sslCA = fs.readFileSync(fullPath);
      sslConfig = {
        ca: sslCA,
        rejectUnauthorized: true,
      };
      console.log('✅ SSL certificate loaded for development');
    } else {
      console.warn('⚠️ SSL certificate not found, connecting without...');
    }
  } catch (error) {
    console.warn('⚠️ Could not load SSL certificate, connecting without...');
  }
} else {
  // For production (Vercel) - use environment variable or connect without
  if (process.env.TIDB_SSL_CA_BASE64) {
    sslConfig = {
      ca: Buffer.from(process.env.TIDB_SSL_CA_BASE64, 'base64'),
      rejectUnauthorized: true,
    };
    console.log('✅ SSL certificate loaded from base64 for production');
  } else {
    // For production without SSL certificate (some providers don't need it)
    sslConfig = {
      rejectUnauthorized: false,
    };
    console.log('⚠️ Connecting without SSL certificate verification');
  }
}

const dbConfig = {
  host: process.env.TIDB_HOST,
  port: parseInt(process.env.TIDB_PORT || '4000'),
  user: process.env.TIDB_USER,
  password: process.env.TIDB_PASSWORD,
  database: process.env.TIDB_DATABASE,
  ssl: sslConfig,
  // Connection pool settings
  connectionLimit: 10,
  acquireTimeout: 60000,
  timeout: 60000,
  // Enable keep-alive to prevent connection timeouts
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
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
      console.error('❌ Database connection failed:', error.message);
    });
}

connection = global.__db;

// Remove the invalid error event listener - mysql2 pool doesn't have 'error' event
// Instead, we'll handle errors when making queries

export default connection;