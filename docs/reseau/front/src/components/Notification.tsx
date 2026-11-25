"use client"
// Les nouveautés : qui a aimé, commenté, ou s'est abonné.
import { useEffect, useState } from "react"
import Link from "next/link"
import { Heart, Loader, MessageCircle, UserPlus } from "lucide-react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import axios_instance from "@/config/axios"
import { useSocketStore } from "@/store/store"
import FollowButton from "./ui/FollowButton"
import toast from "react-hot-toast"
import { profil, ilya } from "@/lib/utils"

const NotificationsComponent = () => {
	const [filter, setFilter] = useState<"all" | "unread">("all")
	const qc = useQueryClient()
	const socket = useSocketStore((state) => state.socket)

	const { data: unreadCount } = useQuery({
		queryKey: ["notifications", "unread-count"],
		queryFn: async () => Number((await axios_instance.get("/notifications/unread-count")).data.count) || 0,
	})
	const { data: notifications, isLoading, isError } = useQuery({
		queryKey: ["notifications"],
		queryFn: async () => (await axios_instance.get("/notifications/all")).data.data || [],
	})

	const toutLu = async () => {
		const { data } = await axios_instance.post("/notifications/read-all")
		if (!data.success) toast.error(data.message || "Ça n'a pas marché")
		qc.refetchQueries({ queryKey: ["notifications"] })
	}

	useEffect(() => {
		if (!socket) return
		const f = () => qc.refetchQueries({ queryKey: ["notifications"] })
		socket.on("notification", f)
		return () => { socket.off("notification", f) }
	}, [socket, qc])

	const icone = (type: string) =>
		type === "like" ? <Heart className="w-4 h-4 text-[#b4235a] fill-current" /> : type === "comment" ? <MessageCircle className="w-4 h-4 text-[#1f5fbf]" /> : <UserPlus className="w-4 h-4 text-[#0f766e]" />

	if (isLoading) return <div className="flex-1 flex justify-center items-center"><Loader className="size-10 animate-spin text-gray-400" /></div>
	if (isError) return <div className="flex-1 flex items-center justify-center py-20"><p className="text-red-600">Impossible de charger les notifications</p></div>

	const liste = filter === "unread" ? notifications?.filter((n: any) => !n.isRead) : notifications
	const onglet = (f: "all" | "unread", t: string) => (
		<button type="button" onClick={() => setFilter(f)} aria-pressed={filter === f}
			className={`min-h-11 text-sm font-bold cursor-pointer ${filter === f ? "text-gray-900 border-b-2 border-gray-900" : "text-gray-500"}`}>{t}</button>
	)

	return (
		<div className="flex-1 min-w-0">
			<div className="max-w-lg mx-auto pb-24 md:pb-6 bg-white md:my-6 md:rounded-2xl md:border md:border-gray-200">
				<div className="p-4 border-b border-gray-200">
					<h2 className="text-xl font-extrabold mb-2">Notifications</h2>
					<div className="flex flex-wrap justify-between items-end gap-x-4">
						<div className="flex gap-5">
							{onglet("all", "Toutes")}
							{onglet("unread", `Non lues (${unreadCount ?? 0})`)}
						</div>
						<button type="button" className="min-h-11 text-sm font-semibold cursor-pointer text-[#1f5fbf]" onClick={toutLu}>Tout marquer comme lu</button>
					</div>
				</div>
				<div className="divide-y divide-gray-100">
					{liste && liste.length > 0 ? (
						liste.map((n: any) => (
							<div key={n._id} className={`flex items-center gap-3 px-4 py-3 ${!n.isRead ? "bg-[#fff8e1]" : ""}`}>
								<Link href={profil(n.from.username)} className="relative shrink-0">
									{/* eslint-disable-next-line @next/next/no-img-element */}
									<img src={n.from.image || "/reseau/avatar.svg"} alt="" className="w-12 h-12 rounded-full object-cover" />
									<span className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm">{icone(n.type)}</span>
								</Link>
								<div className="flex-1 min-w-0 text-sm">
									<Link href={profil(n.from.username)} className="font-bold">{n.from.username}</Link>{" "}
									{n.type === "like" && "a aimé ta publication."}
									{n.type === "comment" && <>a commenté : « {n.comment ?? ""} »</>}
									{n.type === "follow" && "s'est abonné(e) à toi."}
									<p className="text-xs text-gray-500 mt-0.5">{ilya(n.createdAt)}</p>
								</div>
								{n.post?._id && (
									<Link href={`/p/?id=${n.post._id}`} className="shrink-0" aria-label="Voir la publication">
										{/* eslint-disable-next-line @next/next/no-img-element */}
										<img src={n.post.image || "/reseau/avatar.svg"} alt="" className="w-12 h-12 rounded-lg object-cover" />
									</Link>
								)}
								{n.type === "follow" && <FollowButton username={n.from.username} initialIsFollowing={n.isFollowing} />}
							</div>
						))
					) : (
						<div className="text-center py-12 px-4">
							<div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"><Heart className="w-8 h-8 text-gray-400" /></div>
							<h3 className="text-lg font-bold text-gray-900 mb-2">Rien de nouveau</h3>
							<p className="text-gray-500">Quand quelqu&apos;un aimera ou commentera tes publications, tu le verras ici.</p>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}

export default NotificationsComponent
