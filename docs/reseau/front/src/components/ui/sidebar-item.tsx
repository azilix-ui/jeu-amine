import axios_instance from "@/config/axios"
import { useLastMessagesStore, useSocketStore } from "@/store/store"
import { SidebarItemProps } from "@/types/sidebar"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"

const SidebarItem = ({ icon, label, onClick, isActive, compact }: SidebarItemProps) => {
	const socket = useSocketStore((state) => state.socket)
	const queryclient = useQueryClient()
	const setLastMessage = useLastMessagesStore((state) => state.setLastMessage)
	const { data: unreadCount } = useQuery({
		queryKey: ["notifications", "unread-count"],
		queryFn: async () => {
			const { data } = await axios_instance.get("/notifications/unread-count")
			return Number(data.count) || 0
		},
		enabled: label === "Notifications",
	})

	const { data: unreadChats } = useQuery<number>({
		queryKey: ["lastMessages"],
		queryFn: async () => {
			const { data } = await axios_instance.get("/messages/last")
			setLastMessage(data.data)
			const unread = data.data.existingChats.filter(
				(chat: any) => chat.unreadCount > 0
			)
			return unread.length
		},
		enabled: label === "Messages",
	})

	useEffect(() => {
		if (label === "Notifications" && socket) {
			const handler = () => {
				queryclient.refetchQueries({
					queryKey: ["notifications", "unread-count"],
				})
			}
			socket.on("notification", handler)

			return () => {
				socket.off("notification", handler)
			}
		}
		if (label === "Messages" && socket) {
			const messageHandler = () => {
				queryclient.refetchQueries({ queryKey: ["lastMessages"] })
			}
			socket.on("newMessage", messageHandler)

			return () => {
				socket.off("newMessage", messageHandler)
			}
		}
	}, [label, socket, queryclient])

	const pastille = label === "Notifications" ? unreadCount : label === "Messages" ? unreadChats : 0
	if (compact)
		return (
			<button type="button" onClick={onClick} aria-label={label} title={label}
				className={`relative flex h-11 w-11 items-center justify-center rounded-xl cursor-pointer ${isActive ? "text-black" : "text-gray-700"} active:bg-gray-200`}>
				<span className={`flex items-center justify-center ${isActive ? "[&>svg]:stroke-[2.6]" : ""}`}>{icon}</span>
				{!!pastille && pastille > 0 && (
					<span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-[#b4235a] text-white text-[11px] font-bold flex items-center justify-center rounded-full">{pastille > 99 ? "99+" : pastille}</span>
				)}
			</button>
		)

	return (
		<button
			title={label}
			className={`relative flex gap-4 p-3 w-full cursor-pointer rounded-xl items-center transition-all duration-200 ${
				isActive ? "bg-gray-100 font-extrabold" : "hover:bg-gray-100 active:bg-gray-200"
			}`}
			onClick={onClick}
			type="button"
		>
			<span className={`w-6 h-6 flex items-center justify-center ${isActive ? "text-black [&>svg]:stroke-[2.6]" : "text-gray-800"}`}>{icon}</span>
			<span className={`hidden xl:inline text-base ${isActive ? "text-black" : "text-gray-900"}`}>{label}</span>
			{!!pastille && pastille > 0 && (
				<span className="absolute xl:static top-1 left-8 xl:ml-auto min-w-[20px] h-5 px-1.5 bg-[#b4235a] text-white text-xs font-bold flex items-center justify-center rounded-full">
					{pastille > 99 ? "99+" : pastille}
				</span>
			)}
		</button>
	)
}

export default SidebarItem
