import Placeholder from "../../components/Placeholder";
export default function TariffeAcquisto() {
  return <Placeholder title="Tariffe d'acquisto"
    descr="Costi di approvvigionamento: quanto paghi tu il fornitore di energia e acqua."
    items={["Tariffa acquisto elettricità (€/kWh)", "Tariffa acquisto acqua (€/m³)", "Storico variazioni di prezzo"]} />;
}
