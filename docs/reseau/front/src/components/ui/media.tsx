"use client"
// Une photo, ou une vidéo (reel) qui se lance quand elle est à l'écran, sans le son ; un toucher remet le son.
import React, { useEffect, useRef, useState } from "react"
import { Volume2, VolumeX, Play } from "lucide-react"

export default function Media({ image, video, alt, cover = true, auto = true, className = "" }: { image?: string | null; video?: string | null; alt: string; cover?: boolean; auto?: boolean; className?: string }) {
	const ref = useRef<HTMLVideoElement>(null)
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
