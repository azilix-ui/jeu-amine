"use client"
// Une publication ouverte en grand avec ses commentaires. PC/iPad paysage : image à gauche, commentaires à droite. Téléphone : l'un sous l'autre.
import { useState } from "react"
import { Heart, MessageSquare, Trash2, Flag } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import PostActions from "@/components/ui/post-actions"
import PostHeader from "@/components/ui/post-header"
import UserProfile from "@/components/ui/user-profile"
import Media from "@/components/ui/media"
import Signaler from "@/components/ui/signaler"
import { type Post } from "@/types/post"
import { type Comment } from "@/types/comment"
import { usePostComments } from "@/hooks/usePostComments"
import { useUserStore } from "@/store/store"
import { ilya } from "@/lib/utils"

interface CommentsDialogProps {
	postData: Post
	children: React.ReactNode
	isLiked: boolean
	isBookmarked: boolean
	setLiked?: React.Dispatch<React.SetStateAction<boolean>>
	likesCount: number
	bookmarksCount: number
	toggleLike: () => void
	toggleBookmark: () => void
}

const CommentsDialog = ({ postData, children, isLiked, isBookmarked, setLiked, likesCount, bookmarksCount, toggleLike, toggleBookmark }: CommentsDialogProps) => {
	const [showHeartAnimation, setShowHeartAnimation] = useState(false)
	const [dialogOpen, setDialogOpen] = useState(false)
	const [aSignaler, setASignaler] = useState<string | null>(null)
	const { comments, addComment, removeComment } = usePostComments(postData._id)
	const moi = useUserStore((s) => s.username)
	const admin = useUserStore((s) => !!s.admin)
	const auteurPost = postData.author.username === moi

	const handleDoubleClick = () => {
		if (!isLiked) {
			toggleLike()
			setLiked?.(true)
		}
		setShowHeartAnimation(true)
		setTimeout(() => setShowHeartAnimation(false), 800)
	}

	return (
		<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="p-0 gap-0 w-[100vw] max-w-[100vw] h-[100dvh] sm:rounded-2xl sm:w-[92vw] sm:max-w-[1100px] sm:h-[86dvh] overflow-hidden">
				<DialogTitle className="sr-only">Publication de {postData.author.username}</DialogTitle>
				<div className="flex flex-col md:flex-row h-full min-h-0">
					<div className="relative bg-black shrink-0 h-[42dvh] md:h-full md:w-[55%]" onDoubleClick={handleDoubleClick}>
						<Media image={postData.image} video={postData.video} musique={postData.musique} filtre={postData.filtre} alt={`Publication de ${postData.author.username}`} cover={false} />
						<AnimatePresence>
							{showHeartAnimation && (
								<motion.div key="heart" className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
									initial={{ scale: 0, opacity: 0 }} animate={{ scale: [0, 1.2, 0.95, 1.1, 1], opacity: [0, 1, 1, 1, 1, 0] }}
									exit={{ scale: 1, opacity: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}>
									<Heart className="w-20 h-20 text-white fill-white drop-shadow-lg" />
								</motion.div>
							)}
						</AnimatePresence>
					</div>

					<div className="flex-1 min-h-0 flex flex-col md:border-l bg-white">
						<div className="px-3 py-2 border-b pr-12">
							<PostHeader username={postData.author.username} userAvatar={postData.author.image} famille={postData.author.emailVerified}
								postId={postData._id} createdAt={postData.createdAt} onDeleted={() => setDialogOpen(false)} />
						</div>

						<div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 text-sm">
							{postData.caption && (
								<UserProfile username={postData.author.username} image={postData.author.image} emailVerified={postData.author.emailVerified}
									avatarSize={34} text={postData.caption} textCreatedAt={ilya(postData.createdAt)} />
							)}
							<div className="flex items-center gap-2 text-gray-500 font-semibold">
								<MessageSquare className="w-4 h-4" /> {comments?.length ? `${comments.length} commentaire${comments.length > 1 ? "s" : ""}` : "Pas encore de commentaire. Sois le premier !"}
							</div>
							{comments?.map((comment: Comment) => {
								if (typeof comment !== "object" || !comment._id) return null
								const peutSuppr = comment.author.username === moi || auteurPost || admin
								return (
									<div key={comment._id} className="group flex gap-2 items-start">
										<div className="flex-1 min-w-0">
											<UserProfile username={comment.author.username} image={comment.author.image} emailVerified={comment.author.emailVerified}
												avatarSize={34} text={comment.text} textCreatedAt={ilya(comment.createdAt)} />
										</div>
										{comment.author.username !== moi && (
											<button type="button" aria-label="Signaler ce commentaire" onClick={() => setASignaler(comment._id)}
												className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 cursor-pointer">
												<Flag className="w-4 h-4" />
											</button>
										)}
										{peutSuppr && (
											<button type="button" aria-label="Supprimer ce commentaire" onClick={() => confirm("Supprimer ce commentaire ?") && removeComment(comment._id)}
												className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-red-50 hover:text-red-600 cursor-pointer">
												<Trash2 className="w-4 h-4" />
											</button>
										)}
									</div>
								)
							})}
						</div>
						<div className="border-t p-3" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
							<PostActions isLiked={isLiked} isBookmarked={isBookmarked} likesCount={likesCount} bookmarksCount={bookmarksCount}
								onToggleLike={toggleLike} onToggleBookmark={toggleBookmark} addComment={addComment} postId={postData._id} />
						</div>
					</div>
				</div>
				<Signaler genre="comment" cible={aSignaler || "0"} ouvert={!!aSignaler} fermer={() => setASignaler(null)} />
			</DialogContent>
		</Dialog>
	)
}

export default CommentsDialog
