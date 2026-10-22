import { test } from "node:test";
import assert from "node:assert/strict";
import {
  evaluate,
  parseIntake,
  summarizeIntro,
  diagnostics,
  rankMatches,
  type Introduction,
} from "../lib/model";
import { makeProfiles } from "../lib/fixtures";
import { makeDemoActivity } from "../lib/demo-activity";
test("scripted activity demonstrates distinct outcomes without false mutual interest or fabricated silence", () => {
  const now = Date.UTC(2026, 9, 23);
  const examples = makeDemoActivity(now);
  const profiles = makeProfiles(30);
  assert.equal(examples.length, 6);
  assert.equal(
    new Set(examples.map((i) => `${i.clientKey}:${i.candidateKey}`)).size,
    6,
  );
  for (const intro of examples) {
    assert.equal(intro.isSample, true);
    assert.match(intro.note, /^Scripted example:/);
    const client = profiles.find((p) => p.key === intro.clientKey)!;
    const candidate = profiles.find((p) => p.key === intro.candidateKey)!;
    assert.notEqual(client.gender, candidate.gender);
    assert.ok(
      intro.createdAt >=
        Math.max(
          Date.parse(client.importedAt),
          Date.parse(candidate.importedAt),
        ),
    );
    assert.ok(
      ![...evaluate(client, candidate), ...evaluate(candidate, client)].some(
        (e) => e.outcome === "conflict",
      ),
    );
    assert.ok(
      intro.events.every(
        (e, index) =>
          e.at <= now && (!index || e.at >= intro.events[index - 1].at),
      ),
    );
    assert.ok(
      intro.events.every((e) => e.note.startsWith("Fictional example:")),
    );
  }
  const d = diagnostics(examples);
  assert.equal(d.total, 6);
  assert.equal(d.mutual, 3);
  assert.equal(d.contactsExchanged, 2);
  assert.equal(d.met, 1);
  assert.equal(d.declined, 1);
  assert.equal(d.unknownDeclines, 0);
  assert.equal(summarizeIntro(examples[3]).candidateAccepted, false);
  assert.equal(summarizeIntro(examples[3]).declined, false);
  assert.deepEqual(
    examples[5].events.map((e) => e.type),
    ["proposed"],
  );
});
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
test("recommendations enforce opposite-gender eligibility and put must-have conflicts in the fallback", () => {
  const profiles = makeProfiles(12);
  const client = profiles[0];
  const ranked = rankMatches(client, profiles);
  assert.ok(ranked.matches.length > 0);
  assert.ok(ranked.matches.length <= 5);
  assert.ok(
    ranked.matches.every((match) => match.profile.gender !== client.gender),
  );
  assert.ok(ranked.matches.every((match) => match.mustConflicts.length === 0));
  assert.ok(ranked.stretch.every((match) => match.mustConflicts.length > 0));
  assert.ok(
    ranked.stretch.every((match) => match.profile.gender !== client.gender),
  );
});
test("unknown gender is never guessed into a recommendation", () => {
  const profiles = makeProfiles(4);
  const client = profiles[0];
  profiles[1].gender = undefined;
  const ranked = rankMatches(client, profiles);
  assert.ok(
    !ranked.matches.some((match) => match.profile.key === profiles[1].key),
  );
  assert.ok(
    !ranked.stretch.some((match) => match.profile.key === profiles[1].key),
  );
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
    clientAccepted: 0,
    candidateAccepted: 0,
    eitherAccepted: 0,
    mutual: 0,
    met: 0,
    unknownReasons: 0,
    reasons: [],
    contactConsentRecorded: 0,
    mutualConsent: 0,
    contactsExchanged: 0,
    conversations: 0,
    meetingsArranged: 0,
    declined: 0,
    declineEvents: 0,
    unknownDeclines: 0,
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
  const [p] = parseIntake(
    '[{"name":"A B","age":30,"city":"Pune","gender":"woman"}]',
  );
  assert.equal(p.facts.children, undefined);
  assert.deepEqual(p.preferences, []);
});
test("fixture count is exactly 1500 with unique keys, without inferred sensitive attributes", () => {
  const p = makeProfiles();
  assert.equal(p.length, 1500);
  assert.equal(new Set(p.map((x) => x.key)).size, 1500);
  assert.ok(p.every((x) => !("caste" in x.facts)));
});
