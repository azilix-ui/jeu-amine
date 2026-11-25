"use client"
// Entrer dans Mechmoum : d'un toucher pour la famille (déjà entrée sur le site), ou avec son nom d'utilisateur et son mot de passe (invités).
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import toast from "react-hot-toast"
import { authClient, lireSession } from "@/auth/auth-client"
import { useSessionExpiredStore } from "@/store/store"
import { Fleur } from "@/components/ui/instagram-logo"
import { lien } from "@/lib/utils"

interface LoginFormData {
	username: string
	password: string
}

export function LoginForm() {
	const [loading, setLoading] = useState(false)
	const [famille, setFamille] = useState<string | null>(null)
	const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>()

	useEffect(() => {
		lireSession().then((s) => setFamille(s?.famille?.nom || (s?.adminSite ? "Anis" : null)))
	}, [])

	const entre = async (fn: () => Promise<{ error: { message: string } | null }>) => {
		setLoading(true)
		const r = await fn()
		setLoading(false)
		if (r.error) return toast.error(r.error.message)
		useSessionExpiredStore.getState().setSessionExpired(false)
		window.location.href = lien("/")
	}

	return (
		<div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 shadow-xl">
			<div className="flex flex-col items-center text-center mb-6">
				<Fleur taille={72} />
				<h1 className="mc-logo text-5xl mt-3 text-gray-900">Mechmoum</h1>
				<p className="text-gray-500 mt-1">Le réseau privé de la famille Missaoui</p>
			</div>

			<button type="button" disabled={loading} onClick={() => (famille ? entre(authClient.signIn.famille) : (window.location.href = "/"))}
				className="w-full min-h-14 rounded-2xl mc-degrade text-white text-lg font-extrabold shadow-md cursor-pointer disabled:opacity-60">
				{famille ? `Entrer comme ${famille} 🌼` : "Je suis de la famille : « Qui es-tu ? »"}
			</button>
			{!famille && <p className="mt-2 text-center text-xs text-gray-500">Entre d&apos;abord sur le site de la famille avec ton prénom et ton code, puis reviens ici.</p>}

			<div className="my-6 flex items-center gap-3 text-xs font-bold uppercase text-gray-400">
				<span className="h-px flex-1 bg-gray-200" /> ou avec un compte invité <span className="h-px flex-1 bg-gray-200" />
			</div>

			<form className="flex flex-col gap-3" onSubmit={handleSubmit(({ username, password }) => entre(() => authClient.signIn.username({ username, password })))}>
				<label className="flex flex-col gap-1 text-sm font-bold text-gray-700">
					Nom d&apos;utilisateur
					<input autoComplete="username" autoCapitalize="none" spellCheck={false} className="min-h-12 rounded-xl border border-gray-300 px-4 text-base font-normal outline-none focus:border-gray-600"
						{...register("username", { required: "Écris ton nom d'utilisateur" })} />
					{errors.username && <span className="text-red-600 text-xs font-normal">{errors.username.message}</span>}
				</label>
				<label className="flex flex-col gap-1 text-sm font-bold text-gray-700">
					Mot de passe
					<input type="password" autoComplete="current-password" className="min-h-12 rounded-xl border border-gray-300 px-4 text-base font-normal outline-none focus:border-gray-600"
						{...register("password", { required: "Écris ton mot de passe" })} />
					{errors.password && <span className="text-red-600 text-xs font-normal">{errors.password.message}</span>}
				</label>
				<button type="submit" disabled={loading} className="mt-2 min-h-12 rounded-xl bg-gray-900 text-white font-bold cursor-pointer disabled:opacity-60">
					{loading ? "Connexion…" : "Se connecter"}
				</button>
			</form>
			<p className="mt-6 text-center text-xs text-gray-500">
				Pas de compte ? Mechmoum est privé : il faut un lien d&apos;invitation de la famille.<br />Mot de passe oublié ? Demande à Anis.
			</p>
		</div>
	)
}
