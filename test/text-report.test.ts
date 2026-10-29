import assert from "node:assert/strict";
import test from "node:test";
import { formatHumanReport } from "../src/text-report.ts";

test("human report explicitly labels observed, asserted, and unverified evidence", () => {
  const output = formatHumanReport({
    schemaVersion: "report.v1",
    scenarioId: "text-report",
    status: "unverified",
    evidenceMode: "simulated-offline",
    assertions: [{ id: "checkpoint-persisted", status: "unverified", message: "durability unavailable", evidenceRefs: ["trace.checkpoint"] }],
    summary: {
      expectedEventCount: 1,
      observedEventCount: 1,
      deliveryCount: 1,
      handlerInvocationCount: 1,
      effectAttemptCount: 0,
      committedEffectCount: 0,
      uniqueCommittedEffectCount: 0,
    },
    trace: [{ sequence: 0, kind: "delivery", eventId: "event-1", attempt: 1 }],
  });
  assert.match(output, /Status: UNVERIFIED/);
  assert.match(output, /trace entries are observed; assertions are asserted/);
  assert.match(output, /\[UNVERIFIED\] checkpoint-persisted/);
  assert.match(output, /Observed trace:/);
});
