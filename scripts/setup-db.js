const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up database...');

// Check if cert file exists
const certPath = path.join(__dirname, '../certs/isrgrootx1.pem');
if (!fs.existsSync(certPath)) {
  console.error('❌ SSL certificate not found at:', certPath);
  console.log('📋 Please download the certificate from TiDB Cloud and place it in the certs folder');
  process.exit(1);
}

console.log('✅ SSL certificate found');

// Initialize database by calling the API
exec('curl http://localhost:3000/api/init', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Database initialization failed:', error);
    return;
  }
  console.log('✅ Database initialization response:', stdout);
});

// Test database health
exec('curl http://localhost:3000/api/health', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Database health check failed:', error);
    return;
  }
  console.log('✅ Database health check:', stdout);
});