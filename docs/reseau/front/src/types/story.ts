export type Story = {
	_id: string
	image: string | null
	type?: "image" | "video"
	video?: string | null
	viewersCount?: number
	filtre?: string
	musique?: { src: string; volV: number; volM: number; titre?: string } | null
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
