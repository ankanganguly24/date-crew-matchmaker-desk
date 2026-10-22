import {
  query,
  mutation,
  type QueryCtx,
  type MutationCtx,
} from "./_generated/server";
import { v } from "convex/values";
const eventTypes = [
  "accepted",
  "declined",
  "contactConsent",
  "contacts",
  "conversation",
  "arranged",
  "met",
  "pause",
  "resume",
  "note",
];
async function session(ctx: QueryCtx | MutationCtx, token: string) {
  const s = await ctx.db
    .query("deskSessions")
    .withIndex("by_token", (q) => q.eq("token", token))
    .unique();
  if (!s || s.expiresAt < Date.now())
    throw new Error("Your demo session expired. Start a new session.");
  return s;
}
export const createSession = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    if (!/^[0-9a-f-]{72}$/.test(token))
      throw new Error("Invalid demo session token.");
    if (
      await ctx.db
        .query("deskSessions")
        .withIndex("by_token", (q) => q.eq("token", token))
        .unique()
    )
      throw new Error("Create a fresh session token.");
    await ctx.db.insert("deskSessions", {
      token,
      createdAt: Date.now(),
      expiresAt: Date.now() + 7 * 86400000,
    });
    return token;
  },
});
export const list = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const s = await ctx.db
      .query("deskSessions")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique();
    if (!s || s.expiresAt < Date.now()) return [];
    const rows = await ctx.db
      .query("deskIntroductions")
      .withIndex("by_session", (q) => q.eq("session", token))
      .take(100);
    return rows.map(({ session: privateSession, ...intro }) => intro);
  },
});
export const create = mutation({
  args: {
    token: v.string(),
    clientKey: v.string(),
    candidateKey: v.string(),
    note: v.string(),
  },
  handler: async (ctx, args) => {
    await session(ctx, args.token);
    if (args.clientKey === args.candidateKey)
      throw new Error("Choose two different people.");
    if (args.note.length > 2000)
      throw new Error("Keep the note under 2,000 characters.");
    const rows = await ctx.db
      .query("deskIntroductions")
      .withIndex("by_session", (q) => q.eq("session", args.token))
      .take(100);
    if (rows.length >= 100)
      throw new Error("This demo session supports 100 introductions.");
    if (
      rows.some(
        (r) =>
          r.clientKey === args.clientKey &&
          r.candidateKey === args.candidateKey,
      )
    )
      throw new Error("This introduction is already in your workspace.");
    const people = [];
    for (const key of [args.clientKey, args.candidateKey]) {
      const row = await ctx.db
        .query("deskProfiles")
        .withIndex("by_key", (q) => q.eq("key", key))
        .unique();
      if (!row)
        throw new Error("Choose a profile from the demo library.");
      people.push(row.profile);
    }
    if (!people[0].gender || !people[1].gender)
      throw new Error("Gender is not recorded for one of these profiles.");
    if (people[0].gender === people[1].gender)
      throw new Error(
        "This demo only allows opposite-gender introductions. Choose a profile from the eligible match list.",
      );
    const now = Date.now(),
      key = `intro-${now}-${Math.random().toString(36).slice(2)}`;
    await ctx.db.insert("deskIntroductions", {
      session: args.token,
      key,
      clientKey: args.clientKey,
      candidateKey: args.candidateKey,
      createdAt: now,
      note: args.note,
      events: [
        {
          id: `${key}-0`,
          type: "proposed",
          at: now,
          note: "Created by the reviewer in this demo. No email was sent.",
        },
      ],
    });
    return key;
  },
});
export const record = mutation({
  args: {
    token: v.string(),
    key: v.string(),
    type: v.string(),
    note: v.string(),
    subject: v.optional(v.union(v.literal("client"), v.literal("candidate"))),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await session(ctx, args.token);
    if (
      !eventTypes.includes(args.type) ||
      args.note.length > 2000 ||
      !args.note.trim()
    )
      throw new Error(
        "Choose an event and add the evidence or original wording.",
      );
    if (
      ["accepted", "declined", "contactConsent", "pause"].includes(args.type) &&
      !args.subject
    )
      throw new Error("Record whose decision this is.");
    const row = await ctx.db
      .query("deskIntroductions")
      .withIndex("by_session_key", (q) =>
        q.eq("session", args.token).eq("key", args.key),
      )
      .unique();
    if (!row) throw new Error("Introduction not found in your session.");
    if (row.events.length >= 100)
      throw new Error("This introduction has reached the demo event limit.");
    const event = {
      id: `${row.key}-${row.events.length}`,
      type: args.type,
      at: Date.now(),
      note: args.note,
      ...(args.subject ? { subject: args.subject } : {}),
      ...(args.reason ? { reason: args.reason.slice(0, 100) } : {}),
    };
    await ctx.db.patch(row._id, { events: [...row.events, event] });
  },
});
