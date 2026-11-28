"use client"
// Les licences (28/11) : s'ouvrent dans une fenêtre qu'on ferme (✕, Échap, ou toucher à côté), sans quitter Mechmoum :
// dans l'application installée, un simple lien vers le .txt n'avait pas de bouton retour.
import { useRef, useState } from "react"
import { X } from "lucide-react"

export default function Licences({ className = "" }: { className?: string }) {
	const boite = useRef<HTMLDialogElement>(null)
	const [texte, setTexte] = useState("")
	const ouvre = async () => {
		boite.current?.showModal()
		if (!texte) {
			try { const r = await fetch("/reseau/LICENCES.txt", { cache: "no-store" }); setTexte(r.ok ? await r.text() : "Les licences ne sont pas arrivées. Réessaie plus tard.") }
			catch { setTexte("Les licences ne sont pas arrivées. Réessaie plus tard.") }
		}
	}
	return (
		<>
			<button type="button" onClick={ouvre} className={"hover:underline cursor-pointer " + className}>Licences</button>
			<dialog ref={boite} onClick={(e) => { if (e.target === boite.current) boite.current?.close() }}
				className="m-auto w-[min(94vw,720px)] max-h-[85dvh] rounded-2xl p-0 shadow-2xl backdrop:bg-black/50">
				<div className="flex items-center justify-between gap-2 border-b border-gray-100 px-4 py-2 sticky top-0 bg-white">
					<h2 className="text-left font-extrabold text-lg text-gray-900">Licences</h2>
					<button type="button" onClick={() => boite.current?.close()} aria-label="Fermer" autoFocus
						className="flex h-12 w-12 items-center justify-center rounded-full hover:bg-gray-100 cursor-pointer text-gray-700"><X className="w-6 h-6" /></button>
				</div>
				<pre className="text-left whitespace-pre-wrap break-words px-4 py-3 text-xs leading-relaxed text-gray-700 font-sans overflow-auto max-h-[calc(85dvh-4rem)]">{texte || "🌼"}</pre>
			</dialog>
		</>
	)
}
