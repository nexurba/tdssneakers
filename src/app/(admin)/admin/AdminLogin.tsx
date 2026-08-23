"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signInAction } from "./auth-actions";
import Logo from "@/components/Logo";

export default function AdminLogin() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function submit() {
    setError("");
    startTransition(async () => {
      const res = await signInAction(password);
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
            <div className="bg-gray-900 rounded-2xl px-4 py-5 mb-4">
              <Logo width={200} priority className="h-auto w-[200px] mx-auto" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Admin Portal</h1>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="••••••••"
                autoFocus
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
            Accès réservé à l&apos;administrateur
          </p>
        </div>
      </div>
    </div>
  );
}
