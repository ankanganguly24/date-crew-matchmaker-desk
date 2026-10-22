import { ConvexHttpClient } from "convex/browser";
import { anyApi } from "convex/server";
import assert from "node:assert/strict";
const client = new ConvexHttpClient("https://greedy-raccoon-528.convex.cloud"),
  api = anyApi;
const token = crypto.randomUUID() + crypto.randomUUID(),
  other = crypto.randomUUID() + crypto.randomUUID(),
  exampleToken = crypto.randomUUID() + crypto.randomUUID();
assert.equal(await client.query(api.library.count, {}), 1500);
const profile = await client.query(api.library.get, { key: "TDC-0001" });
assert.equal(profile.gender, "woman");
const recommendations = await client.query(api.library.recommendations, {
  clientKey: "TDC-0001",
});
assert.ok(recommendations.matches.length <= 5);
assert.ok(recommendations.matches.every((m) => m.profile.gender === "man"));
assert.ok(recommendations.matches.every((m) => m.mustConflicts.length === 0));
const lowSupply = await client.query(api.library.recommendations, {
  clientKey: "TDC-0008",
});
assert.ok(lowSupply.matches.length < 5);
assert.ok(lowSupply.stretch.length > 0);
assert.ok(lowSupply.stretch.every((m) => m.mustConflicts.length > 0));
await client.mutation(api.workspace.createSession, { token });
await client.mutation(api.workspace.createSession, { token: other });
assert.deepEqual(await client.query(api.workspace.list, { token }), []);
await assert.rejects(
  client.mutation(api.workspace.create, {
    token,
    clientKey: "TDC-0001",
    candidateKey: "TDC-0004",
    note: "Same-gender pairing should be blocked in the demo.",
  }),
);
const key = await client.mutation(api.workspace.create, {
  token,
  clientKey: "TDC-0001",
  candidateKey: "TDC-0002",
  note: "Automated verification only. Fictional profiles.",
});
assert.deepEqual(await client.query(api.workspace.list, { token: other }), []);
await assert.rejects(
  client.mutation(api.workspace.record, {
    token: other,
    key,
    type: "met",
    note: "Should not be able to write another session.",
  }),
);
await client.mutation(api.workspace.record, {
  token,
  key,
  type: "met",
  note: "Verification: direct meeting, without earlier events.",
});
const [intro] = await client.query(api.workspace.list, { token });
assert.equal(intro.events.at(-1).type, "met");
assert.ok(!intro.events.some((e) => e.type === "contacts"));
assert.ok(!("session" in intro));
await client.mutation(api.workspace.createSession, {
  token: exampleToken,
  withExamples: true,
});
let examples = await client.query(api.workspace.list, { token: exampleToken });
assert.equal(examples.length, 6);
assert.ok(examples.every((i) => i.isSample));
assert.equal(
  examples.filter((i) =>
    ["client", "candidate"].every((subject) =>
      i.events.some((e) => e.type === "accepted" && e.subject === subject),
    ),
  ).length,
  3,
);
assert.equal(
  examples.filter((i) => i.events.some((e) => e.type === "met")).length,
  1,
);
await client.mutation(api.workspace.createSession, {
  token: exampleToken,
  withExamples: true,
});
assert.equal(
  await client.mutation(api.workspace.loadExamples, { token: exampleToken }),
  0,
);
assert.equal(
  (await client.query(api.workspace.list, { token: exampleToken })).length,
  6,
);
assert.deepEqual(await client.query(api.workspace.list, { token: other }), []);
await assert.rejects(
  client.mutation(api.workspace.record, {
    token: other,
    key: examples[0].key,
    type: "met",
    note: "Must not edit someone else's sample.",
  }),
);
await client.mutation(api.workspace.record, {
  token: exampleToken,
  key: "sample-undecided",
  type: "note",
  note: "Reviewer tested editing a private example.",
});
examples = await client.query(api.workspace.list, { token: exampleToken });
assert.equal(
  examples.find((i) => i.key === "sample-undecided").events.at(-1).type,
  "note",
);
console.log(
  "Verified: 1,500 profiles; shortlist and fallback; gender enforcement; empty mode; direct meeting; six labeled examples; repeat initialization without duplicates; editable private copies; cross-session isolation; no session token in exports.",
);
