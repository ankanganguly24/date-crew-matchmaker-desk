import { internalMutation as mutation } from "./_generated/server";
import { v } from "convex/values";
import { makeProfiles } from "../lib/fixtures";
export const profiles = mutation({
  args: { offset: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const offset = args.offset ?? 0;
    if (!Number.isInteger(offset) || offset < 0 || offset >= 1500)
      throw new Error("Invalid batch offset");
    const batch = makeProfiles().slice(offset, offset + 100);
    let inserted = 0;
    for (const p of batch) {
      const existing = await ctx.db
        .query("deskProfiles")
        .withIndex("by_key", (q) => q.eq("key", p.key))
        .unique();
      if (!existing) {
        await ctx.db.insert("deskProfiles", {
          key: p.key,
          city: p.city,
          searchText: `${p.name} ${p.role} ${p.key} ${p.interests.join(" ")}`,
          profile: p,
        });
        inserted++;
      }
    }
    const meta = await ctx.db
      .query("deskMetadata")
      .withIndex("by_key", (q) => q.eq("key", "profiles"))
      .unique();
    if (meta) await ctx.db.patch(meta._id, { count: meta.count + inserted });
    else
      await ctx.db.insert("deskMetadata", {
        key: "profiles",
        count: inserted,
        seededAt: Date.now(),
      });
    return {
      offset,
      inserted,
      next: offset + 100 < 1500 ? offset + 100 : null,
    };
  },
});
