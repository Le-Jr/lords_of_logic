import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { DIFFICULTY_TIERS } from "@/lib/questions/schema";
import { scoreQuestion } from "@/lib/scoring";
import type { Difficulty } from "@/lib/scoring";
import {
  adminClient,
  anonClient,
  createTestUser,
  deleteTestUsers,
  getProfile,
} from "./helpers";
import type { TestUser } from "./helpers";

const CATEGORY = "Platforms";
const OTHER_CATEGORY = "General Development";
const PREFIX = "zz-test-";

// One multiple-choice fixture per tier, plus a text one and a few edge cases.
const mcId = (tier: Difficulty) => `${PREFIX}mc-${tier.replace(/\s/g, "-").toLowerCase()}`;
const TEXT_ID = `${PREFIX}text-junior`;
const OTHER_CATEGORY_ID = `${PREFIX}other-category`;
const INACTIVE_ID = `${PREFIX}inactive`;

// PostgREST bulk inserts send every column; omitted ones become null.
const fixtures = [
  ...DIFFICULTY_TIERS.map((tier) => ({
    id: mcId(tier),
    category: CATEGORY,
    difficulty: tier,
    type: "multiple_choice",
    question_text: `Fixture ${tier}?`,
    options: ["A", "B", "C", "D"],
    answer: "B",
    explanation: "Fixture.",
    active: true,
  })),
  {
    id: TEXT_ID,
    category: CATEGORY,
    difficulty: "Junior",
    type: "text",
    question_text: "Shopify template language?",
    options: null,
    answer: "Liquid",
    explanation: "Fixture.",
    active: true,
  },
  {
    id: OTHER_CATEGORY_ID,
    category: OTHER_CATEGORY,
    difficulty: "Junior",
    type: "multiple_choice",
    question_text: "Other category?",
    options: ["A", "B", "C", "D"],
    answer: "B",
    explanation: "Fixture.",
    active: true,
  },
  {
    id: INACTIVE_ID,
    category: CATEGORY,
    difficulty: "Code Wizard Supreme",
    type: "multiple_choice",
    question_text: "Retired question?",
    options: ["A", "B", "C", "D"],
    answer: "B",
    explanation: "Fixture.",
    active: false,
  },
];

type Answer = { question_id: string; selected_option: string | null };

async function record(
  user: TestUser,
  answers: Answer[],
  { sessionId = randomUUID(), playerId = user.id, category = CATEGORY } = {},
) {
  // Same call as lib/sessions.ts.
  return user.client.rpc("record_solo_session", {
    p_session_id: sessionId,
    p_player_id: playerId,
    p_category: category,
    p_answers: answers,
  });
}

const right = (id: string): Answer => ({ question_id: id, selected_option: "B" });
const wrong = (id: string): Answer => ({ question_id: id, selected_option: "A" });
const timeout = (id: string): Answer => ({ question_id: id, selected_option: null });

async function removeFixtures() {
  await adminClient().from("questions").delete().like("id", `${PREFIX}%`);
}

beforeAll(async () => {
  await removeFixtures();
  const { error } = await adminClient().from("questions").insert(fixtures);
  if (error) throw error;
});

afterAll(async () => {
  await deleteTestUsers();
  await removeFixtures();
});

describe("record_solo_session scoring", () => {
  let user: TestUser;
  beforeAll(async () => {
    user = await createTestUser();
  });

  it.each(DIFFICULTY_TIERS)("%s: server score matches lib/scoring.ts", async (tier) => {
    const { data: ok, error } = await record(user, [right(mcId(tier))]);
    expect(error).toBeNull();
    expect(ok[0].score).toBe(scoreQuestion(tier, "correct"));

    const { data: miss } = await record(user, [wrong(mcId(tier))]);
    expect(miss[0].score).toBe(scoreQuestion(tier, "wrong"));

    const { data: none } = await record(user, [timeout(mcId(tier))]);
    expect(none[0].score).toBe(0);
  });

  it("text answers ignore case and surrounding spaces, like the client", async () => {
    const { data } = await record(user, [
      { question_id: TEXT_ID, selected_option: "  lIqUiD " },
    ]);
    expect(data[0].score).toBe(10);
  });

  it("multiple choice must match the option exactly", async () => {
    const { data } = await record(user, [
      { question_id: mcId("Junior"), selected_option: "b" },
    ]);
    expect(data[0].score).toBe(0);
  });
});

describe("record_solo_session XP and match count", () => {
  let user: TestUser;
  beforeEach(async () => {
    user = await createTestUser();
  });

  it("adds the score to xp_total and counts the match", async () => {
    const { data } = await record(user, [
      right(mcId("Junior")),
      right(mcId("Senior")),
      wrong(mcId("Linus Torvalds")),
      timeout(mcId("Vibecoder")),
      { question_id: TEXT_ID, selected_option: "Liquid" },
    ]);
    expect(data[0]).toMatchObject({ score: 10 + 20 - 5 + 0 + 10, created: true });

    const profile = await getProfile(user.id);
    expect(profile.xp_total).toBe(35);
    expect(profile.matches_played).toBe(1);
  });

  it("a negative round counts as played but never removes XP", async () => {
    await record(user, [right(mcId("Junior"))]);
    const { data } = await record(user, [wrong(mcId("Code Wizard Supreme"))]);
    expect(data[0].score).toBe(-10);

    const profile = await getProfile(user.id);
    expect(profile.xp_total).toBe(10);
    expect(profile.matches_played).toBe(2);
  });

  it("submitting the same round twice is recorded once", async () => {
    const sessionId = randomUUID();
    const first = await record(user, [right(mcId("Senior"))], { sessionId });
    const second = await record(user, [right(mcId("Senior"))], { sessionId });

    expect(first.data[0]).toMatchObject({ score: 20, created: true });
    expect(second.data[0]).toMatchObject({ score: 20, created: false });

    const profile = await getProfile(user.id);
    expect(profile.xp_total).toBe(20);
    expect(profile.matches_played).toBe(1);
  });

  it("the ranking reads the new totals", async () => {
    await record(user, [right(mcId("Mid-level"))]);
    const { data } = await anonClient()
      .from("profiles")
      .select("xp_total, matches_played")
      .eq("id", user.id)
      .single();
    expect(data).toEqual({ xp_total: 15, matches_played: 1 });
  });

  it("the player can read their own session row", async () => {
    const sessionId = randomUUID();
    await record(user, [right(mcId("Junior"))], { sessionId });
    const { data } = await user.client
      .from("solo_sessions")
      .select("score, category")
      .eq("id", sessionId)
      .single();
    expect(data).toEqual({ score: 10, category: CATEGORY });
  });
});

describe("record_solo_session rejects bad submissions", () => {
  let user: TestUser;
  let other: TestUser;
  beforeAll(async () => {
    [user, other] = await Promise.all([createTestUser(), createTestUser()]);
  });

  it("recording for another player", async () => {
    const { error } = await record(user, [right(mcId("Junior"))], {
      playerId: other.id,
    });
    expect(error).not.toBeNull();
  });

  it("an unknown category", async () => {
    const { error } = await record(user, [right(mcId("Junior"))], {
      category: "Cooking",
    });
    expect(error).not.toBeNull();
  });

  it("a question from a different category", async () => {
    const { error } = await record(user, [right(OTHER_CATEGORY_ID)]);
    expect(error).not.toBeNull();
  });

  it("an unknown question", async () => {
    const { error } = await record(user, [right(`${PREFIX}missing`)]);
    expect(error).not.toBeNull();
  });

  it("an empty answer list", async () => {
    const { error } = await record(user, []);
    expect(error).not.toBeNull();
  });

  it("a signed-out caller", async () => {
    const { error } = await anonClient().rpc("record_solo_session", {
      p_session_id: randomUUID(),
      p_player_id: user.id,
      p_category: CATEGORY,
      p_answers: [right(mcId("Junior"))],
    });
    expect(error).not.toBeNull();
  });

  it("the same question answered more than once in a round", async () => {
    const { error } = await record(
      user,
      Array.from({ length: 5 }, () => right(mcId("Code Wizard Supreme"))),
    );
    expect(error).not.toBeNull();
  });

  it("more answers than a round has (5)", async () => {
    const { error } = await record(user, [
      ...DIFFICULTY_TIERS.map((tier) => right(mcId(tier))),
      right(TEXT_ID),
    ]);
    expect(error).not.toBeNull();
  });

  it("a question that is not playable (inactive)", async () => {
    const { error } = await record(user, [right(INACTIVE_ID)]);
    expect(error).not.toBeNull();
  });

  it("reusing another player's session id does not reveal their score", async () => {
    const sessionId = randomUUID();
    await record(other, [right(mcId("Code Wizard Supreme"))], { sessionId });
    const { data, error } = await record(user, [timeout(mcId("Junior"))], {
      sessionId,
    });
    expect(error !== null || data?.[0].score !== 40).toBe(true);
  });
});
