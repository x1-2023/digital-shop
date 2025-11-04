module.exports = {
  apps: [
    {
      name: 'digital-shop',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      cwd: './',
      instances: 1,
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        APP_URL: 'https://webmmo.net',
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true,
      merge_logs: true,
    },
    // Auto-topup cron moved to system crontab
    // See DEPLOY-SYSTEM-CRON.md for setup instructions
  ],
};
