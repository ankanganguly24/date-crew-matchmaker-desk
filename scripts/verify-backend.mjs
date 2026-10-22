import { ConvexHttpClient } from "convex/browser";
import { anyApi } from "convex/server";
import assert from "node:assert/strict";
const client = new ConvexHttpClient("https://greedy-raccoon-528.convex.cloud"),
  api = anyApi;
const token = crypto.randomUUID() + crypto.randomUUID(),
  other = crypto.randomUUID() + crypto.randomUUID();
assert.equal(await client.query(api.library.count, {}), 1500);
await client.mutation(api.workspace.createSession, { token });
await client.mutation(api.workspace.createSession, { token: other });
assert.deepEqual(await client.query(api.workspace.list, { token }), []);
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
console.log(
  "Verified: 1,500 profiles; empty initial session; cross-session read/write isolation; direct meeting; session token not exported.",
);
