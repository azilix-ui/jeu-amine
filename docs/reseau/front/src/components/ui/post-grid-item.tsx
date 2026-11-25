import React from "react"
import CommentsDialog from "./comments-dialog"
import { Heart, MessageCircle, Clapperboard } from "lucide-react"
import { usePostLikes } from "@/hooks/usePostLikes"
import { Post } from "@/types/post"

const PostGridItem = ({ post }: { post: Post }) => {
	const {
		liked,
		bookmarked,
		likesCount,
		bookmarksCount,
		toggleBookmark,
		toggleLike,
	} = usePostLikes(post._id, post.isBookmarked, post.bookmarksCount, post.likes)

	return (
		<CommentsDialog
			key={post._id}
			postData={post}
			isLiked={liked}
			isBookmarked={bookmarked}
			likesCount={likesCount}
			bookmarksCount={bookmarksCount}
			toggleLike={toggleLike}
			toggleBookmark={toggleBookmark}
		>
			<button type="button" aria-label={`Ouvrir la publication de ${post.author.username}`} className="block w-full aspect-square relative cursor-pointer group">
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img src={post.image || "/reseau/avatar.svg"} alt={post.caption ? post.caption.slice(0, 80) : `Publication de ${post.author.username}`} loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover bg-gray-100" />
				{post.video && <Clapperboard className="absolute top-2 right-2 w-5 h-5 text-white drop-shadow" aria-label="Vidéo" />}

				{/* Hover overlay */}
				<div className="absolute group inset-0 hover:bg-black/40 transition-all duration-200 flex items-center justify-center">
					<div className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-center">
						<div className="flex items-center gap-4">
							<span className="flex items-center gap-1">
								<Heart className="w-5 h-5 fill-current" />{" "}
								{post.likes ? post.likes.length : 0}
							</span>
							<span className="flex items-center gap-1">
								<MessageCircle className="w-5 h-5 fill-current" />{" "}
								{post.commentsCount ? post.commentsCount : 0}
							</span>
						</div>
					</div>
				</div>
			</button>
		</CommentsDialog>
	)
}

export default PostGridItem
