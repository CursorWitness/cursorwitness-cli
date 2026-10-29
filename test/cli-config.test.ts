import assert from "node:assert/strict";
import test from "node:test";
import { exitCodeForReport, parseCliArguments, parseScenarioConfig, resolveSafeOutputPath } from "../src/cli-config.ts";

test("parses the offline run command and help/version controls", () => {
  assert.deepEqual(parseCliArguments(["run", "--config", "scenario.json"]), {
    command: "run",
    configPath: "scenario.json",
    format: "json",
  });
  assert.deepEqual(parseCliArguments(["run", "--config", "scenario.json", "--format", "text"]), {
    command: "run",
    configPath: "scenario.json",
    format: "text",
  });
  assert.equal(parseCliArguments(["--help"]), "help");
  assert.equal(parseCliArguments(["--version"]), "version");
  assert.throws(() => parseCliArguments(["run", "--config", "scenario.json", "--format", "yaml"]), /json or text/);
});

test("validates scenario.v1 input and rejects unsupported shapes", () => {
  const config = parseScenarioConfig({
    schemaVersion: "scenario.v1",
    scenarioId: "cli-scenario",
    fixture: { schemaVersion: "fixture.v1" },
    expectedEventIds: ["event-1"],
  });
  assert.equal(config.scenarioId, "cli-scenario");
  assert.throws(() => parseScenarioConfig({ schemaVersion: "scenario.v0" }), /schemaVersion/);
  assert.throws(() => parseScenarioConfig({ schemaVersion: "scenario.v1", scenarioId: "x", fixture: {}, expectedEventIds: [""] }), /expectedEventIds/);
});

test("resolves output safely without overwriting the config", () => {
  assert.equal(resolveSafeOutputPath("reports/report.json", "scenario.json", "C:\\workspace"), "C:\\workspace\\reports\\report.json");
  assert.throws(() => resolveSafeOutputPath("scenario.json", "scenario.json", "C:\\workspace"), /overwrite/);
  assert.equal(exitCodeForReport("pass"), 0);
  assert.equal(exitCodeForReport("fail"), 1);
  assert.equal(exitCodeForReport("unverified"), 2);
});
