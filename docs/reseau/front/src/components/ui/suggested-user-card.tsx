import Link from "next/link"
import { profil } from "@/lib/utils"
import { useFollowUser } from "@/hooks/useFollowUser"

interface SuggestedUserCardProps {
	username: string
	image?: string
	bio?: string
}

const SuggestedUserCard = ({
	username,
	image,
	bio,
}: SuggestedUserCardProps) => {
	const { isFollowing, isLoading, toggleFollow } = useFollowUser(
		username,
		false
	)

	return (
		<div className="text-center p-4 border border-gray-200 bg-white rounded-2xl flex flex-col items-center">
			<Link href={profil(username)} className="flex flex-col items-center">
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img src={image || "/reseau/avatar.svg"} alt="" className="w-20 h-20 rounded-full object-cover mb-2" />
			<p className="font-bold text-sm mb-1">{username}</p>
			</Link>
			<p
				className="text-xs text-gray-500 mb-3 h-8 overflow-hidden text-ellipsis"
				style={{
					display: "-webkit-box",
					WebkitLineClamp: 2,
					WebkitBoxOrient: "vertical",
				}}
			>
				{bio}
			</p>
			<button
				onClick={toggleFollow}
				disabled={isLoading}
				className={`cursor-pointer min-h-11 px-5 text-sm font-bold border rounded-xl transition-colors ${
					isLoading
						? "opacity-50 cursor-wait"
						: isFollowing
						? "text-gray-700 border-gray-300 hover:bg-gray-50"
						: "text-white bg-[#1f5fbf] border-[#1f5fbf] hover:opacity-90"
				}`}
			>
				{isLoading ? "..." : isFollowing ? "Abonné(e) ✓" : "Suivre"}
			</button>
		</div>
	)
}

export default SuggestedUserCard
