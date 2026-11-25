"use client"
// Une photo, ou une vidéo (reel) qui se lance quand elle est à l'écran, sans le son ; un toucher remet le son.
import React, { useEffect, useRef, useState } from "react"
import { Volume2, VolumeX, Play } from "lucide-react"

export default function Media({ image, video, musique, alt, cover = true, auto = true, className = "" }: { image?: string | null; video?: string | null; musique?: { src: string; volV: number; volM: number } | null; alt: string; cover?: boolean; auto?: boolean; className?: string }) {
	const ref = useRef<HTMLVideoElement>(null)
	const son = useRef<HTMLAudioElement>(null)

	// une vidéo de l'ancien mur dont la musique est jouée par-dessus : la musique suit la vidéo (lecture, pause, position, son coupé)
	useEffect(() => {
		const v = ref.current, a = son.current
		if (!v || !a || !musique) return
		const cale = () => { if (a.duration && Math.abs(a.currentTime - (v.currentTime % a.duration)) > 0.4) a.currentTime = v.currentTime % a.duration }
		const joue = () => { cale(); a.play().catch(() => {}) }
		const stop = () => a.pause()
		const muet = () => { a.muted = v.muted }
		v.volume = Math.max(0, Math.min(1, musique.volV)); a.volume = Math.max(0, Math.min(1, musique.volM)); a.muted = v.muted
		v.addEventListener("play", joue); v.addEventListener("pause", stop); v.addEventListener("seeked", cale); v.addEventListener("volumechange", muet)
		return () => { v.removeEventListener("play", joue); v.removeEventListener("pause", stop); v.removeEventListener("seeked", cale); v.removeEventListener("volumechange", muet); a.pause() }
	}, [musique, video])
	const [muet, setMuet] = useState(true)
	const [pause, setPause] = useState(!auto)

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

	if (!video)
		return (
			// eslint-disable-next-line @next/next/no-img-element
			<img src={image || "/reseau/avatar.svg"} alt={alt} loading="lazy" decoding="async" className={`absolute inset-0 w-full h-full ${cover ? "object-cover" : "object-contain"} ${className}`} />
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
			<video ref={ref} src={video} poster={image || undefined} muted={muet} loop playsInline preload="metadata" aria-label={alt}
				className={`absolute inset-0 w-full h-full ${cover ? "object-cover" : "object-contain"} bg-black ${className}`} onClick={basculer} />
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
