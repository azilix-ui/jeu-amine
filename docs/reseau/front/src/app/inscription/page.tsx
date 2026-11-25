"use client"
// Créer son compte avec un lien d'invitation : /reseau/inscription/?code=…
import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import toast from "react-hot-toast"
import { authClient } from "@/auth/auth-client"
import { Fleur } from "@/components/ui/instagram-logo"
import { lien } from "@/lib/utils"

type Champs = { name: string; username: string; password: string; confirm: string; accord: boolean }

function Inscription() {
	const code = useSearchParams().get("code") || ""
	const [etat, setEtat] = useState<"verif" | "ok" | "non">("verif")
	const [pour, setPour] = useState("")
	const [loading, setLoading] = useState(false)
	const { register, handleSubmit, watch, formState: { errors } } = useForm<Champs>()

	useEffect(() => {
		if (!code) return setEtat("non")
		authClient.invitation(code).then((r) => { setEtat(r.success || r.ouvert ? "ok" : "non"); setPour(r.nom || "") }).catch(() => setEtat("non"))
	}, [code])

	const envoyer = async (d: Champs) => {
		setLoading(true)
		const r = await authClient.signUp({ code, username: d.username.trim().toLowerCase(), name: d.name.trim(), password: d.password })
		setLoading(false)
		if (r.error) return toast.error(r.error.message)
		toast.success("Bienvenue sur Mechmoum !")
		window.location.href = lien("/")
	}
	const champ = "min-h-12 rounded-xl border border-gray-300 px-4 text-base font-normal outline-none focus:border-gray-600"
	const libelle = "flex flex-col gap-1 text-sm font-bold text-gray-700"
	const err = (m?: string) => m && <span className="text-red-600 text-xs font-normal">{m}</span>

	return (
		<div className="mc-fond-entree flex min-h-dvh items-center justify-center p-4">
			<div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 shadow-xl">
				<div className="flex flex-col items-center text-center mb-6">
					<Fleur taille={64} />
					<h1 className="mc-logo text-4xl mt-2">Mechmoum</h1>
					<p className="text-gray-500">{pour ? `Invitation pour ${pour}` : "Créer ton compte"}</p>
				</div>
				{etat === "verif" && <p className="text-center text-gray-500">Vérification de l&apos;invitation…</p>}
				{etat === "non" && (
					<div className="text-center">
						<p className="text-lg font-bold">Ce lien d&apos;invitation n&apos;est pas (ou plus) valable.</p>
						<p className="mt-2 text-gray-500">Demande un nouveau lien à la famille Missaoui.</p>
						<a href={lien("/login/")} className="mt-6 inline-flex min-h-12 items-center rounded-xl bg-gray-900 px-6 font-bold text-white">J&apos;ai déjà un compte</a>
					</div>
				)}
				{etat === "ok" && (
					<form className="flex flex-col gap-3" onSubmit={handleSubmit(envoyer)}>
						<label className={libelle}>Ton prénom
							<input className={champ} autoComplete="given-name" {...register("name", { required: "Écris ton prénom", minLength: { value: 2, message: "Trop court" } })} />{err(errors.name?.message)}
						</label>
						<label className={libelle}>Nom d&apos;utilisateur
							<input className={champ} autoCapitalize="none" spellCheck={false} autoComplete="username" placeholder="ex. : nour.b"
								{...register("username", { required: "Choisis un nom d'utilisateur", pattern: { value: /^[a-zA-Z][a-zA-Z0-9._]{2,29}$/, message: "3 à 30 caractères : lettres, chiffres, point ou tiret bas" } })} />{err(errors.username?.message)}
						</label>
						<label className={libelle}>Mot de passe
							<input type="password" className={champ} autoComplete="new-password" {...register("password", { required: "Choisis un mot de passe", minLength: { value: 10, message: "10 caractères au moins" } })} />{err(errors.password?.message)}
						</label>
						<label className={libelle}>Encore une fois
							<input type="password" className={champ} autoComplete="new-password" {...register("confirm", { validate: (v) => v === watch("password") || "Les deux mots de passe ne sont pas pareils" })} />{err(errors.confirm?.message)}
						</label>
						<label className="flex items-start gap-3 text-sm text-gray-600 min-h-12">
							<input type="checkbox" className="mt-1 h-5 w-5" {...register("accord", { required: "Coche la case pour continuer" })} />
							<span>Je serai gentil(le) : pas de moquerie, pas de photo de quelqu&apos;un sans son accord. Les enfants de la famille sont ici.</span>
						</label>{err(errors.accord?.message)}
						<button type="submit" disabled={loading} className="mt-2 min-h-12 rounded-xl mc-degrade text-white font-extrabold cursor-pointer disabled:opacity-60">
							{loading ? "Création…" : "Créer mon compte"}
						</button>
					</form>
				)}
			</div>
		</div>
	)
}

export default function Page() {
	return (
		<Suspense fallback={null}>
			<Inscription />
		</Suspense>
	)
}
