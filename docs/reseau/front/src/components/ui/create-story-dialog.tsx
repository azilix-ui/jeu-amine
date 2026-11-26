"use client"
// Publier une story (photo ou petite vidéo) qui disparaît au bout de 24 heures.
import { useState, useRef } from "react"
import { Upload } from "lucide-react"
import toast from "react-hot-toast"
import { Dialog, DialogContent, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { useStories } from "@/hooks/useStories"
import { vignetteVideo } from "@/components/ui/create-post-dialog"
import ChoixEffets, { EFFETS0, type Effets } from "@/components/ui/choix-effets"
import { filtreCss } from "@/lib/filtres"

const CreateStoryDialog = ({ children }: { children: React.ReactNode }) => {
	const [isOpen, setIsOpen] = useState(false)
	const [fichier, setFichier] = useState<File | null>(null)
	const [apercu, setApercu] = useState<string | null>(null)
	const [envoi, setEnvoi] = useState(false)
	const [effets, setEffets] = useState<Effets>(EFFETS0)
	const ref = useRef<HTMLInputElement>(null)
	const { createStory } = useStories()
	const video = !!fichier && fichier.type.startsWith("video/")

	const fermer = () => {
		setIsOpen(false); setFichier(null); setEffets(EFFETS0)
		if (apercu) URL.revokeObjectURL(apercu)
		setApercu(null)
		if (ref.current) ref.current.value = ""
	}
	const partager = async () => {
		if (!fichier) return
		setEnvoi(true)
		createStory(fichier, video ? await vignetteVideo(fichier) : null, effets)
		setEnvoi(false)
		fermer()
	}

	return (
		<Dialog open={isOpen} onOpenChange={(o) => (o ? setIsOpen(true) : fermer())}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="p-0 gap-0 grid-cols-1 [&>*]:min-w-0 max-w-[calc(100%-1rem)] sm:max-w-md max-h-[92dvh] overflow-y-auto">
				<div className="flex items-center justify-center p-4 border-b">
					<DialogTitle className="text-lg font-bold">Nouvelle story</DialogTitle>
					<DialogDescription className="sr-only">Une photo ou une petite vidéo visible 24 heures par tes abonnés</DialogDescription>
				</div>
				<div className="p-5">
					{!apercu ? (
						<button type="button" onClick={() => ref.current?.click()}
							className="w-full aspect-[9/16] max-h-[60dvh] border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-gray-400 hover:bg-gray-50 cursor-pointer">
							<Upload className="w-10 h-10 text-gray-400" />
							<span className="font-bold text-gray-700">Choisir une photo ou une vidéo</span>
							<span className="text-sm text-gray-500 px-6 text-center">Ta story restera visible 24 heures pour tes abonnés.</span>
						</button>
					) : (
						<div className="space-y-4 min-w-0">
							<div className="relative w-full aspect-[9/16] max-h-[42dvh] mx-auto rounded-2xl overflow-hidden bg-black">
								{video ? (
									<video src={apercu} className="absolute inset-0 w-full h-full object-contain" style={{ filter: filtreCss(effets.filtre) }} autoPlay muted loop playsInline />
								) : (
									// eslint-disable-next-line @next/next/no-img-element
									<img src={apercu} alt="Aperçu de la story" className="absolute inset-0 w-full h-full object-contain" style={{ filter: filtreCss(effets.filtre) }} />
								)}
							</div>
							<ChoixEffets preview={apercu} estVideo={video} valeur={effets} change={setEffets} ouvert={isOpen} />
							<div className="flex gap-3">
								<button type="button" onClick={() => { if (apercu) URL.revokeObjectURL(apercu); setApercu(null); setFichier(null) }} className="flex-1 min-h-12 rounded-xl border border-gray-300 font-semibold cursor-pointer">Changer</button>
								<button type="button" onClick={partager} disabled={envoi} className="flex-1 min-h-12 rounded-xl mc-degrade font-bold text-white cursor-pointer disabled:opacity-50">
									{envoi ? "Envoi…" : "Partager"}
								</button>
							</div>
						</div>
					)}
					<input ref={ref} type="file" accept="image/*,video/mp4,video/quicktime,video/webm" className="sr-only"
						onChange={(e) => {
							const f = e.target.files?.[0]
							if (!f) return
							if (f.size > (f.type.startsWith("video/") ? 80 : 15) * 1024 * 1024) return toast.error("Fichier trop lourd")
							setFichier(f); setApercu(URL.createObjectURL(f))
						}} />
				</div>
			</DialogContent>
		</Dialog>
	)
}

export default CreateStoryDialog
