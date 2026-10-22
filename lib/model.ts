export type Fact = { value: string; source: string; recordedAt: string };
export type Gender = "man" | "woman";
export type Preference = {
  field: "city" | "smoking" | "children";
  value: string;
  importance: "must" | "prefer";
  quote: string;
  source: string;
  confirmed: boolean;
};
export type Profile = {
  key: string;
  name: string;
  age: number;
  gender?: Gender;
  city: string;
  role: string;
  initials: string;
  hue: number;
  bio: string;
  interests: string[];
  facts: Record<string, Fact>;
  preferences: Preference[];
  source: string;
  importedAt: string;
};
export type RankedProfile = {
  profile: Profile;
  aligned: number;
  checked: number;
  unknown: number;
  mustConflicts: Evidence[];
};
export type MatchResults = {
  matches: RankedProfile[];
  stretch: RankedProfile[];
  eligibleCount: number;
  strictCount: number;
};
export type Evidence = {
  field: string;
  outcome: "aligned" | "conflict" | "difference" | "unknown" | "unconfirmed";
  expected: string;
  actual: string;
  quote: string;
  source: string;
  importance: string;
};
export type IntroEvent = {
  id: string;
  type: string;
  at: number;
  note: string;
  subject?: "client" | "candidate";
  reason?: string;
};
export type Introduction = {
  key: string;
  clientKey: string;
  candidateKey: string;
  createdAt: number;
  note: string;
  events: IntroEvent[];
  followUpAt?: number;
  followUpReason?: string;
};
export const eventLabels: Record<string, string> = {
  proposed: "Introduction created",
  accepted: "Interest confirmed",
  declined: "Not continuing",
  contactConsent: "Permission to share contacts",
  contacts: "Contacts exchanged",
  conversation: "Conversation confirmed",
  arranged: "Meeting arranged",
  met: "Meeting completed",
  pause: "Space requested",
  resume: "Ready to continue",
  note: "Note added",
};
export function evaluate(client: Profile, candidate: Profile): Evidence[] {
  return client.preferences.map((p) => {
    const fact = candidate.facts[p.field];
    const actual = fact?.value || "Unknown";
    const unknown = !fact || !fact.value || fact.value === "Unknown";
    return {
      field: p.field,
      expected: p.value,
      actual,
      quote: p.quote,
      source: p.source,
      importance: p.importance,
      outcome: !p.confirmed
        ? "unconfirmed"
        : unknown
          ? "unknown"
          : actual.toLowerCase() === p.value.toLowerCase()
            ? "aligned"
            : p.importance === "must"
              ? "conflict"
              : "difference",
    };
  });
}
/**
 * A transparent shortlist, not a chemistry or relationship prediction.
 * Gender eligibility and confirmed must-haves are hard gates for the main list.
 * Stretch options are shown only when fewer than five strict options exist and
 * always include their confirmed must-have conflicts for human review.
 */
export function rankMatches(
  client: Profile,
  candidates: Profile[],
  limit = 5,
): MatchResults {
  const eligible = candidates
    .filter(
      (candidate) =>
        candidate.key !== client.key &&
        !!client.gender &&
        !!candidate.gender &&
        candidate.gender !== client.gender,
    )
    .map((profile) => {
      const evidence = [
        ...evaluate(client, profile),
        ...evaluate(profile, client),
      ];
      return {
        profile,
        aligned: evidence.filter((item) => item.outcome === "aligned").length,
        checked: evidence.filter((item) =>
          ["aligned", "difference", "conflict"].includes(item.outcome),
        ).length,
        unknown: evidence.filter((item) =>
          ["unknown", "unconfirmed"].includes(item.outcome),
        ).length,
        mustConflicts: evidence.filter(
          (item) => item.outcome === "conflict" && item.importance === "must",
        ),
      } satisfies RankedProfile;
    });

  const sortByEvidence = (a: RankedProfile, b: RankedProfile) =>
    b.aligned - a.aligned ||
    b.checked - a.checked ||
    a.unknown - b.unknown ||
    a.profile.key.localeCompare(b.profile.key);
  const strict = eligible
    .filter((candidate) => candidate.mustConflicts.length === 0)
    .sort(sortByEvidence);
  const matches = strict.slice(0, limit);
  const stretch =
    strict.length < limit
      ? eligible
          .filter((candidate) => candidate.mustConflicts.length > 0)
          .sort(
            (a, b) =>
              a.mustConflicts.length - b.mustConflicts.length ||
              sortByEvidence(a, b),
          )
          .slice(0, limit)
      : [];
  return {
    matches,
    stretch,
    eligibleCount: eligible.length,
    strictCount: strict.length,
  };
}
export function summarizeIntro(intro: Introduction) {
  const accepted = (side: string) => {
    const decisions = intro.events.filter(
      (e) => e.subject === side && ["accepted", "declined"].includes(e.type),
    );
    return decisions.at(-1)?.type === "accepted";
  };
  const paused =
    intro.events.filter((e) => ["pause", "resume"].includes(e.type)).at(-1)
      ?.type === "pause";
  const met = intro.events.some((e) => e.type === "met");
  const declined = ["client", "candidate"].some(
    (side) =>
      intro.events
        .filter(
          (e) =>
            e.subject === side && ["accepted", "declined"].includes(e.type),
        )
        .at(-1)?.type === "declined",
  );
  return {
    clientAccepted: accepted("client"),
    candidateAccepted: accepted("candidate"),
    paused,
    met,
    declined,
    label: met
      ? "Meeting completed"
      : declined
        ? "Not continuing"
        : paused
          ? "Client asked for space"
          : accepted("client") && accepted("candidate")
            ? "Both interested"
            : accepted("client")
              ? "Waiting for candidate"
              : accepted("candidate")
                ? "Waiting for client"
                : "Decision not recorded",
  };
}
export function diagnostics(intros: Introduction[]) {
  const pairsFor = (type: string) =>
    intros.filter((intro) => intro.events.some((event) => event.type === type))
      .length;
  const pairsWithBothConsents = intros.filter((intro) =>
    ["client", "candidate"].every((subject) =>
      intro.events.some(
        (event) =>
          event.type === "contactConsent" && event.subject === subject,
      ),
    ),
  ).length;
  const declines = intros.flatMap((intro) =>
    intro.events.filter((event) => event.type === "declined"),
  );
  const clientAccepted = intros.filter(
    (intro) => summarizeIntro(intro).clientAccepted,
  ).length;
  const candidateAccepted = intros.filter(
    (intro) => summarizeIntro(intro).candidateAccepted,
  ).length;
  const eitherAccepted = intros.filter((intro) => {
    const s = summarizeIntro(intro);
    return s.clientAccepted || s.candidateAccepted;
  }).length;
  return {
    total: intros.length,
    clientAccepted,
    candidateAccepted,
    eitherAccepted,
    mutual: intros.filter((i) => {
      const s = summarizeIntro(i);
      return s.clientAccepted && s.candidateAccepted;
    }).length,
    met: intros.filter((i) => i.events.some((e) => e.type === "met")).length,
    unknownReasons: intros.filter((i) =>
      i.events.some(
        (e) => e.type === "declined" && (!e.reason || e.reason === "Unknown"),
      ),
    ).length,
    reasons: intros.flatMap((i) =>
      i.events
        .filter((e) => e.type === "declined")
        .map((e) => e.reason || "Unknown"),
    ),
    contactConsentRecorded: pairsFor("contactConsent"),
    mutualConsent: pairsWithBothConsents,
    contactsExchanged: pairsFor("contacts"),
    conversations: pairsFor("conversation"),
    meetingsArranged: pairsFor("arranged"),
    declined: pairsFor("declined"),
    declineEvents: declines.length,
    unknownDeclines: declines.filter(
      (event) => !event.reason || event.reason === "Unknown",
    ).length,
  };
}
export function parseIntake(input: string): Profile[] {
  let rows: unknown;
  try {
    rows = JSON.parse(input);
  } catch {
    throw new Error(
      "Use the sample JSON format. This demo does not interpret free-text conversations.",
    );
  }
  if (!Array.isArray(rows) || rows.length < 1 || rows.length > 100)
    throw new Error("Import between 1 and 100 fictional profiles at a time.");
  const keys = new Set<string>();
  return rows.map((r: unknown, index: number) => {
    if (!r || typeof r !== "object")
      throw new Error(`Row ${index + 1}: expected a profile.`);
    const x = r as Record<string, unknown>;
    if (
      typeof x.name !== "string" ||
      !x.name.trim() ||
      x.name.length > 100 ||
      typeof x.city !== "string" ||
      !["man", "woman"].includes(String(x.gender)) ||
      typeof x.age !== "number" ||
      !Number.isInteger(x.age) ||
      x.age < 18 ||
      x.age > 100
    )
      throw new Error(
        `Row ${index + 1}: name, city, adult age and gender (man or woman) are required.`,
      );
    const key = typeof x.key === "string" ? x.key : `import-${index + 1}`;
    if (keys.has(key)) throw new Error(`Duplicate profile key: ${key}`);
    keys.add(key);
    const source =
      typeof x.source === "string" ? x.source : "Fictional intake import";
    const facts: Record<string, Fact> = {
      city: { value: x.city, source, recordedAt: "2026-10-22" },
    };
    for (const f of ["smoking", "children"])
      if (typeof x[f] === "string")
        facts[f] = { value: x[f] as string, source, recordedAt: "2026-10-22" };
    const prefs = Array.isArray(x.preferences) ? x.preferences : [];
    const preferences: Preference[] = prefs.map(
      (p: Record<string, unknown>) => {
        if (
          !p ||
          !["city", "smoking", "children"].includes(String(p.field)) ||
          typeof p.value !== "string" ||
          !["must", "prefer"].includes(String(p.importance)) ||
          typeof p.quote !== "string" ||
          typeof p.confirmed !== "boolean"
        )
          throw new Error(
            `Row ${index + 1}: preferences need field, value, importance, original quote and confirmed status.`,
          );
        return {
          field: p.field as Preference["field"],
          value: p.value,
          importance: p.importance as Preference["importance"],
          quote: p.quote,
          confirmed: p.confirmed,
          source,
        };
      },
    );
    return {
      key,
      name: x.name,
      city: x.city,
      age: x.age,
      gender: x.gender as Gender,
      role: typeof x.role === "string" ? x.role : "Not provided",
      initials: x.name
        .split(/\s+/)
        .map((n) => n[0])
        .slice(0, 2)
        .join(""),
      hue: 140,
      bio:
        typeof x.bio === "string"
          ? x.bio
          : "Imported from a fictional intake record.",
      interests: [],
      facts,
      preferences,
      source,
      importedAt: "2026-10-22",
    };
  });
}
