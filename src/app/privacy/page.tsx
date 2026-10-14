import Link from "next/link";

import { PromptLine } from "@/components/prompt-line";
import { createClient } from "@/lib/supabase/server";
import { strings } from "@/lib/strings";
import { getUserStatus } from "@/lib/user-status";

export const metadata = {
  title: "Privacy Policy · Lords of Logic",
};

export default async function PrivacyPage() {
  const supabase = await createClient();
  const status = await getUserStatus(supabase);
  const { contactEmail } = strings.privacy;

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-12">
      <div className="flex w-full max-w-[40rem] flex-col">
        <PromptLine prompt={strings.privacy.prompt} userStatus={status} />

        <section className="mt-16 flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <h1 className="font-display text-7xl leading-none text-term-primary">
              {strings.privacy.title}
            </h1>
            <p className="text-sm text-term-secondary">
              {strings.privacy.tagline}
            </p>
            <p className="text-xs text-term-secondary">
              {strings.privacy.updated}
            </p>
          </div>

          {strings.privacy.sections.map((section) => (
            <div key={section.heading} className="flex flex-col gap-2">
              <h2 className="text-sm font-bold text-term-primary">
                {section.heading}
              </h2>
              {section.lines.map((line) => (
                <p key={line} className="text-sm text-term-primary">
                  {line}
                </p>
              ))}
            </div>
          ))}

          <div className="border-2 border-term-border px-4 py-3 text-sm text-term-primary">
            <span className="mr-2 font-bold">{strings.privacy.contactLabel}</span>
            <a
              href={`mailto:${contactEmail}`}
              className="px-1 underline transition-none hover:bg-term-primary hover:text-term-bg hover:no-underline focus:bg-term-primary focus:text-term-bg focus:no-underline focus:outline-none"
            >
              {contactEmail}
            </a>
          </div>
        </section>

        <hr className="mt-12 w-full border-t border-dashed border-term-border" />

        <Link
          href="/"
          className="mt-6 w-fit px-2 py-1 text-sm uppercase text-term-primary whitespace-nowrap transition-none hover:bg-term-primary hover:text-term-bg focus:bg-term-primary focus:text-term-bg focus:outline-none"
        >
          {strings.privacy.back}
        </Link>

        <p className="mt-4 text-xs text-term-secondary">{strings.privacy.hint}</p>
      </div>
    </main>
  );
}
