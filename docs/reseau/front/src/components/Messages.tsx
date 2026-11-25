"use client"
// Les messages privés. PC/iPad : la liste à gauche, la conversation à droite. Téléphone : l'une ou l'autre, avec un bouton retour.
import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowLeft, BadgeCheck, MessageCircleHeart, SendIcon, Flag } from "lucide-react"
import { motion } from "framer-motion"
import { useLastMessagesStore, useOnlineUsersStore, useSocketStore, useUserStore } from "@/store/store"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import axios_instance from "@/config/axios"
import toast from "react-hot-toast"
import { Message } from "@/types/message"
import ChatMessages from "@/components/ChatMessages"
import Signaler from "@/components/ui/signaler"
import { type existingChat } from "@/types/conversation"
import { profil, ilya } from "@/lib/utils"

const TypingIndicator = () => (
	<div className="flex gap-1 items-center px-5 h-9 w-16 ml-4 bg-gray-200 rounded-2xl rounded-bl-none my-1" aria-label="En train d'écrire">
		{[0, 0.2, 0.4].map((d) => (
			<motion.span key={d} animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: d }} className="size-2 bg-gray-400 rounded-full" />
		))}
	</div>
)

const Avatar = ({ src, taille, enLigne }: { src?: string; taille: number; enLigne?: boolean }) => (
	<span className="relative shrink-0">
		{/* eslint-disable-next-line @next/next/no-img-element */}
		<img src={src || "/reseau/avatar.svg"} alt="" style={{ width: taille, height: taille }} className="rounded-full object-cover" />
		{enLigne && <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" aria-label="En ligne" />}
	</span>
)

const MessagesComponent = () => {
	const socket = useSocketStore((state) => state.socket)
	const currentUserId = useUserStore((state) => state._id)
	const queryClient = useQueryClient()
	const onlineUsers = useOnlineUsersStore((state) => state.onlineUsers)
	const [newMessage, setNewMessage] = useState<string>("")
	const [typing, setTyping] = useState<boolean>(false)
	const [signal, setSignal] = useState<string | null>(null)
	const [selectedChat, setSelectedChat] = useState<existingChat | null>(null)
	const conversations = useLastMessagesStore((state) => state.lastMessages)
	const voulu = useSearchParams().get("a")
	const dernierEcrit = useRef(0)
	const ouvertA = useRef(false)
	const autre = selectedChat?.members[0]

	const messages = useQuery<Message[]>({
		queryKey: ["chats", autre?._id],
		queryFn: async () => {
			const { data } = await axios_instance.get(`/messages/${autre?._id}`)
			return data.success ? data.data : []
		},
		enabled: !!autre,
	})

	useEffect(() => {
		queryClient.refetchQueries({ queryKey: ["lastMessages"] })
	}, [selectedChat, queryClient])

	// ouvrir directement la conversation demandée (?a=nom, depuis un profil)
	useEffect(() => {
		if (!voulu || selectedChat || ouvertA.current || !conversations?.existingChats) return
		ouvertA.current = true
		const c = conversations.existingChats.find((x) => x.members[0].username === voulu)
		if (c) return setSelectedChat(c)
		const u = conversations.availableUsersForNewChat?.find((x) => x.username === voulu)
		if (u) setSelectedChat({ _id: `temp-${u._id}`, members: [u], last_message: { _id: "", message: "", createdAt: "" }, createdAt: "", unreadCount: 0 })
		else toast.error(`Tu ne peux pas écrire à ${voulu} pour l'instant.`)
	}, [voulu, conversations, selectedChat])

	useEffect(() => {
		if (!socket) return
		let minuterie: ReturnType<typeof setTimeout>
		const recu = (msg: Message) => {
			if (msg.sender === autre?._id) queryClient.refetchQueries({ queryKey: ["chats", autre?._id] })
			queryClient.refetchQueries({ queryKey: ["lastMessages"] })
		}
		const lu = ({ chatId }: { chatId: string }) => {
			if (chatId === selectedChat?._id) queryClient.refetchQueries({ queryKey: ["chats", autre?._id] })
		}
		const ecrit = ({ sender }: { sender: string }) => {
			if (autre?._id !== sender) return
			setTyping(true)
			clearTimeout(minuterie)
			minuterie = setTimeout(() => setTyping(false), 2500)
		}
		socket.on("newMessage", recu)
		socket.on("messagesRead", lu)
		socket.on("typing", ecrit)
		return () => {
			socket.off("newMessage", recu)
			socket.off("messagesRead", lu)
			socket.off("typing", ecrit)
			clearTimeout(minuterie)
		}
	}, [socket, selectedChat, autre, queryClient])

	useEffect(() => {
		if (!socket || !selectedChat || !messages.data) return
		const ids = messages.data.filter((m) => !m.read_by.includes(currentUserId) && !m._id.startsWith("temp-")).map((m) => m._id)
		if (ids.length === 0) return
		socket.emit("messagesRead", { chatId: selectedChat._id, messageIds: ids }, () => queryClient.refetchQueries({ queryKey: ["lastMessages"] }))
	}, [socket, selectedChat, messages.data, currentUserId, queryClient])

	const sendMessage = async () => {
		const texte = newMessage.trim()
		if (!texte || !autre) return
		const tempId = `temp-${Date.now()}`
		const cle = ["chats", autre._id]
		queryClient.setQueryData<Message[]>(cle, (old = []) => [{ _id: tempId, sender: currentUserId, message: texte, createdAt: new Date().toISOString(), read_by: [currentUserId] }, ...old])
		setNewMessage("")
		socket?.emit("sendMessage", { receiver: autre._id, content: texte }, (r: { success: boolean; message: string }) => {
			if (!r.success) {
				setNewMessage(texte)
				queryClient.setQueryData<Message[]>(cle, (old = []) => old.filter((m) => m._id !== tempId))
				toast.error(r.message || "Le message n'est pas parti")
			} else {
				queryClient.refetchQueries({ queryKey: cle })
				if (selectedChat?._id.startsWith("temp-")) queryClient.refetchQueries({ queryKey: ["lastMessages"] })
			}
		})
	}

	const ligne = (c: existingChat, nouveau = false) => {
		const m = c.members[0]
		const actif = autre?._id === m._id
		return (
			<button type="button" key={c._id} onClick={() => setSelectedChat(c)}
				className={`flex w-full items-center gap-3 px-4 py-3 text-left cursor-pointer hover:bg-gray-50 ${actif ? "bg-gray-100" : ""} ${c.unreadCount > 0 && !actif ? "bg-[#fff8e1]" : ""}`}>
				<Avatar src={m.image} taille={52} enLigne={onlineUsers.includes(m._id)} />
				<span className="flex-1 min-w-0">
					<span className="flex items-center gap-1 font-bold">
						{m.username}
						{m.emailVerified && <BadgeCheck className="text-[#0f766e] w-4 h-4" aria-label="Famille Missaoui" />}
					</span>
					<span className={`block truncate text-sm ${c.unreadCount > 0 ? "text-gray-900 font-semibold" : "text-gray-500"}`}>
						{nouveau ? "Commencer une conversation" : c.last_message?.message}
					</span>
				</span>
				<span className="flex flex-col items-end gap-1 shrink-0">
					{c.unreadCount > 0 && <span className="bg-[#b4235a] min-w-5 h-5 px-1 text-white text-xs font-bold rounded-full flex justify-center items-center">{c.unreadCount}</span>}
					{c.last_message?.createdAt && <span className="text-gray-400 text-xs">{ilya(c.last_message.createdAt)}</span>}
				</span>
			</button>
		)
	}

	return (
		<div className="flex flex-1 min-w-0 min-h-0 bg-white">
			<div className={`${selectedChat ? "hidden md:flex" : "flex"} w-full md:w-80 lg:w-96 shrink-0 flex-col border-r min-h-0`}>
				<h1 className="border-b px-4 py-4 text-xl font-extrabold">Messages</h1>
				<div className="flex-1 overflow-y-auto">
					{conversations?.existingChats?.map((c) => ligne(c))}
					{conversations?.availableUsersForNewChat?.length > 0 && (
						<p className="px-4 pt-4 pb-1 text-xs font-bold uppercase tracking-wide text-gray-400">Écrire à…</p>
					)}
					{conversations?.availableUsersForNewChat?.map((u) =>
						ligne({ _id: `temp-${u._id}`, members: [u], last_message: { _id: "", message: "", createdAt: "" }, createdAt: "", unreadCount: 0 }, true)
					)}
					{!conversations?.existingChats?.length && !conversations?.availableUsersForNewChat?.length && (
						<p className="p-6 text-center text-gray-500">Abonne-toi à quelqu&apos;un pour pouvoir lui écrire.</p>
					)}
				</div>
			</div>
			<div className={`${selectedChat ? "flex" : "hidden md:flex"} flex-1 min-w-0 min-h-0 flex-col`}>
				{selectedChat && autre ? (
					<>
						<div className="flex items-center gap-2 h-16 px-2 md:px-4 border-b shrink-0">
							<button type="button" onClick={() => setSelectedChat(null)} aria-label="Retour à la liste" className="md:hidden flex h-11 w-11 items-center justify-center rounded-full hover:bg-gray-100 cursor-pointer">
								<ArrowLeft />
							</button>
							<Link href={profil(autre.username)} className="flex items-center gap-3 min-w-0 flex-1">
								<Avatar src={autre.image} taille={40} enLigne={onlineUsers.includes(autre._id)} />
								<span className="min-w-0">
									<span className="flex items-center gap-1 font-bold truncate">
										{autre.username}
										{autre.emailVerified && <BadgeCheck className="text-[#0f766e] w-4 h-4" />}
									</span>
									<span className="block text-xs text-gray-500">{onlineUsers.includes(autre._id) ? "En ligne" : "Hors ligne"}</span>
								</span>
							</Link>
							<button type="button" onClick={() => setSignal(autre._id)} aria-label="Signaler cette personne" className="flex h-11 w-11 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 cursor-pointer">
								<Flag className="w-5 h-5" />
							</button>
						</div>
						<ChatMessages messages={{ data: messages.data, isLoading: messages.isLoading, isError: messages.isError }} currentUserId={currentUserId} />
						{messages.data && messages.data.length > 0 && messages.data[0].sender === currentUserId && (
							<span className="text-gray-400 text-xs text-right px-6">{messages.data[0].read_by.includes(autre._id) ? "Vu ✓✓" : "Envoyé ✓"}</span>
						)}
						{typing && <TypingIndicator />}
						<form className="border-t p-3 flex items-center gap-2 shrink-0" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
							onSubmit={(e) => { e.preventDefault(); sendMessage() }}>
							<input placeholder="Écris ton message…" aria-label="Ton message" maxLength={2000} enterKeyHint="send"
								className="flex-1 min-h-12 rounded-full border border-gray-300 px-5 text-base outline-none focus:border-gray-500"
								value={newMessage}
								onChange={(e) => {
									setNewMessage(e.target.value)
									if (Date.now() - dernierEcrit.current > 2000) {
										dernierEcrit.current = Date.now()
										socket?.emit("typing", { receiver: autre._id })
									}
								}} />
							<motion.button type="submit" whileTap={{ scale: 0.85 }} aria-label="Envoyer" disabled={!newMessage.trim()}
								className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1f5fbf] text-white disabled:opacity-40 cursor-pointer">
								<SendIcon className="w-5 h-5" />
							</motion.button>
						</form>
					</>
				) : (
					<div className="flex flex-col items-center h-full justify-center text-gray-500 text-xl gap-4 p-6 text-center">
						<MessageCircleHeart size={80} className="text-gray-300" />
						Choisis une conversation
					</div>
				)}
			</div>
			<Signaler genre="user" cible={signal || "0"} ouvert={!!signal} fermer={() => setSignal(null)} />
		</div>
	)
}

export default MessagesComponent
