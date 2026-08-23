import type { Metadata } from "next";
import InfoPage, { Section } from "@/components/InfoPage";
import { storeSettings } from "@/lib/commerce/settings";

export const metadata: Metadata = {
  title: "Livraison & retours",
  description:
    "Délais et frais de livraison au Canada, et notre politique de retours sous 14 jours.",
};

export default function LivraisonPage() {
  return (
    <InfoPage
      title="Livraison & retours"
      intro="Tout ce qu'il faut savoir sur l'expédition et les retours."
    >
      <Section heading="Frais de livraison">
        <p>
          Livraison à tarif fixe de <strong>{storeSettings.shippingFee} $ CAD</strong>{" "}
          partout au Canada, et <strong>gratuite</strong> dès{" "}
          <strong>{storeSettings.freeShippingThreshold} $ CAD</strong> d&apos;achat
          (avant taxes).
        </p>
      </Section>

      <Section heading="Délais">
        <ul className="list-disc pl-5 space-y-1">
          <li>Préparation de la commande : 1 à 2 jours ouvrables</li>
          <li>Grands centres : 2 à 5 jours ouvrables</li>
          <li>Régions éloignées : 5 à 10 jours ouvrables</li>
        </ul>
        <p className="text-gray-500">
          Un numéro de suivi vous est envoyé par courriel dès l&apos;expédition.
        </p>
      </Section>

      <Section heading="Retours sous 14 jours">
        <p>
          Vous avez <strong>14 jours</strong> après réception pour demander un
          retour. L&apos;article doit être non porté, dans son état d&apos;origine et
          avec son emballage.
        </p>
        <p>
          Pour lancer un retour, écrivez-nous à{" "}
          <a href="mailto:retours@tdssneakers.ca" className="text-primary hover:underline">
            retours@tdssneakers.ca
          </a>{" "}
          en indiquant votre numéro de commande.
        </p>
      </Section>

      <Section heading="Remboursements">
        <p>
          Une fois le retour reçu et vérifié, le remboursement est émis sur le
          moyen de paiement d&apos;origine sous 5 à 10 jours ouvrables. Les frais de
          livraison initiaux ne sont pas remboursés, sauf en cas d&apos;erreur de
          notre part ou d&apos;article défectueux.
        </p>
      </Section>

      <Section heading="Taxes">
        <p>
          Les taxes applicables ({(storeSettings.taxRate * 100).toFixed(3)} % — TPS
          et TVQ) sont calculées automatiquement au moment du paiement.
        </p>
      </Section>
    </InfoPage>
  );
}
