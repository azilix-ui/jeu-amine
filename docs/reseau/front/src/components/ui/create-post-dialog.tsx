"use client"
// Publier une photo ou une vidéo (reel). Pour une vidéo, on prend une image du début comme vignette.
// 26/11 : un filtre (Jasmin, Sidi Bou, Sahara…) et une musique (celles du mur de la famille, ou son propre morceau mp3).
import React from "react"
import toast from "react-hot-toast"
import axios_instance from "@/config/axios"
import { PlusSquare } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useQueryClient } from "@tanstack/react-query"
import { filtreCss } from "@/lib/filtres"
import ChoixEffets, { ajouteEffets, EFFETS0, type Effets } from "@/components/ui/choix-effets"

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

const CreatePostDialog = ({ compact = false }: { compact?: boolean }) => {
	const [caption, setCaption] = React.useState("")
	const [fichier, setFichier] = React.useState<File | null>(null)
	const [preview, setPreview] = React.useState<string>("")
	const [effets, setEffets] = React.useState<Effets>(EFFETS0)
	const [isLoading, setIsLoading] = React.useState(false)
	const [isOpen, setIsOpen] = React.useState(false)
	const queryClient = useQueryClient()
	const estVideo = !!fichier && fichier.type.startsWith("video/")

	const remiseAZero = () => {
		if (preview) URL.revokeObjectURL(preview)
		setCaption(""); setFichier(null); setPreview(""); setEffets(EFFETS0)
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
	const publier = async () => {
		if (!fichier) return toast.error("Choisis d'abord une photo ou une vidéo")
		if (isLoading) return
		setIsLoading(true)
		const fn = async () => {
			const fd = new FormData()
			fd.append("caption", caption)
			ajouteEffets(fd, effets, estVideo)
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

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
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
									<video src={preview} className="max-h-64 rounded-xl" style={{ filter: filtreCss(effets.filtre) }} controls playsInline muted />
								) : (
									// eslint-disable-next-line @next/next/no-img-element
									<img src={preview} alt="Aperçu" className="max-h-64 object-contain rounded-xl" style={{ filter: filtreCss(effets.filtre) }} />
								)}
							</div>

							<ChoixEffets preview={preview} estVideo={estVideo} valeur={effets} change={setEffets} ouvert={isOpen} />
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
