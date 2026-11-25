import { useRef, useState } from "react"
import { Bookmark, Heart, MessageCircle } from "lucide-react"
import { motion } from "framer-motion"
import CommentInput from "./comment-input"
import UsersListDialog from "./users-list-dialog"
import CommentsDialog from "./comments-dialog"
import { Post } from "@/types/post"

interface PostActionsProps {
	isLiked: boolean
	isBookmarked: boolean
	likesCount: number
	bookmarksCount: number
	onToggleLike?: () => void
	onToggleBookmark?: () => void
	addComment?: (commentText: string) => void
	hideLikesCount?: boolean
	hideCommentInput?: boolean
	postId: string
	postData?: Post
}

const PostActions = ({
	postData,
	postId,
	isLiked,
	isBookmarked = false,
	likesCount = 0,
	bookmarksCount = 0,
	onToggleLike,
	onToggleBookmark,
	addComment,
	hideLikesCount,
	hideCommentInput,
}: PostActionsProps) => {
	const [animate, setAnimate] = useState(false)
	const commentInputRef = useRef<HTMLInputElement | null>(null)
	const likePost = async () => {
		if (onToggleLike) {
			setAnimate(true)
			setTimeout(() => setAnimate(false), 300)
			onToggleLike()
		}
	}

	const handleBookmark = async () => {
		if (onToggleBookmark) onToggleBookmark()
	}
	return (
		<div className="flex flex-col">
			<div className="flex items-center justify-between w-full">
				<div className="flex items-center gap-4">
					<button
						onClick={likePost}
						aria-label={isLiked ? "Je n'aime plus" : "J'aime"}
						className="p-2.5 -ml-2.5 hover:bg-gray-50 rounded-full transition-colors cursor-pointer"
					>
						<motion.div
							animate={animate ? { scale: [1, 1.3, 1] } : {}}
							transition={{ duration: 0.3, ease: "easeOut" }}
						>
							<Heart
								className={`w-6 h-6 transition-colors ${
									isLiked ? "text-red-500 fill-red-500" : "text-gray-700"
								}`}
							/>
						</motion.div>
					</button>
					{postData ? (
						<CommentsDialog
							postData={postData}
							isLiked={isLiked}
							isBookmarked={isBookmarked}
							likesCount={likesCount}
							bookmarksCount={bookmarksCount}
							toggleBookmark={handleBookmark}
							toggleLike={likePost}
						>
							<button aria-label="Commenter" className="p-2.5 hover:bg-gray-50 rounded-full transition-colors cursor-pointer">
								<MessageCircle
									className="w-6 h-6 text-gray-700 hover:text-gray-900 scale-x-[-1]"
									onClick={() => commentInputRef.current?.focus()}
								/>
							</button>
						</CommentsDialog>
					) : (
						<button aria-label="Commenter" className="p-2.5 hover:bg-gray-50 rounded-full transition-colors cursor-pointer">
							<MessageCircle
								className="w-6 h-6 text-gray-700 hover:text-gray-900 scale-x-[-1]"
								onClick={() => commentInputRef.current?.focus()}
							/>
						</button>
					)}

				</div>
				<button
					onClick={handleBookmark}
					aria-label={isBookmarked ? "Retirer des enregistrements" : "Enregistrer"}
					className="p-2.5 -mr-2.5 hover:bg-gray-50 rounded-full transition-colors flex items-center gap-1 cursor-pointer"
				>
					<Bookmark
						className={`w-6 h-6 transition-colors cursor-pointer ${
							isBookmarked ? "fill-gray-700" : "fill-white"
						}`}
					/>
					{bookmarksCount}
				</button>
			</div>
			{!hideLikesCount && (
				<UsersListDialog postId={postId} type="likes" title="J'aime">
					<div className="font-bold mb-2 cursor-pointer">
						{likesCount} j'aime
					</div>
				</UsersListDialog>
			)}
			{!hideCommentInput && (
				<CommentInput
					className="flex"
					postId={postId}
					addComment={addComment}
					ref={commentInputRef}
				/>
			)}
		</div>
	)
}

export default PostActions
