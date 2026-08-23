import type { Metadata } from "next";
import Link from "next/link";
import InfoPage, { Section } from "@/components/InfoPage";
import { getSizeOptions } from "@/lib/catalog/taxonomy";
import { SHOE_OFFSET } from "@/lib/catalog/size-conversion";

export const metadata: Metadata = {
  title: "FAQ & guide des tailles",
  description:
    "Questions fréquentes et guide des tailles pour chaussures et vêtements (homme, femme, enfant).",
};

function SizeRow({ label, sizes }: { label: string; sizes: string[] }) {
  return (
    <div className="flex flex-wrap items-baseline gap-2 py-1.5 border-b last:border-0">
      <span className="text-xs font-semibold text-gray-900 w-28 shrink-0">{label}</span>
      <span className="text-xs text-gray-600 font-mono">{sizes.join(" · ")}</span>
    </div>
  );
}

export default function FaqPage() {
  return (
    <InfoPage
      title="FAQ & guide des tailles"
      intro="Les réponses aux questions qu'on nous pose le plus souvent."
    >
      <Section heading="Guide des tailles — chaussures (US)">
        <SizeRow label="Homme" sizes={getSizeOptions("sneakers", "homme")} />
        <SizeRow label="Femme" sizes={getSizeOptions("sneakers", "femme")} />
        <SizeRow label="Enfant" sizes={getSizeOptions("sneakers", "enfant")} />
        <SizeRow label="Unisexe" sizes={getSizeOptions("sneakers", "unisex")} />
        <p className="text-gray-500 mt-2">
          Les modèles unisexes sont listés sur l&apos;échelle Homme. Pour convertir en
          taille Femme, ajoutez {SHOE_OFFSET} (une Homme 8 = une Femme{" "}
          {8 + SHOE_OFFSET}). Sur la fiche produit, vous pouvez basculer entre les
          deux échelles.
        </p>
      </Section>

      <Section heading="Guide des tailles — vêtements">
        <SizeRow label="Homme" sizes={getSizeOptions("vetements", "homme")} />
        <SizeRow label="Femme" sizes={getSizeOptions("vetements", "femme")} />
        <SizeRow label="Enfant" sizes={getSizeOptions("vetements", "enfant")} />
        <p className="text-gray-500 mt-2">
          Les accessoires sont proposés en taille unique.
        </p>
      </Section>

      <Section heading="Comment savoir si un article est en stock ?">
        <p>
          Seuls les articles disponibles sont affichés en boutique. Sur la fiche
          produit, les tailles en rupture apparaissent barrées et ne peuvent pas
          être ajoutées au panier.
        </p>
      </Section>

      <Section heading="Quels moyens de paiement acceptez-vous ?">
        <p>
          Cartes Visa, Mastercard et American Express, ainsi qu&apos;Apple Pay et
          Google Pay, via Stripe. Aucune donnée de carte ne transite par nos
          serveurs.
        </p>
      </Section>

      <Section heading="Livrez-vous à l'international ?">
        <p>
          Pour le moment, nous expédions uniquement au Canada. Voir la page{" "}
          <Link href="/livraison" className="text-primary hover:underline">
            livraison &amp; retours
          </Link>
          .
        </p>
      </Section>

      <Section heading="Vos produits sont-ils authentiques ?">
        <p>
          Oui. Chaque article est vérifié avant expédition et nous ne travaillons
          qu&apos;avec des sources fiables.
        </p>
      </Section>

      <Section heading="Comment utiliser un code promo ?">
        <p>
          Entrez-le dans le champ « Code promo » à l&apos;étape du paiement : la
          réduction s&apos;applique immédiatement au récapitulatif. Voir les{" "}
          <Link href="/promotions" className="text-primary hover:underline">
            promotions en cours
          </Link>
          .
        </p>
      </Section>
    </InfoPage>
  );
}
