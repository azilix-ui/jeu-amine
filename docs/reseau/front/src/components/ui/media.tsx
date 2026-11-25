"use client"
// Une photo, ou une vidéo (reel) qui se lance quand elle est à l'écran, sans le son ; un toucher remet le son.
// 26/11 : le filtre choisi à la publication (CSS) et la musique jouée par-dessus (photo ou vidéo).
import React, { useEffect, useRef, useState } from "react"
import { Volume2, VolumeX, Play, Music2 } from "lucide-react"
import { filtreCss } from "@/lib/filtres"

type Musique = { src: string; volV: number; volM: number; titre?: string } | null | undefined

export default function Media({ image, video, musique, filtre, alt, cover = true, auto = true, className = "" }: { image?: string | null; video?: string | null; musique?: Musique; filtre?: string; alt: string; cover?: boolean; auto?: boolean; className?: string }) {
	const ref = useRef<HTMLVideoElement>(null)
	const son = useRef<HTMLAudioElement>(null)
	const boite = useRef<HTMLImageElement>(null)
	const [muet, setMuet] = useState(true)
	const [pause, setPause] = useState(!auto)
	const [musiqueOn, setMusiqueOn] = useState(false)
	const style = { filter: filtreCss(filtre) }

	// vidéo : lecture quand elle est à l'écran
	useEffect(() => {
		const v = ref.current
		if (!v || !auto || typeof IntersectionObserver === "undefined") return
		const o = new IntersectionObserver(
			([e]) => {
				if (e.isIntersecting && e.intersectionRatio > 0.6) v.play().then(() => setPause(false)).catch(() => setPause(true))
				else { v.pause(); setPause(true) }
			},
			{ threshold: [0, 0.6, 1] }
		)
		o.observe(v)
		return () => o.disconnect()
	}, [auto, video])

	// vidéo + musique : la musique suit la vidéo (lecture, pause, position, son coupé)
	useEffect(() => {
		const v = ref.current, a = son.current
		if (!v || !a || !musique) return
		const cale = () => { if (a.duration && Math.abs(a.currentTime - (v.currentTime % a.duration)) > 0.4) a.currentTime = v.currentTime % a.duration }
		const joue = () => { cale(); a.play().catch(() => {}) }
		const stop = () => a.pause()
		const coupe = () => { a.muted = v.muted }
		v.volume = Math.max(0, Math.min(1, musique.volV)); a.volume = Math.max(0, Math.min(1, musique.volM)); a.muted = v.muted
		v.addEventListener("play", joue); v.addEventListener("pause", stop); v.addEventListener("seeked", cale); v.addEventListener("volumechange", coupe)
		return () => { v.removeEventListener("play", joue); v.removeEventListener("pause", stop); v.removeEventListener("seeked", cale); v.removeEventListener("volumechange", coupe); a.pause() }
	}, [musique, video])

	// photo + musique : on la lance d'un toucher ; elle s'arrête quand la photo sort de l'écran
	useEffect(() => {
		const b = boite.current, a = son.current
		if (video || !b || !a || !musique || typeof IntersectionObserver === "undefined") return
		a.volume = Math.max(0, Math.min(1, musique.volM))
		const o = new IntersectionObserver(([e]) => { if (!e.isIntersecting) { a.pause(); setMusiqueOn(false) } }, { threshold: 0.2 })
		o.observe(b)
		return () => { o.disconnect(); a.pause() }
	}, [musique, video])

	const puce = musique ? (
		<span className="pointer-events-none absolute top-3 left-3 z-10 flex max-w-[70%] items-center gap-1 rounded-full bg-black/45 px-3 py-1 text-xs font-semibold text-white">
			<Music2 className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{musique.titre || "Musique"}</span>
		</span>
	) : null

	if (!video)
		return (
			<>
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img ref={boite} src={image || "/reseau/avatar.svg"} alt={alt} loading="lazy" decoding="async" style={style} className={`absolute inset-0 w-full h-full ${cover ? "object-cover" : "object-contain"} ${className}`} />
				{musique && (
					<>
						<audio ref={son} src={musique.src} loop preload="none" />
						{puce}
						<button type="button" onClick={(e) => { e.stopPropagation(); const a = son.current; if (!a) return; if (a.paused) { a.play().then(() => setMusiqueOn(true)).catch(() => {}) } else { a.pause(); setMusiqueOn(false) } }}
							aria-label={musiqueOn ? "Couper la musique" : "Écouter la musique"} className="absolute bottom-3 right-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/55 text-white">
							{musiqueOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
						</button>
					</>
				)}
			</>
		)

	const basculer = () => {
		const v = ref.current
		if (!v) return
		if (v.paused) { v.play().catch(() => {}); setPause(false) }
		else if (muet) { v.muted = false; setMuet(false) }
		else { v.pause(); setPause(true) }
	}
	return (
		<>
			{musique && <audio ref={son} src={musique.src} loop preload="auto" />}
			<video ref={ref} src={video} poster={image || undefined} muted={muet} loop playsInline preload="metadata" aria-label={alt} style={style}
				className={`absolute inset-0 w-full h-full ${cover ? "object-cover" : "object-contain"} bg-black ${className}`} onClick={basculer} />
			{puce}
			{pause && (
				<span className="pointer-events-none absolute inset-0 flex items-center justify-center">
					<span className="rounded-full bg-black/45 p-4"><Play className="w-10 h-10 text-white fill-white" /></span>
				</span>
			)}
			<button type="button" onClick={(e) => { e.stopPropagation(); const v = ref.current; if (v) { v.muted = !muet; setMuet(!muet) } }}
				aria-label={muet ? "Mettre le son" : "Couper le son"} className="absolute bottom-3 right-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/55 text-white">
				{muet ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
			</button>
		</>
	)
}
