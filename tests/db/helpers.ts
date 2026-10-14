import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

function env(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} is not set. Run \`npx supabase start\` and fill .env.local (see .env.example).`,
    );
  }
  return value;
}

const url = () => env("NEXT_PUBLIC_SUPABASE_URL");
const noSession = { auth: { persistSession: false, autoRefreshToken: false } };

/** Service-role client: bypasses RLS, used only for fixtures and assertions. */
export function adminClient(): SupabaseClient {
  return createClient(url(), env("SUPABASE_SERVICE_ROLE_KEY"), noSession);
}

/** Signed-out client, as a visitor's browser would be. */
export function anonClient(): SupabaseClient {
  return createClient(url(), env("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"), noSession);
}

export type TestUser = { id: string; email: string; client: SupabaseClient };

const TEST_EMAIL_DOMAIN = "lords-of-logic.test";

// Per test file (Vitest isolates modules per file), so one suite's cleanup
// never deletes users another suite is still using.
const createdUserIds = new Set<string>();

/**
 * Creates a real auth.users row (firing on_auth_user_created, the same path an
 * OAuth signup takes) and returns a client signed in as that user.
 */
export async function createTestUser(): Promise<TestUser> {
  const email = `test-${randomUUID()}@${TEST_EMAIL_DOMAIN}`;
  const password = `pw-${randomUUID()}`;

  const { data, error } = await adminClient().auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) throw error ?? new Error("createUser failed");
  createdUserIds.add(data.user.id);

  const client = anonClient();
  const { error: signInError } = await client.auth.signInWithPassword({
    email,
    password,
  });
  if (signInError) throw signInError;

  return { id: data.user.id, email, client };
}

/** Deletes the users this test file created (profiles/sessions cascade). */
export async function deleteTestUsers(): Promise<void> {
  const admin = adminClient();
  for (const id of createdUserIds) {
    await admin.auth.admin.deleteUser(id);
    createdUserIds.delete(id);
  }
}

/**
 * Reads a profile through the public read policy (what the ranking sees).
 * service_role has no grants on profiles, so the admin client can't read it.
 */
export async function getProfile(userId: string) {
  const { data, error } = await anonClient()
    .from("profiles")
    .select("nickname, xp_total, matches_played, current_title")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data as {
    nickname: string;
    xp_total: number;
    matches_played: number;
    current_title: string;
  };
}
