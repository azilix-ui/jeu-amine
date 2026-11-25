"use client"
// Publier une photo ou une vidéo (reel). Pour une vidéo, on prend une image du début comme vignette.
// 26/11 : un filtre (Jasmin, Sidi Bou, Sahara…) et une musique (celles du mur de la famille, ou son propre morceau mp3).
import React from "react"
import toast from "react-hot-toast"
import axios_instance from "@/config/axios"
import { PlusSquare, Music2, Play, Pause, X } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { FILTRES, filtreCss } from "@/lib/filtres"

export const vignetteVideo = (fichier: File): Promise<Blob | null> =>
	new Promise((ok) => {
		const v = document.createElement("video")
		v.muted = true
		v.playsInline = true
		v.preload = "auto"
		v.src = URL.createObjectURL(fichier)
		const fin = (b: Blob | null) => { URL.revokeObjectURL(v.src); ok(b) }
		v.onloadeddata = () => { try { v.currentTime = Math.min(0.5, (v.duration || 1) / 3) } catch { fin(null) } }
		v.onseeked = () => {
			const l = Math.min(1080, v.videoWidth || 720)
			const h = Math.round(l * ((v.videoHeight || 1280) / (v.videoWidth || 720)))
			const c = document.createElement("canvas")
			c.width = l; c.height = h
			c.getContext("2d")?.drawImage(v, 0, 0, l, h)
			c.toBlob((b) => fin(b), "image/jpeg", 0.85)
		}
		v.onerror = () => fin(null)
		setTimeout(() => fin(null), 8000)
	})

type Morceau = { id: string; titre: string; emoji: string; ecoute: string }

const CreatePostDialog = ({ compact = false }: { compact?: boolean }) => {
	const [caption, setCaption] = React.useState("")
	const [fichier, setFichier] = React.useState<File | null>(null)
	const [preview, setPreview] = React.useState<string>("")
	const [filtre, setFiltre] = React.useState("")
	const [musique, setMusique] = React.useState("")            // id de la musicothèque
	const [monSon, setMonSon] = React.useState<File | null>(null) // ou son propre morceau
	const [volV, setVolV] = React.useState(0.6)
	const [volM, setVolM] = React.useState(0.8)
	const [ecoute, setEcoute] = React.useState("")
	const [isLoading, setIsLoading] = React.useState(false)
	const [isOpen, setIsOpen] = React.useState(false)
	const lecteur = React.useRef<HTMLAudioElement | null>(null)
	const queryClient = useQueryClient()
	const estVideo = !!fichier && fichier.type.startsWith("video/")

	const { data: morceaux = [] } = useQuery<Morceau[]>({
		queryKey: ["musiques"],
		queryFn: async () => (await axios_instance.get("/musiques")).data.data || [],
		enabled: isOpen,
		staleTime: 3600_000,
	})

	const arreteEcoute = () => { lecteur.current?.pause(); setEcoute("") }
	const ecouter = (id: string, src: string) => {
		if (ecoute === id) return arreteEcoute()
		if (!lecteur.current) lecteur.current = new Audio()
		lecteur.current.src = src
		lecteur.current.volume = volM
		lecteur.current.play().then(() => setEcoute(id)).catch(() => toast.error("Impossible d'écouter ce morceau ici"))
	}
	const remiseAZero = () => {
		arreteEcoute()
		if (preview) URL.revokeObjectURL(preview)
		setCaption(""); setFichier(null); setPreview(""); setFiltre(""); setMusique(""); setMonSon(null)
	}

	const choisir = (e: React.ChangeEvent<HTMLInputElement>) => {
		const f = e.target.files?.[0]
		if (!f) return
		if (f.type.startsWith("video/") && f.size > 80 * 1024 * 1024) return toast.error("Cette vidéo est trop lourde (80 Mo au plus).")
		if (f.type.startsWith("image/") && f.size > 15 * 1024 * 1024) return toast.error("Cette photo est trop lourde (15 Mo au plus).")
		if (preview) URL.revokeObjectURL(preview)
		setFichier(f)
		setPreview(URL.createObjectURL(f))
	}
	const choisirSon = (e: React.ChangeEvent<HTMLInputElement>) => {
		const f = e.target.files?.[0]
		if (!f) return
		if (f.size > 15 * 1024 * 1024) return toast.error("Ce morceau est trop lourd (15 Mo au plus).")
		arreteEcoute()
		setMonSon(f); setMusique("")
	}

	const publier = async () => {
		if (!fichier) return toast.error("Choisis d'abord une photo ou une vidéo")
		if (isLoading) return
		setIsLoading(true)
		arreteEcoute()
		const fn = async () => {
			const fd = new FormData()
			fd.append("caption", caption)
			fd.append("filtre", filtre)
			if (monSon) { fd.append("son", monSon); fd.append("titreMusique", monSon.name.replace(/\.[a-z0-9]+$/i, "").slice(0, 60)) }
			else if (musique) fd.append("musique", musique)
			if (monSon || musique) { fd.append("volV", String(estVideo ? volV : 0)); fd.append("volM", String(volM)) }
			if (estVideo) {
				fd.append("video", fichier)
				const v = await vignetteVideo(fichier)
				if (v) fd.append("image", v, "vignette.jpg")
			} else fd.append("image", fichier)
			const r = await axios_instance.post("/posts/create", fd)
			if (!r.data.success) throw new Error(r.data.message)
			remiseAZero(); setIsOpen(false)
			queryClient.invalidateQueries()
		}
		toast
			.promise(fn(), {
				loading: estVideo ? "Envoi de la vidéo…" : "Publication…",
				success: estVideo ? "Ton reel est publié !" : "C'est publié !",
				error: (err) => err.message || "Quelque chose n'a pas marché",
			})
			.finally(() => setIsLoading(false))
	}

	const puce = (actif: boolean) => `shrink-0 rounded-xl border-2 ${actif ? "border-[#0f766e]" : "border-transparent"} cursor-pointer`
	return (
		<Dialog open={isOpen} onOpenChange={(o) => { setIsOpen(o); if (!o) arreteEcoute() }}>
			<DialogTrigger asChild>
				{compact ? (
					<button type="button" aria-label="Publier" title="Publier" className="flex h-11 w-11 items-center justify-center rounded-xl text-gray-800 active:bg-gray-200 cursor-pointer">
						<PlusSquare />
					</button>
				) : (
					<button type="button" title="Publier" className="flex gap-4 p-3 w-full cursor-pointer rounded-xl items-center transition-colors duration-200 hover:bg-gray-100">
						<span className="w-6 h-6 flex items-center justify-center text-gray-800"><PlusSquare /></span>
						<span className="hidden xl:inline text-base">Publier</span>
					</button>
				)}
			</DialogTrigger>
			<DialogContent className="grid-cols-1 [&>*]:min-w-0 max-w-[calc(100%-1rem)] sm:max-w-lg max-h-[92dvh] overflow-y-auto p-4 sm:p-6">
				<DialogHeader>
					<DialogTitle>Nouvelle publication</DialogTitle>
					<DialogDescription>Une photo, ou une petite vidéo qui deviendra un reel. Un filtre et une musique si tu veux.</DialogDescription>
				</DialogHeader>
				<div className="space-y-4 min-w-0">
					<label className="flex min-h-12 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-gray-300 px-4 py-3 text-center font-semibold text-gray-700 hover:bg-gray-50">
						📷 {fichier ? "Changer de photo ou de vidéo" : "Choisir une photo ou une vidéo"}
						<input type="file" accept="image/*,video/mp4,video/quicktime,video/webm" onChange={choisir} className="sr-only" />
					</label>

					{preview && (
						<>
							<div className="flex justify-center">
								{estVideo ? (
									<video src={preview} className="max-h-64 rounded-xl" style={{ filter: filtreCss(filtre) }} controls playsInline muted />
								) : (
									// eslint-disable-next-line @next/next/no-img-element
									<img src={preview} alt="Aperçu" className="max-h-64 object-contain rounded-xl" style={{ filter: filtreCss(filtre) }} />
								)}
							</div>

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
					)}

					<div>
						<Label htmlFor="legende">Légende</Label>
						<textarea id="legende" placeholder="Écris quelque chose…" value={caption} maxLength={2200}
							onChange={(e) => setCaption(e.target.value)}
							className="mt-1 w-full min-h-20 rounded-xl border border-gray-300 p-3 text-base outline-none focus:border-gray-500" />
					</div>
					<Button onClick={publier} disabled={isLoading || !fichier} className="w-full min-h-12 cursor-pointer text-base">
						{isLoading ? "Publication…" : "Publier"}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	)
}

export default CreatePostDialog
