"use client"
import Link from "next/link"
import { Search } from "lucide-react"
import PostGrid from "./ui/post-grid"
import { useQuery } from "@tanstack/react-query"
import axios_instance from "@/config/axios"
import SuggestedUserCard from "./ui/suggested-user-card"
import {
	useSuggestedUsers,
	type SuggestedUser,
} from "@/hooks/useSuggestedUsers"

const ExploreComponent = () => {
	const { data: posts, isLoading } = useQuery({
		queryKey: ["explorePosts"],
		queryFn: async () => {
			const { data } = await axios_instance.get("/posts/explore")
			if (!data.success)
				throw new Error(data.message || "Impossible de charger les publications")
			return data.data
		},
	})

	const {
		data: suggestedUsers,
		isLoading: isSuggestedUsersLoading,
		isError: isSuggestedUsersError,
	} = useSuggestedUsers()

	return (
		<div className="flex-1 min-w-0">
			<div className="max-w-4xl mx-auto p-2 md:p-6 pb-24 md:pb-6">
				<Link href="/search/" className="mb-4 flex min-h-12 items-center gap-3 rounded-xl bg-gray-100 px-4 text-gray-500">
					<Search className="w-5 h-5" /> Rechercher un membre…
				</Link>
				<h2 className="sr-only">Découvrir</h2>

				{/* Posts Grid */}
				{!isLoading && (!posts || posts.length === 0) ? (
					<p className="py-10 text-center text-gray-500">Rien de nouveau à découvrir pour l&apos;instant. 🌼</p>
				) : (
					<PostGrid posts={posts} isLoading={isLoading} />
				)}

				{/* Suggested People Section */}
				<div className="mt-8 px-1">
					<h3 className="text-lg font-bold text-gray-800 mb-4 px-2">
						Des membres à suivre
					</h3>
					{isSuggestedUsersLoading ? (
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
							{Array.from({ length: 8 }).map((_, i) => (
								<div
									key={i}
									className="text-center p-4 border border-gray-200 rounded-lg flex flex-col items-center animate-pulse"
								>
									<div className="w-20 h-20 bg-gray-200 rounded-full mb-3" />
									<div className="h-4 bg-gray-200 rounded w-16 mb-2" />
									<div className="h-3 bg-gray-200 rounded w-20 mb-3" />
									<div className="h-6 bg-gray-200 rounded w-12" />
								</div>
							))}
						</div>
					) : isSuggestedUsersError ? (
						<div className="text-center py-8 text-gray-500">
							<p>Impossible de charger les suggestions</p>
						</div>
					) : suggestedUsers && suggestedUsers.length > 0 ? (
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
							{suggestedUsers.map((user: SuggestedUser) => (
								<SuggestedUserCard
									key={user.username}
									username={user.username}
									image={user.image}
									bio={user.bio}
								/>
							))}
						</div>
					) : (
						<div className="text-center py-8 text-gray-500">
							<p>Tu suis déjà tout le monde 🌼</p>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}

export default ExploreComponent
