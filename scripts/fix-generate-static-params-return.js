#!/usr/bin/env node
/**
 * Zamienia return [] w generateStaticParams na poprawne placeholdery.
 * Next.js wymaga przynajmniej jednego zestawu parametrów (length > 0).
 */
const fs = require("fs");
const path = require("path");

function paramsForRoute(routePath) {
  const segmentRegex = /\[(\w+)\]/g;
  const paramNames = [];
  let m;
  while ((m = segmentRegex.exec(routePath)) !== null) {
    paramNames.push(m[1]);
  }
  const uniq = [...new Set(paramNames)];
  const obj = Object.fromEntries(uniq.map((p) => [p, "_"]));
  return "return [ " + JSON.stringify(obj) + " ];";
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
        const routePathStr = rel.split(path.sep).join("/");
        results.push({ file: routePath, routePath: routePathStr });
      }
      results.push(...findDynamicRoutes(full, rel));
    }
  }
  return results;
}

const apiDir = path.join(__dirname, "..", "src", "app", "api");
const files = findDynamicRoutes(apiDir);

let updated = 0;
for (const { file, routePath } of files) {
  let content = fs.readFileSync(file, "utf8");
  if (!content.includes("generateStaticParams")) continue;
  const needsFix = content.includes("return [];") || content.includes("return [ {} ]") || content.includes("return [{}]");
  if (!needsFix) continue;

  const newReturn = paramsForRoute(routePath);
  const newContent = content.replace(/return\s*\[\s*(\{\s*\})?\s*\]\s*;?/, newReturn);
  if (newContent === content) continue;

  fs.writeFileSync(file, newContent);
  updated++;
  console.log("Fixed:", path.relative(process.cwd(), file));
}
console.log("Done. Fixed", updated, "files.");
