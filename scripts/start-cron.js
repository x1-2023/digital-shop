/**
 * Script to auto-start cron jobs after Next.js dev server is ready
 * This will call /api/cron-init to initialize the cron jobs
 */

const http = require('http');

const MAX_RETRIES = 10;
const RETRY_DELAY = 2000; // 2 seconds

function initCronJobs(retryCount = 0) {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/cron-init',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log('✅ Cron jobs initialized successfully!');
        console.log('📅 Auto-topup will run every 5 minutes');
        process.exit(0);
      } else {
        console.error('❌ Failed to initialize cron jobs:', data);
        process.exit(1);
      }
    });
  });

  req.on('error', (error) => {
    if (retryCount < MAX_RETRIES) {
      console.log(`⏳ Waiting for server... (attempt ${retryCount + 1}/${MAX_RETRIES})`);
      setTimeout(() => initCronJobs(retryCount + 1), RETRY_DELAY);
    } else {
      console.error('❌ Server not ready after', MAX_RETRIES, 'attempts');
      console.error('Please make sure Next.js dev server is running on port 3000');
      console.error('Then run: node scripts/start-cron.js');
      process.exit(1);
    }
  });

  req.end();
}

console.log('🚀 Initializing cron jobs...');
initCronJobs();
