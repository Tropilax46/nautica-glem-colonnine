import Link from "next/link";
import { useRouter } from "next/router";
import { ReactNode, useState } from "react";
import { adminSignOut } from "../lib/api";

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/colonnine", label: "Colonnine" },
  { href: "/utenti", label: "Utenti" },
  { href: "/transazioni", label: "Transazioni" },
  { href: "/report", label: "Report" },
  { href: "/impostazioni", label: "Impostazioni" },
];

export default function Layout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const logout = async () => { await adminSignOut(); router.push("/login"); };

  return (
    <div className="min-h-screen lg:flex">
      {/* Barra superiore (solo mobile) */}
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between bg-glem-700 px-4 py-3 text-white">
        <button onClick={() => setOpen(true)} aria-label="Apri menu" className="text-2xl leading-none">≡</button>
        <span className="font-bold">Nautica GLEM</span>
        <button onClick={logout} className="text-sm opacity-90">Esci</button>
      </header>

      {/* Overlay drawer (mobile) */}
      {open && <div onClick={() => setOpen(false)} className="fixed inset-0 z-40 bg-black/40 lg:hidden" />}

      {/* Sidebar: drawer su mobile, fissa su desktop */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-glem-700 p-6 text-white transition-transform lg:static lg:z-auto lg:w-60 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="text-2xl font-bold mb-1">Nautica GLEM</div>
        <div className="text-xs text-glem-50 opacity-70 mb-8">Pannello amministratore</div>
        <nav className="flex-1 space-y-1">
          {NAV.map((n) => {
            const active = router.pathname === n.href;
            return (
              <Link key={n.href} href={n.href} onClick={() => setOpen(false)}
                className={`block px-3 py-2 rounded ${active ? "bg-glem-500" : "hover:bg-glem-500/40"}`}>
                {n.label}
              </Link>
            );
          })}
        </nav>
        <button onClick={logout} className="mt-6 text-left text-sm opacity-80 hover:opacity-100">Esci</button>
      </aside>

      <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
