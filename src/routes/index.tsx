import { createFileRoute, Link } from "@tanstack/react-router";
import { AdSlot } from "@/components/ad-slot";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Mark } from "@/lib/logo";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <AppShell>
      <main className="mx-auto max-w-6xl px-4 py-12 sm:py-20">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
          Roundtable
        </p>
        <h1 className="mt-4 max-w-3xl font-display text-5xl leading-[1.05] tracking-tight text-fg sm:text-6xl">
          Seat the models you pay for.
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-muted">
          Grok, GPT, Claude, Gemini, DeepSeek, Llama. You paste the keys, you
          pick the seats, you put a question in the center. They answer as
          themselves.
        </p>
        <div className="mt-10">
          <Button asChild>
            <Link to="/roundtable">
              Open the table
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
        <div className="mt-12 max-w-xl">
          <AdSlot slot="home-mid" label="House ad until this slot sells" />
        </div>
        <div className="mt-16 flex items-start gap-3 text-sm text-muted">
          <Mark className="mt-0.5 size-5 shrink-0" />
          <p className="max-w-2xl leading-relaxed">
            Bring your own API keys. After you sign in, the first visit stops
            you and tells you which keys you still need. You only need keys
            for the seats you fill.
          </p>
        </div>
      </main>
    </AppShell>
  );
}
