/**
 * Start Next.js dev server with auto-cron initialization
 * This script will:
 * 1. Start Next.js dev server
 * 2. Wait for server to be ready
 * 3. Auto-initialize cron jobs
 */

const { spawn } = require('child_process');
const http = require('http');

console.log('🚀 Starting Next.js dev server with auto-cron...\n');

// Track the actual port the server starts on
let serverPort = 3000;

// Start Next.js dev server (use dev:only to avoid infinite loop)
const nextProcess = spawn('npm', ['run', 'dev:only'], {
  stdio: ['inherit', 'pipe', 'inherit'],
  shell: true
});

// Capture stdout to detect the actual port
nextProcess.stdout.on('data', (data) => {
  const output = data.toString();
  // Look for "Local: http://localhost:XXXX"
  const portMatch = output.match(/Local:\s+http:\/\/localhost:(\d+)/);
  if (portMatch) {
    serverPort = parseInt(portMatch[1]);
  }
  // Forward to stdout
  process.stdout.write(data);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  nextProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  nextProcess.kill('SIGTERM');
  process.exit(0);
});

// Wait for server to be ready, then initialize cron
function waitForServerAndInitCron(retryCount = 0) {
  const MAX_RETRIES = 30;
  const RETRY_DELAY = 2000;

  if (retryCount === 0) {
    console.log('\n⏳ Waiting for Next.js server to start...');
  }

  setTimeout(() => {
    const options = {
      hostname: 'localhost',
      port: serverPort,
      path: '/api/cron-init',
      method: 'GET',
      timeout: 2000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('\n✅ Cron jobs initialized successfully!');
          console.log('⚡ Auto-topup will run every 30 seconds');
          console.log(`\n📝 Server ready at http://localhost:${serverPort}\n`);
        } else {
          console.error('\n❌ Failed to initialize cron jobs');
        }
      });
    });

    req.on('error', () => {
      if (retryCount < MAX_RETRIES) {
        waitForServerAndInitCron(retryCount + 1);
      } else {
        console.error('\n❌ Could not initialize cron after', MAX_RETRIES, 'attempts');
        console.error('You can manually run: npm run cron:start\n');
      }
    });

    req.end();
  }, RETRY_DELAY);
}

// Start waiting for server
waitForServerAndInitCron();
