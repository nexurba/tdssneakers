import type { Metadata } from "next";
import InfoPage, { Section } from "@/components/InfoPage";

export const metadata: Metadata = {
  title: "À propos",
  description:
    "TDSSNEAKERS — ta destination sneakers et streetwear au Canada. Notre histoire et nos engagements.",
};

export default function AProposPage() {
  return (
    <InfoPage
      title="À propos"
      intro="Sneakers. Style. Attitude."
    >
      <Section heading="Notre histoire">
        <p>
          TDSSNEAKERS est née d&apos;une passion simple : rendre accessibles au Canada les
          sneakers et le streetwear qu&apos;on aime porter au quotidien. Nous
          sélectionnons chaque modèle à la main, en privilégiant les pièces qui
          traversent les saisons plutôt que les tendances éphémères.
        </p>
      </Section>

      <Section heading="Authenticité garantie">
        <p>
          Chaque paire et chaque vêtement est vérifié avant expédition. Nous ne
          vendons que des produits authentiques : si un article ne passe pas notre
          contrôle, il ne part pas.
        </p>
      </Section>

      <Section heading="Nos engagements">
        <ul className="list-disc pl-5 space-y-1">
          <li>Expédition rapide partout au Canada</li>
          <li>Retours faciles sous 14 jours</li>
          <li>Paiement sécurisé</li>
          <li>Service client réactif et à l&apos;écoute</li>
        </ul>
      </Section>

      <Section heading="Une question ?">
        <p>
          Écrivez-nous à{" "}
          <a href="mailto:contact@tdssneakers.ca" className="text-primary hover:underline">
            contact@tdssneakers.ca
          </a>{" "}
          ou passez par notre page contact.
        </p>
      </Section>
    </InfoPage>
  );
}
