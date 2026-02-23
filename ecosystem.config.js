module.exports = {
  apps: [
    {
      name: 'pos-karczma',
      script: 'node_modules/.bin/next',
      args: 'start -p 3001',
      cwd: '/var/www/pos',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '500M',
      restart_delay: 3000,
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 30000
    },
    {
      name: 'pos-webhook',
      script: 'webhook/server.js',
      cwd: '/var/www/pos',
      env: {
        NODE_ENV: 'production',
        WEBHOOK_PORT: 9000,
        WEBHOOK_SECRET: process.env.WEBHOOK_SECRET || '',
        DEPLOY_SCRIPT: '/var/www/pos/webhook/deploy.sh',
        DEPLOY_BRANCH: 'master',
        WEBHOOK_LOG: '/var/www/pos/webhook/webhook.log'
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '100M',
      restart_delay: 1000
    }
  ]
};
