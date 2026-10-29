import type { ReportV1 } from "@cursorwitness/core";

/** Stable, concise human rendering; it contains no timestamps, paths, or runtime metadata. */
export function formatHumanReport(report: ReportV1): string {
  const lines = [
    `CursorWitness report: ${report.scenarioId}`,
    `Status: ${report.status.toUpperCase()}`,
    `Evidence mode: ${report.evidenceMode}`,
    "Evidence meaning: trace entries are observed; assertions are asserted from that trace; unverified means evidence was insufficient.",
    "",
    "Summary:",
    `  expected events: ${report.summary.expectedEventCount}`,
    `  observed events: ${report.summary.observedEventCount}`,
    `  deliveries: ${report.summary.deliveryCount}`,
    `  handler invocations: ${report.summary.handlerInvocationCount}`,
    `  effect attempts: ${report.summary.effectAttemptCount}`,
    `  committed effects: ${report.summary.committedEffectCount}`,
    `  unique committed effects: ${report.summary.uniqueCommittedEffectCount}`,
    "",
    "Assertions:",
    ...report.assertions.map((assertion) =>
      `  [${assertion.status.toUpperCase()}] ${assertion.id}: ${assertion.message} (evidence: ${assertion.evidenceRefs.join(", ")})`),
    "",
    "Observed trace:",
    ...report.trace.map((entry) => `  #${entry.sequence} ${entry.kind}`),
  ];
  return `${lines.join("\n")}\n`;
}
