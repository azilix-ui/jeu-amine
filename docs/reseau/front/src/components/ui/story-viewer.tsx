"use client"
// Regarder les stories en plein écran : une barre de progression par story, toucher à gauche / à droite pour reculer / avancer,
// appuyer longtemps pour faire pause. Sa propre story : qui l'a vue, et la supprimer. Celle d'un autre : la signaler.
import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { X, Pause, Play, Eye, Trash2, Flag, Volume2, VolumeX } from "lucide-react"
import { type Story } from "@/types/story"
import { useUserStore } from "@/store/store"
import { useStories } from "@/hooks/useStories"
import axios_instance from "@/config/axios"
import Signaler from "@/components/ui/signaler"
import { profil, ilya } from "@/lib/utils"

interface StoryViewerProps {
	stories: { [userId: string]: Story[] }
	initialUserId: string
	onClose: () => void
	onStoryView?: (storyId: string) => void
}

const DUREE_PHOTO = 6000

const StoryViewer = ({ stories, initialUserId, onClose, onStoryView }: StoryViewerProps) => {
	const userIds = Object.keys(stories)
	const [iu, setIu] = useState(Math.max(0, userIds.indexOf(initialUserId)))
	const [is, setIs] = useState(0)
	const [pause, setPause] = useState(false)
	const [progres, setProgres] = useState(0)
	const [muet, setMuet] = useState(true)
	const [vus, setVus] = useState<any[] | null>(null)
	const [signal, setSignal] = useState(false)
	const moiId = useUserStore((s) => s._id)
	const admin = useUserStore((s) => !!s.admin)
	const { deleteStory } = useStories()
	const deja = useRef<Set<string>>(new Set())
	const video = useRef<HTMLVideoElement>(null)
	const appui = useRef<number>(0)
	const progresRef = useRef(0)

	const liste = stories[userIds[iu]] || []
	const story = liste[is]
	const mienne = story?.author._id === moiId

	const suivante = useCallback(() => {
		progresRef.current = 0
		setProgres(0)
		if (is < liste.length - 1) setIs(is + 1)
		else if (iu < userIds.length - 1) {
			setIu(iu + 1)
			setIs(0)
		} else onClose()
	}, [is, iu, liste.length, userIds.length, onClose])

	const precedente = useCallback(() => {
		progresRef.current = 0
		setProgres(0)
		if (is > 0) setIs(is - 1)
		else if (iu > 0) {
			const l = stories[userIds[iu - 1]] || []
			setIu(iu - 1)
			setIs(Math.max(0, l.length - 1))
		}
	}, [is, iu, stories, userIds])

	// la minuterie : 6 s pour une photo, la durée de la vidéo pour une vidéo
	const arretee = pause || signal || vus !== null
	useEffect(() => {
		if (!story || arretee) return
		if (story.video) {
			const v = video.current
			if (!v) return
			v.play().catch(() => {})
			const maj = () => setProgres(v.duration ? (v.currentTime / v.duration) * 100 : 0)
			v.addEventListener("timeupdate", maj)
			v.addEventListener("ended", suivante)
			return () => {
				v.pause()
				v.removeEventListener("timeupdate", maj)
				v.removeEventListener("ended", suivante)
			}
		}
		const debut = performance.now() - (progresRef.current / 100) * DUREE_PHOTO
		let id = 0
		const tic = (t: number) => {
			const p = ((t - debut) / DUREE_PHOTO) * 100
			if (p >= 100) return suivante()
			progresRef.current = p
			setProgres(p)
			id = requestAnimationFrame(tic)
		}
		id = requestAnimationFrame(tic)
		return () => cancelAnimationFrame(id)
	}, [story, arretee, suivante])

	useEffect(() => {
		if (story && onStoryView && !deja.current.has(story._id)) {
			deja.current.add(story._id)
			onStoryView(story._id)
		}
	}, [story, onStoryView])

	useEffect(() => {
		const k = (e: KeyboardEvent) => {
			if (e.key === "ArrowLeft") precedente()
			else if (e.key === "ArrowRight") suivante()
			else if (e.key === "Escape") onClose()
			else if (e.key === " ") {
				e.preventDefault()
				setPause((p) => !p)
			}
		}
		document.addEventListener("keydown", k)
		return () => document.removeEventListener("keydown", k)
	}, [precedente, suivante, onClose])

	useEffect(() => {
		const avant = document.body.style.overflow
		document.body.style.overflow = "hidden"
		return () => {
			document.body.style.overflow = avant
		}
	}, [])

	if (!story) return null

	const voirQui = async () => {
		const { data } = await axios_instance.get(`/stories/${story._id}/viewers`)
		setVus(data.success ? data.data : [])
	}
	const supprimer = (msg: string) => {
		if (!confirm(msg)) return
		deleteStory(story._id)
		onClose()
	}
	const bouton = "flex h-11 w-11 items-center justify-center rounded-full text-white hover:bg-white/15 cursor-pointer"
	const nbVues = story.viewersCount ?? story.viewers?.length ?? 0

	return (
		<div className="fixed inset-0 z-50 bg-black flex items-center justify-center select-none" role="dialog" aria-label={`Story de ${story.author.username}`}>
			<div className="relative w-full h-full sm:h-[94dvh] sm:w-auto sm:aspect-[9/16] sm:max-w-full sm:rounded-2xl overflow-hidden bg-neutral-900">
				{story.video ? (
					<video key={story._id} ref={video} src={story.video} poster={story.image || undefined} muted={muet} playsInline preload="auto" className="absolute inset-0 w-full h-full object-contain" />
				) : (
					// eslint-disable-next-line @next/next/no-img-element
					<img key={story._id} src={story.image || ""} alt={`Story de ${story.author.username}`} className="absolute inset-0 w-full h-full object-contain" />
				)}

				{/* zones de toucher : un tiers à gauche = reculer, le reste = avancer ; appui long = pause */}
				<div
					className="absolute inset-0 z-10"
					onPointerDown={() => {
						appui.current = Date.now()
						setPause(true)
					}}
					onPointerUp={(e) => {
						const long = Date.now() - appui.current > 350
						setPause(false)
						if (long) return
						const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
						if (e.clientX - r.left < r.width / 3) precedente()
						else suivante()
					}}
					onPointerLeave={() => setPause(false)}
				/>

				<div className="absolute top-0 inset-x-0 z-20 p-3 bg-gradient-to-b from-black/60 to-transparent" style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}>
					<div className="flex gap-1 mb-3">
						{liste.map((s, i) => (
							<div key={s._id} className="flex-1 h-[3px] bg-white/35 rounded-full overflow-hidden">
								<div className="h-full bg-white" style={{ width: i < is ? "100%" : i === is ? `${progres}%` : "0%" }} />
							</div>
						))}
					</div>
					<div className="flex items-center gap-1">
						<Link href={profil(story.author.username)} className="flex items-center gap-2 min-w-0 flex-1" onClick={onClose}>
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img src={story.author.image || "/reseau/avatar.svg"} alt="" className="w-9 h-9 rounded-full object-cover border border-white/60" />
							<span className="text-white font-bold text-sm truncate">{story.author.username}</span>
							<span className="text-white/70 text-xs shrink-0">{ilya(story.createdAt)}</span>
						</Link>
						{story.video && (
							<button type="button" className={bouton} aria-label={muet ? "Mettre le son" : "Couper le son"} onClick={() => setMuet(!muet)}>
								{muet ? <VolumeX size={20} /> : <Volume2 size={20} />}
							</button>
						)}
						<button type="button" className={bouton} aria-label={pause ? "Reprendre" : "Pause"} onClick={() => setPause(!pause)}>
							{pause ? <Play size={20} /> : <Pause size={20} />}
						</button>
						{!mienne && (
							<button type="button" className={bouton} aria-label="Signaler cette story" onClick={() => setSignal(true)}>
								<Flag size={18} />
							</button>
						)}
						<button type="button" className={bouton} aria-label="Fermer" onClick={onClose}>
							<X size={24} />
						</button>
					</div>
				</div>

				{(mienne || admin) && (
					<div className="absolute bottom-0 inset-x-0 z-20 flex items-center justify-between p-3 bg-gradient-to-t from-black/60 to-transparent" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
						{mienne ? (
							<button type="button" onClick={voirQui} className="flex min-h-11 items-center gap-2 rounded-full px-4 text-white font-semibold hover:bg-white/15 cursor-pointer">
								<Eye size={20} /> {nbVues} vue{nbVues > 1 ? "s" : ""}
							</button>
						) : (
							<span />
						)}
						<button type="button" aria-label="Supprimer cette story" className={bouton} onClick={() => supprimer(mienne ? "Supprimer cette story ?" : "Supprimer cette story (administration) ?")}>
							<Trash2 size={20} />
						</button>
					</div>
				)}

				{vus !== null && (
					<div className="absolute inset-x-0 bottom-0 z-30 max-h-[60%] overflow-y-auto rounded-t-2xl bg-white p-4">
						<div className="flex items-center justify-between mb-2">
							<h3 className="font-bold">
								Vue par {vus.length} personne{vus.length > 1 ? "s" : ""}
							</h3>
							<button type="button" aria-label="Fermer" className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-gray-100 cursor-pointer" onClick={() => setVus(null)}>
								<X size={20} />
							</button>
						</div>
						{vus.length === 0 && <p className="text-gray-500 py-4">Personne pour l&apos;instant.</p>}
						{vus.map((u) => (
							<Link key={u._id} href={profil(u.username)} className="flex items-center gap-3 min-h-14" onClick={onClose}>
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img src={u.image || "/reseau/avatar.svg"} alt="" className="w-10 h-10 rounded-full object-cover" />
								<span className="font-semibold">{u.username}</span>
							</Link>
						))}
					</div>
				)}
			</div>
			<Signaler genre="story" cible={story._id} ouvert={signal} fermer={() => setSignal(false)} />
		</div>
	)
}

export default StoryViewer
