"use client"
// En-tête d'une publication : l'auteur, la date, et le menu « … » (suivre, signaler, supprimer).
import axios_instance from "@/config/axios"
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { BadgeCheck, Ellipsis } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import toast from "react-hot-toast"
import { useUserStore } from "@/store/store"
import { profil, ilya } from "@/lib/utils"
import Signaler from "@/components/ui/signaler"

interface PostHeaderProps {
	username: string
	userAvatar?: string
	famille?: boolean
	postId?: string
	createdAt?: string
	onDeleted?: () => void
}

const PostHeader = ({ username, userAvatar, famille, postId, createdAt, onDeleted }: PostHeaderProps) => {
	const [moreOpen, setMoreOpen] = useState(false)
	const [signal, setSignal] = useState(false)
	const moi = useUserStore((s) => s.username)
	const admin = useUserStore((s) => !!s.admin)
	const qc = useQueryClient()
	const estMoi = moi === username

	const { data: isFollowing = true, refetch } = useQuery({
		queryKey: ["is-following", username],
		queryFn: async () => {
			const { data } = await axios_instance.get("/users/is-following/" + username)
			return !!data.data
		},
		enabled: moreOpen && !estMoi,
	})

	const suivre = () => {
		toast.promise(
			(async () => {
				const { data } = await axios_instance.post("/users/toggle-follow/" + username)
				if (!data.success) throw new Error(data.message)
				setMoreOpen(false)
				refetch()
			})(),
			{ loading: "Un instant…", success: isFollowing ? `Tu ne suis plus ${username}` : `Tu suis ${username}`, error: (e) => e.message || "Ça n'a pas marché" }
		)
	}

	const supprimer = () => {
		if (!postId || !confirm("Supprimer cette publication pour de bon ?")) return
		toast.promise(
			(async () => {
				const { data } = await axios_instance.post("/posts/delete/" + postId)
				if (!data.success) throw new Error(data.message)
				setMoreOpen(false)
				onDeleted?.()
				qc.invalidateQueries()
			})(),
			{ loading: "Suppression…", success: "Publication supprimée", error: (e) => e.message || "Ça n'a pas marché" }
		)
	}

	const ligne = "min-h-12 px-4 py-3 hover:bg-gray-100 cursor-pointer transition-colors text-center w-full"
	return (
		<div className="flex items-center justify-between w-full">
			<Link href={profil(username)} className="flex items-center gap-3 hover:opacity-80 transition-opacity min-w-0">
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img src={userAvatar || "/reseau/avatar.svg"} alt="" width={36} height={36} className="w-9 h-9 rounded-full object-cover mc-anneau-fin" />
				<span className="flex flex-col min-w-0">
					<span className="flex items-center gap-1 text-sm font-bold text-gray-900 truncate">
						{username}
						{famille && <BadgeCheck className="w-4 h-4 text-[#0f766e] shrink-0" aria-label="Famille Missaoui" />}
					</span>
					{createdAt && <span className="text-xs text-gray-500">{ilya(createdAt)}</span>}
				</span>
			</Link>
			<Dialog open={moreOpen} onOpenChange={setMoreOpen}>
				<DialogTrigger asChild>
					<button type="button" aria-label="Plus d'options" className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-gray-100 cursor-pointer">
						<Ellipsis className="w-5 h-5 text-gray-600" />
					</button>
				</DialogTrigger>
				<DialogContent className="max-w-sm rounded-2xl p-0 overflow-hidden bg-white [&>button]:hidden">
					<DialogTitle className="sr-only">Options</DialogTitle>
					<div className="flex flex-col divide-y divide-gray-200">
						{!estMoi && (
							<button type="button" className={ligne + " font-bold text-red-600"} onClick={() => { setMoreOpen(false); setSignal(true) }}>Signaler</button>
						)}
						{(estMoi || admin) && postId && (
							<button type="button" className={ligne + " font-bold text-red-600"} onClick={supprimer}>Supprimer</button>
						)}
						{!estMoi && <button type="button" className={ligne} onClick={suivre}>{isFollowing ? "Ne plus suivre" : "Suivre"}</button>}
						<Link href={profil(username)} className={ligne}>Voir le profil</Link>
						<DialogClose asChild><button type="button" className={ligne}>Annuler</button></DialogClose>
					</div>
				</DialogContent>
			</Dialog>
			{postId && <Signaler genre="post" cible={postId} ouvert={signal} fermer={() => setSignal(false)} />}
		</div>
	)
}

export default PostHeader
