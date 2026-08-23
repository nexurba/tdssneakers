import type { Metadata } from "next";
import InfoPage, { Section } from "@/components/InfoPage";

export const metadata: Metadata = {
  title: "Suivi de commande",
  description: "Suivez l'état de votre commande TDSSNEAKERS.",
};

export default function SuiviCommandePage() {
  return (
    <InfoPage
      title="Suivi de commande"
      intro="Retrouvez où en est votre commande."
    >
      <Section heading="Par courriel">
        <p>
          À la confirmation de votre commande, vous recevez un courriel contenant
          votre <strong>numéro de commande</strong> (au format{" "}
          <span className="font-mono">TDS-XXXXX</span>). Dès l&apos;expédition, un
          second courriel vous transmet le numéro de suivi du transporteur.
        </p>
      </Section>

      <Section heading="Les statuts">
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>En attente</strong> — paiement reçu, commande à traiter</li>
          <li><strong>En cours</strong> — commande en préparation</li>
          <li><strong>Expédiée</strong> — colis remis au transporteur</li>
          <li><strong>Livrée</strong> — colis livré</li>
          <li><strong>Annulée</strong> — commande annulée ou remboursée</li>
        </ul>
      </Section>

      <Section heading="Besoin d'aide ?">
        <p>
          Écrivez-nous à{" "}
          <a href="mailto:commandes@tdssneakers.ca" className="text-primary hover:underline">
            commandes@tdssneakers.ca
          </a>{" "}
          avec votre numéro de commande et nous vérifions pour vous.
        </p>
      </Section>
    </InfoPage>
  );
}
