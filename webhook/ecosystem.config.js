module.exports = {
  apps: [
    {
      name: 'pos-webhook',
      script: 'server.js',
      cwd: '/var/www/pos/webhook',
      env: {
        NODE_ENV: 'production',
        WEBHOOK_PORT: 9000,
        WEBHOOK_SECRET: process.env.WEBHOOK_SECRET || '3048fc1f8506a1176411482719ee26796db05586a9543cbff4331090f6be0993',
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
