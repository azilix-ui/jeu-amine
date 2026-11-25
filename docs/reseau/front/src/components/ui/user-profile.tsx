// Un petit bloc « avatar + nom + texte » (légende, commentaire).
import { BadgeCheck } from "lucide-react"
import Link from "next/link"
import { profil } from "@/lib/utils"

interface UserProfileProps {
	username: string
	image?: string
	emailVerified?: boolean
	avatarSize?: number
	showVerified?: boolean
	className?: string
	text?: string
	usernameClassName?: string
	textCreatedAt?: string
}

const UserProfile = ({ username, image, emailVerified = false, avatarSize = 28, showVerified = true, text = "", textCreatedAt }: UserProfileProps) => (
	<div className="flex gap-2 items-start">
		<Link href={profil(username)} className="shrink-0">
			{/* eslint-disable-next-line @next/next/no-img-element */}
			<img src={image || "/reseau/avatar.svg"} alt="" width={avatarSize} height={avatarSize} style={{ width: avatarSize, height: avatarSize }} className="rounded-full object-cover" />
		</Link>
		<div className="flex flex-col min-w-0">
			<div className="flex gap-1 items-center">
				<Link href={profil(username)} className="font-bold">{username}</Link>
				{showVerified && emailVerified && <BadgeCheck className="size-4 text-[#0f766e]" aria-label="Famille Missaoui" />}
			</div>
			{text && <p className="text-sm whitespace-pre-wrap break-words">{text}</p>}
			{textCreatedAt && <p className="text-xs text-gray-500">{textCreatedAt}</p>}
		</div>
	</div>
)

export default UserProfile
