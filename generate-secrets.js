const crypto = require('crypto');

// Generate a 32-character secret for JWT
const jwtSecret = crypto.randomBytes(32).toString('hex');

// Generate a 32-character secret for NextAuth
const nextAuthSecret = crypto.randomBytes(32).toString('hex');

console.log('=== GENERATED SECRETS ===');
console.log('JWT_SECRET=' + jwtSecret);
console.log('NEXTAUTH_SECRET=' + nextAuthSecret);
console.log('==========================');
console.log('\nCopy these to your .env.local file:');
console.log(`JWT_SECRET=${jwtSecret}`);
console.log(`NEXTAUTH_SECRET=${nextAuthSecret}`);