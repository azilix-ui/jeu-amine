// Mechmoum : remplace « better-auth » du projet d'origine. Les comptes vivent sur le serveur PHP du site :
// on entre avec sa session de la famille (« Qui es-tu ? » + code secret) ou avec son nom d'utilisateur et son mot de passe.
// Pas de connexion Google ou GitHub, pas d'e-mail : un compte se crée avec un lien d'invitation d'Anis.
import axios_instance from "@/config/axios"
import { useEffect, useState } from "react"

type Rep = { error: { message: string } | null; data?: any }
const rep = (r: any): Rep => (r.data?.success ? { error: null, data: r.data } : { error: { message: r.data?.message || "Erreur du serveur" } })

export type Session = { user: any; famille: { nom: string; role: string } | null; adminSite: boolean; prive: boolean }

export async function lireSession(): Promise<Session | null> {
	try {
		const r = await axios_instance.get("/auth/session")
		return r.data?.success ? r.data : null
	} catch {
		return null
	}
}

export const authClient = {
	signIn: {
		famille: async () => rep(await axios_instance.post("/auth/famille")),
		username: async ({ username, password }: { username: string; password: string }) =>
			rep(await axios_instance.post("/auth/connexion", { identifiant: username, motdepasse: password })),
	},
	signUp: async (d: { code: string; username: string; name: string; password: string }) =>
		rep(await axios_instance.post("/auth/inscription", { code: d.code, username: d.username, name: d.name, motdepasse: d.password })),
	signOut: async () => rep(await axios_instance.post("/auth/deconnexion")),
	deleteUser: async (password: string) => rep(await axios_instance.post("/auth/supprimer", { motdepasse: password })),
	revokeOtherSessions: async () => rep(await axios_instance.post("/auth/autres-sessions")),
	invitation: async (code: string) => (await axios_instance.get("/auth/invitation", { params: { code } })).data,
	useSession: () => {
		const [s, setS] = useState<{ data: Session | null; isPending: boolean }>({ data: null, isPending: true })
		useEffect(() => {
			lireSession().then((d) => setS({ data: d, isPending: false }))
		}, [])
		return s
	},
}
