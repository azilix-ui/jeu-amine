import { useFollowUser } from "@/hooks/useFollowUser"
import React from "react"
import { Button } from "./button"

const FollowButton = ({
	username,
	initialIsFollowing,
}: {
	username: string
	initialIsFollowing: boolean
}) => {
	const { isLoading, isFollowing, toggleFollow } = useFollowUser(
		username,
		initialIsFollowing
	)
	return (
		<Button
			disabled={isLoading}
			onClick={toggleFollow}
			className="cursor-pointer min-w-24 h-11 rounded-xl"
			variant={isFollowing ? "outline" : "default"}
		>
			{isLoading ? "..." : isFollowing ? "Abonné(e)" : "Suivre"}
		</Button>
	)
}

export default FollowButton
