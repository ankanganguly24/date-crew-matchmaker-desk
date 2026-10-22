import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
const fact = v.object({
  value: v.string(),
  source: v.string(),
  recordedAt: v.string(),
});
const preference = v.object({
  field: v.union(
    v.literal("city"),
    v.literal("smoking"),
    v.literal("children"),
  ),
  value: v.string(),
  importance: v.union(v.literal("must"), v.literal("prefer")),
  quote: v.string(),
  source: v.string(),
  confirmed: v.boolean(),
});
const profile = v.object({
  key: v.string(),
  name: v.string(),
  age: v.number(),
  gender: v.optional(v.union(v.literal("man"), v.literal("woman"))),
  city: v.string(),
  role: v.string(),
  initials: v.string(),
  hue: v.number(),
  bio: v.string(),
  interests: v.array(v.string()),
  facts: v.record(v.string(), fact),
  preferences: v.array(preference),
  source: v.string(),
  importedAt: v.string(),
});
export default defineSchema({
  deskProfiles: defineTable({
    key: v.string(),
    city: v.string(),
    gender: v.optional(v.union(v.literal("man"), v.literal("woman"))),
    searchText: v.string(),
    profile,
  })
    .index("by_key", ["key"])
    .index("by_city", ["city"])
    .index("by_gender", ["gender"])
    .searchIndex("search_profiles", {
      searchField: "searchText",
      filterFields: ["city"],
    }),
  deskMetadata: defineTable({
    key: v.string(),
    count: v.number(),
    seededAt: v.number(),
  }).index("by_key", ["key"]),
  deskSessions: defineTable({
    token: v.string(),
    createdAt: v.number(),
    expiresAt: v.number(),
  }).index("by_token", ["token"]),
  deskIntroductions: defineTable({
    session: v.string(),
    key: v.string(),
    clientKey: v.string(),
    candidateKey: v.string(),
    createdAt: v.number(),
    isSample: v.optional(v.boolean()),
    note: v.string(),
    events: v.array(
      v.object({
        id: v.string(),
        type: v.string(),
        at: v.number(),
        note: v.string(),
        subject: v.optional(
          v.union(v.literal("client"), v.literal("candidate")),
        ),
        reason: v.optional(v.string()),
      }),
    ),
    followUpAt: v.optional(v.number()),
    followUpReason: v.optional(v.string()),
  })
    .index("by_session", ["session"])
    .index("by_session_key", ["session", "key"]),
});
