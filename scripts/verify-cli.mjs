import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { join, relative } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const cli = join(root, "dist", "cli.js");
const run = (args) => spawnSync(process.execPath, [cli, ...args], { cwd: root, encoding: "utf8" });

const passing = run(["run", "--config", "examples/cli/basic-scenario.json"]);
assert.equal(passing.status, 0, passing.stderr);
assert.equal(JSON.parse(passing.stdout).status, "pass");

const text = run(["run", "--config", "examples/cli/basic-scenario.json", "--format", "text"]);
assert.equal(text.status, 0, text.stderr);
assert.match(text.stdout, /Status: PASS/);
assert.match(text.stdout, /trace entries are observed; assertions are asserted/);

const failing = run(["run", "--config", "examples/cli/broken-scenario.json"]);
assert.equal(failing.status, 1, failing.stderr);
assert.equal(JSON.parse(failing.stdout).status, "fail");

const invalidDirectory = await mkdtemp(join(root, ".cli-output-"));
try {
  const output = join(invalidDirectory, "report.json");
  const outputRelative = relative(root, output);
  const written = run(["run", "--config", "examples/cli/basic-scenario.json", "--output", outputRelative]);
  assert.equal(written.status, 0, written.stderr);
  assert.equal(JSON.parse(await readFile(output, "utf8")).status, "pass");
  const overwrite = run(["run", "--config", "examples/cli/basic-scenario.json", "--output", outputRelative]);
  assert.equal(overwrite.status, 2);
  assert.match(overwrite.stderr, /already exists|EEXIST/);
} finally {
  await rm(invalidDirectory, { recursive: true, force: true });
}

const invalid = run(["run", "--config", "examples/cli/does-not-exist.json"]);
assert.equal(invalid.status, 2);
assert.match(invalid.stderr, /ENOENT|no such file/i);
console.log("cliVerification: true");
