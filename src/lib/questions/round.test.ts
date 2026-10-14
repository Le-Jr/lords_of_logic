import { describe, expect, it, vi } from "vitest";

// round.ts also exports a DB loader; keep next/headers out of unit tests.
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

const { isCategorySlug, sampleQuestions } = await import(
  "@/lib/questions/round"
);

describe("sampleQuestions", () => {
  const items = Array.from({ length: 12 }, (_, i) => i);

  it("returns the requested count of distinct items from the pool", () => {
    const sample = sampleQuestions(items, 5);
    expect(sample).toHaveLength(5);
    expect(new Set(sample).size).toBe(5);
    sample.forEach((item) => expect(items).toContain(item));
  });

  it("returns the whole pool when it is smaller than the count", () => {
    expect(sampleQuestions([1, 2], 5).sort()).toEqual([1, 2]);
  });

  it("does not mutate the input", () => {
    const copy = [...items];
    sampleQuestions(items, 5);
    expect(items).toEqual(copy);
  });
});

describe("isCategorySlug", () => {
  it("accepts the three category slugs", () => {
    expect(isCategorySlug("web-mobile-stack")).toBe(true);
    expect(isCategorySlug("platforms")).toBe(true);
    expect(isCategorySlug("general-development")).toBe(true);
  });

  it("rejects anything else", () => {
    expect(isCategorySlug("Platforms")).toBe(false);
    expect(isCategorySlug("")).toBe(false);
  });
});
