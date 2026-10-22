# The Date Crew · Matchmaker Desk

An independent assessment prototype built with **Next.js, TypeScript and Convex**. The library contains exactly **1,500 fictional profiles**. Introduction history starts empty for each visitor.

## What this tests

Can a matchmaker find recorded facts, distinguish an explicit requirement from a flexible preference, and keep useful evidence about an introduction without being forced through a pipeline?

The prototype demonstrates a workflow. It does **not** establish adoption, business uplift, chemistry, accuracy of real intake records or savings in staff time.

## Try it

1. Choose a fictional client and review a candidate. Open the original intake or a preference's source quote.
2. Notice the difference between a confirmed conflict, a flexible difference, missing information and an unconfirmed preference. Unknowns do not stop a private draft.
3. Save an introduction. This only creates a draft in your demo session. No profiles, emails or contact details are sent.
4. Record a meeting directly, without contacts or earlier events. Each person's interest can be recorded separately. No response is never automatically converted to a rejection.
5. Open **What we know**. Counts describe your own reviewer actions, not company results. There are no staff rankings or speed targets.
6. Try an intake import. The example is JSON because this build has no verified CRM export contract. The preview stays in the browser, exposes missing fields, and does not modify the shared library. Real email, WhatsApp or call capture is not implemented.

## Run locally

Requires Node.js 22 or newer.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

The supplied environment example points to the authorized fictional-data demo backend. To deploy your own backend, log into Convex and configure your own project using `npx convex dev --configure existing`, then update the public frontend URL. Never commit an access token or deployment key.

The Vercel project builds this static Next.js frontend from `main`. Its Production environment must define `NEXT_PUBLIC_CONVEX_URL`; the current value points to the Convex **development** deployment used for this fictional assessment. It is not a production database for client records. `CONVEX_DEPLOYMENT` is used only by local Convex developer and seed commands, not by the browser bundle.

```sh
npm test
npm run typecheck
npm run build
```

The static Next.js build is written to `out/`. All database operations run in Convex, so the frontend can use static hosting. This remains a Next.js application, not a replacement framework.

## Data and architecture

- `lib/model.ts`: comparison rules, intake validation and evidence summaries.
- `lib/fixtures.ts`: deterministic fictional intake records. No real photos, email addresses, caste or inferred income.
- `convex/schema.ts`: namespaced typed tables and search/index definitions.
- `convex/library.ts`: indexed profile lookup and cursor-paginated search.
- `convex/workspace.ts`: backend-validated, session-scoped draft and event writes.
- `convex/seed.ts`: internal, idempotent 100-profile seed batches. It cannot be called by an anonymous frontend visitor.
- `components/desk.tsx`: library, review, introduction workspace, import preview and evidence views.
- `app/globals.css`: responsive design inspired by The Date Crew's cream, forest green and gold palette.
- `public/guide/`: captured product screens and the looping GIF shown in the first-visit walkthrough and the persistent dashboard guide.

To seed the authorized demo deployment after deploying functions:

```sh
node scripts/seed.mjs
```

The seed adds missing profiles only. It does not delete unrelated tables, overwrite real records or create historical introduction outcomes. `node scripts/verify-backend.mjs` performs a live integration check using its own fictional-data sessions.

To rebuild the walkthrough GIF after updating its captured screens, run `python3 scripts/create_walkthrough_gif.py`.

## Critical limitations

- The connected Convex deployment is a **development deployment**, intentionally used for this assessment. A publicly reachable demo is not a production rollout.
- An unguessable browser-generated bearer token separates demo sessions. This is **not staff authentication**. It is suitable only for fictional assessment data; staff identity and authorization are required for operational use.
- A saved draft with an acknowledged conflict does not override a client requirement or grant permission to share anything.
- Events are recorded when the reviewer clicks; they are **not verified occurrence timestamps**. The build therefore does not calculate business waiting-time metrics or a conversion lift from these records.
- No AI model infers preferences, attraction, willingness, hidden rejection reasons or sensitive attributes. A real feedback extraction feature would need source access, consent, evaluation data and a provider/budget decision first.
- The intake preview deliberately does not claim to eliminate input work. A live pilot must measure collection, correction, retrieval and review time together, plus false exclusions and client feedback.
- Public endpoints and sessions need production abuse controls, monitoring and lifecycle management before wider operation. Session access expires after seven days; this build is not designed to retain real client records.

## Evidence behind the choices

- [The Date Crew](https://www.thedatecrew.com/): describes a human-led service spanning introductions and relationship support. Marketing success figures are not used as assessment baselines.
- [GOV.UK: learning user needs](https://www.gov.uk/service-manual/user-research/start-by-learning-user-needs): observe existing work and treat untested product ideas as assumptions.
- [GOV.UK: completion measurement](https://www.gov.uk/service-manual/measuring-success/measuring-completion-rate): link starts to completions and account for journeys spanning time.
- [Convex Next.js integration](https://docs.convex.dev/client/nextjs/app-router/), [indexes](https://docs.convex.dev/database/reading-data/indexes/), [pagination](https://docs.convex.dev/database/pagination): support the implementation architecture, not a business-impact claim.

The assessment scenario supplies the 1,000 → 310 → 210 → 150 → 75 → 42 counts. It does not prove that those are linked mature cohorts, that all non-acceptances are rejections, or that any one proposed feature will fix the funnel.
