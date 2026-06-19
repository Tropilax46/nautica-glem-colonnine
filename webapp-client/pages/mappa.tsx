import { useEffect, useRef, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import Layout from "@/components/Layout";
import { supabase } from "@/lib/api";

function loadLeaflet(): Promise<any> {
  return new Promise((resolve, reject) => {
    if ((window as any).L) return resolve((window as any).L);
    const css = document.createElement("link"); css.rel = "stylesheet"; css.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"; document.head.appendChild(css);
    const js = document.createElement("script"); js.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
    js.onload = () => resolve((window as any).L); js.onerror = reject; document.body.appendChild(js);
  });
}

function Mappa() {
  const ref = useRef<HTMLDivElement>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    let map: any;
    (async () => {
      const L = await loadLeaflet();
      if (!ref.current) return;
      map = L.map(ref.current).setView([41.9, 12.5], 5);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap", maxZoom: 19 }).addTo(map);
      const { data } = await supabase.from("porti").select("*");
      const pts: any[] = data ?? [];
      const coords: [number, number][] = [];
      pts.forEach((p) => {
        L.circleMarker([p.lat, p.lng], { radius: 10, color: "#0b4f6c", fillColor: "#0b4f6c", fillOpacity: 0.85 })
          .addTo(map).bindPopup(`<strong>${p.nome}</strong><br/>${p.descrizione ?? ""}`);
        coords.push([p.lat, p.lng]);
      });
      if (coords.length === 1) map.setView(coords[0], 13);
      else if (coords.length > 1) map.fitBounds(coords, { padding: [40, 40] });
    })().catch(() => setErr("Mappa non disponibile al momento."));
    return () => { try { map?.remove(); } catch {} };
  }, []);

  return (
    <Layout title="Mappa">
      <p className="mb-3 text-sm text-slate-500">I porti Nautica GLEM. Presto anche spot di pesca e punti di interesse.</p>
      {err && <p className="mb-2 text-sm text-red-600">{err}</p>}
      <div ref={ref} className="w-full overflow-hidden rounded-2xl border border-slate-200" style={{ height: "68vh", minHeight: 360 }} />
    </Layout>
  );
}
export default function Page() { return (<AuthGuard><Mappa /></AuthGuard>); }
