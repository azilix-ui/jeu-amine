"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUserStore } from "@/store/store"
import { profil } from "@/lib/utils"

export default function ProfilePage() {
	const router = useRouter()
	const currentUsername = useUserStore((state) => state.username)
	useEffect(() => {
		if (currentUsername) router.replace(profil(currentUsername))
	}, [currentUsername, router])
	return <div className="mc-chargement">🌼</div>
}
