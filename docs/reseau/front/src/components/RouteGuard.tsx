"use client"
// Mechmoum : qui est connecté ? Le serveur le dit (cookie de session HttpOnly : aucun script ne le voit).
// Si personne ne l'est mais que la famille est déjà entrée sur le site (« Qui es-tu ? » + code), on entre tout seul.
import { authClient, lireSession } from "@/auth/auth-client"
import { useUserStore } from "@/store/store"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

const publiques = ["/login", "/inscription"]

export default function RouteGuard({ children }: { children: React.ReactNode }) {
	const pathname = usePathname() || "/"
	const router = useRouter()
	const [pret, setPret] = useState(false)
	const setUser = useUserStore((state) => state.setUser)
	const clearUser = useUserStore((state) => state.clearUser)

	useEffect(() => {
		let fini = false
		const publique = publiques.some((r) => pathname.startsWith(r))
		;(async () => {
			let s = await lireSession()
			if (s && !s.user && (s.famille || s.adminSite) && !publique) {
				const r = await authClient.signIn.famille()
				if (!r.error) s = await lireSession()
			}
			if (fini) return
			if (s?.user) {
				setUser({ ...s.user, followersCount: s.user.followersCount, followingCount: s.user.followingCount })
				if (publique) router.replace("/")
				else setPret(true)
			} else {
				clearUser()
				if (!publique) router.replace("/login/")
				else setPret(true)
			}
		})()
		return () => {
			fini = true
		}
	}, [pathname, router, setUser, clearUser])

	if (!pret)
		return (
			<div className="flex h-dvh items-center justify-center">
				<div className="mc-chargement" aria-label="Chargement">🌼</div>
			</div>
		)
	return <>{children}</>
}
