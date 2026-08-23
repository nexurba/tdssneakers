import type { Metadata } from "next";
import InfoPage, { Section } from "@/components/InfoPage";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description: "Comment TDSSNEAKERS collecte et protège vos données personnelles.",
};

export default function ConfidentialitePage() {
  return (
    <InfoPage
      title="Politique de confidentialité"
      intro="Quelles données nous collectons, pourquoi, et comment les protéger."
    >
      <Section heading="Données collectées">
        <ul className="list-disc pl-5 space-y-1">
          <li>Nom, adresse courriel et adresse de livraison, pour traiter la commande</li>
          <li>Historique de commandes, pour le service client</li>
          <li>Données techniques anonymes (pages consultées), pour améliorer le site</li>
        </ul>
      </Section>

      <Section heading="Paiement">
        <p>
          Les paiements sont traités par <strong>Stripe</strong>. Aucune donnée de
          carte bancaire n&apos;est stockée sur nos serveurs.
        </p>
      </Section>

      <Section heading="Sous-traitants">
        <p>
          Nous utilisons des prestataires pour faire fonctionner la boutique :
          hébergement (Vercel), base de données (Neon), paiement (Stripe) et envoi
          de courriels transactionnels (Resend). Ils ne traitent vos données que
          pour ces finalités.
        </p>
      </Section>

      <Section heading="Conservation">
        <p>
          Les données de commande sont conservées le temps requis par nos
          obligations comptables, puis supprimées ou anonymisées.
        </p>
      </Section>

      <Section heading="Vos droits">
        <p>
          Vous pouvez demander l&apos;accès, la correction ou la suppression de vos
          données en écrivant à{" "}
          <a href="mailto:contact@tdssneakers.ca" className="text-primary hover:underline">
            contact@tdssneakers.ca
          </a>
          .
        </p>
      </Section>

      <Section heading="Témoins (cookies)">
        <p>
          Nous utilisons uniquement les témoins nécessaires au fonctionnement du
          site (panier, session administrateur). Aucun témoin publicitaire.
        </p>
      </Section>

      <p className="text-xs text-gray-400 pt-4">
        Ce texte est fourni à titre indicatif et devrait être revu par un
        conseiller juridique avant une mise en production commerciale.
      </p>
    </InfoPage>
  );
}
