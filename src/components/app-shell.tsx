import { Link } from "@tanstack/react-router";
import { AdSlot } from "@/components/ad-slot";
import { Mark } from "@/lib/logo";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
          <Link to="/" className="flex items-center gap-2 text-fg">
            <Mark className="size-7" />
            <span className="font-display text-lg tracking-tight">Roundtable</span>
          </Link>
          <nav className="flex gap-4 text-sm text-muted">
            <Link to="/roundtable" className="hover:text-fg">
              Table
            </Link>
            <Link to="/keys" className="hover:text-fg">
              Keys
            </Link>
          </nav>
        </div>
      </header>
      {children}
      <footer className="mx-auto max-w-6xl px-4 py-8">
        <AdSlot slot="footer-banner" />
      </footer>
    </div>
  );
}

export function AuthSkeleton() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-sm text-muted">Loading…</div>
  );
}
