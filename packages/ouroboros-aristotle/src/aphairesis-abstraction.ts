/**
 * Primitive 73 — Aphairesis abstraction
 *
 * Aristotle's aphairesis (ἀφαίρεσις) is "abstraction by removal" —
 * the geometer studies a body NOT as wood, NOT as heavy, but as
 * extended-only. The properties stripped are not denied; they are
 * set aside. Stanford Encyclopedia of Philosophy: "the mathematician
 * subtracts… all the things which are perceptible."
 *
 * Every Ouroboros abstraction must carry a removal-receipt: which
 * properties were removed, by whom, when. Without the receipt, the
 * abstraction is a fiction (Aristotle's worry about Platonic
 * separation). With the receipt, abstraction is honest.
 */

export interface Property {
  name: string;
  value?: unknown;
}

export interface AphairesisInput {
  subjectId: string;
  allProperties: Property[];
  retainedProperties: string[]; // property names kept after removal
  removedBy: string;
  timestamp: string; // ISO
}

export interface AphairesisReceipt {
  subjectId: string;
  retained: Property[];
  removed: Property[];
  removedBy: string;
  timestamp: string;
  precision: number; // ratio of removed / total — Aristotle: more removal = more akribeia
  honest: boolean; // true iff every removal is recorded explicitly
}

export function abstractByRemoval(input: AphairesisInput): AphairesisReceipt {
  const retainedSet = new Set(input.retainedProperties);
  const retained: Property[] = [];
  const removed: Property[] = [];
  for (const p of input.allProperties) {
    if (retainedSet.has(p.name)) retained.push(p);
    else removed.push(p);
  }
  const total = input.allProperties.length;
  const precision = total === 0 ? 0 : removed.length / total;
  // Honest if every retained name actually existed in allProperties.
  const allNames = new Set(input.allProperties.map((p) => p.name));
  const honest = input.retainedProperties.every((n) => allNames.has(n));
  return {
    subjectId: input.subjectId,
    retained,
    removed,
    removedBy: input.removedBy,
    timestamp: input.timestamp,
    precision,
    honest,
  };
}

export function moreAkribeic(a: AphairesisReceipt, b: AphairesisReceipt): AphairesisReceipt {
  // Aristotle: arithmetic > geometry in akribeia because more is removed.
  return a.precision >= b.precision ? a : b;
}
