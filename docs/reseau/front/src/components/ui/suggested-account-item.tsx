"use client"
import { BASE, profil } from "@/lib/utils"
import { BadgeCheck } from "lucide-react"
import Image from "next/image"
import { useFollowUser } from "@/hooks/useFollowUser"
import { type SuggestedUser } from "@/hooks/useSuggestedUsers"

interface SuggestedAccountItemProps {
	account: SuggestedUser
}

const SuggestedAccountItem = ({ account }: SuggestedAccountItemProps) => {
	const { isFollowing, isLoading, toggleFollow } = useFollowUser(
		account.username,
		account.isFollowing || false
	)

	return (
		<div className="flex items-center gap-3 py-2">
			{/* Avatar */}
			<button className="relative flex-shrink-0 cursor-pointer" aria-label={`Profil de ${account.username}`} onClick={() => { window.location.href = BASE + profil(account.username) }}>
				<Image
					src={account.image || "/reseau/avatar.svg"}
					alt=""
					width={50}
					height={50}
					style={{
						aspectRatio: "1 / 1",
						borderRadius: "50%",
						objectFit: "cover",
					}}
				/>
			</button>

			{/* User Info */}
			<div className="flex-1 min-w-0">
				<button className="block text-left w-full">
					<div className="flex items-center gap-1">
						<span
							className="text-sm font-semibold text-gray-900 truncate cursor-pointer"
							onClick={() => {
								window.location.href = BASE + profil(account.username)
							}}
						>
							{account.username}
						</span>
						{account.emailVerified && (
							<BadgeCheck className="w-4 h-4 text-[#0f766e] flex-shrink-0" aria-label="Famille Missaoui" />
						)}
					</div>
					{account.bio && (
						<div className="text-xs text-gray-500 truncate">{account.bio}</div>
					)}
					{account.followedBy && account.followedBy.length > 0 && (
						<div className="text-xs text-gray-400 w-fit whitespace-nowrap">
							Suivi(e) par {account.followedBy[0]}
							{account.followedBy.length > 1 &&
								` et ${account.followedBy.length - 1} autre${account.followedBy.length > 2 ? "s" : ""}`}
						</div>
					)}
				</button>
			</div>

			{/* Follow Button */}
			<button
				disabled={isLoading}
				onClick={toggleFollow}
				className={`min-h-11 px-3 text-sm font-bold rounded-xl transition-colors cursor-pointer ${
					isFollowing
						? "text-gray-700 hover:text-gray-900"
						: "text-blue-500 hover:text-blue-700"
				} ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
			>
				{isLoading ? "..." : isFollowing ? "Abonné(e)" : "Suivre"}
			</button>
		</div>
	)
}

export default SuggestedAccountItem
