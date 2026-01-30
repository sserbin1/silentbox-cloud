// PM2 Ecosystem Configuration for Silentbox Cloud
// Server: 49.12.104.181
// Domain: cloud.silent-box.com

module.exports = {
  apps: [
    // API Server (Fastify)
    {
      name: 'silentbox-api',
      script: 'dist/index.js',
      cwd: './apps/api',
      instances: 2,
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      wait_ready: true,
      listen_timeout: 10000,
      kill_timeout: 5000,
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      error_file: '/var/log/silentbox/api-error.log',
      out_file: '/var/log/silentbox/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },

    // Admin Dashboard (Next.js)
    {
      name: 'silentbox-admin',
      script: 'node_modules/next/dist/bin/next',
      args: 'start --port 3002',
      cwd: './apps/admin',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      wait_ready: true,
      listen_timeout: 10000,
      kill_timeout: 5000,
      env: {
        NODE_ENV: 'production',
        PORT: 3002,
      },
      error_file: '/var/log/silentbox/admin-error.log',
      out_file: '/var/log/silentbox/admin-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },

    // Booking App (Next.js PWA)
    {
      name: 'silentbox-booking',
      script: 'node_modules/next/dist/bin/next',
      args: 'start --port 3003',
      cwd: './apps/booking',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      wait_ready: true,
      listen_timeout: 10000,
      kill_timeout: 5000,
      env: {
        NODE_ENV: 'production',
        PORT: 3003,
      },
      error_file: '/var/log/silentbox/booking-error.log',
      out_file: '/var/log/silentbox/booking-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
  ],

  deploy: {
    production: {
      user: 'root',
      host: '49.12.104.181',
      ref: 'origin/main',
      repo: 'git@github.com:sergiorbk/silentbox-cloud.git',
      path: '/var/www/silentbox-cloud',
      'pre-deploy-local': '',
      'post-deploy': 'pnpm install && pnpm build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
    },
  },
};
