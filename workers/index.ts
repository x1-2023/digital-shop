/**
 * WORKERS - DISABLED (No Redis)
 * 
 * This file contains background workers for:
 * - Email sending (OTP, notifications)
 * - Order fulfillment (license generation)
 * - TPBank transaction sync
 * 
 * For production with scale, consider:
 * 1. Install Redis: `docker run -p 6379:6379 redis`
 * 2. Set REDIS_ENABLED=true in .env
 * 3. Install dependencies: npm install bullmq ioredis
 * 4. Run workers: npm run workers
 * 
 * Current setup: Jobs are logged to console (see src/lib/queues.ts)
 */

export {};



