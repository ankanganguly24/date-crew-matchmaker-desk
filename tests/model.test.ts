import { test } from "node:test";
import assert from "node:assert/strict";
import {
  evaluate,
  parseIntake,
  summarizeIntro,
  diagnostics,
  type Introduction,
} from "../lib/model";
import { makeProfiles } from "../lib/fixtures";
test("unknowns and flexible differences are not treated as a hard conflict", () => {
  const [a, b] = makeProfiles(2);
  const checks = evaluate(a, b);
  assert.equal(
    checks.find((x) => x.field === "children")?.outcome,
    "unconfirmed",
  );
  assert.equal(checks.find((x) => x.field === "city")?.outcome, "difference");
  assert.ok(!checks.some((x) => x.outcome === "conflict"));
});
test("a known confirmed smoking conflict is explicit and traceable", () => {
  const [a, b] = makeProfiles(2);
  b.facts.smoking.value = "Yes";
  const c = evaluate(a, b)[0];
  assert.equal(c.outcome, "conflict");
  assert.ok(c.quote);
  assert.ok(c.source);
});
test("one person accepting does not imply mutual interest; meeting can occur without contacts", () => {
  const i: Introduction = {
    key: "i",
    clientKey: "a",
    candidateKey: "b",
    createdAt: 1,
    note: "",
    events: [
      { id: "a", type: "accepted", subject: "client", at: 1, note: "Said yes" },
    ],
  };
  assert.equal(summarizeIntro(i).candidateAccepted, false);
  i.events.push({ id: "m", type: "met", at: 2, note: "Met at an event" });
  assert.equal(summarizeIntro(i).met, true);
});
test("empty demo has no fabricated introduction outcomes", () =>
  assert.deepEqual(diagnostics([]), {
    total: 0,
    mutual: 0,
    met: 0,
    unknownReasons: 0,
    reasons: [],
  }));
test("unrecorded reasons stay unknown", () => {
  const i: Introduction = {
    key: "i",
    clientKey: "a",
    candidateKey: "b",
    createdAt: 1,
    note: "",
    events: [
      {
        id: "e",
        type: "declined",
        at: 1,
        note: "No response to reason request",
      },
    ],
  };
  assert.deepEqual(diagnostics([i]).reasons, ["Unknown"]);
});
test("import validates adult age and keeps absent facts absent", () => {
  assert.throws(() => parseIntake('[{"name":"A","age":17,"city":"Pune"}]'));
  const [p] = parseIntake('[{"name":"A B","age":30,"city":"Pune"}]');
  assert.equal(p.facts.children, undefined);
  assert.deepEqual(p.preferences, []);
});
test("fixture count is exactly 1500 with unique keys, without inferred sensitive attributes", () => {
  const p = makeProfiles();
  assert.equal(p.length, 1500);
  assert.equal(new Set(p.map((x) => x.key)).size, 1500);
  assert.ok(p.every((x) => !("caste" in x.facts)));
});
