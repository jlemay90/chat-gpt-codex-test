import { readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

function findTestFiles(dir) {
  const entries = readdirSync(dir);
  const files = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      files.push(...findTestFiles(fullPath));
      continue;
    }

    if (entry.endsWith(".test.js")) {
      files.push(fullPath);
    }
  }

  return files;
}

const root = resolve(process.cwd(), "tests");
const files = findTestFiles(root);

if (files.length === 0) {
  console.error("No test files found under tests/");
  process.exit(1);
}

const result = spawnSync(process.execPath, ["--test", ...files], {
  stdio: "inherit",
  shell: false,
});

process.exit(result.status ?? 1);
