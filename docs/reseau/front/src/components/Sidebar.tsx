"use client"
// La navigation de Mechmoum. PC : la colonne à gauche (icônes seules sur iPad, avec les noms sur grand écran).
// Téléphone : une barre en haut (logo, nouveautés, messages) et une barre en bas (accueil, recherche, publier, reels, profil).
import React from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import toast from "react-hot-toast"
import { LogOut, Compass, Heart, Home, MessageCircleMore, Search, Clapperboard, Shield, ArrowLeftToLine, Youtube } from "lucide-react"
import { useUserStore } from "@/store/store"
import InstagramLogo from "@/components/ui/instagram-logo"
import SidebarItem from "@/components/ui/sidebar-item"
import CreatePostDialog from "@/components/ui/create-post-dialog"
import { useLoadingStore } from "@/components/ui/loading-bar"
import { authClient } from "@/auth/auth-client"
import { profil } from "@/lib/utils"

export type SidebarItemType = "Accueil" | "Rechercher" | "Découvrir" | "Reels" | "Shorts" | "Messages" | "Notifications" | "Créer" | "Profil" | "Administration" | ""

const Avatar = ({ src, taille = 26, actif = false }: { src?: string | null; taille?: number; actif?: boolean }) => (
	// eslint-disable-next-line @next/next/no-img-element
	<img
		src={src || "/reseau/avatar.svg"}
		alt=""
		width={taille}
		height={taille}
		className={`rounded-full object-cover aspect-square ${actif ? "ring-2 ring-gray-900 ring-offset-1" : ""}`}
	/>
)

const Sidebar = () => {
	const router = useRouter()
	const pathname = usePathname() || "/"
	const params = useSearchParams()
	const { startLoading, stopLoading } = useLoadingStore()
	const image = useUserStore((state) => state.image)
	const currentUsername = useUserStore((state) => state.username)
	const estAdmin = useUserStore((state) => !!state.admin || state.role === "moderateur")

	const actif = (): SidebarItemType => {
		if (pathname === "/") return "Accueil"
		if (pathname.startsWith("/search")) return "Rechercher"
		if (pathname.startsWith("/explore")) return "Découvrir"
		if (pathname.startsWith("/reels")) return "Reels"
		if (pathname.startsWith("/shorts")) return "Shorts"
		if (pathname.startsWith("/messages")) return "Messages"
		if (pathname.startsWith("/notifications")) return "Notifications"
		if (pathname.startsWith("/admin")) return "Administration"
		if (pathname.startsWith("/u") && params.get("n") === currentUsername) return "Profil"
		return ""
	}
	const courant = actif()

	const va = (item: SidebarItemType) => {
		const cibles: Record<string, string> = {
			Accueil: "/", Rechercher: "/search/", Découvrir: "/explore/", Reels: "/reels/", Shorts: "/shorts/", Messages: "/messages/",
			Notifications: "/notifications/", Profil: profil(currentUsername), Administration: "/admin/",
		}
		if (!cibles[item]) return
		startLoading()
		router.push(cibles[item])
		setTimeout(() => stopLoading(), 500)
	}

	const deconnexion = async () => {
		await toast.promise(
			(async () => {
				await authClient.signOut()
				localStorage.removeItem("user-storage")
				window.location.href = "/reseau/login/"
			})(),
			{ loading: "Déconnexion…", success: "À bientôt !", error: "Quelque chose n'a pas marché" }
		)
	}

	const elements: { label: SidebarItemType; icon: React.ReactNode }[] = [
		{ label: "Accueil", icon: <Home /> },
		{ label: "Rechercher", icon: <Search /> },
		{ label: "Découvrir", icon: <Compass /> },
		{ label: "Reels", icon: <Clapperboard /> },
		{ label: "Shorts", icon: <Youtube /> },
		{ label: "Messages", icon: <MessageCircleMore /> },
		{ label: "Notifications", icon: <Heart /> },
		{ label: "Créer", icon: null },
		{ label: "Profil", icon: <Avatar src={image} actif={courant === "Profil"} /> },
	]
	if (estAdmin) elements.push({ label: "Administration", icon: <Shield /> })

	return (
		<>
			{/* PC et iPad : la colonne de gauche */}
			<aside className="hidden md:flex sticky top-0 h-dvh shrink-0 flex-col border-r border-gray-200 bg-white px-3 py-6 md:w-[76px] xl:w-64">
				<button type="button" onClick={() => va("Accueil")} className="mb-8 px-2 cursor-pointer" aria-label="Accueil de Mechmoum">
					<span className="xl:hidden"><InstagramLogo compact /></span>
					<span className="hidden xl:block"><InstagramLogo /></span>
				</button>
				<nav className="flex flex-1 flex-col gap-1" aria-label="Navigation principale">
					{elements.map((e) =>
						e.label === "Créer" ? (
							<CreatePostDialog key="creer" />
						) : (
							<SidebarItem key={e.label} icon={e.icon} label={e.label} onClick={() => va(e.label)} isActive={courant === e.label} />
						)
					)}
					<div className="mt-auto pt-4 flex flex-col gap-1">
						<SidebarItem icon={<ArrowLeftToLine />} label="Le site de la famille" onClick={() => (window.location.href = "/")} isActive={false} />
						<SidebarItem icon={<LogOut />} label="Se déconnecter" onClick={deconnexion} isActive={false} />
					</div>
				</nav>
			</aside>

			{/* Téléphone : barre du haut */}
			{/* 26/11 : hauteur = 56 px + l'encoche (avant, l'encoche mangeait les 56 px : barre écrasée et floue sous l'heure de l'iPhone) ; fond blanc plein, sans flou */}
			<header className="md:hidden fixed top-0 inset-x-0 z-40 flex items-center justify-between border-b border-gray-200 bg-white px-2" style={{ paddingTop: "env(safe-area-inset-top)", height: "calc(3.5rem + env(safe-area-inset-top))" }}>
				<div className="flex items-center gap-1">
					<button type="button" onClick={() => (window.location.href = "/")} aria-label="Revenir au site de la famille" title="Le site de la famille" className="flex h-11 w-11 items-center justify-center rounded-full text-gray-700 active:bg-gray-100"><ArrowLeftToLine className="h-6 w-6" /></button>
					<button type="button" onClick={() => va("Accueil")} aria-label="Accueil de Mechmoum"><InstagramLogo /></button>
				</div>
				<div className="flex items-center gap-1">
					{estAdmin && <SidebarItem compact icon={<Shield />} label="Administration" onClick={() => va("Administration")} isActive={courant === "Administration"} />}
					<SidebarItem compact icon={<Heart />} label="Notifications" onClick={() => va("Notifications")} isActive={courant === "Notifications"} />
					<SidebarItem compact icon={<MessageCircleMore />} label="Messages" onClick={() => va("Messages")} isActive={courant === "Messages"} />
				</div>
			</header>

			{/* Téléphone : barre du bas */}
			<nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-gray-200 bg-white mc-barre-bas" aria-label="Navigation">
				<div className="flex h-14 items-center justify-around">
					<SidebarItem compact icon={<Home />} label="Accueil" onClick={() => va("Accueil")} isActive={courant === "Accueil"} />
					<SidebarItem compact icon={<Compass />} label="Découvrir" onClick={() => va("Découvrir")} isActive={courant === "Découvrir" || courant === "Rechercher"} />
					<CreatePostDialog compact />
					<SidebarItem compact icon={<Clapperboard />} label="Reels" onClick={() => va("Reels")} isActive={courant === "Reels"} />
					<SidebarItem compact icon={<Youtube />} label="Shorts" onClick={() => va("Shorts")} isActive={courant === "Shorts"} />
					<SidebarItem compact icon={<Avatar src={image} taille={28} actif={courant === "Profil"} />} label="Profil" onClick={() => va("Profil")} isActive={courant === "Profil"} />
				</div>
			</nav>
			<div className="md:hidden shrink-0 w-full" style={{ height: "calc(3.5rem + env(safe-area-inset-top))" }} aria-hidden="true" />
		</>
	)
}

export default Sidebar
