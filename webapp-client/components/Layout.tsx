import Link from "next/link";
import { useRouter } from "next/router";
import { ReactNode, useEffect, useState } from "react";
import useSWR from "swr";
import { fetcher, supabase, SessionOut } from "@/lib/api";

const tabs = [
  { href: "/", label: "Colonnine", icon: "⚡" },
  { href: "/sessione", label: "Sessione", icon: "▶" },
  { href: "/wallet", label: "Wallet", icon: "💶" },
  { href: "/profilo", label: "Profilo", icon: "👤" },
];

export default function Layout({ children, title }: { children: ReactNode; title?: string }) {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setLoggedIn(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setLoggedIn(!!s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const { data: active } = useSWR<SessionOut[]>(loggedIn ? "/sessions/active" : null, fetcher, {
    refreshInterval: 15000,
  });
  const hasActive = (active?.length ?? 0) > 0;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 bg-glem-500 text-white shadow">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <h1 className="text-lg font-bold">{title ?? "Nautica GLEM"}</h1>
          {/* Navigazione orizzontale (tablet/desktop) */}
          <nav className="hidden gap-1 sm:flex">
            {tabs.map((t) => {
              const current = router.pathname === t.href;
              return (
                <Link key={t.href} href={t.href}
                  className={`relative rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                    current ? "bg-white text-glem-700" : "text-white/90 hover:bg-white/10"
                  }`}>
                  <span className="mr-1">{t.icon}</span>{t.label}
                  {t.href === "/sessione" && hasActive && (
                    <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-green-400" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md px-4 py-4 pb-24 sm:max-w-3xl sm:pb-8 lg:max-w-5xl">
        {children}
      </main>

      {/* Navigazione inferiore (solo mobile) */}
      <nav className="fixed inset-x-0 bottom-0 z-10 mx-auto flex max-w-md border-t border-slate-200 bg-white sm:hidden">
        {tabs.map((t) => {
          const current = router.pathname === t.href;
          return (
            <Link key={t.href} href={t.href}
              className={`relative flex flex-1 flex-col items-center gap-0.5 py-2 text-xs ${
                current ? "font-semibold text-glem-500" : "text-slate-500"
              }`}>
              <span className="text-lg leading-none">{t.icon}</span>
              {t.label}
              {t.href === "/sessione" && hasActive && (
                <span className="absolute right-1/4 top-1 h-2 w-2 rounded-full bg-green-500" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
