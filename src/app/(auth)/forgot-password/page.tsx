"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [message, setMessage] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("loading");
        setMessage("");

        const { error } = await authClient.requestPasswordReset({
            email,
            redirectTo: "/reset-password",
        });

        if (error) {
            setStatus("error");
            setMessage(error.message || "Une erreur est survenue");
        } else {
            setStatus("success");
            setMessage("Un email de réinitialisation vous a été envoyé si le compte existe.");
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black px-4 font-sans">
            <div className="w-full max-w-md space-y-8 p-10 bg-white dark:bg-zinc-900 rounded-3xl shadow-[0_20px_50px_rgba(8,112,184,0.07)] border border-zinc-100 dark:border-zinc-800 transition-all">
                <div className="text-center">
                    <div className="mx-auto w-12 h-12 bg-black dark:bg-white rounded-xl flex items-center justify-center mb-4 shadow-lg">
                        <span className="text-white dark:text-black font-bold text-xl">F</span>
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">Récupération</h1>
                    <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
                        Entrez votre email pour recevoir un lien de réinitialisation
                    </p>
                </div>

                {status === "success" ? (
                    <div className="space-y-6">
                        <div className="text-emerald-600 text-sm bg-emerald-50 dark:bg-emerald-950/30 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/50 flex items-center gap-3">
                            <span className="block w-2 h-2 bg-emerald-500 rounded-full shrink-0" />
                            {message}
                        </div>
                        <Link
                            href="/login"
                            className="block w-full text-center py-3 px-4 border border-zinc-200 dark:border-zinc-800 text-sm font-bold rounded-xl text-zinc-900 dark:text-white bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
                        >
                            Retour à la connexion
                        </Link>
                    </div>
                ) : (
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-2">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="appearance-none block w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all sm:text-sm text-zinc-900 dark:text-white"
                                placeholder="vous@exemple.com"
                                required
                            />
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
                            {status === "loading" ? "Envoi..." : "Envoyer le lien"}
                        </button>

                        <div className="text-center text-sm">
                            <Link href="/login" className="font-semibold text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors">
                                Se souvenir du mot de passe ? Connexion
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
