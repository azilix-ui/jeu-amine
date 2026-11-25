"use client"
// Les paramètres du compte : mot de passe, autres appareils, déconnexion, et suppression du compte (invités seulement).
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ReactNode, useState } from "react"
import toast from "react-hot-toast"
import axios_instance from "@/config/axios"
import { authClient } from "@/auth/auth-client"
import { useUserStore } from "@/store/store"
import { lien } from "@/lib/utils"

const DeleteUserDialog = ({ children }: { children: ReactNode }) => {
	const [open, setOpen] = useState(false)
	const [vue, setVue] = useState<"menu" | "mdp" | "suppr">("menu")
	const [actuel, setActuel] = useState("")
	const [nouveau, setNouveau] = useState("")
	const clearUser = useUserStore((s) => s.clearUser)
	const famille = useUserStore((s) => s.famille)
	const aMdp = useUserStore((s) => s.aMotDePasse)

	const fermer = (o: boolean) => { setOpen(o); if (!o) { setVue("menu"); setActuel(""); setNouveau("") } }
	const appel = (p: Promise<{ error: { message: string } | null }>, ok: string, apres?: () => void) =>
		p.then((r) => { if (r.error) toast.error(r.error.message); else { toast.success(ok); apres?.() } })

	const ligne = "min-h-12 w-full rounded-xl px-4 text-left font-semibold hover:bg-gray-100 cursor-pointer"
	const champ = "min-h-12 w-full rounded-xl border border-gray-300 px-4 text-base outline-none focus:border-gray-600"

	return (
		<Dialog open={open} onOpenChange={fermer}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="max-w-sm">
				<DialogTitle>Paramètres</DialogTitle>
				<DialogDescription className="sr-only">Les réglages de ton compte</DialogDescription>
				{vue === "menu" && (
					<div className="flex flex-col gap-1">
						<button type="button" className={ligne} onClick={() => setVue("mdp")}>🔑 {aMdp ? "Changer mon mot de passe" : "Choisir un mot de passe"}</button>
						<button type="button" className={ligne} onClick={() => appel(authClient.revokeOtherSessions(), "Les autres appareils sont déconnectés")}>📱 Déconnecter mes autres appareils</button>
						<button type="button" className={ligne} onClick={() => appel(authClient.signOut(), "À bientôt !", () => { clearUser(); window.location.href = lien("/login/") })}>🚪 Me déconnecter</button>
						{!famille && <button type="button" className={ligne + " text-red-600"} onClick={() => setVue("suppr")}>🗑️ Supprimer mon compte</button>}
					</div>
				)}
				{vue === "mdp" && (
					<form className="flex flex-col gap-3" onSubmit={(e) => {
						e.preventDefault()
						axios_instance.post("/auth/motdepasse", { actuel, nouveau }).then(({ data }) => {
							if (!data.success) return toast.error(data.message)
							toast.success("Mot de passe changé"); fermer(false)
						})
					}}>
						{aMdp && <input type="password" className={champ} placeholder="Mot de passe actuel" autoComplete="current-password" value={actuel} onChange={(e) => setActuel(e.target.value)} />}
						<input type="password" className={champ} placeholder="Nouveau (10 caractères au moins)" autoComplete="new-password" minLength={10} required value={nouveau} onChange={(e) => setNouveau(e.target.value)} />
						<button type="submit" className="min-h-12 rounded-xl bg-gray-900 font-bold text-white cursor-pointer">Enregistrer</button>
						<button type="button" className="min-h-11 text-gray-500 cursor-pointer" onClick={() => setVue("menu")}>Retour</button>
					</form>
				)}
				{vue === "suppr" && (
					<form className="flex flex-col gap-3" onSubmit={(e) => {
						e.preventDefault()
						appel(authClient.deleteUser(actuel), "Ton compte est supprimé", () => { clearUser(); window.location.href = lien("/login/?acc=deleted") })
					}}>
						<p className="text-sm text-gray-600">Tes publications, stories, commentaires et messages seront effacés pour de bon. On ne pourra pas revenir en arrière.</p>
						{aMdp && <input type="password" className={champ} placeholder="Ton mot de passe pour confirmer" autoComplete="current-password" required value={actuel} onChange={(e) => setActuel(e.target.value)} />}
						<button type="submit" className="min-h-12 rounded-xl bg-red-600 font-bold text-white cursor-pointer">Supprimer définitivement</button>
						<button type="button" className="min-h-11 text-gray-500 cursor-pointer" onClick={() => setVue("menu")}>Annuler</button>
					</form>
				)}
			</DialogContent>
		</Dialog>
	)
}

export default DeleteUserDialog
