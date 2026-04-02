"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function RegisterPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const { data, error } = await authClient.signUp.email({
            email,
            password,
            name,
            callbackURL: "/",
        });

        if (error) {
            setError(error.message || "Une erreur est survenue lors de l'inscription");
            setLoading(false);
        } else {
            // Because of our custom database hook, the store is automatically created
            router.push("/");
            router.refresh();
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black px-4 font-sans">
            <div className="w-full max-w-md space-y-8 p-10 bg-white dark:bg-zinc-900 rounded-3xl shadow-[0_20px_50px_rgba(8,112,184,0.07)] border border-zinc-100 dark:border-zinc-800 transition-all">
                <div className="text-center">
                    <div className="mx-auto w-12 h-12 bg-black dark:bg-white rounded-xl flex items-center justify-center mb-4 shadow-lg">
                        <span className="text-white dark:text-black font-bold text-xl">F</span>
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">Créer un compte</h1>
                    <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
                        Votre environnement (Store) sera généré automatiquement
                    </p>
                </div>

                <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-2">Nom Complet</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="appearance-none block w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all sm:text-sm text-zinc-900 dark:text-white"
                                placeholder="Jean Dupont"
                                required
                            />
                        </div>
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
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-2">Mot de passe</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="appearance-none block w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all sm:text-sm text-zinc-900 dark:text-white"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="text-rose-600 text-sm bg-rose-50 dark:bg-rose-950/30 p-3 rounded-xl border border-rose-100 dark:border-rose-900/50 flex items-center gap-2">
                            <span className="block w-1.5 h-1.5 bg-rose-500 rounded-full shrink-0" />
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="group relative w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-black hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 focus:outline-none transition-all shadow-md active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
                        Ouvrir ma boutique
                    </button>
                    
                    <div className="text-center text-sm pt-4 border-t border-zinc-100 dark:border-zinc-800">
                        <span className="text-zinc-500 dark:text-zinc-400">Déjà propriétaire ? </span>
                        <Link href="/login" className="font-semibold text-black dark:text-white hover:underline decoration-zinc-300 underline-offset-4">
                            Se connecter
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
