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
      // Check if any parent directory has [ in its name (dynamic segment)
      if (dir.includes('[')) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

const apiDir = path.join(__dirname, '..', 'src', 'app', 'api');
const files = findRouteFiles(apiDir);
let updatedCount = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Skip if already has generateStaticParams
  if (content.includes('generateStaticParams')) {
    console.log('Already has:', file);
    continue;
  }
  
  // Find the first import block
  const lines = content.split('\n');
  let lastImportIndex = -1;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('import ') || (line.startsWith('} from ') && lastImportIndex >= 0)) {
      lastImportIndex = i;
    } else if (lastImportIndex >= 0 && line !== '' && !line.startsWith('import ') && !line.startsWith('//')) {
      break;
    }
  }
  
  if (lastImportIndex === -1) {
    console.log('Skipping (no imports):', file);
    continue;
  }
  
  const staticParamsCode = `
// Required for output: 'export' (Capacitor build) – API not used in static bundle
export async function generateStaticParams() {
  return [];
}`;
  
  // Insert after the last import line
  lines.splice(lastImportIndex + 1, 0, staticParamsCode);
  
  fs.writeFileSync(file, lines.join('\n'), 'utf8');
  console.log('Updated:', file);
  updatedCount++;
}

console.log(`\nTotal updated: ${updatedCount} files`);
