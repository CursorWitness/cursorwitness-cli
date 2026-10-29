import { isAbsolute, relative, resolve } from "node:path";
const MAX_EXPECTED_IDS = 100_000;
const MAX_FIELD_LENGTH = 4_096;

export interface CliRunArguments {
  readonly command: "run";
  readonly configPath: string;
  readonly outputPath?: string;
  readonly format: "json" | "text";
}

export interface ScenarioConfigV1 {
  readonly schemaVersion: "scenario.v1";
  readonly scenarioId: string;
  readonly fixture: Record<string, unknown>;
  readonly expectedEventIds: readonly string[];
  readonly expectedEffectKeys?: readonly string[];
}

export function parseCliArguments(argv: readonly string[]): CliRunArguments | "help" | "version" {
  if (argv.length === 0 || argv.includes("--help") || argv.includes("-h")) return "help";
  if (argv.length === 1 && (argv[0] === "--version" || argv[0] === "-v")) return "version";
  if (argv[0] !== "run") throw new TypeError("expected command: run");

  let configPath: string | undefined;
  let outputPath: string | undefined;
  let format: "json" | "text" = "json";
  for (let index = 1; index < argv.length; index += 1) {
    const flag = argv[index];
    const value = argv[index + 1];
    if ((flag === "--config" || flag === "-c") && value !== undefined) {
      configPath = value;
      index += 1;
    } else if (flag === "--output" || flag === "-o") {
      if (value === undefined) throw new TypeError("--output requires a path");
      outputPath = value;
      index += 1;
    } else if (flag === "--format") {
      if (value !== "json" && value !== "text") throw new TypeError("--format must be json or text");
      format = value;
      index += 1;
    } else {
      throw new TypeError(`unknown or incomplete option: ${flag}`);
    }
  }
  if (configPath === undefined) throw new TypeError("run requires --config <path>");
  return { command: "run", configPath, format, ...(outputPath === undefined ? {} : { outputPath }) };
}

export function parseScenarioConfig(value: unknown): ScenarioConfigV1 {
  if (value === null || typeof value !== "object") throw new TypeError("scenario config must be an object");
  const config = value as Record<string, unknown>;
  if (config.schemaVersion !== "scenario.v1") throw new TypeError("scenario config schemaVersion must be scenario.v1");
  if (typeof config.scenarioId !== "string" || config.scenarioId.trim() === "") throw new TypeError("scenarioId must be non-empty");
  if (config.scenarioId.length > MAX_FIELD_LENGTH) throw new TypeError("scenarioId exceeds the size limit");
  if (config.fixture === null || typeof config.fixture !== "object") throw new TypeError("fixture must be an object");
  if (!isStringArray(config.expectedEventIds)) throw new TypeError("expectedEventIds must be an array of strings");
  if (config.expectedEventIds.length > MAX_EXPECTED_IDS) throw new TypeError(`expectedEventIds exceeds ${MAX_EXPECTED_IDS}`);
  if (config.expectedEffectKeys !== undefined && !isStringArray(config.expectedEffectKeys)) {
    throw new TypeError("expectedEffectKeys must be an array of strings");
  }
  if (config.expectedEffectKeys !== undefined && config.expectedEffectKeys.length > MAX_EXPECTED_IDS) {
    throw new TypeError(`expectedEffectKeys exceeds ${MAX_EXPECTED_IDS}`);
  }
  return {
    schemaVersion: "scenario.v1",
    scenarioId: config.scenarioId,
    fixture: config.fixture as Record<string, unknown>,
    expectedEventIds: config.expectedEventIds,
    ...(config.expectedEffectKeys === undefined ? {} : { expectedEffectKeys: config.expectedEffectKeys }),
  };
}

export function resolveSafeOutputPath(outputPath: string, configPath: string, cwd: string): string {
  if (outputPath.trim() === "") throw new TypeError("output path must be non-empty");
  if (outputPath.includes("\0") || isAbsolute(outputPath)) throw new TypeError("output path must be relative to the working directory");
  if (outputPath.split(/[\\/]/u).some((segment) => segment === "..")) throw new TypeError("output path must not contain parent traversal");
  const resolved = resolve(cwd, outputPath);
  const resolvedConfig = resolve(cwd, configPath);
  if (resolved === resolvedConfig) throw new TypeError("output path must not overwrite the config file");
  const escaped = relative(resolve(cwd), resolved).startsWith(`..`);
  if (escaped) throw new TypeError("output path escapes the working directory");
  return resolved;
}

export function exitCodeForReport(status: "pass" | "fail" | "unverified"): number {
  return status === "pass" ? 0 : status === "fail" ? 1 : 2;
}

export function isAbsolutePath(value: string): boolean {
  return isAbsolute(value);
}

function isStringArray(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string" && entry.trim() !== "");
}
