import Layout from "@/components/Layout";

const Sez = ({ n, t, children }: { n: string; t: string; children: React.ReactNode }) => (
  <section className="space-y-1">
    <h2 className="font-semibold text-glem-700">{n}. {t}</h2>
    <div className="space-y-1 text-slate-600">{children}</div>
  </section>
);

export default function Page() {
  return (
    <Layout title="Termini e condizioni">
      <div className="card space-y-5 text-sm leading-relaxed">
        <div>
          <h1 className="text-lg font-bold text-glem-700">Termini e Condizioni del servizio Nautica GLEM</h1>
          <p className="text-xs text-slate-400">Versione 1.0 — Ultimo aggiornamento: giugno 2026</p>
        </div>

        <Sez n="1" t="Titolare del servizio">
          <p>Il servizio Nautica GLEM (di seguito il “Servizio”) è gestito da [RAGIONE SOCIALE], P.IVA 02803540877, con sede in [SEDE LEGALE] (di seguito il “Gestore”). Per qualsiasi comunicazione: [EMAIL] — PEC [PEC].</p>
        </Sez>

        <Sez n="2" t="Oggetto e accettazione">
          <p>I presenti Termini regolano l’uso dell’applicazione e delle colonnine di erogazione di energia elettrica e acqua installate presso i pontili gestiti. Registrandoti e utilizzando il Servizio dichiari di aver letto e accettato i presenti Termini e l’Informativa Privacy.</p>
        </Sez>

        <Sez n="3" t="Definizioni">
          <p><strong>Diportista/Utente</strong>: la persona registrata che utilizza il Servizio. <strong>Colonnina</strong>: il dispositivo al pontile che eroga energia e/o acqua. <strong>Sessione</strong>: un singolo prelievo avviato dall’Utente. <strong>Credito/Wallet</strong>: il saldo prepagato a crediti dell’Utente. <strong>Debito massimo</strong>: l’importo negativo massimo che il saldo può raggiungere prima del blocco.</p>
        </Sez>

        <Sez n="4" t="Registrazione e account">
          <p>Per usare il Servizio occorre creare un account fornendo dati veritieri e aggiornati. L’Utente è responsabile della riservatezza delle credenziali e di ogni attività svolta dal proprio account. È vietato cedere l’account a terzi.</p>
        </Sez>

        <Sez n="5" t="Descrizione del Servizio">
          <p>L’Utente avvia una Sessione inquadrando il QR della Colonnina, conferma i servizi desiderati (energia elettrica e/o acqua), collega fisicamente presa e/o tubi e monitora i consumi in tempo reale dall’app. Il Servizio è disponibile compatibilmente con lo stato dell’impianto e della connettività.</p>
        </Sez>

        <Sez n="6" t="Credito, ricariche e tariffe">
          <p>Il Servizio funziona con un Wallet prepagato a crediti, scalati in base ai consumi secondo le tariffe vigenti (es. €/kWh per l’energia, €/m³ per l’acqua) consultabili nell’app e applicabili alla singola Colonnina. Le tariffe possono essere aggiornate dal Gestore con effetto sulle Sessioni successive. Le ricariche del Wallet sono immediate e non rimborsabili salvo quanto previsto dalla legge.</p>
        </Sez>

        <Sez n="7" t="Svolgimento e interruzione della Sessione">
          <p>La Sessione si interrompe: (a) quando l’Utente preme “Termina sessione”; (b) al raggiungimento del debito massimo consentito; (c) dopo un periodo di inattività (assenza di prelievo) indicato nell’app. Al termine, il costo viene addebitato sul Wallet e reso disponibile nello storico. L’Utente è tenuto a scollegare presa e tubi al termine.</p>
        </Sez>

        <Sez n="8" t="Debito massimo e morosità">
          <p>A ciascun Utente è associato un debito massimo (predefinito o personalizzato dal Gestore). Al suo raggiungimento il Servizio viene sospeso fino alla ricarica del Wallet. Il saldo negativo costituisce debito esigibile che l’Utente si impegna a regolarizzare tempestivamente.</p>
        </Sez>

        <Sez n="9" t="Obblighi dell’Utente e sicurezza">
          <p>L’Utente si impegna a utilizzare attrezzature conformi e in buono stato, a collegare correttamente presa e tubi e a rispettare le norme di sicurezza del porto. È vietato manomettere le Colonnine o utilizzare il Servizio per scopi illeciti o per finalità diverse dalla normale fornitura alla propria imbarcazione.</p>
        </Sez>

        <Sez n="10" t="Limitazioni di responsabilità">
          <p>Il Gestore non è responsabile per interruzioni, malfunzionamenti, cali di tensione/portata o indisponibilità dovuti a cause tecniche, manutenzioni o forza maggiore. Nei limiti di legge, il Gestore non risponde dei danni a imbarcazioni o apparecchiature derivanti da uso improprio o da attrezzature non conformi dell’Utente. Restano impregiudicati i diritti inderogabili del consumatore.</p>
        </Sez>

        <Sez n="11" t="Sospensione e cessazione">
          <p>Il Gestore può sospendere o chiudere l’account in caso di violazione dei Termini, morosità persistente o uso fraudolento. L’Utente può richiedere la chiusura dell’account in qualsiasi momento; l’eventuale debito residuo resta dovuto.</p>
        </Sez>

        <Sez n="12" t="Diritto di recesso (consumatori)">
          <p>Il consumatore ha diritto di recedere dal contratto a distanza nei termini di legge. Poiché il Servizio comporta l’erogazione immediata su richiesta dell’Utente, l’avvio di una Sessione comporta l’accettazione dell’inizio della prestazione, con conseguente limitazione del recesso per i consumi già effettuati.</p>
        </Sez>

        <Sez n="13" t="Modifiche ai Termini">
          <p>Il Gestore può modificare i presenti Termini dandone informativa tramite l’app. L’uso continuato del Servizio dopo la pubblicazione delle modifiche ne comporta l’accettazione.</p>
        </Sez>

        <Sez n="14" t="Legge applicabile e foro">
          <p>I presenti Termini sono regolati dalla legge italiana. Per le controversie con i consumatori è competente il foro del luogo di residenza o domicilio del consumatore; negli altri casi il foro di [FORO COMPETENTE].</p>
        </Sez>

        <Sez n="15" t="Contatti">
          <p>Per assistenza o richieste: [EMAIL].</p>
        </Sez>
      </div>
    </Layout>
  );
}
