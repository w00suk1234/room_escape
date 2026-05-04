import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const filesToScan = [
  "data/chapter1.ts",
  "data/chapter2.ts",
  "data/chapter3.ts",
  "data/chapter4.ts",
  "data/endings.ts",
  "data/audio.ts",
  "data/characters.ts",
  "components/StartScreen.tsx",
];

const assetPattern = /["'](\/(?:assets|images)\/[^"']+)["']/g;
const found = new Set();

for (const file of filesToScan) {
  const filePath = path.join(root, file);
  if (!fs.existsSync(filePath)) {
    console.error(`Missing data file: ${file}`);
    process.exitCode = 1;
    continue;
  }

  const source = fs.readFileSync(filePath, "utf8");
  for (const match of source.matchAll(assetPattern)) {
    found.add(match[1]);
  }
}

let missingCount = 0;

for (const assetPath of [...found].sort()) {
  const publicPath = path.join(root, "public", assetPath.replace(/^\//, ""));
  if (fs.existsSync(publicPath)) {
    console.log(`Found: ${path.relative(root, publicPath)}`);
  } else {
    missingCount += 1;
    console.error(`Missing: ${path.relative(root, publicPath)}`);
  }
}

if (missingCount > 0) {
  console.error(`Asset check failed: ${missingCount} missing file(s).`);
  process.exit(1);
}

console.log(`Asset check passed: ${found.size} asset path(s) verified.`);
