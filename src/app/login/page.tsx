import Link from "next/link";

import { LoginForm } from "@/components/login-form";
import { PromptLine } from "@/components/prompt-line";
import { createClient } from "@/lib/supabase/server";
import { strings } from "@/lib/strings";
import { getUserStatus } from "@/lib/user-status";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const supabase = await createClient();
  const status = await getUserStatus(supabase);

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-12">
      <div className="flex w-full max-w-[40rem] flex-col">
        <PromptLine prompt={strings.login.prompt} userStatus={status} />

        <section className="mt-16 flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <h1 className="font-display text-7xl leading-none text-term-primary">
              {strings.login.title}
            </h1>
            <p className="text-sm text-term-secondary">
              {strings.login.tagline}
            </p>
          </div>

          <LoginForm errorParam={error} />
        </section>

        <hr className="mt-12 w-full border-t border-dashed border-term-border" />

        <Link
          href="/"
          className="mt-6 w-fit px-2 py-1 text-sm uppercase text-term-primary whitespace-nowrap transition-none hover:bg-term-primary hover:text-term-bg focus:bg-term-primary focus:text-term-bg focus:outline-none"
        >
          {strings.login.back}
        </Link>

        <p className="mt-4 text-xs text-term-secondary">{strings.login.hint}</p>
        <p className="mt-1 text-xs text-term-secondary">
          {strings.login.privacyNotice}{" "}
          <Link href="/privacy" className="px-1 underline transition-none hover:bg-term-primary hover:text-term-bg hover:no-underline focus:bg-term-primary focus:text-term-bg focus:no-underline focus:outline-none">
            {strings.login.privacyLink}
          </Link>
        </p>
      </div>
    </main>
  );
}
