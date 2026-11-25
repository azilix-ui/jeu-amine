"use client"
import { profil } from "@/lib/utils"
import { BadgeCheck } from "lucide-react"
import Image from "next/image"
import { useFollowUser } from "@/hooks/useFollowUser"
import { type SearchUser } from "@/hooks/useSearch"
import { useRouter } from "next/navigation"

interface SearchUserItemProps {
	user: SearchUser
}

const SearchUserItem = ({ user }: SearchUserItemProps) => {
	const { isFollowing, isLoading, toggleFollow } = useFollowUser(
		user.username,
		user.isFollowing,
		user.followersCount
	)
	const router = useRouter()

	return (
		<div className="flex items-center gap-3 p-3 min-h-16 hover:bg-gray-50 rounded-xl">
			<Image
				src={user.image || "/reseau/avatar.svg"}
				alt={user.username}
				width={44}
				height={44}
				style={{
					aspectRatio: "1 / 1",
					borderRadius: "50%",
					objectFit: "cover",
				}}
			/>
			<div className="flex-1 min-w-0 cursor-pointer" onClick={() => router.push(profil(user.username))}>
				<div className="flex items-center gap-1">
					<p
						className="font-semibold text-sm truncate"
					>
						{user.username}
					</p>
					{user.emailVerified && (
						<BadgeCheck className="w-3 h-3 text-[#0f766e] flex-shrink-0" />
					)}
				</div>
				<p className="text-xs text-gray-500 truncate">
					{user.bio || `${user.followersCount} abonné${user.followersCount > 1 ? "s" : ""}`}
				</p>
			</div>
			<button
				onClick={(e) => {
					e.stopPropagation()
					toggleFollow()
				}}
				disabled={isLoading}
				className={`min-h-11 px-4 cursor-pointer text-sm font-bold rounded-xl transition-colors ${
					isLoading
						? "opacity-50 cursor-wait"
						: isFollowing
						? "text-gray-700 border border-gray-300 hover:bg-gray-50"
						: "text-white bg-[#1f5fbf] hover:opacity-90"
				}`}
			>
				{isLoading ? "..." : isFollowing ? "Abonné(e)" : "Suivre"}
			</button>
		</div>
	)
}

export default SearchUserItem
