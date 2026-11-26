"use client"

import { useState, useMemo } from "react"
import { Plus } from "lucide-react"
import { useUserStore } from "@/store/store"
import { useStories } from "@/hooks/useStories"
import CreateStoryDialog from "./create-story-dialog"
import StoryViewer from "./story-viewer"

const Stories = () => {
	const userId = useUserStore((state) => state._id)
	const username = useUserStore((state) => state.username)
	const image = useUserStore((state) => state.image)
	const user = useMemo(
		() => ({
			_id: userId,
			username,
			image: image,
		}),
		[userId, username, image]
	)

	const { groupedStories, isLoading, viewStory } = useStories()
	const [selectedStory, setSelectedStory] = useState<string | null>(null)

	// Convert grouped stories to flat array for easier handling
	const allStories = Object.entries(groupedStories || {})
		.map(([userId, stories]) => {
			if (!Array.isArray(stories) || stories.length === 0) {
				return null
			}

			const firstStory = stories[0]
			if (!firstStory?.author) {
				return null
			}

			return {
				userId,
				user: firstStory.author,
				stories,
				hasViewed: stories.every((story) => story.isViewed),
			}
		})
		.filter((story): story is NonNullable<typeof story> => story !== null) // Type-safe filter

	const handleStoryClick = (userId: string) => {
		setSelectedStory(userId)
	}

	const mesStories = allStories.find((g) => g.userId === user._id)
	const autres = allStories.filter((g) => g.userId !== user._id)

	const Rond = ({ src, vu, taille = 64 }: { src?: string | null; vu: boolean; taille?: number }) => (
		<span className={`block rounded-full p-[3px] ${vu ? "bg-gray-300" : "mc-anneau"}`}>
			<span className="block rounded-full bg-white p-[2px]">
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img src={src || "/reseau/avatar.svg"} alt="" style={{ width: taille, height: taille }} className="rounded-full object-cover" />
			</span>
		</span>
	)

	return (
		<>
			<div className="bg-white border border-gray-200 rounded-2xl py-3 mb-4">
				<div className="flex gap-3 overflow-x-auto px-3 mc-sans-barre" aria-label="Stories">
					{isLoading
						? Array.from({ length: 6 }).map((_, i) => (
								<div key={i} className="flex flex-col items-center gap-2 shrink-0">
									<div className="w-[74px] h-[74px] rounded-full bg-gray-200 animate-pulse" />
									<div className="w-12 h-3 bg-gray-200 rounded animate-pulse" />
								</div>
							))
						: null}
					{!isLoading && (
						<div className="flex flex-col items-center gap-1 shrink-0 w-[78px]">
							<div className="relative">
								{mesStories ? (
									<button type="button" onClick={() => handleStoryClick(user._id)} aria-label="Voir ma story" className="cursor-pointer">
										<Rond src={user.image} vu={false} />
									</button>
								) : (
									<CreateStoryDialog>
										<button type="button" aria-label="Ajouter une story" className="cursor-pointer"><Rond src={user.image} vu /></button>
									</CreateStoryDialog>
								)}
								<CreateStoryDialog>
									<button type="button" aria-label="Ajouter une story" className="absolute -bottom-0.5 -right-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-[#1f5fbf] border-2 border-white cursor-pointer">
										<Plus size={14} className="text-white" />
									</button>
								</CreateStoryDialog>
							</div>
							<span className="text-xs text-gray-700 font-semibold">Ma story</span>
						</div>
					)}
					{autres.map((g) => (
						<button type="button" key={g.userId} onClick={() => handleStoryClick(g.userId)}
							className="flex flex-col items-center gap-1 shrink-0 w-[78px] cursor-pointer" aria-label={`Story de ${g.user.username}`}>
							<Rond src={g.user.image} vu={g.hasViewed} />
							<span className="text-xs text-gray-700 max-w-[76px] truncate">{g.user.username}</span>
						</button>
					))}
					{!isLoading && autres.length === 0 && (
						<p className="self-center text-sm text-gray-500 pl-2">Pas encore de story aujourd&apos;hui. Partage la tienne !</p>
					)}
				</div>
			</div>

			{selectedStory && (
				<StoryViewer stories={groupedStories || {}} initialUserId={selectedStory} onClose={() => setSelectedStory(null)} onStoryView={viewStory} />
			)}
		</>
	)
}

export default Stories
