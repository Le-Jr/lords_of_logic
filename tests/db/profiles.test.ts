import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { placeholderNickname } from "@/lib/nickname";
import {
  adminClient,
  anonClient,
  createTestUser,
  deleteTestUsers,
  getProfile,
} from "./helpers";
import type { TestUser } from "./helpers";

const uniqueNick = () => `nick_${randomUUID().slice(0, 8)}`;

describe("account creation", () => {
  let user: TestUser;

  beforeAll(async () => {
    user = await createTestUser();
  });
  afterAll(deleteTestUsers);

  it("creates a profile with the placeholder nickname on signup", async () => {
    const profile = await getProfile(user.id);
    expect(profile.nickname).toBe(placeholderNickname(user.id));
    expect(profile.xp_total).toBe(0);
    expect(profile.matches_played).toBe(0);
    expect(profile.current_title).toBe("Vibecoder");
  });

  it("lets the new user read their own profile (callback onboarding check)", async () => {
    const { data, error } = await user.client
      .from("profiles")
      .select("nickname")
      .eq("id", user.id)
      .single();
    expect(error).toBeNull();
    expect(data?.nickname).toBe(placeholderNickname(user.id));
  });

  it("deleting the auth user removes the profile", async () => {
    const temp = await createTestUser();
    await adminClient().auth.admin.deleteUser(temp.id);
    const { data } = await anonClient()
      .from("profiles")
      .select("id")
      .eq("id", temp.id);
    expect(data).toEqual([]);
  });
});

describe("nickname change", () => {
  let alice: TestUser;
  let bob: TestUser;

  beforeAll(async () => {
    [alice, bob] = await Promise.all([createTestUser(), createTestUser()]);
  });
  afterAll(deleteTestUsers);

  // Same call as components/nickname-form.tsx, plus .select() to see the row count.
  const rename = (user: TestUser, nickname: string, targetId = user.id) =>
    user.client
      .from("profiles")
      .update({ nickname })
      .eq("id", targetId)
      .select("nickname");

  it("owner can change their nickname", async () => {
    const nick = uniqueNick();
    const { data, error } = await rename(alice, nick);
    expect(error).toBeNull();
    expect(data).toEqual([{ nickname: nick }]);
    expect((await getProfile(alice.id)).nickname).toBe(nick);
  });

  it("can change it again later (settings page)", async () => {
    const nick = uniqueNick();
    const { error } = await rename(alice, nick);
    expect(error).toBeNull();
    expect((await getProfile(alice.id)).nickname).toBe(nick);
  });

  it("rejects a nickname taken by someone else, ignoring case (23505)", async () => {
    const nick = uniqueNick();
    expect((await rename(alice, nick)).error).toBeNull();
    const { error } = await rename(bob, nick.toUpperCase());
    expect(error?.code).toBe("23505");
  });

  it("rejects a blank nickname (23514)", async () => {
    const { error } = await rename(alice, "   ");
    expect(error?.code).toBe("23514");
  });

  it("rejects a nickname over 24 chars (23514)", async () => {
    const { error } = await rename(alice, "x".repeat(25));
    expect(error?.code).toBe("23514");
  });

  it("cannot rename another user (RLS: 0 rows, no error)", async () => {
    const before = (await getProfile(bob.id)).nickname;
    const { data, error } = await rename(alice, uniqueNick(), bob.id);
    expect(error).toBeNull();
    expect(data).toEqual([]);
    expect((await getProfile(bob.id)).nickname).toBe(before);
  });

  it("a signed-out client cannot rename anyone", async () => {
    const before = (await getProfile(bob.id)).nickname;
    await anonClient().from("profiles").update({ nickname: uniqueNick() }).eq("id", bob.id);
    expect((await getProfile(bob.id)).nickname).toBe(before);
  });

  it("cannot write xp_total / matches_played directly (anti-cheat)", async () => {
    const { error } = await alice.client
      .from("profiles")
      .update({ xp_total: 99_999 })
      .eq("id", alice.id);
    expect(error?.code).toBe("42501");

    const { error: matchesError } = await alice.client
      .from("profiles")
      .update({ matches_played: 99 })
      .eq("id", alice.id);
    expect(matchesError?.code).toBe("42501");
  });
});
