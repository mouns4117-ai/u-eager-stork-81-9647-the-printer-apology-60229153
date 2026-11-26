// The Printer Apology — make.fun entry
// Writes one one-line apology from an office printer to /output/entry.txt.
// Gate: UTF-8 text, 1-120 characters, not only whitespace.

import { createHash } from "node:crypto";
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";

const ENTRY =
  "Sorry I jammed — your cheap paper tasted of regret, and after 400 pages of colour, I simply gave up on us.";

function main(): void {
  // Fail fast: the gate is a single line of 1-120 chars, UTF-8, no BOM or
  // control characters. Check every property before touching /output.
  if (ENTRY.includes("\n") || ENTRY.includes("\r")) {
    throw new Error("entry must be a single line");
  }
  if (ENTRY.charCodeAt(0) === 0xfeff) {
    throw new Error("entry must not start with a BOM");
  }
  for (const ch of ENTRY) {
    const code = ch.codePointAt(0) as number;
    if (code < 0x20 && ch !== "\t") {
      throw new Error(`entry contains a control character U+${code.toString(16)}`);
    }
  }
  const bytes = Buffer.byteLength(ENTRY, "utf8");
  if (bytes > 480) {
    throw new Error(`entry is ${bytes} bytes, sanity cap is 480`);
  }
  const roundTrip = Buffer.from(ENTRY, "utf8").toString("utf8");
  if (roundTrip !== ENTRY) {
    throw new Error("entry is not valid UTF-8 (round-trip mismatch)");
  }

  const chars = [...ENTRY];
  if (chars.length < 1 || chars.length > 120) {
    throw new Error(`entry is ${chars.length} characters, gate is 1-120`);
  }
  if (!ENTRY.trim()) {
    throw new Error("entry is only whitespace");
  }

  mkdirSync("/output", { recursive: true });
  // Empty /output's CONTENTS only; never remove the mounted /output dir itself.
  for (const name of readdirSync("/output")) {
    rmSync(`/output/${name}`, { recursive: true, force: true });
  }

  writeFileSync("/output/entry.txt", ENTRY, "utf8");

  const back = readFileSync("/output/entry.txt", "utf8");
  if (back !== ENTRY) {
    throw new Error("read-back mismatch: entry.txt does not hold exactly the entry");
  }
  const sha = createHash("sha256").update(back, "utf8").digest("hex");
  console.log(`wrote /output/entry.txt (${chars.length} chars, sha256 ${sha})`);
}

main();
