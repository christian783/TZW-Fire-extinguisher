#!/usr/bin/env node
/**
 * Static regression check for the hidden-tab JavaScript dropper.
 * Flags extensionless init files, long tab-padding runs, and the campaign's
 * loader identifiers and npm script hooks.
 *
 * Reads file bytes as text only. Does not import, eval, or execute anything it scans.
 * Signature fragments are concatenated so this file does not contain the live needles.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const SKIP_DIRS = new Set([".git", "node_modules", "dist", "build", "logs", "coverage"]);

const needles = [
  { id: "lane-splitter", value: "split" + "Lane" },
  { id: "peel-helper", value: "function " + "peel" },
  { id: "global-require", value: "(global," + "require)" },
  { id: "global-require-spaced", value: "(global, " + "require)" },
  { id: "node-init-hook", value: "node " + "init &&" }
];

const TAB_RUN = new RegExp("\\t{32,}");
const LONG_LINE = 4000;

function findingsInText(rel, text) {
  const found = [];
  for (const needle of needles) {
    if (text.includes(needle.value)) {
      found.push(`${rel}: contains ${needle.id}`);
    }
  }
  if (TAB_RUN.test(text)) {
    found.push(`${rel}: contains tab-padding run`);
  }
  if (rel !== "package-lock.json") {
    const lines = text.split("\n");
    for (let i = 0; i < lines.length; i += 1) {
      if (lines[i].length > LONG_LINE) {
        found.push(`${rel}:${i + 1}: line length ${lines[i].length}`);
      }
    }
  }
  return found;
}

function selfTest() {
  const sample = [
    "'use strict';",
    "\t".repeat(40) + "function " + "peel" + "(R){return R}",
    "function " + "split" + "Lane" + "(R){return R}",
    "}(global," + "require);",
    "node " + "init && true"
  ].join("\n");
  const hits = findingsInText("init", sample);
  for (const id of ["lane-splitter", "peel-helper", "global-require", "node-init-hook", "tab-padding"]) {
    if (!hits.some((hit) => hit.includes(id))) {
      throw new Error(`self-test missed ${id}`);
    }
  }
  const clean = "export default {\n  plugins: {}\n};\n";
  const cleanHits = findingsInText("frontend/postcss.config.js", clean);
  if (cleanHits.length > 0) {
    throw new Error(`self-test false positive: ${cleanHits.join("; ")}`);
  }
}

function walk(dir, out) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.isSymbolicLink()) continue;
    const full = path.join(dir, ent.name);
    const rel = path.relative(repoRoot, full).split(path.sep).join("/");
    if (ent.isDirectory()) {
      if (SKIP_DIRS.has(ent.name)) continue;
      walk(full, out);
      continue;
    }
    if (!ent.isFile()) continue;
    if (ent.name === "init") {
      out.push(`${rel}: dropper filename`);
    }
    let data;
    try {
      data = fs.readFileSync(full);
    } catch (err) {
      out.push(`${rel}: unreadable (${err.message})`);
      continue;
    }
    if (data.includes(0)) continue;
    out.push(...findingsInText(rel, data.toString("utf8")));
  }
}

function main() {
  selfTest();
  const findings = [];
  walk(repoRoot, findings);
  if (findings.length > 0) {
    console.error("Dropper regression check failed:");
    for (const finding of findings) console.error(`  ${finding}`);
    process.exit(1);
  }
  console.log("Dropper regression check passed.");
}

main();
