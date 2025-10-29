import cron, { ScheduledTask } from 'node-cron';

let cronJobStarted = false;
let cronTask: ScheduledTask | null = null;

export async function startCronJobs() {
  if (cronJobStarted) {
    console.log('[Cron] Jobs already started, skipping...');
    return;
  }

  console.log('[Cron] Starting cron jobs...');

  // Start online tracking
  const { startOnlineTracking } = await import('./online-tracking');
  startOnlineTracking();

  // Auto-topup: Chạy mỗi 1 phút
  cronTask = cron.schedule('*/1 * * * *', async () => {
    console.log('[Cron] Running auto-topup check...');
    try {
      // Dynamic import để luôn dùng code mới nhất
      const { processAllBanks } = await import('./auto-topup');
      const result = await processAllBanks();
      console.log(`[Cron] Auto-topup completed: ${result.processed} processed, ${result.failed} failed`);
    } catch (error) {
      console.error('[Cron] Auto-topup error:', error);
    }
  });

  cronJobStarted = true;
  console.log('[Cron] Jobs started successfully!');
  console.log('[Cron] - Auto-topup: Every 1 minute');
  console.log('[Cron] - Online tracking: Every 1 minute');
}

export function stopCronJobs() {
  if (cronTask) {
    cronTask.stop();
    cronJobStarted = false;
    cronTask = null;
    console.log('[Cron] Jobs stopped');
  }
}

export async function restartCronJobs() {
  stopCronJobs();
  await startCronJobs();
}
