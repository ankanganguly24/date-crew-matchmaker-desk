import type { Introduction, IntroEvent } from "./model";

/** Scripted examples, copied into each reviewer's private demo workspace. */
export function makeDemoActivity(now: number): Introduction[] {
  const hour = 60 * 60 * 1000;
  const make = (
    key: string,
    clientKey: string,
    candidateKey: string,
    hoursAgo: number,
    note: string,
    actions: Array<[string, string, IntroEvent["subject"]?, string?]>,
  ): Introduction => {
    const createdAt = now - hoursAgo * hour;
    return {
      key: `sample-${key}`,
      clientKey,
      candidateKey,
      createdAt,
      isSample: true,
      note: `Scripted example: ${note}`,
      events: [
        {
          id: `${key}-0`,
          type: "proposed",
          at: createdAt,
          note: "Fictional example: draft introduction created. Nothing was sent.",
        },
        ...actions.map(([type, wording, subject, reason], index) => ({
          id: `${key}-${index + 1}`,
          type,
          at: createdAt + (index + 1) * hour,
          note: `Fictional example: ${wording}`,
          ...(subject ? { subject } : {}),
          ...(reason ? { reason } : {}),
        })),
      ],
    };
  };

  return [
    make(
      "meeting",
      "TDC-0001",
      "TDC-0011",
      18,
      "A completed introduction, including each person's interest and permission to exchange contacts.",
      [
        ["accepted", "Priya would like an introduction.", "client"],
        ["accepted", "Dev would like an introduction.", "candidate"],
        ["contactConsent", "Priya agreed to share contact details.", "client"],
        ["contactConsent", "Dev agreed to share contact details.", "candidate"],
        ["contacts", "Both permissions are recorded; contacts exchanged."],
        ["conversation", "Both confirmed that they spoke."],
        ["arranged", "They agreed on a coffee meeting."],
        ["met", "Both confirmed that the coffee meeting took place."],
      ],
    ),
    make(
      "conversation",
      "TDC-0004",
      "TDC-0003",
      14,
      "Both people are interested and have spoken; a meeting is not yet recorded.",
      [
        ["accepted", "Meera is interested.", "client"],
        ["accepted", "Rohan is interested.", "candidate"],
        ["contactConsent", "Meera agreed to share contacts.", "client"],
        ["contactConsent", "Rohan agreed to share contacts.", "candidate"],
        ["contacts", "Contacts exchanged after both permissions."],
        [
          "conversation",
          "A conversation was confirmed; no meeting outcome is known.",
        ],
      ],
    ),
    make(
      "mutual-interest",
      "TDC-0006",
      "TDC-0005",
      10,
      "Mutual interest does not automatically mean that both gave contact-sharing permission.",
      [
        ["accepted", "Ishita is interested.", "client"],
        ["accepted", "Kabir is interested.", "candidate"],
        [
          "contactConsent",
          "Ishita agreed to share contacts; Kabir's permission is not recorded.",
          "client",
        ],
      ],
    ),
    make(
      "one-sided",
      "TDC-0010",
      "TDC-0007",
      7,
      "One person said yes. The other person's decision remains unknown, not rejected.",
      [
        [
          "accepted",
          "Sana would like an introduction; Arjun's decision is not recorded.",
          "client",
        ],
      ],
    ),
    make(
      "declined",
      "TDC-0014",
      "TDC-0013",
      5,
      "An explicit decline with the person's original wording; no hidden reason is inferred.",
      [
        [
          "declined",
          "I am pausing dating because I cannot make time for it right now.",
          "candidate",
          "Availability",
        ],
      ],
    ),
    make(
      "undecided",
      "TDC-0020",
      "TDC-0017",
      3,
      "A draft awaiting decisions. No acceptance, rejection or silence interpretation is invented.",
      [],
    ),
  ];
}
