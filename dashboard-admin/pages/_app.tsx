import "../styles/globals.css";
import type { AppProps } from "next/app";
import { useEffect } from "react";
import { useRouter } from "next/router";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  useEffect(() => {
    if (typeof window === "undefined") return;
    const tok = localStorage.getItem("glem_admin_token");
    if (!tok && router.pathname !== "/login") {
      router.replace("/login");
    }
  }, [router.pathname]);

  return <Component {...pageProps} />;
}
