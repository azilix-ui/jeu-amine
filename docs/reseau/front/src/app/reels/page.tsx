"use client"
// Les reels : les vidéos de la famille, l'une après l'autre en plein écran ; on glisse vers le haut pour passer à la suivante.
import { useEffect, useState } from "react"
import Link from "next/link"
import { Heart, MessageCircle, Bookmark, Clapperboard } from "lucide-react"
import { useInfiniteQuery } from "@tanstack/react-query"
import Cadre from "@/components/Cadre"
import Media from "@/components/ui/media"
import CommentsDialog from "@/components/ui/comments-dialog"
import CreatePostDialog from "@/components/ui/create-post-dialog"
import axios_instance from "@/config/axios"
import { usePostLikes } from "@/hooks/usePostLikes"
import { type Post } from "@/types/post"
import { profil } from "@/lib/utils"

function Reel({ post }: { post: Post }) {
	const { liked, bookmarked, likesCount, bookmarksCount, toggleLike, toggleBookmark } = usePostLikes(post._id, post.isBookmarked, post.bookmarksCount, post.likes)
	const action = "flex flex-col items-center gap-1 text-white text-xs font-bold drop-shadow cursor-pointer"
	const rond = "flex h-12 w-12 items-center justify-center rounded-full bg-black/25 backdrop-blur-sm"
	return (
		<section className="mc-reel relative flex items-center justify-center bg-black" aria-label={`Reel de ${post.author.username}`}>
			<div className="relative h-full w-full max-w-[min(100%,calc(100dvh*9/16))]">
				<Media image={post.image} video={post.video} musique={post.musique} filtre={post.filtre} alt={post.caption || `Reel de ${post.author.username}`} cover={false} />
				<div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/70 to-transparent" />
				<div className="absolute bottom-4 left-3 right-20 text-white">
					<Link href={profil(post.author.username)} className="flex items-center gap-2 font-bold">
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img src={post.author.image || "/reseau/avatar.svg"} alt="" className="w-9 h-9 rounded-full object-cover border border-white/70" />
						{post.author.username}
					</Link>
					{post.caption && <p className="mt-2 text-sm line-clamp-3 whitespace-pre-wrap">{post.caption}</p>}
				</div>
				<div className="absolute bottom-16 right-2 flex flex-col items-center gap-4">
					<button type="button" className={action} onClick={toggleLike} aria-label={liked ? "Je n'aime plus" : "J'aime"}>
						<span className={rond}><Heart className={`w-7 h-7 ${liked ? "fill-[#ff3d6e] text-[#ff3d6e]" : ""}`} /></span>{likesCount}
					</button>
					<CommentsDialog postData={post} isLiked={liked} isBookmarked={bookmarked} likesCount={likesCount} bookmarksCount={bookmarksCount} toggleLike={toggleLike} toggleBookmark={toggleBookmark}>
						<button type="button" className={action} aria-label="Commentaires">
							<span className={rond}><MessageCircle className="w-7 h-7 scale-x-[-1]" /></span>{post.commentsCount}
						</button>
					</CommentsDialog>
					<button type="button" className={action} onClick={toggleBookmark} aria-label={bookmarked ? "Retirer des enregistrements" : "Enregistrer"}>
						<span className={rond}><Bookmark className={`w-7 h-7 ${bookmarked ? "fill-white" : ""}`} /></span>
					</button>
				</div>
			</div>
		</section>
	)
}

export default function ReelsPage() {
	const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
		queryKey: ["reels"],
		initialPageParam: 1,
		queryFn: async ({ pageParam }) => (await axios_instance.get(`/posts/reels?page=${pageParam}&limit=6`)).data,
		getNextPageParam: (d: any) => (d?.pagination?.hasMore ? d.pagination.page + 1 : undefined),
	})
	const reels: Post[] = data?.pages.flatMap((p: any) => p.data || []) || []
	const [fin, setFin] = useState<HTMLDivElement | null>(null)

	useEffect(() => {
		if (!fin || !hasNextPage) return
		const o = new IntersectionObserver(([e]) => e.isIntersecting && !isFetchingNextPage && fetchNextPage(), { rootMargin: "200%" })
		o.observe(fin)
		return () => o.disconnect()
	}, [fin, hasNextPage, isFetchingNextPage, fetchNextPage])

	return (
		<Cadre plein>
			<div className="mc-reels flex-1 min-w-0 bg-black mc-sans-barre">
				{isLoading && <div className="mc-reel flex items-center justify-center text-white text-4xl">🌼</div>}
				{!isLoading && reels.length === 0 && (
					<div className="mc-reel flex flex-col items-center justify-center gap-4 p-6 text-center text-white">
						<Clapperboard className="w-16 h-16 opacity-70" />
						<p className="text-xl font-bold">Pas encore de reel</p>
						<p className="text-white/70">Publie la première petite vidéo de la famille !</p>
						<div className="rounded-xl bg-white text-gray-900 px-2"><CreatePostDialog /></div>
					</div>
				)}
				{reels.map((p) => <Reel key={p._id} post={p} />)}
				<div ref={setFin} className="h-px" />
			</div>
		</Cadre>
	)
}
