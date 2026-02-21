#!/usr/bin/env node
const http = require('http');
const crypto = require('crypto');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = process.env.WEBHOOK_PORT || 9000;
const SECRET = process.env.WEBHOOK_SECRET || '';
const DEPLOY_SCRIPT = process.env.DEPLOY_SCRIPT || '/var/www/pos/webhook/deploy.sh';
const BRANCH = process.env.DEPLOY_BRANCH || 'master';
const LOG_FILE = process.env.WEBHOOK_LOG || '/var/www/pos/webhook/webhook.log';

function log(message) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${message}`;
  console.log(line);
  try {
    fs.appendFileSync(LOG_FILE, line + '\n');
  } catch (e) {}
}

function verifySignature(payload, signature) {
  if (!SECRET) {
    log('WARNING: No WEBHOOK_SECRET set - skipping verification');
    return true;
  }
  if (!signature) {
    log('ERROR: No signature in request');
    return false;
  }
  const sig = signature.replace('sha256=', '');
  const hmac = crypto.createHmac('sha256', SECRET);
  hmac.update(payload);
  const digest = hmac.digest('hex');
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(digest));
}

function runDeploy() {
  log('Starting deploy...');
  
  const deploy = spawn('bash', [DEPLOY_SCRIPT], {
    cwd: path.dirname(DEPLOY_SCRIPT),
    stdio: ['ignore', 'pipe', 'pipe']
  });

  deploy.stdout.on('data', (data) => {
    log(`[DEPLOY] ${data.toString().trim()}`);
  });

  deploy.stderr.on('data', (data) => {
    log(`[DEPLOY ERROR] ${data.toString().trim()}`);
  });

  deploy.on('close', (code) => {
    if (code === 0) {
      log('Deploy completed successfully');
    } else {
      log(`Deploy failed with code ${code}`);
    }
  });

  deploy.on('error', (err) => {
    log(`Deploy error: ${err.message}`);
  });
}

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
    return;
  }

  if (req.method !== 'POST' || req.url !== '/webhook') {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
    return;
  }

  let body = '';
  req.on('data', chunk => { body += chunk; });

  req.on('end', () => {
    const signature = req.headers['x-hub-signature-256'];
    const event = req.headers['x-github-event'];

    log(`Received ${event} event`);

    if (!verifySignature(body, signature)) {
      log('ERROR: Invalid signature');
      res.writeHead(401, { 'Content-Type': 'text/plain' });
      res.end('Invalid signature');
      return;
    }

    if (event !== 'push') {
      log(`Ignoring ${event} event (only push triggers deploy)`);
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('OK - ignored');
      return;
    }

    let payload;
    try {
      payload = JSON.parse(body);
    } catch (e) {
      log('ERROR: Invalid JSON payload');
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Invalid JSON');
      return;
    }

    const ref = payload.ref || '';
    const branch = ref.replace('refs/heads/', '');
    
    if (branch !== BRANCH) {
      log(`Ignoring push to ${branch} (only ${BRANCH} triggers deploy)`);
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end(`OK - ignored (branch: ${branch})`);
      return;
    }

    const pusher = payload.pusher?.name || 'unknown';
    const commits = payload.commits?.length || 0;
    log(`Push to ${branch} by ${pusher} (${commits} commits) - triggering deploy`);

    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Deploy triggered');

    runDeploy();
  });
});

server.listen(PORT, () => {
  log(`Webhook server listening on port ${PORT}`);
  log(`Deploy script: ${DEPLOY_SCRIPT}`);
  log(`Branch: ${BRANCH}`);
});
