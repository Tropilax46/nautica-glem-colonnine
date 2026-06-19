import AuthGuard from "@/components/AuthGuard";
import Layout from "@/components/Layout";
export default function Page() {
  return (
    <AuthGuard>
      <Layout title="Privacy">
        <div className="card space-y-3 text-sm text-slate-600">
          <p className="font-semibold text-glem-700">Informativa sulla privacy</p>
          <p>Documento in preparazione. Qui verrà descritto come vengono trattati i dati personali (account, consumi, pagamenti) ai sensi del GDPR.</p>
          <p className="text-xs text-slate-400">Ultimo aggiornamento: —</p>
        </div>
      </Layout>
    </AuthGuard>
  );
}
