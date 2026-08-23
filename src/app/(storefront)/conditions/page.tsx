import type { Metadata } from "next";
import InfoPage, { Section } from "@/components/InfoPage";

export const metadata: Metadata = {
  title: "Conditions générales",
  description: "Conditions générales de vente de TDSSNEAKERS.",
};

export default function ConditionsPage() {
  return (
    <InfoPage
      title="Conditions générales"
      intro="Conditions générales de vente applicables aux commandes passées sur ce site."
    >
      <Section heading="1. Objet">
        <p>
          Les présentes conditions régissent les ventes conclues sur le site
          TDSSNEAKERS. Toute commande implique leur acceptation sans réserve.
        </p>
      </Section>

      <Section heading="2. Produits et prix">
        <p>
          Les prix sont indiqués en dollars canadiens (CAD), hors taxes. Les taxes
          applicables sont ajoutées au moment du paiement. Nous nous réservons le
          droit de modifier nos prix à tout moment ; le prix appliqué est celui en
          vigueur lors de la commande.
        </p>
      </Section>

      <Section heading="3. Commande et paiement">
        <p>
          La commande est confirmée après acceptation du paiement par notre
          prestataire (Stripe). En cas d&apos;indisponibilité d&apos;un article après
          commande, nous vous contactons et procédons au remboursement.
        </p>
      </Section>

      <Section heading="4. Livraison">
        <p>
          Les livraisons sont effectuées au Canada. Les délais annoncés sont
          indicatifs et ne sauraient engager notre responsabilité en cas de retard
          imputable au transporteur.
        </p>
      </Section>

      <Section heading="5. Droit de rétractation et retours">
        <p>
          Vous disposez de 14 jours après réception pour demander un retour, dans
          les conditions décrites sur notre page livraison &amp; retours.
        </p>
      </Section>

      <Section heading="6. Responsabilité">
        <p>
          Notre responsabilité est limitée au montant de la commande concernée.
          Nous ne saurions être tenus responsables des dommages indirects.
        </p>
      </Section>

      <Section heading="7. Droit applicable">
        <p>
          Les présentes conditions sont soumises au droit applicable dans la
          province de Québec, Canada.
        </p>
      </Section>

      <p className="text-xs text-gray-400 pt-4">
        Ce texte est fourni à titre indicatif et devrait être revu par un
        conseiller juridique avant une mise en production commerciale.
      </p>
    </InfoPage>
  );
}
