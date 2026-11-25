import { type Comment } from "./comment"

export type Post = {
	_id: string
	caption: string
	image: string
	type?: "image" | "video"
	video?: string | null
	author: {
		username: string
		image?: string
		emailVerified: boolean
	}
	likes: {
		username: string
		image?: string
		emailVerified: boolean
	}[]
	isBookmarked: boolean
	bookmarksCount: number
	createdAt: string
	comments: Comment[]
	commentsCount: number
}
