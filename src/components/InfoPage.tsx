import Link from "next/link";

/** Shared shell for informational/legal pages. */
export default function InfoPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 min-h-[60vh]">
      <nav className="text-sm text-gray-500 mb-5 flex items-center gap-2">
        <Link href="/" className="hover:text-primary">Accueil</Link>
        <span>/</span>
        <span className="text-gray-900">{title}</span>
      </nav>

      <h1 className="text-3xl font-black text-gray-900">{title}</h1>
      {intro && <p className="text-gray-600 mt-2">{intro}</p>}

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-gray-700">
        {children}
      </div>

      <div className="mt-12 pt-6 border-t">
        <Link
          href="/boutique"
          className="inline-flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-gray-800 transition-colors"
        >
          Voir la boutique
        </Link>
      </div>
    </div>
  );
}

export function Section({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-lg font-bold text-gray-900 mb-2">{heading}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}
