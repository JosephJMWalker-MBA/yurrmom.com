/**
 * Versioned moderation-policy registry (Phase 9).
 *
 * The policy provides REVIEW CRITERIA, not automatic verdicts. It never
 * classifies intent, identity, illegality, or protected-trait membership. It
 * distinguishes safety/fiction-boundary violations from "ordinary weak or
 * unfunny" submissions — "not funny" is explicitly NOT a safety violation.
 */
import type { ModerationPolicyRule } from "./types";

export const MODERATION_POLICY_VERSION = "moderation-policy/2026-07-1";

const v = MODERATION_POLICY_VERSION;

export const MODERATION_POLICY: ModerationPolicyRule[] = [
  {
    id: "fiction-boundary",
    version: v,
    title: "Fictional-subject boundary",
    description:
      "Roast subjects must remain the fictional prompt character/archetype. Content that redirects the roast onto an identifiable real person breaks the boundary.",
    possibleActions: ["escalate", "remove", "restore-to-pending"],
    reviewerQuestions: [
      "Does this stay on the fictional prompt, or does it target a specific real person?",
      "Is any named individual plausibly identifiable rather than the archetype?",
    ],
    rationaleGuidance: "State which specific text pointed at a real person, or why it stays fictional.",
  },
  {
    id: "identifiable-real-person",
    version: v,
    title: "Identifiable real-person targeting",
    description:
      "Content that appears to target an identifiable real person is escalated for human review. The system never decides whether a person is real.",
    possibleActions: ["escalate", "remove"],
    reviewerQuestions: ["Is a real, identifiable individual the actual target?", "Should this be escalated for a second reviewer?"],
    rationaleGuidance: "Escalation records that review is needed — it is not a finding of fact.",
  },
  {
    id: "protected-trait",
    version: v,
    title: "Protected-trait attacks",
    description:
      "Attacks based on protected traits are not permitted. The system does not determine anyone's trait membership; the reviewer judges the content.",
    possibleActions: ["remove", "escalate"],
    reviewerQuestions: ["Does the content attack a protected trait?", "Is it about the archetype's behavior or about a group?"],
    rationaleGuidance: "Quote the trait-based attack; do not speculate about any person's membership.",
  },
  {
    id: "harassment-cruelty",
    version: v,
    title: "Harassment or cruelty",
    description:
      "Ranking rewards wit, not cruelty. Pile-on harassment or gratuitous cruelty is removable even when aimed at the fictional subject.",
    possibleActions: ["remove", "restore-to-pending"],
    reviewerQuestions: ["Is this wit about the behavior, or cruelty for its own sake?"],
    rationaleGuidance: "Distinguish sharp humor from harassment; cite the crossing line.",
  },
  {
    id: "sexual-content",
    version: v,
    title: "Sexual content",
    description: "Sexual content is out of scope for the roast and is removed.",
    possibleActions: ["remove", "escalate"],
    reviewerQuestions: ["Is the content sexual in nature?"],
    rationaleGuidance: "Note the sexual content without reproducing it.",
  },
  {
    id: "minor-safety",
    version: v,
    title: "Content involving minors",
    description:
      "Anything raising minor-safety concerns is escalated immediately for human review. The system never infers age from text.",
    possibleActions: ["escalate", "remove"],
    reviewerQuestions: ["Does this raise a minor-safety concern that needs a second reviewer?"],
    rationaleGuidance: "Escalate for review; do not make an age determination.",
  },
  {
    id: "pii-doxxing",
    version: v,
    title: "PII or doxxing",
    description:
      "Personal data or doxxing content is removed and treated as urgent. The system stores no real personal data in fixtures.",
    possibleActions: ["remove", "escalate"],
    reviewerQuestions: ["Does this expose private personal information?"],
    rationaleGuidance: "Record that PII was present without copying it into the rationale.",
  },
  {
    id: "threat-violence",
    version: v,
    title: "Threats or violence",
    description:
      "Credible threats or violent content are urgent and removed/escalated. This is not a legal determination and triggers no external reporting.",
    possibleActions: ["remove", "escalate"],
    reviewerQuestions: ["Is there a credible threat that a human must review?"],
    rationaleGuidance: "Escalation/removal here is a platform action, not a legal finding.",
  },
  {
    id: "spam-manipulation",
    version: v,
    title: "Spam or manipulation",
    description: "Spam, vote manipulation, or link-stuffing is low-priority removal.",
    possibleActions: ["remove", "dismiss-report"],
    reviewerQuestions: ["Is this spam or an attempt to manipulate ranking?"],
    rationaleGuidance: "Note the spam pattern.",
  },
  {
    id: "weak-not-unsafe",
    version: v,
    title: "Ordinary weak or unfunny submissions",
    description:
      "A weak or unfunny roast is NOT a safety violation. It may simply rank low. Do not remove content for being unfunny.",
    possibleActions: ["approve"],
    reviewerQuestions: ["Is this merely unfunny (approve, let ranking sort it) rather than unsafe?"],
    rationaleGuidance: "If it is only weak, approve it — taste is not moderation.",
  },
];

export function getPolicyRule(id: string): ModerationPolicyRule | undefined {
  return MODERATION_POLICY.find((r) => r.id === id);
}
