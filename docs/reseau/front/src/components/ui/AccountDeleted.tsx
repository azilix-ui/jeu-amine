"use client"
import { lien } from "@/lib/utils"
import { Fleur } from "@/components/ui/instagram-logo"

export default function AccountDeletionSuccess() {
	return (
		<div className="mc-fond-entree min-h-dvh flex items-center justify-center p-4">
			<div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-xl">
				<div className="flex justify-center"><Fleur taille={64} /></div>
				<h1 className="mt-4 text-2xl font-extrabold">Ton compte est supprimé</h1>
				<p className="mt-2 text-gray-600">Toutes tes données ont été effacées de Mechmoum. Merci d&apos;être passé(e) !</p>
				<a href={lien("/login/")} className="mt-6 inline-flex min-h-12 items-center rounded-xl bg-gray-900 px-6 font-bold text-white">Retour à l&apos;entrée</a>
			</div>
		</div>
	)
}
