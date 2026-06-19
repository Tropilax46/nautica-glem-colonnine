import Link from "next/link";
import { useRouter } from "next/router";
import { ReactNode, useEffect, useState } from "react";
import useSWR from "swr";
import { fetcher, supabase, SessionOut } from "@/lib/api";

const tabs = [
  { href: "/news", label: "News", icon: "📰" },
  { href: "/sessioni", label: "Sessioni", icon: "🧾" },
  { href: "/", label: "Home", icon: "⚓", center: true },
  { href: "/mappa", label: "Mappa", icon: "🗺️" },
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

  const { data: active } = useSWR<SessionOut[]>(loggedIn ? "/sessions/active" : null, fetcher, { refreshInterval: 15000 });
  const hasActive = (active?.length ?? 0) > 0;
  const isCurrent = (href: string) => router.pathname === href || (href !== "/" && router.pathname.startsWith(href));

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 bg-glem-500 text-white shadow">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <h1 className="text-lg font-bold">{title ?? "Nautica GLEM"}</h1>
          <nav className="hidden gap-1 sm:flex">
            {tabs.map((t) => (
              <Link key={t.href} href={t.href}
                className={`relative rounded-lg px-3 py-1.5 text-sm font-medium transition ${isCurrent(t.href) ? "bg-white text-glem-700" : "text-white/90 hover:bg-white/10"}`}>
                <span className="mr-1">{t.icon}</span>{t.label}
                {t.center && hasActive && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-green-400" />}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md px-4 py-4 pb-28 sm:max-w-3xl sm:pb-8 lg:max-w-5xl">{children}</main>

      {/* Bottom nav (mobile) */}
      <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto flex max-w-md items-end border-t border-slate-200 bg-white sm:hidden">
        {tabs.map((t) => {
          const cur = isCurrent(t.href);
          if (t.center) {
            return (
              <Link key={t.href} href={t.href} className="relative flex flex-1 flex-col items-center">
                <span className={`-mt-5 flex h-14 w-14 items-center justify-center rounded-full text-2xl shadow-lg ring-4 ring-white ${cur ? "bg-glem-700 text-white" : "bg-glem-500 text-white"}`}>
                  {t.icon}
                  {hasActive && <span className="absolute right-0 top-0 h-3 w-3 rounded-full border-2 border-white bg-green-400" />}
                </span>
                <span className={`pb-1 text-[11px] ${cur ? "font-semibold text-glem-600" : "text-slate-500"}`}>{t.label}</span>
              </Link>
            );
          }
          return (
            <Link key={t.href} href={t.href} className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] ${cur ? "font-semibold text-glem-500" : "text-slate-500"}`}>
              <span className="text-lg leading-none">{t.icon}</span>{t.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
