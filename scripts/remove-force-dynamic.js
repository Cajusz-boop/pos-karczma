const fs = require('fs');
const path = require('path');

function findRouteFiles(dir) {
  const results = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      results.push(...findRouteFiles(fullPath));
    } else if (item.name === 'route.ts') {
      results.push(fullPath);
    }
  }
  return results;
}

const apiDir = path.join(__dirname, '..', 'src', 'app', 'api');
const files = findRouteFiles(apiDir);
let updatedCount = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;
  
  // Remove export const dynamic = 'force-dynamic'; or "force-dynamic"
  content = content.replace(/export const dynamic = ['"]force-dynamic['"];\r?\n?/g, '');
  
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated:', file);
    updatedCount++;
  }
}

console.log(`\nTotal updated: ${updatedCount} files`);
