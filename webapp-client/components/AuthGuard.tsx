import { useRouter } from "next/router";
import { ReactNode, useEffect, useState } from "react";
import { hasSession } from "@/lib/api";

/** Reindirizza a /login (conservando la destinazione) se non c'è sessione. */
export default function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    let alive = true;
    hasSession().then((s) => {
      if (!alive) return;
      if (!s) router.replace("/login?next=" + encodeURIComponent(router.asPath));
      else setOk(true);
    });
    return () => { alive = false; };
  }, [router]);

  if (!ok) return null;
  return <>{children}</>;
}
