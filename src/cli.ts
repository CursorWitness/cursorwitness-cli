import { readFile, stat, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { FixtureGetEventsPort, InMemoryObservationRecorder, evaluateOracle, reportFromOracle, runPaginationScenario } from "@cursorwitness/core";
import { exitCodeForReport, parseCliArguments, parseScenarioConfig, resolveSafeOutputPath } from "./cli-config.js";
import { validateFixture, type GetEventsFixtureV1 } from "@cursorwitness/core";
import { formatHumanReport } from "./text-report.js";
const MAX_SCENARIO_FILE_BYTES = 4 * 1024 * 1024;

export const CLI_VERSION = "0.1.0-dev.0";

const HELP = `CursorWitness ${CLI_VERSION}

Usage:
  cursorwitness run --config <scenario.json> [--output <report.json>]
                    [--format json|text]
  cursorwitness --help
  cursorwitness --version

The run command is offline and uses the scenario's embedded fixture.v1 data.
`;

export async function main(argv: readonly string[], cwd = process.cwd()): Promise<number> {
  try {
    const parsed = parseCliArguments(argv);
    if (parsed === "help") {
      process.stdout.write(HELP);
      return 0;
    }
    if (parsed === "version") {
      process.stdout.write(`${CLI_VERSION}\n`);
      return 0;
    }

    const configPath = resolve(cwd, parsed.configPath);
    const configStats = await stat(configPath);
    if (!configStats.isFile()) throw new TypeError("config path must refer to a regular file");
    if (configStats.size > MAX_SCENARIO_FILE_BYTES) throw new TypeError(`config file exceeds ${MAX_SCENARIO_FILE_BYTES} bytes`);
    const config = parseScenarioConfig(JSON.parse(await readFile(configPath, "utf8")));
    const fixture = config.fixture as unknown as GetEventsFixtureV1;
    validateFixture(fixture);

    const result = await runPaginationScenario({
      expected: {
        scenarioId: config.scenarioId,
        expectedEventIds: config.expectedEventIds,
        ...(config.expectedEffectKeys === undefined ? {} : { expectedEffectKeys: config.expectedEffectKeys }),
      },
      rpc: new FixtureGetEventsPort(fixture),
      consumer: {
        continueAfterPage: (response) => response.cursor !== undefined,
        handleEvent: () => undefined,
      },
      recorder: new InMemoryObservationRecorder(),
      evaluate: evaluateOracle,
      buildReport: reportFromOracle,
    });
    const output = parsed.format === "text"
      ? formatHumanReport(result.report)
      : `${JSON.stringify(result.report, null, 2)}\n`;
    if (parsed.outputPath === undefined) {
      process.stdout.write(output);
    } else {
      const outputPath = resolveSafeOutputPath(parsed.outputPath, configPath, cwd);
      await writeFile(outputPath, output, { encoding: "utf8", flag: "wx" });
      process.stdout.write(`report written to ${outputPath}\n`);
    }
    return exitCodeForReport(result.report.status);
  } catch (error) {
    const message = error instanceof Error ? error.message : "command failed";
    process.stderr.write(`cursorwitness: ${message}\n`);
    return 2;
  }
}

if (process.argv[1]?.endsWith("cli.js")) {
  main(process.argv.slice(2)).then((code) => { process.exitCode = code; });
}
