import { useRouter } from "next/router";
import { ReactNode, useEffect, useState } from "react";
import { getToken } from "@/lib/api";

/** Reindirizza a /login se non c'è un token salvato. */
export default function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
    } else {
      setOk(true);
    }
  }, [router]);

  if (!ok) return null;
  return <>{children}</>;
}
