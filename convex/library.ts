import { paginationOptsValidator } from "convex/server";
import { query } from "./_generated/server";
import { v } from "convex/values";
export const page = query({
  args: {
    paginationOpts: paginationOptsValidator,
    search: v.string(),
    city: v.string(),
  },
  handler: async (ctx, args) => {
    const search = args.search.trim().slice(0, 100);
    if (search) {
      return await ctx.db
        .query("deskProfiles")
        .withSearchIndex("search_profiles", (q) => {
          const x = q.search("searchText", search);
          return args.city ? x.eq("city", args.city) : x;
        })
        .paginate(args.paginationOpts);
    }
    return args.city
      ? await ctx.db
          .query("deskProfiles")
          .withIndex("by_city", (q) => q.eq("city", args.city))
          .paginate(args.paginationOpts)
      : await ctx.db
          .query("deskProfiles")
          .withIndex("by_key")
          .paginate(args.paginationOpts);
  },
});
export const get = query({
  args: { key: v.string() },
  handler: async (ctx, { key }) =>
    (
      await ctx.db
        .query("deskProfiles")
        .withIndex("by_key", (q) => q.eq("key", key))
        .unique()
    )?.profile ?? null,
});
export const clients = query({
  args: {},
  handler: async (ctx) =>
    (await ctx.db.query("deskProfiles").withIndex("by_key").take(40)).map(
      (p) => p.profile,
    ),
});
export const count = query({
  args: {},
  handler: async (ctx) =>
    (
      await ctx.db
        .query("deskMetadata")
        .withIndex("by_key", (q) => q.eq("key", "profiles"))
        .unique()
    )?.count ?? 0,
});
