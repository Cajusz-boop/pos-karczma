#!/usr/bin/env node
/**
 * Dodaje generateStaticParams do API route handlers z segmentami dynamicznymi.
 * Wymagane dla output: 'export' (build Capacitor).
 */
const fs = require("fs");
const path = require("path");

function blockForPath(routePath) {
  const segments = routePath.match(/\[(\w+)\]/g) || [];
  const params = segments.map((s) => s.slice(1, -1));
  const obj = Object.fromEntries(params.map((p) => [p, "__"]));
  const ret = JSON.stringify([obj], null, 2).replace(/"__"/g, '"_"');
  return `
// Required for output: 'export' (Capacitor build) – API not used in static bundle
export async function generateStaticParams() {
  return ${ret};
}
`;
}

function findDynamicRoutes(dir, pathSoFar = "") {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    const rel = path.join(pathSoFar, e.name);
    if (e.isDirectory()) {
      const hasDynamic = rel.includes("[");
      const routePath = path.join(full, "route.ts");
      if (hasDynamic && fs.existsSync(routePath)) {
        results.push(routePath);
      }
      results.push(...findDynamicRoutes(full, rel));
    }
  }
  return results;
}

const apiDir = path.join(__dirname, "..", "src", "app", "api");
const files = findDynamicRoutes(apiDir);

let updated = 0;
for (const file of files) {
  let content = fs.readFileSync(file, "utf8");
  if (content.includes("generateStaticParams")) continue;

  // Wstaw przed pierwszym export async function / export function
  const match = content.match(/\n(\s*)(export (async )?function (GET|POST|PUT|PATCH|DELETE))/);
  if (!match) continue;
  const relPath = path.relative(apiDir, path.dirname(file));
  const routePath = relPath.split(path.sep).join("/");
  const block = blockForPath(routePath);
  const insertAt = content.indexOf(match[0]);
  const before = content.slice(0, insertAt);
  const after = content.slice(insertAt);
  content = before + block + "\n" + after;
  fs.writeFileSync(file, content);
  updated++;
  console.log("Updated:", path.relative(process.cwd(), file));
}
console.log("Done. Updated", updated, "files.");
