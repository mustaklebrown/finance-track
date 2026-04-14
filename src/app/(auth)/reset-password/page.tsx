"use client";

import { useState, Suspense } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function ResetPasswordForm() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [message, setMessage] = useState("");
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!token) {
            setStatus("error");
            setMessage("Jeton de réinitialisation manquant ou invalide.");
            return;
        }

        if (password !== confirmPassword) {
            setStatus("error");
            setMessage("Les mots de passe ne correspondent pas.");
            return;
        }

        setStatus("loading");
        setMessage("");

        const { error } = await authClient.resetPassword({
            newPassword: password,
            token: token,
        });

        if (error) {
            setStatus("error");
            setMessage(error.message || "Une erreur est survenue lors de la réinitialisation.");
        } else {
            setStatus("success");
            setMessage("Votre mot de passe a été réinitialisé avec succès !");
            setTimeout(() => {
                router.push("/login");
            }, 3000);
        }
    };

    if (!token && status !== "success") {
        return (
            <div className="text-center space-y-4">
                <div className="text-rose-600 text-sm bg-rose-50 dark:bg-rose-950/30 p-4 rounded-xl border border-rose-100 dark:border-rose-900/50">
                    Lien de réinitialisation invalide ou expiré.
                </div>
                <Link href="/forgot-password" className="text-sm font-semibold hover:underline">
                    Demander un nouveau lien
                </Link>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md space-y-8 p-10 bg-white dark:bg-zinc-900 rounded-3xl shadow-[0_20px_50px_rgba(8,112,184,0.07)] border border-zinc-100 dark:border-zinc-800 transition-all">
            <div className="text-center">
                <div className="mx-auto w-12 h-12 bg-black dark:bg-white rounded-xl flex items-center justify-center mb-4 shadow-lg">
                    <span className="text-white dark:text-black font-bold text-xl">F</span>
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">Nouveau mot de passe</h1>
                <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
                    Définissez votre nouveau mot de passe sécurisé
                </p>
            </div>

            {status === "success" ? (
                <div className="space-y-6">
                    <div className="text-emerald-600 text-sm bg-emerald-50 dark:bg-emerald-950/30 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/50 flex items-center gap-3">
                        <span className="block w-2 h-2 bg-emerald-500 rounded-full shrink-0" />
                        {message}
                    </div>
                    <p className="text-center text-sm text-zinc-500">Redirection vers la connexion...</p>
                </div>
            ) : (
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-2">Nouveau mot de passe</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="appearance-none block w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all sm:text-sm text-zinc-900 dark:text-white"
                                placeholder="••••••••"
                                required
                                minLength={8}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-2">Confirmer le mot de passe</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="appearance-none block w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all sm:text-sm text-zinc-900 dark:text-white"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    {status === "error" && (
                        <div className="text-rose-600 text-sm bg-rose-50 dark:bg-rose-950/30 p-3 rounded-xl border border-rose-100 dark:border-rose-900/50 flex items-center gap-2">
                            <span className="block w-1.5 h-1.5 bg-rose-500 rounded-full shrink-0" />
                            {message}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={status === "loading"}
                        className="group relative w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-black hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 focus:outline-none transition-all shadow-md active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {status === "loading" ? "Mise à jour..." : "Réinitialiser le mot de passe"}
                    </button>
                </form>
            )}
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black px-4 font-sans">
            <Suspense fallback={<div>Chargement...</div>}>
                <ResetPasswordForm />
            </Suspense>
        </div>
    );
}
