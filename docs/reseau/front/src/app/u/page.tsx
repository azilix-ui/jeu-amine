"use client"
// Le profil d'un membre : /reseau/u/?n=<nom>
import { Suspense } from "react"
import Cadre from "@/components/Cadre"
import About from "@/components/ui/about"
import axios_instance from "@/config/axios"
import { useUserStore } from "@/store/store"
import { useQuery } from "@tanstack/react-query"
import { useSearchParams } from "next/navigation"

function Profil() {
	const username = useSearchParams().get("n") || ""
	const currentUsername = useUserStore((state) => state.username)
	const { data, error, isLoading, isError } = useQuery({
		queryKey: ["profile", username],
		queryFn: async () => {
			const response = await axios_instance.get(`/users/${encodeURIComponent(username)}`)
			if (!response.data.success) throw new Error(response.data.message)
			return response.data.data
		},
		enabled: !!username,
		retry: false,
	})
	return (
		<About
			key={username}
			userId={data?._id}
			fullname={data?.name}
			username={data?.username}
			image={data?.image}
			gender={data?.gender}
			bio={data?.bio}
			followersCount={data?.followers.length}
			followingCount={data?.following.length}
			emailVerified={data?.emailVerified}
			isUserLoading={isLoading}
			isUserError={isError}
			error={(error as any)?.response?.data?.message || error?.message}
			isOwnProfile={currentUsername === username}
			isFollowing={data?.followers.some((f: { username: string }) => f.username === currentUsername)}
			isBlocked={data?.isBlocked}
		/>
	)
}

export default function Page() {
	return (
		<Cadre>
			<Suspense fallback={null}>
				<Profil />
			</Suspense>
		</Cadre>
	)
}
