import Link from "next/link";
import { useRouter } from "next/router";
import { ReactNode } from "react";
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
  const logout = async () => { await adminSignOut(); router.push("/login"); };

  return (
    <div className="min-h-screen flex">
      <aside className="w-60 bg-glem-700 text-white p-6 flex flex-col">
        <div className="text-2xl font-bold mb-1">Nautica GLEM</div>
        <div className="text-xs text-glem-50 opacity-70 mb-8">Pannello amministratore</div>
        <nav className="flex-1 space-y-1">
          {NAV.map((n) => {
            const active = router.pathname === n.href;
            return (
              <Link key={n.href} href={n.href}
                className={`block px-3 py-2 rounded ${active ? "bg-glem-500" : "hover:bg-glem-500/40"}`}>
                {n.label}
              </Link>
            );
          })}
        </nav>
        <button onClick={logout} className="mt-6 text-sm opacity-80 hover:opacity-100 text-left">Esci</button>
      </aside>
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
