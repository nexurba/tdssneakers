"use client";

import { useState, useTransition } from "react";
import { ReviewData } from "@/lib/data/reviews";
import { submitReviewAction } from "@/app/(storefront)/produit/[slug]/review-actions";

function Stars({ value, size = "w-4 h-4" }: { value: number; size?: string }) {
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          className={`${size} ${i <= value ? "text-amber-400" : "text-gray-300"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.966a1 1 0 00.95.69h4.169c.969 0 1.371 1.24.588 1.81l-3.374 2.451a1 1 0 00-.363 1.118l1.287 3.966c.3.921-.755 1.688-1.54 1.118l-3.373-2.45a1 1 0 00-1.176 0l-3.373 2.45c-.784.57-1.838-.197-1.539-1.118l1.287-3.966a1 1 0 00-.363-1.118L2.98 9.393c-.783-.57-.38-1.81.588-1.81h4.17a1 1 0 00.95-.69l1.286-3.966z" />
        </svg>
      ))}
    </div>
  );
}

export default function ProductReviews({
  productId,
  reviews,
  average,
}: {
  productId: number;
  reviews: ReviewData[];
  average: number;
}) {
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [author, setAuthor] = useState("");
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function submit() {
    setMsg(null);
    startTransition(async () => {
      const res = await submitReviewAction({ productId, author, rating, title, body });
      if (res.ok) {
        setMsg({ type: "success", text: "Merci ! Votre avis sera publié après modération." });
        setShowForm(false);
        setAuthor("");
        setTitle("");
        setBody("");
        setRating(5);
      } else {
        setMsg({ type: "error", text: res.error ?? "Erreur" });
      }
    });
  }

  return (
    <section className="mt-16 border-t pt-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-black text-gray-900">Avis clients</h2>
          {reviews.length > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <Stars value={Math.round(average)} />
              <span className="text-sm text-gray-500">
                {average} / 5 · {reviews.length} avis
              </span>
            </div>
          )}
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="text-sm font-semibold text-primary hover:text-primary-dark"
        >
          Écrire un avis
        </button>
      </div>

      {msg && (
        <p className={`text-sm mb-4 ${msg.type === "success" ? "text-green-600" : "text-red-500"}`}>
          {msg.text}
        </p>
      )}

      {showForm && (
        <div className="bg-gray-50 rounded-xl p-5 mb-6 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Note :</span>
            {[1, 2, 3, 4, 5].map((i) => (
              <button key={i} onClick={() => setRating(i)} type="button" aria-label={`${i} étoiles`}>
                <svg className={`w-6 h-6 ${i <= rating ? "text-amber-400" : "text-gray-300"}`} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.966a1 1 0 00.95.69h4.169c.969 0 1.371 1.24.588 1.81l-3.374 2.451a1 1 0 00-.363 1.118l1.287 3.966c.3.921-.755 1.688-1.54 1.118l-3.373-2.45a1 1 0 00-1.176 0l-3.373 2.45c-.784.57-1.838-.197-1.539-1.118l1.287-3.966a1 1 0 00-.363-1.118L2.98 9.393c-.783-.57-.38-1.81.588-1.81h4.17a1 1 0 00.95-.69l1.286-3.966z" />
                </svg>
              </button>
            ))}
          </div>
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Votre nom" className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre (optionnel)" className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Votre avis..." rows={3} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
          <button onClick={submit} disabled={isPending} className="bg-black text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50">
            {isPending ? "Envoi..." : "Publier l'avis"}
          </button>
        </div>
      )}

      {reviews.length === 0 ? (
        <p className="text-sm text-gray-500">Aucun avis pour le moment. Soyez le premier !</p>
      ) : (
        <div className="space-y-5">
          {reviews.map((r) => (
            <div key={r.id} className="border-b pb-5 last:border-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Stars value={r.rating} />
                  {r.title && <span className="text-sm font-semibold">{r.title}</span>}
                </div>
                <span className="text-xs text-gray-400">{r.createdAt}</span>
              </div>
              {r.body && <p className="text-sm text-gray-600 mt-2">{r.body}</p>}
              <p className="text-xs text-gray-400 mt-1">— {r.author}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
