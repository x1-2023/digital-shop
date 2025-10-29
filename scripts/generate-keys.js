const crypto = require('crypto');
const fs = require('fs');

console.log('🔑 Generating RSA key pair for license system...\n');

// Generate RSA key pair
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem'
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem'
  }
});

// Save keys to files
fs.writeFileSync('private.pem', privateKey);
fs.writeFileSync('public.pem', publicKey);

console.log('✅ Keys generated successfully!');
console.log('\n📁 Files created:');
console.log('- private.pem (Private key)');
console.log('- public.pem (Public key)');
console.log('\n🔧 Add these to your .env file:');
console.log('\nLICENSE_PRIVATE_KEY="' + privateKey.replace(/\n/g, '\\n') + '"');
console.log('\nLICENSE_PUBLIC_KEY="' + publicKey.replace(/\n/g, '\\n') + '"');
console.log('\n⚠️  Keep your private key secure and never commit it to version control!');



