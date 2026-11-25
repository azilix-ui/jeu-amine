"use client"
// La colonne de droite sur grand écran : qui je suis, et les membres que je pourrais suivre.
import { BadgeCheck } from "lucide-react"
import { useUserStore } from "@/store/store"
import { useSuggestedUsers } from "@/hooks/useSuggestedUsers"
import SuggestedAccountItem from "./ui/suggested-account-item"
import { profil } from "@/lib/utils"
import Link from "next/link"

const CurrentUser = () => {
	const moi = useUserStore((state) => state)
	return (
		<Link href={profil(moi.username)} className="flex items-center gap-3 py-4">
			{/* eslint-disable-next-line @next/next/no-img-element */}
			<img src={moi.image || "/reseau/avatar.svg"} alt="" width={44} height={44} className="rounded-full object-cover aspect-square" />
			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-1">
					<span className="text-sm font-bold text-gray-900 truncate">{moi.username}</span>
					{moi.emailVerified && <BadgeCheck className="w-4 h-4 text-[#0f766e] flex-shrink-0" aria-label="Famille Missaoui" />}
				</div>
				<div className="text-xs text-gray-500 truncate">{moi.name}</div>
			</div>
		</Link>
	)
}

const Suggestions = () => {
	const { data: suggested_accounts, isLoading } = useSuggestedUsers()
	return (
		<aside className="hidden lg:block w-80 xl:w-96 shrink-0 h-full overflow-y-auto pt-8 px-6 border-l border-gray-200 bg-white">
			<CurrentUser />
			<div className="mt-6">
				<div className="mb-3 text-sm font-bold text-gray-500">Suggestions pour toi</div>
				{isLoading ? (
					<div className="space-y-2 animate-pulse">
						{Array.from({ length: 4 }).map((_, i) => (
							<div key={i} className="flex items-center gap-3 py-2">
								<div className="w-11 h-11 bg-gray-200 rounded-full" />
								<div className="flex-1"><div className="h-3 bg-gray-200 rounded w-24" /></div>
							</div>
						))}
					</div>
				) : suggested_accounts && suggested_accounts.length > 0 ? (
					<div className="space-y-1">
						{suggested_accounts.slice(0, 6).map((account) => (
							<SuggestedAccountItem key={account._id || account.username} account={account} />
						))}
					</div>
				) : (
					<div className="py-4 text-gray-500 text-sm">Tu suis déjà tout le monde 🌼</div>
				)}
			</div>
			<div className="mt-8 pt-6 border-t border-gray-100 text-xs text-gray-400 space-y-1">
				<p>Mechmoum · le réseau privé de la famille Missaoui</p>
				<p>
					<a href="/" className="hover:underline">Le site de la famille</a> ·{" "}
					<a href="/reseau/LICENCES.txt" className="hover:underline">Licences</a>
				</p>
				<p>© 2026 Anis Missaoui</p>
			</div>
		</aside>
	)
}

export default Suggestions
