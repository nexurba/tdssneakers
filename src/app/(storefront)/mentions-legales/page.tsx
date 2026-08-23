import type { Metadata } from "next";
import InfoPage, { Section } from "@/components/InfoPage";

export const metadata: Metadata = {
  title: "Mentions légales",
  description: "Mentions légales du site TDSSNEAKERS.",
};

export default function MentionsLegalesPage() {
  return (
    <InfoPage title="Mentions légales">
      <Section heading="Éditeur du site">
        <p>
          TDSSNEAKERS<br />
          Québec, Canada<br />
          <a href="mailto:contact@tdssneakers.ca" className="text-primary hover:underline">
            contact@tdssneakers.ca
          </a>
        </p>
      </Section>

      <Section heading="Hébergement">
        <p>
          Le site est hébergé par Vercel Inc. La base de données est hébergée par
          Neon.
        </p>
      </Section>

      <Section heading="Propriété intellectuelle">
        <p>
          Le logo et les contenus originaux de ce site sont la propriété de
          TDSSNEAKERS. Les marques et modèles des produits vendus (Nike, Jordan,
          adidas, New Balance, etc.) demeurent la propriété de leurs détenteurs
          respectifs ; leur mention est purement descriptive.
        </p>
      </Section>

      <Section heading="Photographies">
        <p>
          Certaines images d&apos;illustration proviennent de banques d&apos;images
          libres de droits.
        </p>
      </Section>

      <p className="text-xs text-gray-400 pt-4">
        Ce texte est fourni à titre indicatif et devrait être complété avec vos
        informations légales réelles (dénomination, numéro d&apos;entreprise) avant
        une mise en production commerciale.
      </p>
    </InfoPage>
  );
}
