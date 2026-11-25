export type Story = {
	_id: string
	image: string | null
	type?: "image" | "video"
	video?: string | null
	viewersCount?: number
	author: {
		_id: string
		username: string
		image?: string
	}
	viewers: string[]
	expiresAt: string
	createdAt: string
	updatedAt: string
	hasNewStory?: boolean
	isOwn?: boolean
	isViewed?: boolean
}
