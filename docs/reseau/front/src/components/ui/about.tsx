"use client"
// La page de profil : avatar, nombres, bio, et les onglets Publications / Reels / Enregistrés.
import { BadgeCheck, Grid3X3, Clapperboard, Bookmark, Settings, Flag, MessageCircleMore } from "lucide-react"
import React from "react"
import Link from "next/link"
import PostGrid from "./post-grid"
import axios_instance from "@/config/axios"
import { useQuery } from "@tanstack/react-query"
import { useFollowUser } from "@/hooks/useFollowUser"
import EditProfileDialog from "./edit-profile-dialog"
import BlockUserDialog from "./block-user-dialog"
import UsersListDialog from "./users-list-dialog"
import DeleteUserDialog from "./delete-user-dialog"
import Signaler from "./signaler"

interface AboutProps {
	userId?: string
	fullname: string
	username: string
	image: string
	gender: string
	bio: string
	followersCount: number
	followingCount: number
	emailVerified?: boolean
	isUserLoading?: boolean
	isUserError?: boolean
	error?: string
	isOwnProfile?: boolean
	isFollowing?: boolean
	isBlocked?: boolean
}

type Onglet = "posts" | "reels" | "saved"

const Vide = ({ icone, titre, texte }: { icone: React.ReactNode; titre: string; texte: string }) => (
	<div className="text-center py-12 px-4">
		<div className="w-16 h-16 border-2 border-gray-300 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">{icone}</div>
		<h3 className="text-xl font-bold mb-2">{titre}</h3>
		<p className="text-gray-500">{texte}</p>
	</div>
)

const About = ({ userId, fullname, username, image, gender, bio, followersCount, followingCount, emailVerified = false, isUserLoading, isUserError, error, isOwnProfile = false, isFollowing = false, isBlocked = false }: AboutProps) => {
	const [onglet, setOnglet] = React.useState<Onglet>("posts")
	const [signal, setSignal] = React.useState(false)
	const { data: profilData } = useQuery({
		queryKey: ["profile-posts", username, onglet],
		queryFn: async () => {
			if (onglet === "saved") return (await axios_instance.get(`/posts/bookmarks`)).data.data || []
			const r = await axios_instance.get(`/posts/${encodeURIComponent(username)}?limit=60${onglet === "reels" ? "&type=video" : ""}`)
			return r.data.data.posts
		},
		enabled: !!username,
	})
	const { data: nbPosts } = useQuery({
		queryKey: ["profile-posts", username, "nb"],
		queryFn: async () => (await axios_instance.get(`/posts/${encodeURIComponent(username)}?limit=60`)).data.data.posts.length as number,
		enabled: !!username,
	})
	const posts = profilData
	const isPostsLoading = profilData === undefined

	const { isFollowing: suit, followersCount: nbAbonnes, isLoading: chargeSuivi, toggleFollow } = useFollowUser(username, isFollowing, followersCount)

	if (isUserLoading) {
		return (
			<div className="flex-1 max-w-4xl mx-auto w-full p-4 md:p-8 animate-pulse">
				<div className="flex items-center gap-6 md:gap-10 mb-8">
					<div className="w-20 h-20 md:w-36 md:h-36 bg-gray-200 rounded-full" />
					<div className="flex-1 space-y-3">
						<div className="h-6 bg-gray-200 rounded w-40" />
						<div className="h-4 bg-gray-200 rounded w-56" />
					</div>
				</div>
				<div className="grid grid-cols-3 gap-1">{Array.from({ length: 9 }).map((_, i) => <div key={i} className="aspect-square bg-gray-200" />)}</div>
			</div>
		)
	}

	if (isUserError) {
		return (
			<div className="flex-1 max-w-4xl mx-auto p-8 text-center py-20">
				<div className="text-6xl mb-4">🌫️</div>
				<h3 className="text-2xl font-bold text-gray-800 mb-3">Profil introuvable</h3>
				<p className="text-gray-500 max-w-sm mx-auto">{error || "Ce membre n'existe pas, ou tu ne peux pas voir son profil."}</p>
				<Link href="/" className="inline-flex mt-6 min-h-12 items-center rounded-xl bg-[#1f5fbf] px-6 font-bold text-white">Retour à l&apos;accueil</Link>
			</div>
		)
	}

	const bouton = "min-h-11 px-4 text-sm font-bold rounded-xl transition-colors cursor-pointer"
	const tab = (o: Onglet, icone: React.ReactNode, texte: string) => (
		<button type="button" onClick={() => setOnglet(o)} aria-pressed={onglet === o}
			className={`flex flex-1 md:flex-none min-h-12 cursor-pointer items-center justify-center gap-2 px-6 text-xs font-bold tracking-wide uppercase ${onglet === o ? "text-gray-900 border-t-2 border-gray-900 -mt-px" : "text-gray-500"}`}>
			{icone}<span className="hidden sm:inline">{texte}</span>
		</button>
	)
	const pronom = gender === "male" ? "il" : gender === "female" ? "elle" : ""

	return (
		<div className="flex-1 min-w-0">
			<div className="max-w-4xl mx-auto px-3 py-4 md:p-8 pb-24 md:pb-8">
				<div className="flex items-center gap-5 md:gap-12 mb-5 md:mb-10">
					<div className="shrink-0 rounded-full p-[3px] mc-anneau">
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img src={image || "/reseau/avatar.svg"} alt={username} className="w-20 h-20 md:w-36 md:h-36 rounded-full object-cover border-[3px] border-white bg-white" />
					</div>
					<div className="flex-1 min-w-0">
						<div className="flex flex-wrap items-center gap-2 md:gap-3 mb-3">
							<h1 className="text-xl md:text-2xl font-bold flex items-center gap-1 min-w-0 truncate">
								{username}
								{emailVerified && <BadgeCheck className="size-5 text-[#0f766e] shrink-0" aria-label="Famille Missaoui" />}
							</h1>
							{isOwnProfile ? (
								<>
									<EditProfileDialog currentProfile={{ name: fullname, username, bio, gender, image }}>
										<button type="button" className={`${bouton} bg-gray-100 hover:bg-gray-200`}>Modifier le profil</button>
									</EditProfileDialog>
									<DeleteUserDialog>
										<button type="button" aria-label="Paramètres du compte" className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-gray-100 cursor-pointer"><Settings className="w-5 h-5" /></button>
									</DeleteUserDialog>
								</>
							) : (
								<>
									<button type="button" onClick={toggleFollow} disabled={chargeSuivi}
										className={`${bouton} ${suit ? "bg-gray-100 hover:bg-gray-200 text-gray-900" : "bg-[#1f5fbf] hover:opacity-90 text-white"} ${chargeSuivi ? "opacity-50" : ""}`}>
										{suit ? "Abonné(e) ✓" : "Suivre"}
									</button>
									<Link href={`/messages/?a=${encodeURIComponent(username)}`} className={`${bouton} inline-flex items-center gap-1 bg-gray-100 hover:bg-gray-200`}>
										<MessageCircleMore className="w-4 h-4" /> Écrire
									</Link>
									<BlockUserDialog username={username} isBlocked={isBlocked}>
										<button type="button" aria-label="Bloquer" className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-gray-100 cursor-pointer"><Settings className="w-5 h-5" /></button>
									</BlockUserDialog>
									<button type="button" aria-label="Signaler ce profil" onClick={() => setSignal(true)} className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-gray-100 cursor-pointer text-gray-500"><Flag className="w-5 h-5" /></button>
								</>
							)}
						</div>
						<div className="hidden md:flex gap-8 mb-3">
							<Nombres username={username} nbPosts={nbPosts ?? 0} nbAbonnes={nbAbonnes ?? followersCount} nbAbonnements={followingCount} />
						</div>
						<div className="hidden md:block text-sm">
							{fullname && <p className="font-bold">{fullname}</p>}
							{pronom && <p className="text-gray-500 text-xs">{pronom}</p>}
							{bio && <p className="whitespace-pre-wrap mt-1">{bio}</p>}
						</div>
					</div>
				</div>
				<div className="md:hidden text-sm mb-4 px-1">
					{fullname && <p className="font-bold">{fullname}</p>}
					{pronom && <p className="text-gray-500 text-xs">{pronom}</p>}
					{bio && <p className="whitespace-pre-wrap mt-1">{bio}</p>}
				</div>
				<div className="md:hidden flex justify-around border-t border-gray-200 py-3 text-center text-sm">
					<Nombres username={username} nbPosts={nbPosts ?? 0} nbAbonnes={nbAbonnes ?? followersCount} nbAbonnements={followingCount} colonne />
				</div>

				<div className="border-t border-gray-200 flex justify-center md:gap-10">
					{tab("posts", <Grid3X3 className="w-4 h-4" />, "Publications")}
					{tab("reels", <Clapperboard className="w-4 h-4" />, "Reels")}
					{isOwnProfile && tab("saved", <Bookmark className="w-4 h-4" />, "Enregistrés")}
				</div>
				<div className="mt-1">
					{posts?.length > 0 || isPostsLoading ? (
						<PostGrid posts={posts} isLoading={isPostsLoading} />
					) : onglet === "posts" ? (
						<Vide icone={<Grid3X3 className="w-8 h-8" />} titre="Pas encore de publication" texte={isOwnProfile ? "Tes photos apparaîtront ici." : "Rien ici pour l'instant."} />
					) : onglet === "reels" ? (
						<Vide icone={<Clapperboard className="w-8 h-8" />} titre="Pas encore de reel" texte={isOwnProfile ? "Publie une petite vidéo avec le bouton ＋." : "Aucune vidéo pour l'instant."} />
					) : (
						<Vide icone={<Bookmark className="w-8 h-8" />} titre="Rien d'enregistré" texte="Touche le petit marque-page sous une publication pour la retrouver ici." />
					)}
				</div>
			</div>
			<Signaler genre="user" cible={String(userId || 0)} ouvert={signal} fermer={() => setSignal(false)} />
		</div>
	)
}

const Nombres = ({ username, nbPosts, nbAbonnes, nbAbonnements, colonne = false }: { username: string; nbPosts: number; nbAbonnes: number; nbAbonnements: number; colonne?: boolean }) => {
	const c = colonne ? "flex flex-col items-center min-h-11 justify-center cursor-pointer" : "cursor-pointer"
	return (
		<>
			<span className={colonne ? "flex flex-col items-center" : ""}><strong>{nbPosts}</strong> {colonne ? <span className="text-gray-500">publications</span> : "publications"}</span>
			<UsersListDialog username={username} type="followers" title="Abonnés">
				<button type="button" className={c}><strong>{nbAbonnes}</strong> {colonne ? <span className="text-gray-500">abonnés</span> : " abonnés"}</button>
			</UsersListDialog>
			<UsersListDialog username={username} type="following" title="Abonnements">
				<button type="button" className={c}><strong>{nbAbonnements}</strong> {colonne ? <span className="text-gray-500">abonnements</span> : " abonnements"}</button>
			</UsersListDialog>
		</>
	)
}

export default About
