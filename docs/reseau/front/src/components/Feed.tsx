"use client"
// Le fil d'accueil : les stories en haut, puis les publications de ceux que l'on suit (et les siennes).
import { useState, useEffect, useCallback } from "react"
import Stories from "@/components/ui/stories"
import Posts from "@/components/ui/posts"
import { PostSkeleton } from "@/components/ui/skeleton"
import { type Post } from "@/types/post"
import axios_instance from "@/config/axios"

const usePostsData = () => {
	const [posts, setPosts] = useState<Post[]>([])
	const [isLoadingPosts, setIsLoadingPosts] = useState(true)
	const [hasMore, setHasMore] = useState(true)
	const [page, setPage] = useState(1)

	const fetchPosts = useCallback(async (page = 1, reset = true) => {
		setIsLoadingPosts(true)
		try {
			const response = await axios_instance.get(`/posts/feed?page=${page}&limit=10`)
			if (!response.data.success) throw new Error(response.data.message)
			const newPosts = response.data.data
			if (reset) setPosts(newPosts)
			else setPosts((prev) => [...prev, ...newPosts])
			setHasMore(response.data.pagination.hasMore)
			setPage(page)
		} catch {
			if (reset) setPosts([])
		} finally {
			setIsLoadingPosts(false)
		}
	}, [])

	const loadMorePosts = useCallback(async () => {
		if (!hasMore || isLoadingPosts) return
		await fetchPosts(page + 1, false)
	}, [hasMore, isLoadingPosts, fetchPosts, page])

	useEffect(() => {
		fetchPosts()
	}, [fetchPosts])

	return { posts, isLoadingPosts, hasMore, loadMore: loadMorePosts }
}

const Feed = () => {
	const { posts, isLoadingPosts, hasMore, loadMore } = usePostsData()
	return (
		<div className="flex-1 min-w-0 h-full overflow-y-auto bg-gray-50">
			<div className="mx-auto px-2 sm:px-6 py-4 md:py-6 pb-24 md:pb-6">
				<div className="max-w-[470px] mx-auto">
					<Stories />
					{isLoadingPosts && posts.length === 0 ? (
						<PostSkeleton />
					) : (
						<Posts posts={posts} isLoading={isLoadingPosts} hasMore={hasMore} onLoadMore={loadMore} />
					)}
				</div>
			</div>
		</div>
	)
}

export default Feed
