import PostComponent from "@/components/ui/post"
import { PostSkeleton } from "@/components/ui/skeleton"
import { type Post } from "@/types/post"

const Posts = ({
	posts,
	isLoading = false,
	hasMore = false,
	onLoadMore,
}: {
	posts: Post[]
	isLoading?: boolean
	hasMore?: boolean
	onLoadMore?: () => void
}) => {
		const postsData = posts

	return (
		<div className="w-full max-w-[470px] mx-auto">
			<div className="space-y-5">
				{postsData.map((post) => (
					<PostComponent key={post._id} postData={post} />
				))}

				{/* Loading skeletons */}
				{isLoading && (
					<>
						<PostSkeleton />
						<PostSkeleton />
					</>
				)}
			</div>

			{/* Load More Button */}
			{hasMore && !isLoading && (
				<div className="text-center py-6">
					<button
						onClick={onLoadMore}
						className="min-h-12 px-6 py-2 bg-[#1f5fbf] text-white font-bold rounded-xl hover:opacity-90 cursor-pointer"
					>
						Voir plus
					</button>
				</div>
			)}

			{/* End of feed message */}
			{!hasMore && !isLoading && postsData.length > 0 && (
				<div className="text-center py-8 lg:py-12">
					<p className="text-gray-500 text-sm lg:text-base">
						Tu as tout vu ! 🌼
					</p>
					<p className="text-gray-400 text-xs lg:text-sm mt-1">
						Il n'y a pas d'autre nouvelle publication pour l'instant.
					</p>
				</div>
			)}

			{/* No posts message */}
			{!isLoading && postsData.length === 0 && (
				<div className="text-center py-12">
					<p className="text-gray-500 text-lg">Rien à voir pour l'instant</p>
					<p className="text-gray-400 text-sm mt-1">
						Publie une photo ou suis un membre de la famille pour voir ses publications ici.
					</p>
				</div>
			)}
		</div>
	)
}

export default Posts
