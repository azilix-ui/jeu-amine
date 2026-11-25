"use client"
// Signaler un contenu à l'administration (papa). Raisons simples, adaptées aux enfants.
import React, { useState } from "react"
import toast from "react-hot-toast"
import axios_instance from "@/config/axios"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const RAISONS = [
	["mechant", "😠 C'est méchant ou moqueur"],
	["fait-peur", "😨 Ça me fait peur ou me met mal à l'aise"],
	["prive", "🔒 Ça montre quelque chose de privé"],
	["faux", "🤥 C'est faux ou c'est une arnaque"],
	["autre", "💬 Autre chose"],
] as const

export default function Signaler({ genre, cible, ouvert, fermer }: { genre: "post" | "comment" | "story" | "user" | "message"; cible: string; ouvert: boolean; fermer: () => void }) {
	const [detail, setDetail] = useState("")
	const envoyer = async (raison: string) => {
		try {
			const { data } = await axios_instance.post("/signalements", { genre, cible: Number(cible), raison, detail })
			if (!data.success) throw new Error(data.message)
			toast.success(data.message || "Merci, l'administration va regarder.")
			setDetail("")
			fermer()
		} catch (e: any) {
			toast.error(e?.message || "Le signalement n'est pas parti")
		}
	}
	return (
		<Dialog open={ouvert} onOpenChange={(o) => !o && fermer()}>
			<DialogContent className="max-w-sm">
				<DialogHeader>
					<DialogTitle>Signaler</DialogTitle>
					<DialogDescription>Papa (l&apos;administration) sera prévenu. Personne d&apos;autre ne saura que c&apos;est toi.</DialogDescription>
				</DialogHeader>
				<div className="flex flex-col gap-2">
					{RAISONS.map(([c, t]) => (
						<button key={c} type="button" onClick={() => envoyer(c)} className="min-h-12 rounded-xl border border-gray-200 px-4 text-left font-semibold hover:bg-gray-50 active:bg-gray-100 cursor-pointer">
							{t}
						</button>
					))}
					<textarea value={detail} onChange={(e) => setDetail(e.target.value)} maxLength={500} placeholder="Tu peux expliquer (facultatif)…"
						className="mt-1 min-h-16 rounded-xl border border-gray-300 p-3 text-sm outline-none focus:border-gray-500" />
				</div>
			</DialogContent>
		</Dialog>
	)
}
