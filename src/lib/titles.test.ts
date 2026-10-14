import { describe, expect, it } from "vitest";

import { titleFromXp } from "@/lib/titles";

describe("titleFromXp", () => {
  it.each([
    [0, "Vibecoder"],
    [49, "Vibecoder"],
    [50, "Junior"],
    [149, "Junior"],
    [150, "Mid-level"],
    [349, "Mid-level"],
    [350, "Senior"],
    [699, "Senior"],
    [700, "Linus Torvalds"],
    [1199, "Linus Torvalds"],
    [1200, "Code Wizard Supreme"],
    [99_999, "Code Wizard Supreme"],
  ] as const)("%i XP -> %s", (xp, title) => {
    expect(titleFromXp(xp)).toBe(title);
  });
});
