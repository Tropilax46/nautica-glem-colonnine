import Layout from "@/components/Layout";

const Sez = ({ n, t, children }: { n: string; t: string; children: React.ReactNode }) => (
  <section className="space-y-1">
    <h2 className="font-semibold text-glem-700">{n}. {t}</h2>
    <div className="space-y-1 text-slate-600">{children}</div>
  </section>
);

export default function Page() {
  return (
    <Layout title="Privacy">
      <div className="card space-y-5 text-sm leading-relaxed">
        <div>
          <h1 className="text-lg font-bold text-glem-700">Informativa sulla Privacy</h1>
          <p className="text-xs text-slate-400">Ai sensi degli artt. 13-14 del Regolamento UE 2016/679 (GDPR) — Versione 1.0, giugno 2026</p>
        </div>

        <Sez n="1" t="Titolare del trattamento">
          <p>Titolare è [RAGIONE SOCIALE], P.IVA [P.IVA], sede in [SEDE LEGALE], email [EMAIL], PEC [PEC]. [Eventuale Responsabile della Protezione dei Dati (DPO): [CONTATTO DPO]].</p>
        </Sez>

        <Sez n="2" t="Dati personali trattati">
          <p>Trattiamo: dati di registrazione (nome, email, telefono, nome dell’imbarcazione); dati relativi all’uso del Servizio (sessioni, consumi di energia e acqua, importi e movimenti del Wallet); dati tecnici (log di accesso, identificativi di sessione). Non sono richiesti dati particolari ai sensi dell’art. 9 GDPR.</p>
        </Sez>

        <Sez n="3" t="Finalità e basi giuridiche">
          <p>(a) Erogazione del Servizio, gestione account, sessioni e credito — base: esecuzione del contratto (art. 6.1.b). (b) Adempimenti contabili e fiscali — obbligo legale (art. 6.1.c). (c) Sicurezza, prevenzione abusi e miglioramento del Servizio — legittimo interesse (art. 6.1.f). (d) Eventuali comunicazioni di servizio. Eventuale marketing solo previo consenso (art. 6.1.a).</p>
        </Sez>

        <Sez n="4" t="Modalità del trattamento">
          <p>I dati sono trattati con strumenti elettronici, adottando misure tecniche e organizzative adeguate a garantire sicurezza e riservatezza, e sono accessibili solo a personale autorizzato.</p>
        </Sez>

        <Sez n="5" t="Destinatari e responsabili esterni">
          <p>I dati possono essere trattati da fornitori che agiscono come responsabili del trattamento, tra cui i provider di infrastruttura e hosting (database e autenticazione, hosting dell’applicazione) ed eventuali fornitori di pagamento. L’elenco aggiornato dei responsabili è disponibile su richiesta a [EMAIL].</p>
        </Sez>

        <Sez n="6" t="Trasferimento dei dati">
          <p>I dati sono ospitati su infrastrutture con server situati nell’Unione Europea. Qualora un fornitore comporti trasferimenti verso Paesi terzi, questi avvengono nel rispetto del GDPR (decisioni di adeguatezza o clausole contrattuali standard).</p>
        </Sez>

        <Sez n="7" t="Periodo di conservazione">
          <p>I dati dell’account sono conservati per la durata del rapporto e successivamente per il tempo necessario ad adempiere obblighi di legge (es. fiscali, di norma 10 anni per i dati contabili). I dati tecnici/log sono conservati per il tempo strettamente necessario alle finalità di sicurezza.</p>
        </Sez>

        <Sez n="8" t="Diritti dell’interessato">
          <p>L’interessato può esercitare i diritti di accesso, rettifica, cancellazione, limitazione, opposizione e portabilità, oltre a revocare il consenso ove prestato, scrivendo a [EMAIL]. Ha inoltre diritto di proporre reclamo al Garante per la protezione dei dati personali (www.garanteprivacy.it).</p>
        </Sez>

        <Sez n="9" t="Cookie e tecnologie simili">
          <p>L’applicazione utilizza spazi di archiviazione locale del dispositivo (es. localStorage) per finalità tecniche: mantenere la sessione di accesso e ricordare le preferenze (es. modalità di visualizzazione). Non sono utilizzati cookie di profilazione di terze parti.</p>
        </Sez>

        <Sez n="10" t="Conferimento dei dati">
          <p>Il conferimento dei dati di registrazione e d’uso è necessario per fruire del Servizio: il mancato conferimento impedisce l’erogazione del Servizio stesso.</p>
        </Sez>

        <Sez n="11" t="Modifiche">
          <p>La presente informativa può essere aggiornata; le modifiche saranno comunicate tramite l’app con indicazione della nuova data di aggiornamento.</p>
        </Sez>
      </div>
    </Layout>
  );
}
