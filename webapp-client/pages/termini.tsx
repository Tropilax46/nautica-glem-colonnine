import AuthGuard from "@/components/AuthGuard";
import Layout from "@/components/Layout";
export default function Page() {
  return (
    <AuthGuard>
      <Layout title="Termini e condizioni">
        <div className="card space-y-3 text-sm text-slate-600">
          <p className="font-semibold text-glem-700">Termini e condizioni del servizio</p>
          <p>Documento in preparazione. Qui verranno pubblicate le condizioni d'uso delle colonnine, le modalità di addebito del credito, il debito massimo consentito e le responsabilità delle parti.</p>
          <p className="text-xs text-slate-400">Ultimo aggiornamento: —</p>
        </div>
      </Layout>
    </AuthGuard>
  );
}
