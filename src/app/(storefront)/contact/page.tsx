import type { Metadata } from "next";
import InfoPage, { Section } from "@/components/InfoPage";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contactez l'équipe TDSSNEAKERS.",
};

export default function ContactPage() {
  return (
    <InfoPage title="Contact" intro="On répond généralement sous 24 à 48 h.">
      <Section heading="Courriel">
        <ul className="space-y-1">
          <li>
            Questions générales :{" "}
            <a href="mailto:contact@tdssneakers.ca" className="text-primary hover:underline">
              contact@tdssneakers.ca
            </a>
          </li>
          <li>
            Commandes :{" "}
            <a href="mailto:commandes@tdssneakers.ca" className="text-primary hover:underline">
              commandes@tdssneakers.ca
            </a>
          </li>
          <li>
            Retours :{" "}
            <a href="mailto:retours@tdssneakers.ca" className="text-primary hover:underline">
              retours@tdssneakers.ca
            </a>
          </li>
        </ul>
      </Section>

      <Section heading="Réseaux sociaux">
        <p>
          Le plus rapide reste Instagram :{" "}
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            @tdssneakers
          </a>
        </p>
      </Section>

      <Section heading="Avant d'écrire">
        <p>
          Beaucoup de questions (tailles, délais, retours) sont déjà traitées dans
          notre FAQ — ça peut vous faire gagner du temps.
        </p>
      </Section>
    </InfoPage>
  );
}
