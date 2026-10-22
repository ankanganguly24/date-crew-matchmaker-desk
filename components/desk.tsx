"use client";
import {
  ConvexProvider,
  ConvexReactClient,
  useQuery,
  usePaginatedQuery,
  useMutation,
} from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect, useState, useMemo } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Search,
  SlidersHorizontal,
  Users,
  HeartHandshake,
  BarChart3,
  Upload,
  Check,
  ChevronDown,
  ChevronRight,
  Plus,
  X,
  Info,
  MapPin,
  Clock,
  FileText,
  CheckCircle2,
  AlertCircle,
  Minus,
  ExternalLink,
  Download,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Leaf,
  MessageSquare,
  Link2,
  BookOpen,
} from "lucide-react";
import { cities } from "@/lib/fixtures";
import {
  evaluate,
  eventLabels,
  summarizeIntro,
  diagnostics,
  parseIntake,
  type Profile,
  type Introduction,
  type IntroEvent,
} from "@/lib/model";
const url = process.env.NEXT_PUBLIC_CONVEX_URL;
const connection = url ? new ConvexReactClient(url) : null;
type View = "library" | "workspace" | "evidence";
const fieldNames: Record<string, string> = {
  city: "Location",
  smoking: "Smoking",
  children: "Children",
};
const sample = JSON.stringify(
  [
    {
      key: "sample-001",
      name: "Asha Rao",
      age: 32,
      city: "Mumbai",
      role: "Architect",
      smoking: "No",
      source: "Fictional intake / example.csv",
      preferences: [
        {
          field: "city",
          value: "Mumbai",
          importance: "prefer",
          quote: "I prefer Mumbai, but could consider other cities.",
          confirmed: true,
        },
      ],
    },
  ],
  null,
  2,
);
function Avatar({
  profile,
  size = "md",
}: {
  profile: Profile;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <span
      className={`avatar ${size}`}
      style={{
        background: `hsl(${profile.hue} 17% 88%)`,
        color: `hsl(${profile.hue} 28% 27%)`,
      }}
    >
      {profile.initials}
    </span>
  );
}
function Pill({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: string;
}) {
  return <span className={`pill ${tone}`}>{children}</span>;
}
function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="modal-scrim" onClick={onClose}>
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-top">
          <h2>{title}</h2>
          <button
            aria-label="Close dialog"
            className="icon-button"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
export default function Desk() {
  if (!connection)
    return (
      <main className="setup">
        <h1>Matchmaker Desk</h1>
        <p>Set NEXT_PUBLIC_CONVEX_URL to connect this prototype to Convex.</p>
      </main>
    );
  return (
    <ConvexProvider client={connection}>
      <Workbench />
    </ConvexProvider>
  );
}
function Workbench() {
  const [view, setView] = useState<View>("library"),
    [search, setSearch] = useState(""),
    [city, setCity] = useState(""),
    [clientKey, setClientKey] = useState("TDC-0001"),
    [candidateKey, setCandidateKey] = useState<string | null>(null),
    [showImport, setShowImport] = useState(false),
    [showAbout, setShowAbout] = useState(false),
    [token, setToken] = useState(""),
    [error, setError] = useState(""),
    [toast, setToast] = useState(""),
    [selectedIntro, setSelectedIntro] = useState<string | null>(null);
  const count = useQuery(api.library.count, {}),
    clients = useQuery(api.library.clients, {}) as Profile[] | undefined,
    client = useQuery(api.library.get, { key: clientKey }) as
      Profile | undefined;
  const candidate = useQuery(
    api.library.get,
    candidateKey ? { key: candidateKey } : "skip",
  ) as Profile | null | undefined;
  const { results, status, loadMore } = usePaginatedQuery(
    api.library.page,
    { search, city },
    { initialNumItems: 30 },
  );
  const createSession = useMutation(api.workspace.createSession),
    create = useMutation(api.workspace.create);
  const introductions = useQuery(
    api.workspace.list,
    token ? { token } : "skip",
  ) as Introduction[] | undefined;
  useEffect(() => {
    const saved = localStorage.getItem("tdc-desk-session");
    if (saved) setToken(saved);
    setShowAbout(sessionStorage.getItem("tdc-guide-dismissed:v1") !== "true");
  }, []);
  const closeGuide = () => {
    setShowAbout(false);
    sessionStorage.setItem("tdc-guide-dismissed:v1", "true");
  };
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(t);
  }, [toast]);
  const ensureSession = async () => {
    if (token) return token;
    const next = await createSession({
      token: crypto.randomUUID() + crypto.randomUUID(),
    });
    setToken(next);
    localStorage.setItem("tdc-desk-session", next);
    return next as string;
  };
  const propose = async (note: string) => {
    if (!candidate) return;
    try {
      const t = await ensureSession();
      const key = await create({
        token: t,
        clientKey,
        candidateKey: candidate.key,
        note,
      });
      setCandidateKey(null);
      setView("workspace");
      setSelectedIntro(key);
      setToast("Introduction added to your workspace. Nothing was sent.");
    } catch (e) {
      setError(message(e));
    }
  };
  const reset = () => {
    localStorage.removeItem("tdc-desk-session");
    setToken("");
    setSelectedIntro(null);
    setToast(
      "A fresh demo workspace is ready. The profile library stays unchanged.",
    );
  };
  const data = (results as Array<{ profile: Profile }>).map((r) => r.profile);
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setView("library");
          }}
        >
          <span className="brand-seal">tdc</span>
          <span>
            The Date Crew<span className="brand-caption">MATCHMAKER DESK</span>
          </span>
        </a>
        <div className="space-label">YOUR WORKSPACE</div>
        <nav>
          {(
            [
              { id: "library", label: "Discover profiles", icon: Users },
              { id: "workspace", label: "Introductions", icon: HeartHandshake },
              { id: "evidence", label: "What we know", icon: BarChart3 },
            ] as const
          ).map((n) => (
            <button
              key={n.id}
              className={`nav-item ${view === n.id ? "active" : ""}`}
              onClick={() => setView(n.id)}
            >
              <n.icon size={18} />
              {n.label}
              {n.id === "workspace" && !!introductions?.length && (
                <span className="nav-count">{introductions.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <Leaf size={21} />
          <h3>
            Thoughtful introductions.
            <br />
            Human decisions.
          </h3>
          <p>
            A little less searching.
            <br />A little more understanding.
          </p>
        </div>
        <button className="help-link" onClick={() => setShowAbout(true)}>
          <BookOpen size={16} /> How to use this desk <ArrowRight size={14} />
        </button>
        <div className="account">
          <span className="account-avatar">AG</span>
          <div>
            <strong>Assessment workspace</strong>
            <span>Your own demo session</span>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace <ChevronRight size={13} />{" "}
            <strong>
              {view === "library"
                ? "Discover profiles"
                : view === "workspace"
                  ? "Introductions"
                  : "What we know"}
            </strong>
          </div>
          <div className="top-right">
            <span className="connection">
              <span />
              Connected to Convex
            </span>
            <button className="small-button" onClick={() => setShowAbout(true)}>
              Open guide <BookOpen size={14} />
            </button>
          </div>
        </header>
        <div className="demo-banner">
          <span className="demo-dot" />
          <strong>A working idea, with fictional people.</strong>
          <span>All 1,500 profiles are made up. Outcomes start empty.</span>
          <button onClick={() => setShowAbout(true)}>
            See the boundaries <ArrowRight size={13} />
          </button>
        </div>
        <main>
          {view === "library" ? (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">
                    THE RIGHT PEOPLE. THE FULL PICTURE.
                  </div>
                  <h1>
                    Good introductions
                    <br />
                    start with understanding.
                  </h1>
                  <p>
                    Find the facts. Notice the differences. Make your own call.
                  </p>
                </div>
                <button
                  className="primary-button"
                  onClick={() => setShowImport(true)}
                >
                  <Upload size={16} /> Try an intake import
                </button>
              </div>
              <section className="library-context">
                <div className="context-title">
                  <span className="context-icon">
                    <HeartHandshake size={20} />
                  </span>
                  <div>
                    <span className="eyebrow">
                      SEARCHING WITH SOMEONE IN MIND
                    </span>
                    <strong>
                      {client?.name ?? "Loading client…"}{" "}
                      <span>
                        {client?.age} · {client?.city}
                      </span>
                    </strong>
                  </div>
                </div>
                <label className="client-select">
                  <select
                    aria-label="Select a fictional client"
                    value={clientKey}
                    onChange={(e) => {
                      setClientKey(e.target.value);
                      setCandidateKey(null);
                    }}
                  >
                    {clients?.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.name} · {c.key}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={15} />
                </label>
                <div className="context-preferences">
                  <span>
                    <Check size={13} /> Non-smoker <small>must-have</small>
                  </span>
                  <span>
                    <MapPin size={13} />
                    {client?.city ?? "Location"} <small>flexible</small>
                  </span>
                </div>
              </section>
              <div className="section-bar">
                <div>
                  <h2>
                    The profile library{" "}
                    <span>
                      {count === undefined ? "…" : count.toLocaleString()}
                    </span>
                  </h2>
                  <p>
                    Imported fictional intake records. No inferred compatibility
                    scores.
                  </p>
                </div>
                <span className="source-caption">
                  <Link2 size={13} /> Fictional intake · 22 Oct 2026
                </span>
              </div>
              <div className="filters">
                <label className="search-input">
                  <Search size={17} />
                  <input
                    aria-label="Search profiles"
                    placeholder="Search a name, role or interest…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  {search && (
                    <button
                      aria-label="Clear search"
                      onClick={() => setSearch("")}
                    >
                      <X size={14} />
                    </button>
                  )}
                </label>
                <label className="filter-select">
                  <MapPin size={15} />
                  <select
                    aria-label="Filter by city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  >
                    <option value="">All locations</option>
                    {cities.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} />
                </label>
                <div className="filter-note">
                  <SlidersHorizontal size={15} /> Preferences are context, not
                  hidden filters
                </div>
              </div>
              <div className="profile-grid">
                {status === "LoadingFirstPage"
                  ? Array.from({ length: 6 }, (_, i) => (
                      <div className="profile-card skeleton" key={i} />
                    ))
                  : data
                      .filter((p) => p.key !== clientKey)
                      .map((p) => (
                        <article className="profile-card" key={p.key}>
                          <div className="profile-top">
                            <Avatar profile={p} />
                            <span className="profile-code">{p.key}</span>
                          </div>
                          <h3>
                            {p.name}
                            <span>{p.age}</span>
                          </h3>
                          <p className="role">{p.role}</p>
                          <div className="location">
                            <MapPin size={13} />
                            {p.city}
                          </div>
                          <p className="bio">{p.bio}</p>
                          <div className="interests">
                            {p.interests.slice(0, 2).map((x) => (
                              <span key={x}>{x}</span>
                            ))}
                          </div>
                          <div className="card-footer">
                            <span>
                              <span className="tiny-dot" /> Intake on file
                            </span>
                            <button
                              onClick={() => setCandidateKey(p.key)}
                              aria-label={`Review ${p.name} ${p.key}`}
                            >
                              Review profile <ArrowUpRight size={15} />
                            </button>
                          </div>
                        </article>
                      ))}
              </div>
              {status !== "LoadingFirstPage" &&
                !data.filter((p) => p.key !== clientKey).length && (
                  <div className="empty-state">
                    <Search size={28} />
                    <h2>No profiles found</h2>
                    <p>
                      Try a different name or location. An empty result is a
                      supply signal, not a reason to loosen a client’s
                      requirements.
                    </p>
                    <button
                      className="small-button"
                      onClick={() => {
                        setSearch("");
                        setCity("");
                      }}
                    >
                      Clear filters
                    </button>
                  </div>
                )}
              <div className="load-more">
                {status === "CanLoadMore" || status === "LoadingMore" ? (
                  <button
                    className="secondary-button"
                    disabled={status === "LoadingMore"}
                    onClick={() => loadMore(30)}
                  >
                    {status === "LoadingMore"
                      ? "Loading…"
                      : "Load more profiles"}{" "}
                    <ChevronDown size={15} />
                  </button>
                ) : (
                  status !== "LoadingFirstPage" && (
                    <span>You've reached the end of these results.</span>
                  )
                )}
              </div>
              <div className="bottom-note">
                <ShieldCheck size={15} /> No real personal data. No emails sent.
                No promise that a profile will lead to a relationship.
              </div>
            </>
          ) : view === "workspace" ? (
            <>
              <div className="page-heading compact">
                <div>
                  <div className="eyebrow">LET PEOPLE SET THE PACE</div>
                  <h1>
                    Every introduction
                    <br />
                    has its own story.
                  </h1>
                  <p>Record what you know. Leave room for what you don’t.</p>
                </div>
                <button
                  className="secondary-button"
                  onClick={() => setView("library")}
                >
                  <Plus size={16} /> Find a profile
                </button>
              </div>
              <div className="workspace-notice">
                <Info size={17} />
                <p>
                  Your workspace starts empty. Add an introduction from the
                  library to try it. You can record a meeting directly—there is
                  no required sequence and no overdue score.
                </p>
                <button onClick={reset} title="Start an empty session">
                  <RotateCcw size={15} />
                </button>
              </div>
              {!introductions?.length ? (
                <div className="empty-workspace">
                  <div className="empty-illustration">
                    <HeartHandshake size={42} />
                  </div>
                  <span className="eyebrow">A CLEAN START</span>
                  <h2>No stories invented.</h2>
                  <p>
                    There are no fabricated acceptances, ghosting labels or
                    meetings here. Choose two fictional people and make your
                    first introduction.
                  </p>
                  <button
                    className="primary-button"
                    onClick={() => setView("library")}
                  >
                    Explore the profiles <ArrowRight size={15} />
                  </button>
                </div>
              ) : (
                <div className="introduction-list">
                  {introductions.map((i) => (
                    <IntroCard
                      key={i.key}
                      intro={i}
                      token={token}
                      expanded={selectedIntro === i.key}
                      onToggle={() =>
                        setSelectedIntro(selectedIntro === i.key ? null : i.key)
                      }
                      onError={setError}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <EvidencePage introductions={introductions ?? []} onReset={reset} />
          )}
        </main>
        <footer className="site-footer">
          <span>
            <span className="footer-seal">tdc</span> Built around the people,
            not the pipeline.
          </span>
          <span>Independent assessment prototype · Next.js + Convex</span>
        </footer>
      </div>
      {candidate && client && (
        <ReviewModal
          client={client}
          candidate={candidate}
          onClose={() => setCandidateKey(null)}
          onPropose={propose}
        />
      )}
      {showImport && <ImportModal onClose={() => setShowImport(false)} />}
      {showAbout && <AboutModal onClose={closeGuide} />}
      {error && (
        <div role="alert" className="toast error">
          <AlertCircle size={18} />
          {error}
          <button onClick={() => setError("")} aria-label="Dismiss error">
            <X size={16} />
          </button>
        </div>
      )}
      {toast && (
        <div role="status" className="toast">
          <CheckCircle2 size={18} />
          {toast}
        </div>
      )}
    </div>
  );
}
function message(e: unknown) {
  return e instanceof Error
    ? e.message.replace(/\[CONVEX[^\]]*\]\s*/g, "").slice(0, 400)
    : "Something went wrong. Please try again.";
}
function ReviewModal({
  client,
  candidate,
  onClose,
  onPropose,
}: {
  client: Profile;
  candidate: Profile;
  onClose: () => void;
  onPropose: (note: string) => Promise<void>;
}) {
  const [note, setNote] = useState(""),
    [busy, setBusy] = useState(false),
    [ack, setAck] = useState(false),
    [tab, setTab] = useState<"context" | "source">("context");
  const forward = evaluate(client, candidate),
    reverse = evaluate(candidate, client),
    conflicts = [...forward, ...reverse].filter(
      (x) => x.outcome === "conflict",
    );
  return (
    <Modal title="Consider an introduction" onClose={onClose}>
      <div className="review-pair">
        <div>
          <Avatar profile={client} size="lg" />
          <h3>{client.name}</h3>
          <p>
            {client.age} · {client.city}
          </p>
          <small>Your selected client</small>
        </div>
        <HeartHandshake size={28} />
        <div>
          <Avatar profile={candidate} size="lg" />
          <h3>{candidate.name}</h3>
          <p>
            {candidate.age} · {candidate.city}
          </p>
          <small>Fictional candidate</small>
        </div>
      </div>
      <div className="review-tabs">
        <button
          className={tab === "context" ? "selected" : ""}
          onClick={() => setTab("context")}
        >
          What to consider
        </button>
        <button
          className={tab === "source" ? "selected" : ""}
          onClick={() => setTab("source")}
        >
          <FileText size={14} /> Original intake
        </button>
      </div>
      {tab === "source" ? (
        <div className="source-record">
          <p className="muted">
            This is the fictional source used to produce the comparison. It is
            not an AI-generated biography.
          </p>
          <h3>{candidate.source}</h3>
          <pre>
            {JSON.stringify(
              {
                name: candidate.name,
                age: candidate.age,
                facts: candidate.facts,
                preferences: candidate.preferences,
              },
              null,
              2,
            )}
          </pre>
        </div>
      ) : (
        <>
          <p className="review-explainer">
            These are recorded facts and preferences—not a prediction of
            chemistry. Missing information does not block an introduction.
          </p>
          <h4>
            {client.name.split(" ")[0]}’s preferences, with{" "}
            {candidate.name.split(" ")[0]} in mind
          </h4>
          <Checks checks={forward} />
          <h4>The other direction matters too</h4>
          <Checks checks={reverse} />
          <div className="quiet-note">
            <Info size={16} />
            <span>
              A “yes” from either person still needs to be obtained. Never infer
              willingness from a matching profile.
            </span>
          </div>
        </>
      )}
      <div className="decision-area">
        <label className="field-label" htmlFor="selection-note">
          Your thinking <span>optional · original words welcome</span>
        </label>
        <textarea
          id="selection-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={2000}
          placeholder="What makes this introduction worth considering? No tagging required."
        />
        {conflicts.length > 0 && (
          <label className="ack">
            <input
              type="checkbox"
              checked={ack}
              onChange={(e) => setAck(e.target.checked)}
            />
            <span>
              I have reviewed the recorded conflicts. This is a private draft,
              not permission to share a profile or override a client’s
              requirements.
            </span>
          </label>
        )}
        <div className="modal-actions">
          <span>
            <ShieldCheck size={14} /> Nothing is sent to either person.
          </span>
          <button
            className="primary-button"
            disabled={busy || (conflicts.length > 0 && !ack)}
            onClick={async () => {
              setBusy(true);
              await onPropose(note);
              setBusy(false);
            }}
          >
            {busy ? "Saving…" : "Save a draft introduction"}{" "}
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </Modal>
  );
}
function Checks({ checks }: { checks: ReturnType<typeof evaluate> }) {
  return (
    <div className="checks">
      {checks.map((c, i) => (
        <div className={`check-row ${c.outcome}`} key={i}>
          <div className="check-symbol">
            {c.outcome === "aligned" ? (
              <Check size={15} />
            ) : c.outcome === "conflict" ? (
              <AlertCircle size={15} />
            ) : (
              <Minus size={15} />
            )}
          </div>
          <div className="check-content">
            <div className="check-title">
              <strong>{fieldNames[c.field]}</strong>
              <Pill tone={c.outcome}>
                {c.outcome === "aligned"
                  ? "Aligned"
                  : c.outcome === "conflict"
                    ? "Confirmed conflict"
                    : c.outcome === "difference"
                      ? "Flexible difference"
                      : c.outcome === "unconfirmed"
                        ? "Preference not confirmed"
                        : "Not recorded"}
              </Pill>
            </div>
            <p>
              {c.actual} <span>· client said {c.expected}</span>
            </p>
            <details>
              <summary>See the client’s words and source</summary>
              <blockquote>“{c.quote}”</blockquote>
              <small>{c.source} · No inference added.</small>
            </details>
          </div>
        </div>
      ))}
    </div>
  );
}
function IntroCard({
  intro,
  token,
  expanded,
  onToggle,
  onError,
}: {
  intro: Introduction;
  token: string;
  expanded: boolean;
  onToggle: () => void;
  onError: (x: string) => void;
}) {
  const client = useQuery(api.library.get, { key: intro.clientKey }) as
      Profile | undefined,
    candidate = useQuery(api.library.get, { key: intro.candidateKey }) as
      Profile | undefined;
  const record = useMutation(api.workspace.record),
    [type, setType] = useState("note"),
    [subject, setSubject] = useState<"client" | "candidate">("client"),
    [note, setNote] = useState(""),
    [reason, setReason] = useState("Unknown"),
    [busy, setBusy] = useState(false);
  const summary = summarizeIntro(intro);
  if (!client || !candidate) return null;
  const add = async () => {
    try {
      setBusy(true);
      await record({
        token,
        key: intro.key,
        type,
        note,
        ...(["accepted", "declined", "contactConsent", "pause"].includes(type)
          ? { subject }
          : {}),
        ...(type === "declined" ? { reason } : {}),
      });
      setNote("");
    } catch (e) {
      onError(message(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <article className="intro-card">
      <button className="intro-summary" onClick={onToggle}>
        <div className="paired-avatars">
          <Avatar profile={client} size="sm" />
          <Avatar profile={candidate} size="sm" />
        </div>
        <div>
          <h3>
            {client.name} <span>&</span> {candidate.name}
          </h3>
          <p>
            {client.city} · {candidate.city}{" "}
            <span>
              Created{" "}
              {new Date(intro.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
              })}
            </span>
          </p>
        </div>
        <Pill tone={summary.met ? "aligned" : "neutral"}>{summary.label}</Pill>
        <ChevronDown size={18} className={expanded ? "rotated" : ""} />
      </button>
      {expanded && (
        <div className="intro-body">
          {intro.note && (
            <div className="original-note">
              <span className="eyebrow">
                WHY YOU CONSIDERED THIS INTRODUCTION
              </span>
              <p>{intro.note}</p>
            </div>
          )}
          <div className="timeline">
            {intro.events.map((e) => (
              <div className="timeline-item" key={e.id}>
                <span className="timeline-dot" />
                <div>
                  <strong>{eventLabels[e.type] ?? e.type}</strong>
                  {e.subject && (
                    <Pill>
                      {e.subject === "client" ? client.name : candidate.name}
                    </Pill>
                  )}
                  <time>
                    {new Date(e.at).toLocaleString("en-IN", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                  <p>{e.note}</p>
                  {e.type === "declined" && (
                    <small>
                      Stated reason: {e.reason || "Unknown"} · This is not an
                      inferred explanation.
                    </small>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="record-form">
            <h4>Add something you actually know</h4>
            <p>
              Any order is fine. No update is required just to fill a stage.
            </p>
            <div className="form-row">
              <label>
                What happened?
                <select value={type} onChange={(e) => setType(e.target.value)}>
                  {Object.entries(eventLabels)
                    .filter(([k]) => k !== "proposed")
                    .map(([k, v]) => (
                      <option value={k} key={k}>
                        {v}
                      </option>
                    ))}
                </select>
              </label>
              {["accepted", "declined", "contactConsent", "pause"].includes(
                type,
              ) && (
                <label>
                  Whose decision?
                  <select
                    value={subject}
                    onChange={(e) =>
                      setSubject(e.target.value as "client" | "candidate")
                    }
                  >
                    <option value="client">{client.name}</option>
                    <option value="candidate">{candidate.name}</option>
                  </select>
                </label>
              )}
            </div>
            {type === "declined" && (
              <label className="full-label">
                Reason, if explicitly known
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                >
                  {[
                    "Unknown",
                    "Recorded preference",
                    "No mutual interest",
                    "Not ready",
                    "Scheduling",
                    "Other stated reason",
                  ].map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </label>
            )}
            <label className="field-label" htmlFor={`note-${intro.key}`}>
              Original wording or evidence
            </label>
            <textarea
              id={`note-${intro.key}`}
              placeholder="For example: ‘We met for coffee on Sunday.’ Silence is not rejection."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={2000}
            />
            <div className="record-action">
              <span>
                <Info size={14} /> Saved only in your demo session.
              </span>
              <button
                className="primary-button"
                disabled={!note.trim() || busy}
                onClick={add}
              >
                {busy ? "Saving…" : "Record this"} <Plus size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
function EvidencePage({
  introductions,
  onReset,
}: {
  introductions: Introduction[];
  onReset: () => void;
}) {
  const d = diagnostics(introductions),
    download = () => {
      const blob = new Blob(
        [
          JSON.stringify(
            {
              notice: "Fictional assessment session; not company performance",
              exportedAt: new Date().toISOString(),
              introductions,
            },
            null,
            2,
          ),
        ],
        { type: "application/json" },
      );
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "my-demo-introductions.json";
      a.click();
      URL.revokeObjectURL(a.href);
    };
  return (
    <>
      <div className="page-heading compact">
        <div>
          <div className="eyebrow">EVIDENCE BEFORE CONFIDENCE</div>
          <h1>
            Useful signals.
            <br />
            Honest limitations.
          </h1>
          <p>Activity from your session, not a claim about The Date Crew.</p>
        </div>
        <button className="secondary-button" onClick={download}>
          <Download size={16} /> Export my session
        </button>
      </div>
      <div className="metric-grid">
        <div>
          <span>Introductions you created</span>
          <strong>{d.total}</strong>
          <small>No seeded history</small>
        </div>
        <div>
          <span>Both people said yes</span>
          <strong>{d.mutual}</strong>
          <small>Two separate recorded decisions</small>
        </div>
        <div>
          <span>Meetings recorded</span>
          <strong>{d.met}</strong>
          <small>No earlier steps required</small>
        </div>
      </div>
      <div className="evidence-callout">
        <Info size={21} />
        <div>
          <h3>
            {d.total < 20
              ? "Too little evidence to claim an improvement."
              : "Demo activity is not a business experiment."}
          </h3>
          <p>
            These counts describe reviewer actions with fictional people. They
            do not establish acceptance uplift, statistical significance or
            client satisfaction. Missing records do not mean a step failed.
          </p>
        </div>
      </div>
      <div className="evidence-columns">
        <section className="paper">
          <h2>What would we investigate?</h2>
          <div className="research-row">
            <span>01</span>
            <div>
              <h3>Where does progress stop?</h3>
              <p>
                Compare linked introductions with the same observation window.
                Keep missing steps separate from explicit decisions.
              </p>
            </div>
          </div>
          <div className="research-row">
            <span>02</span>
            <div>
              <h3>Is it a delay or a decision?</h3>
              <p>
                Show how long a case has waited, without labelling someone late
                or pushing them to reply.
              </p>
            </div>
          </div>
          <div className="research-row">
            <span>03</span>
            <div>
              <h3>What reason is actually known?</h3>
              <p>
                Keep the client’s own words. “Busy” remains “busy”; no response
                remains unknown.
              </p>
            </div>
          </div>
        </section>
        <section className="paper">
          <h2>The real-world test</h2>
          <p>
            Compare the current workflow with this one, including all the work
            needed to prepare the data.
          </p>
          <div className="cost-equation">
            Capture + correction + searching + review
          </div>
          <p>
            A quicker search is not a win if intake preparation takes longer.
            Review false exclusions and client feedback alongside total effort.
          </p>
          <ul className="plain-list">
            <li>
              <Check size={14} /> Test with actual matchmaker tasks.
            </li>
            <li>
              <Check size={14} /> Review mistakes, not just compliments.
            </li>
            <li>
              <Check size={14} /> No matchmaker leaderboard or speed target.
            </li>
          </ul>
        </section>
      </div>
      <section className="sources-paper">
        <h2>Where this idea comes from</h2>
        <a href="https://www.thedatecrew.com/" target="_blank" rel="noreferrer">
          The Date Crew <ArrowUpRight size={14} />
          <span>
            Human-led matchmaking and end-to-end support. Website claims are not
            used as assessment benchmarks.
          </span>
        </a>
        <a
          href="https://www.gov.uk/service-manual/user-research/start-by-learning-user-needs"
          target="_blank"
          rel="noreferrer"
        >
          GOV.UK user research guidance <ArrowUpRight size={14} />
          <span>
            Observe real work and test assumptions before committing to a
            solution.
          </span>
        </a>
        <a
          href="https://www.gov.uk/service-manual/measuring-success/measuring-completion-rate"
          target="_blank"
          rel="noreferrer"
        >
          GOV.UK completion measurement <ArrowUpRight size={14} />
          <span>
            Link starts and outcomes over time. Do not treat unrelated monthly
            counts as a completed cohort.
          </span>
        </a>
        <p>
          The assessment’s 1,000 → 310 → 210 → 150 → 75 → 42 counts are a
          supplied scenario, not data produced by this demo.
        </p>
      </section>
      <button className="text-button" onClick={onReset}>
        <RotateCcw size={14} /> Start a fresh demo session
      </button>
    </>
  );
}
function ImportModal({ onClose }: { onClose: () => void }) {
  const [input, setInput] = useState(sample),
    [parsed, setParsed] = useState<Profile[] | null>(null),
    [error, setError] = useState(""),
    [started] = useState(Date.now());
  const validate = () => {
    try {
      setParsed(parseIntake(input));
      setError("");
    } catch (e) {
      setParsed(null);
      setError(message(e));
    }
  };
  return (
    <Modal title="Where does the information come from?" onClose={onClose}>
      <p className="import-lead">
        Reuse an intake export. Don’t ask matchmakers to tag every conversation.
      </p>
      <div className="quiet-note">
        <ShieldCheck size={17} />
        <span>
          Fictional data only. This import preview stays in your browser and
          does not upload or alter the shared library.
        </span>
      </div>
      <div className="import-steps">
        <span>
          <b>1</b> Existing intake
        </span>
        <ArrowRight size={14} />
        <span>
          <b>2</b> Validate facts
        </span>
        <ArrowRight size={14} />
        <span>
          <b>3</b> Review sources
        </span>
      </div>
      <label className="upload-area">
        <Upload size={23} />
        <strong>Choose a fictional JSON intake export</strong>
        <span>Or edit the sample below · max 200 KB</span>
        <input
          type="file"
          accept=".json,application/json"
          aria-label="Choose fictional intake JSON"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            if (f.size > 200000) {
              setError("Keep the demo file below 200 KB.");
              return;
            }
            setInput(await f.text());
            setParsed(null);
          }}
        />
      </label>
      <label className="field-label" htmlFor="intake-input">
        Original intake data
      </label>
      <textarea
        id="intake-input"
        className="code-input"
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          setParsed(null);
        }}
        spellCheck={false}
      />
      <div className="modal-actions">
        <span>No AI inference. Missing fields stay missing.</span>
        <button className="primary-button" onClick={validate}>
          Preview intake <ArrowRight size={15} />
        </button>
      </div>
      {error && (
        <p role="alert" className="inline-error">
          {error}
        </p>
      )}
      {parsed && (
        <div className="import-result">
          <h3>
            <CheckCircle2 size={18} /> {parsed.length} profile
            {parsed.length > 1 ? "s" : ""} validated
          </h3>
          {parsed.map((p) => (
            <div key={p.key}>
              <strong>{p.name}</strong>
              <p>
                {p.age} · {p.city} · {p.source}
              </p>
              <small>
                {p.preferences.length} explicit preference
                {p.preferences.length === 1 ? "" : "s"} ·{" "}
                {p.facts.children
                  ? "Children information provided"
                  : "Children information not recorded — no new question required"}
              </small>
            </div>
          ))}
          <p className="muted">
            This preview took {Math.round((Date.now() - started) / 1000)}{" "}
            seconds since opening, including reading and editing. It is not an
            estimate of staff time saved.
          </p>
        </div>
      )}
      <p className="modal-footnote">
        Assumption: a real deployment needs an authorized source export or
        integration. This prototype does not read email, WhatsApp or calls, and
        makes no claim of zero preparation work.
      </p>
    </Modal>
  );
}
function AboutModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="How to use Matchmaker Desk" onClose={onClose}>
      <div className="about-walkthrough">
        <h3>Watch the quick walkthrough</h3>
        <img
          className="walkthrough-gif"
          src="/guide/matchmaker-walkthrough.gif"
          alt="Animated walkthrough: choose a client, review a profile, save a draft, record an outcome, and inspect the evidence."
          width={960}
          height={540}
        />
      </div>
      <div className="about-grid">
        <div>
          <Users size={22} />
          <h3>1,500 fictional people</h3>
          <p>
            Deterministic sample intake records stored in Convex. No real
            identities, photos, contact details, caste or income estimates.
          </p>
        </div>
        <div>
          <HeartHandshake size={22} />
          <h3>Your own workspace</h3>
          <p>
            Introductions start empty. Saved actions belong to your browser’s
            unguessable demo session. No emails or notifications are sent.
          </p>
        </div>
        <div>
          <FileText size={22} />
          <h3>Facts with their source</h3>
          <p>
            Every comparison points to the fictional intake. Missing data never
            becomes a rejection or a forced question.
          </p>
        </div>
        <div>
          <BarChart3 size={22} />
          <h3>No manufactured success</h3>
          <p>
            Demo activity cannot validate adoption, attraction or business
            uplift. There are no invented compatibility scores or staff
            rankings.
          </p>
        </div>
      </div>
      <div className="about-walkthrough">
        <h3>Try the same steps yourself</h3>
        <ol>
          <li>Pick a client and open a profile to review.</li>
          <li>Compare confirmed facts, flexible preferences and unknowns.</li>
          <li>Save a private draft. Nothing is sent.</li>
          <li>Record an outcome when you know it; there is no required order.</li>
          <li>Open “What we know” to see what the demo can and cannot tell us.</li>
        </ol>
      </div>
      <p className="modal-footnote">
        An independent assessment prototype inspired by The Date Crew’s visual
        language. Not an official client portal. Staff authentication, verified
        integrations and a real-data pilot are required before operational use.
      </p>
    </Modal>
  );
}
