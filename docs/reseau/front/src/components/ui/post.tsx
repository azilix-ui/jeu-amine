"use client"

import { useState } from "react"
import Link from "next/link"
import Media from "@/components/ui/media"
import { profil, ilya } from "@/lib/utils"
import { Heart } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

// Local imports
import PostHeader from "@/components/ui/post-header"
import PostActions from "@/components/ui/post-actions"
import CommentsDialog from "@/components/ui/comments-dialog"
import CommentInput from "@/components/ui/comment-input"
import UsersListDialog from "@/components/ui/users-list-dialog"
import { type Post } from "@/types/post"
import { usePostComments } from "@/hooks/usePostComments"
import { usePostLikes } from "@/hooks/usePostLikes"

const Post = ({ postData }: { postData: Post }) => {
	const [showHeartAnimation, setShowHeartAnimation] = useState(false)
	const [supprime, setSupprime] = useState(false)

	const { comments, addComment } = usePostComments(postData._id)

	const {
		liked,
		bookmarked,
		likesCount,
		bookmarksCount,
		toggleLike,
		toggleBookmark,
	} = usePostLikes(
		postData._id,
		postData.isBookmarked,
		postData.bookmarksCount,
		postData.likes
	)

	const handleDoubleClick = () => {
		if (!liked) toggleLike()
		setShowHeartAnimation(true)
		setTimeout(() => setShowHeartAnimation(false), 800)
	}

	if (!postData || supprime) return null

	return (
		<article className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm max-w-[470px] mx-auto">
			{/* Post Header */}
			<div className="px-3 py-2">
				<PostHeader
					username={postData.author.username}
					userAvatar={postData.author.image}
					famille={postData.author.emailVerified}
					postId={postData._id}
					createdAt={postData.createdAt}
					onDeleted={() => setSupprime(true)}
				/>
			</div>

			{/* Post Image */}
			<div
				className={`relative ${postData.video ? "aspect-[4/5]" : "aspect-square"} cursor-pointer bg-gray-100`}
				onDoubleClick={handleDoubleClick}
			>
				<Media image={postData.image} video={postData.video} musique={postData.musique} filtre={postData.filtre} alt={`Publication de ${postData.author.username}`} />

				{/* Heart Pop Animation */}
				<AnimatePresence>
					{showHeartAnimation && (
						<motion.div
							key="heart"
							className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
							initial={{ scale: 0, opacity: 0 }}
							animate={{
								scale: [0, 1.2, 0.95, 1.1, 1],
								opacity: [0, 1, 1, 1, 1, 0],
							}}
							exit={{ scale: 1, opacity: 0 }}
							transition={{ duration: 0.8, ease: "easeOut" }}
						>
							<Heart className="w-20 h-20 text-white fill-white drop-shadow-lg" />
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			{/* Post Actions */}
			<div className="px-4 pb-4 pt-2">
				<PostActions
					postData={{ ...postData, comments }}
					isLiked={liked}
					isBookmarked={bookmarked}
					likesCount={likesCount}
					bookmarksCount={bookmarksCount}
					onToggleLike={toggleLike}
					onToggleBookmark={toggleBookmark}
					postId={postData._id}
					hideLikesCount={true}
					hideCommentInput={true}
				/>

				{/* Post Info */}
				<div>
					<UsersListDialog postId={postData._id} type="likes" title="J'aime">
						<div className="text-sm font-semibold text-gray-900 cursor-pointer hover:text-gray-700 transition-colors">
							{likesCount} {likesCount > 1 ? "j'aime" : "j'aime"}
						</div>
					</UsersListDialog>

					<div className="mt-2">
						<Link href={profil(postData.author.username)} className="text-sm font-bold text-gray-900 mr-2">
							{postData.author.username}
						</Link>
						<span className="text-sm text-gray-700">{postData.caption}</span>
					</div>

					{/* Comments Dialog */}
					{comments.length > 0 && (
						<CommentsDialog
							postData={{ ...postData, comments }}
							isLiked={liked}
							isBookmarked={bookmarked}
							likesCount={likesCount}
							bookmarksCount={bookmarksCount}
							toggleLike={toggleLike}
							toggleBookmark={toggleBookmark}
						>
							<button className="text-sm text-gray-500 hover:text-gray-700 mt-2 transition-colors cursor-pointer">
								{comments.length > 1 ? `Voir les ${comments.length} commentaires` : "Voir le commentaire"}
							</button>
						</CommentsDialog>
					)}

					{/* Comments Preview */}
					{comments && Array.isArray(comments) && comments.length > 0 && (
						<div className="mt-2 space-y-1">
							{comments.slice(0, 2).map((comment: any) => {
								if (typeof comment === "object" && comment._id) {
									return (
										<div key={comment._id} className="text-sm">
											<Link href={profil(comment.author.username)} className="font-bold text-gray-900 mr-2">
												{comment.author.username}
											</Link>
											<span className="text-gray-700">{comment.text}</span>
										</div>
									)
								}
								return null
							})}
						</div>
					)}

					{/* Timestamp */}
					<div className="text-xs text-gray-400 mt-2">{ilya(postData.createdAt)}</div>
				</div>

				{/* Comment Input */}
				<div className="mt-4 pt-4 border-t border-gray-100">
					<CommentInput postId={postData._id} addComment={addComment} />
				</div>
			</div>
		</article>
	)
}

export default Post
