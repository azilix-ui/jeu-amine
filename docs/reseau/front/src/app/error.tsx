"use client"
// 28/11 : au lieu de « Application error », un message clair, la page qui se recharge, et l'erreur notée sur le serveur.
import { useEffect } from "react"

export default function Erreur({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
	useEffect(() => { try { (window as any).__mcNote?.(error?.name + ": " + error?.message, error?.stack) } catch {} }, [error])
	return (
		<div className="min-h-dvh flex flex-col items-center justify-center gap-4 p-6 text-center">
			<p className="text-5xl">🌼</p>
			<h1 className="text-xl font-bold">Oups, Mechmoum a eu un petit souci.</h1>
			<p className="text-gray-600">Touche « Recharger ». Si ça recommence, préviens papa.</p>
			<div className="flex gap-3">
				<button type="button" onClick={() => location.reload()} className="rounded-xl bg-gray-900 px-5 py-3 font-bold text-white">Recharger</button>
				<button type="button" onClick={() => reset()} className="rounded-xl border px-5 py-3 font-bold">Réessayer</button>
			</div>
			<a href="/" className="text-sm text-gray-500 underline">Revenir au site de la famille</a>
		</div>
	)
}
