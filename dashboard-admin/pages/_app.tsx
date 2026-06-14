import "../styles/globals.css";
import type { AppProps } from "next/app";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { hasSession } from "../lib/api";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    hasSession().then((s) => {
      if (!alive) return;
      if (!s && router.pathname !== "/login") router.replace("/login");
      else setReady(true);
    });
    return () => { alive = false; };
  }, [router.pathname]);

  if (!ready && router.pathname !== "/login") return null;
  return <Component {...pageProps} />;
}
