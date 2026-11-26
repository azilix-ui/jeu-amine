"use client"
// Le filtre et la musique d'une publication ou d'une story (26/11) : le même choix dans les deux fenêtres.
import React from "react"
import toast from "react-hot-toast"
import { Music2, Play, Pause, X } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import axios_instance from "@/config/axios"
import { FILTRES } from "@/lib/filtres"

type Morceau = { id: string; titre: string; emoji: string; ecoute: string }
export type Effets = { filtre: string; musique: string; monSon: File | null; volV: number; volM: number }
export const EFFETS0: Effets = { filtre: "", musique: "", monSon: null, volV: 0.6, volM: 0.8 }

// à ajouter au formulaire envoyé
export function ajouteEffets(fd: FormData, e: Effets, estVideo: boolean) {
	fd.append("filtre", e.filtre)
	if (e.monSon) { fd.append("son", e.monSon); fd.append("titreMusique", e.monSon.name.replace(/\.[a-z0-9]+$/i, "").slice(0, 60)) }
	else if (e.musique) fd.append("musique", e.musique)
	if (e.monSon || e.musique) { fd.append("volV", String(estVideo ? e.volV : 0)); fd.append("volM", String(e.volM)) }
}

export default function ChoixEffets({ preview, estVideo, valeur, change, ouvert }: { preview: string; estVideo: boolean; valeur: Effets; change: (e: Effets) => void; ouvert: boolean }) {
	const { filtre, musique, monSon, volV, volM } = valeur
	const maj = (x: Partial<Effets>) => change({ ...valeur, ...x })
	const setFiltre = (filtre: string) => maj({ filtre })
	const setMusique = (musique: string) => maj({ musique })
	const setMonSon = (monSon: File | null) => maj({ monSon })
	const setVolV = (volV: number) => maj({ volV })
	const setVolM = (volM: number) => maj({ volM })
	const [ecoute, setEcoute] = React.useState("")
	const lecteur = React.useRef<HTMLAudioElement | null>(null)
	const { data: morceaux = [] } = useQuery<Morceau[]>({
		queryKey: ["musiques"],
		queryFn: async () => (await axios_instance.get("/musiques")).data.data || [],
		enabled: ouvert,
		staleTime: 3600_000,
	})
	const arreteEcoute = () => { lecteur.current?.pause(); setEcoute("") }
	React.useEffect(() => { if (!ouvert) arreteEcoute() }, [ouvert])
	React.useEffect(() => () => lecteur.current?.pause(), [])
	const ecouter = (id: string, src: string) => {
		if (ecoute === id) return arreteEcoute()
		if (!lecteur.current) lecteur.current = new Audio()
		lecteur.current.src = src
		lecteur.current.volume = volM
		lecteur.current.play().then(() => setEcoute(id)).catch(() => toast.error("Impossible d'écouter ce morceau ici"))
	}
	const choisirSon = (e: React.ChangeEvent<HTMLInputElement>) => {
		const f = e.target.files?.[0]
		if (!f) return
		if (f.size > 15 * 1024 * 1024) return toast.error("Ce morceau est trop lourd (15 Mo au plus).")
		arreteEcoute()
		maj({ monSon: f, musique: "" })
	}
	const puce = (actif: boolean) => `shrink-0 rounded-xl border-2 ${actif ? "border-[#0f766e]" : "border-transparent"} cursor-pointer`
	return (
		<>
							<div>
								<p className="mb-2 text-sm font-bold text-gray-700">✨ Filtre</p>
								<div className="flex gap-2 overflow-x-auto pb-1 mc-sans-barre" role="radiogroup" aria-label="Filtres">
									{FILTRES.map((f) => (
										<button key={f.id || "normal"} type="button" role="radio" aria-checked={filtre === f.id} onClick={() => setFiltre(f.id)} className={puce(filtre === f.id) + " flex flex-col items-center gap-1 p-1"}>
											{estVideo ? (
												<span className="block h-16 w-16 rounded-lg bg-gradient-to-br from-sky-300 via-amber-200 to-rose-300" style={{ filter: f.css }} />
											) : (
												// eslint-disable-next-line @next/next/no-img-element
												<img src={preview} alt="" className="h-16 w-16 rounded-lg object-cover" style={{ filter: f.css }} />
											)}
											<span className="text-[11px] font-semibold text-gray-700">{f.nom}</span>
										</button>
									))}
								</div>
							</div>

							<div>
								<p className="mb-2 text-sm font-bold text-gray-700 flex items-center gap-1"><Music2 className="w-4 h-4" /> Musique</p>
								{monSon ? (
									<div className="flex min-h-12 items-center gap-2 rounded-xl bg-teal-50 px-3">
										<span className="flex-1 truncate text-sm font-semibold">🎧 {monSon.name}</span>
										<button type="button" aria-label="Enlever mon morceau" onClick={() => setMonSon(null)} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white cursor-pointer"><X className="w-4 h-4" /></button>
									</div>
								) : (
									<div className="max-h-48 overflow-y-auto rounded-xl border border-gray-200 divide-y">
										<button type="button" onClick={() => { setMusique(""); arreteEcoute() }} className={`flex w-full min-h-11 items-center px-3 text-left text-sm ${musique === "" ? "bg-teal-50 font-bold" : ""} cursor-pointer`}>🔇 Pas de musique</button>
										{morceaux.map((m) => (
											<div key={m.id} className={`flex min-h-11 items-center gap-2 px-3 ${musique === m.id ? "bg-teal-50" : ""}`}>
												<button type="button" onClick={() => setMusique(m.id)} className={`flex-1 text-left text-sm ${musique === m.id ? "font-bold" : ""} cursor-pointer`}>{m.emoji} {m.titre}</button>
												<button type="button" aria-label={ecoute === m.id ? "Arrêter" : `Écouter ${m.titre}`} onClick={() => ecouter(m.id, m.ecoute)} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100 cursor-pointer">
													{ecoute === m.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
												</button>
											</div>
										))}
									</div>
								)}
								<label className="mt-2 flex min-h-11 cursor-pointer items-center justify-center rounded-xl border border-gray-300 px-3 text-sm font-semibold text-gray-700 hover:bg-gray-50">
									📁 Mon morceau (mp3, m4a…)
									<input type="file" accept="audio/*,.mp3,.m4a,.wav,.ogg" onChange={choisirSon} className="sr-only" />
								</label>
								{(musique || monSon) && (
									<div className="mt-3 space-y-2 text-sm">
										{estVideo && (
											<label className="flex items-center gap-3">
												<span className="w-32 shrink-0">🎬 Son de la vidéo</span>
												<input type="range" min={0} max={1} step={0.05} value={volV} onChange={(e) => setVolV(+e.target.value)} className="flex-1" />
											</label>
										)}
										<label className="flex items-center gap-3">
											<span className="w-32 shrink-0">🎵 Musique</span>
											<input type="range" min={0} max={1} step={0.05} value={volM} onChange={(e) => { setVolM(+e.target.value); if (lecteur.current) lecteur.current.volume = +e.target.value }} className="flex-1" />
										</label>
									</div>
								)}
							</div>
		</>
	)
}
