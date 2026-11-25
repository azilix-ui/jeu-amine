"use client"
import { useEffect } from "react"
import { useUserStore, useSocketStore, useOnlineUsersStore } from "@/store/store"
import { TempsReel } from "@/lib/temps-reel"

export default function SocketInitializer({ children }: { children: React.ReactNode }) {
	const username = useUserStore((state) => state.username)
	const setSocket = useSocketStore((state) => state.setSocket)
	const setOnlineUsers = useOnlineUsersStore((state) => state.setOnlineUsers)
	useEffect(() => {
		if (!username) return
		const socket = new TempsReel()
		socket.on("onlineUsers", setOnlineUsers)
		setSocket(socket)
		return () => {
			socket.disconnect()
			setSocket(null)
		}
	}, [username, setSocket, setOnlineUsers])

	return <>{children}</>
}
