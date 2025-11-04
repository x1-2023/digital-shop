#!/usr/bin/env node

const cron = require('node-cron');
const http = require('http');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

console.log('[Auto-topup Daemon] Starting...');
console.log(`[Auto-topup Daemon] Target: http://${HOST}:${PORT}/api/cron/auto-topup`);
console.log('[Auto-topup Daemon] Schedule: Every 5 minutes');

function runAutoTopup() {
  console.log(`\n[${new Date().toISOString()}] Running auto-topup cron job...`);

  const options = {
    hostname: HOST,
    port: PORT,
    path: '/api/cron/auto-topup',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 30000, // 30 second timeout
  };

  const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log(`[${new Date().toISOString()}] Status: ${res.statusCode}`);
      if (res.statusCode === 200) {
        try {
          const result = JSON.parse(data);
          console.log(`[${new Date().toISOString()}] Success: ${result.message}`);
          if (result.details && result.details.length > 0) {
            console.log(`[${new Date().toISOString()}] Processed ${result.details.length} transactions`);
          }
        } catch (e) {
          console.log(`[${new Date().toISOString()}] Response: ${data}`);
        }
      } else {
        console.error(`[${new Date().toISOString()}] Error: ${data}`);
      }
    });
  });

  req.on('error', (error) => {
    console.error(`[${new Date().toISOString()}] Request error:`, error.message);
  });

  req.on('timeout', () => {
    console.error(`[${new Date().toISOString()}] Request timeout`);
    req.destroy();
  });

  req.end();
}

// Schedule: run every 5 minutes
const task = cron.schedule('*/5 * * * *', () => {
  runAutoTopup();
}, {
  scheduled: true,
  timezone: "Asia/Ho_Chi_Minh"
});

// Run immediately on start
console.log('[Auto-topup Daemon] Running initial check...');
runAutoTopup();

console.log('[Auto-topup Daemon] Daemon started successfully. Press Ctrl+C to stop.');

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[Auto-topup Daemon] Shutting down...');
  task.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n[Auto-topup Daemon] Shutting down...');
  task.stop();
  process.exit(0);
});

// Keep process alive
process.stdin.resume();
