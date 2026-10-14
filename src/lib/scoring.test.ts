import { describe, expect, it } from "vitest";

import { DIFFICULTY_TIERS } from "@/lib/questions/schema";
import { roundScore, scoreQuestion, xpFromScore } from "@/lib/scoring";
import type { Difficulty, ScoredAnswer } from "@/lib/scoring";

// The PROJECT.md table. record_solo_session hardcodes the same numbers in SQL,
// so tests/db/solo-sessions.test.ts checks the database against this too.
const EXPECTED: Record<Difficulty, { correct: number; wrong: number }> = {
  Vibecoder: { correct: 8, wrong: 0 },
  Junior: { correct: 10, wrong: 0 },
  "Mid-level": { correct: 15, wrong: 0 },
  Senior: { correct: 20, wrong: 0 },
  "Linus Torvalds": { correct: 30, wrong: -5 },
  "Code Wizard Supreme": { correct: 40, wrong: -10 },
};

describe("scoreQuestion", () => {
  it.each(DIFFICULTY_TIERS)("%s follows the PROJECT.md table", (tier) => {
    expect(scoreQuestion(tier, "correct")).toBe(EXPECTED[tier].correct);
    expect(scoreQuestion(tier, "wrong")).toBe(EXPECTED[tier].wrong);
    expect(scoreQuestion(tier, "no-answer")).toBe(0);
  });

  it("returns whole numbers for every tier", () => {
    for (const tier of DIFFICULTY_TIERS) {
      expect(Number.isInteger(scoreQuestion(tier, "correct"))).toBe(true);
    }
  });
});

describe("roundScore", () => {
  const answer = (
    difficulty: Difficulty,
    result: ScoredAnswer["result"],
  ): ScoredAnswer => ({ questionId: "q", difficulty, result, selected: null });

  it("is 0 for an empty round", () => {
    expect(roundScore([])).toBe(0);
  });

  it("sums points and penalties", () => {
    expect(
      roundScore([
        answer("Vibecoder", "correct"),
        answer("Senior", "correct"),
        answer("Linus Torvalds", "wrong"),
        answer("Code Wizard Supreme", "wrong"),
        answer("Junior", "no-answer"),
      ]),
    ).toBe(8 + 20 - 5 - 10);
  });

  it("can go negative", () => {
    expect(roundScore([answer("Code Wizard Supreme", "wrong")])).toBe(-10);
  });
});

describe("xpFromScore", () => {
  it("is 1:1 with the score", () => {
    expect(xpFromScore(42)).toBe(42);
  });
});
