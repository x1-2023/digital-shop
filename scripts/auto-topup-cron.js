#!/usr/bin/env node

const http = require('http');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

console.log(`[${new Date().toISOString()}] Running auto-topup cron job...`);

const options = {
  hostname: HOST,
  port: PORT,
  path: '/api/cron/auto-topup',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`[${new Date().toISOString()}] Status: ${res.statusCode}`);
    console.log(`[${new Date().toISOString()}] Response:`, data);
    process.exit(res.statusCode === 200 ? 0 : 1);
  });
});

req.on('error', (error) => {
  console.error(`[${new Date().toISOString()}] Error:`, error.message);
  process.exit(1);
});

req.end();
