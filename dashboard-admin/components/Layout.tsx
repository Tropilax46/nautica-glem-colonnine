import Link from "next/link";
import { useRouter } from "next/router";
import { ReactNode, useState } from "react";
import { adminSignOut } from "../lib/api";

type Child = { label: string; href: string };
type Item = { label: string; href?: string; children?: Child[] };

const NAV: Item[] = [
  { label: "Dashboard", href: "/" },
  { label: "Sessioni attive", href: "/sessioni-attive" },
  { label: "Utenti", children: [
    { label: "Utenti", href: "/utenti" },
    { label: "Gruppi utenti", href: "/utenti/gruppi" },
    { label: "Debiti", href: "/utenti/debiti" },
    { label: "Ricariche", href: "/utenti/ricariche" },
  ]},
  { label: "Assistenza", children: [
    { label: "Alert", href: "/assistenza/alert" },
    { label: "Tickets", href: "/assistenza/tickets" },
  ]},
  { label: "Rendiconto", href: "/rendiconto" },
  { label: "Gestione colonnine", href: "/gestione-colonnine" },
  { label: "Tariffe", children: [
    { label: "Tariffe d'acquisto", href: "/tariffe/acquisto" },
    { label: "Tariffe di vendita", href: "/tariffe/vendita" },
  ]},
  { label: "Impostazioni", children: [
    { label: "Generali", href: "/impostazioni" },
    { label: "Gestione accounts", href: "/impostazioni/accounts" },
  ]},
];

export default function Layout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const path = router.pathname;
  const [drawer, setDrawer] = useState(false);

  const groupActive = (it: Item) => it.children?.some((c) => c.href === path);
  const [open, setOpen] = useState<Record<string, boolean>>(() => {
    const o: Record<string, boolean> = {};
    NAV.forEach((it) => { if (it.children && groupActive(it)) o[it.label] = true; });
    return o;
  });
  const toggle = (l: string) => setOpen((s) => ({ ...s, [l]: !s[l] }));
  const logout = async () => { await adminSignOut(); router.push("/login"); };
  const linkCls = (active: boolean) =>
    `block rounded px-3 py-2 text-sm ${active ? "bg-glem-500" : "hover:bg-glem-500/40"}`;

  return (
    <div className="min-h-screen lg:flex">
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between bg-glem-700 px-4 py-3 text-white">
        <button onClick={() => setDrawer(true)} aria-label="Apri menu" className="text-2xl leading-none">≡</button>
        <span className="font-bold">Nautica GLEM</span>
        <button onClick={logout} className="text-sm opacity-90">Esci</button>
      </header>

      {drawer && <div onClick={() => setDrawer(false)} className="fixed inset-0 z-40 bg-black/40 lg:hidden" />}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col overflow-y-auto bg-glem-700 p-6 text-white transition-transform lg:static lg:z-auto lg:w-60 lg:translate-x-0 ${
          drawer ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="text-2xl font-bold mb-1">Nautica GLEM</div>
        <div className="text-xs text-glem-50 opacity-70 mb-8">Pannello amministratore</div>
        <nav className="flex-1 space-y-1">
          {NAV.map((it) =>
            it.children ? (
              <div key={it.label}>
                <button onClick={() => toggle(it.label)}
                  className="flex w-full items-center justify-between rounded px-3 py-2 text-sm hover:bg-glem-500/40">
                  <span>{it.label}</span>
                  <span className="text-xs opacity-70">{open[it.label] ? "▾" : "▸"}</span>
                </button>
                {open[it.label] && (
                  <div className="mt-1 space-y-1 border-l border-white/15 pl-3">
                    {it.children.map((c) => (
                      <Link key={c.href} href={c.href} onClick={() => setDrawer(false)} className={linkCls(path === c.href)}>
                        {c.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link key={it.href} href={it.href!} onClick={() => setDrawer(false)} className={linkCls(path === it.href)}>
                {it.label}
              </Link>
            )
          )}
        </nav>
        <button onClick={logout} className="mt-6 text-left text-sm opacity-80 hover:opacity-100">Esci</button>
      </aside>

      <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
