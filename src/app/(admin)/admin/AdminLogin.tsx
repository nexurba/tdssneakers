"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signInAction } from "./auth-actions";

export default function AdminLogin() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function submit() {
    setError("");
    startTransition(async () => {
      const res = await signInAction(email, password);
      if (res.ok) {
        router.refresh();
      } else {
        setError(res.error ?? "Erreur de connexion");
      }
    });
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-black text-sm">TDS</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">Admin Portal</h1>
            <p className="text-sm text-gray-500 mt-1">TDSSNEAKERS</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="admin@tdssneakers.ca"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="••••••••"
              />
            </div>
            {error && <p className="text-red-500 text-xs font-medium">{error}</p>}
            <button
              type="button"
              onClick={submit}
              disabled={isPending}
              className="w-full bg-gray-900 text-white py-3 rounded-lg font-semibold text-sm hover:bg-gray-800 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isPending ? "Connexion..." : "Se connecter"}
            </button>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Authentification sécurisée via Supabase
          </p>
        </div>
      </div>
    </div>
  );
}
