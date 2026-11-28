"use client"
// Les Shorts (27/11) : les petites vidéos YouTube choisies par le papa dans l'Administration (chaînes et vidéos), l'une après l'autre en plein écran,
// comme les reels. Une seule vidéo YouTube est chargée à la fois (lecteur officiel youtube-nocookie) ; les autres sont des vignettes.
// Quand une vidéo finit, on passe à la suivante toute seule.
import { useEffect, useRef, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Volume2, VolumeX, Youtube, ChevronDown } from "lucide-react"
import Cadre from "@/components/Cadre"
import axios_instance from "@/config/axios"

type Short = { id: string; titre: string; chaine?: string }
const YT = "https://www.youtube-nocookie.com"

function Lecteur({ s, chaine, actif, son, setSon, suivante }: { s: Short; chaine: string; actif: boolean; son: boolean; setSon: (b: boolean) => void; suivante: () => void }) {
	const cadre = useRef<HTMLIFrameElement>(null)
	const [pret, setPret] = useState(false)
	const ordre = (func: string, args: unknown[] = []) => cadre.current?.contentWindow?.postMessage(JSON.stringify({ event: "command", func, args }), YT)

	// les nouvelles du lecteur : la fin de la vidéo (état 0) → la suivante
	useEffect(() => {
		if (!actif) return
		const ecoute = (e: MessageEvent) => {
			if (e.source !== cadre.current?.contentWindow) return
			let d: any
			try { d = typeof e.data === "string" ? JSON.parse(e.data) : e.data } catch { return }
			if (d?.event === "onReady") setPret(true)
			const etat = d?.event === "onStateChange" ? d.info : d?.info?.playerState
			if (etat === 0) suivante()
		}
		window.addEventListener("message", ecoute)
		return () => window.removeEventListener("message", ecoute)
	}, [actif, suivante])

	useEffect(() => { if (!actif) setPret(false) }, [actif])
	useEffect(() => { if (actif && pret) ordre(son ? "unMute" : "mute") }, [son, pret, actif])

	const charge = () => {   // on s'abonne aux nouvelles du lecteur
		const w = cadre.current?.contentWindow
		if (!w) return
		const t = [0, 400, 1200].map((ms) => setTimeout(() => w.postMessage(JSON.stringify({ event: "listening", id: s.id }), YT), ms))
		setTimeout(() => t.forEach(clearTimeout), 1500)
	}

	return (
		<section className="mc-reel relative flex items-center justify-center bg-black" aria-label={s.titre || "Short"}>
			<div className="relative h-full w-full max-w-[min(100%,calc(100dvh*9/16))] overflow-hidden">
				{actif ? (
					<iframe
						ref={cadre}
						key={s.id}
						onLoad={charge}
						src={`${YT}/embed/${s.id}?autoplay=1&mute=${son ? 0 : 1}&playsinline=1&rel=0&modestbranding=1&iv_load_policy=3&enablejsapi=1&origin=${encodeURIComponent(location.origin)}`}
						title={s.titre || "Short"}
						allow="autoplay; encrypted-media; picture-in-picture"
						referrerPolicy="strict-origin-when-cross-origin"
						className="absolute inset-0 h-full w-full border-0"
					/>
				) : (
					// eslint-disable-next-line @next/next/no-img-element
					<img src={`https://i.ytimg.com/vi/${s.id}/hqdefault.jpg`} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-70" />
				)}
				{actif && (
					<button type="button" onClick={() => { setSon(!son); if (!son) ordre("playVideo") }} aria-label={son ? "Couper le son" : "Mettre le son"}
						className="absolute top-3 right-3 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-black/45 text-white cursor-pointer">
						{son ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
					</button>
				)}
				<p className="pointer-events-none absolute left-3 right-16 bottom-28 md:bottom-16 z-10 text-white text-sm font-bold drop-shadow line-clamp-2">▶ {chaine}{s.titre ? ` · ${s.titre}` : ""}</p>
			</div>
		</section>
	)
}

export default function ShortsPage() {
	const { data, isLoading } = useQuery({ queryKey: ["shorts"], queryFn: async () => (await axios_instance.get("/shorts")).data, staleTime: 30 * 60 * 1000 })
	const liste: Short[] = data?.data || []
	const [actif, setActif] = useState(0)
	const [son, setSon] = useState(false)
	const zone = useRef<HTMLDivElement>(null)

	// la vidéo visible devient la vidéo active
	useEffect(() => {
		const z = zone.current
		if (!z || !liste.length) return
		const o = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setActif(Number((e.target as HTMLElement).dataset.i))), { root: z, threshold: 0.6 })
		z.querySelectorAll<HTMLElement>("[data-i]").forEach((el) => o.observe(el))
		return () => o.disconnect()
	}, [liste.length])

	const va = (i: number) => zone.current?.querySelector<HTMLElement>(`[data-i="${i}"]`)?.scrollIntoView({ behavior: "smooth" })
	const suivanteRef = useRef(() => {})
	suivanteRef.current = () => va(actif + 1 < liste.length ? actif + 1 : 0)
	const [suivante] = useState(() => () => suivanteRef.current())

	return (
		<Cadre plein>
			<div ref={zone} className="mc-reels flex-1 min-w-0 bg-black mc-sans-barre">
				{isLoading && <div className="mc-reel flex items-center justify-center text-white text-4xl">🌼</div>}
				{!isLoading && liste.length === 0 && (
					<div className="mc-reel flex flex-col items-center justify-center gap-3 p-6 text-center text-white">
						<Youtube className="w-16 h-16 opacity-70" />
						<p className="text-xl font-bold">Les shorts ne sont pas arrivés</p>
						<p className="text-white/70">YouTube n'a pas répondu. Réessaie un peu plus tard.</p>
					</div>
				)}
				{liste.map((s, i) => (
					<div key={s.id} data-i={i} className="h-full">
						<Lecteur s={s} chaine={s.chaine || data?.chaine || "YouTube"} actif={i === actif} son={son} setSon={setSon} suivante={suivante} />
					</div>
				))}
				{liste.length > 0 && actif === 0 && (
					<button type="button" onClick={() => va(1)} aria-label="Short suivant" className="fixed bottom-24 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 rounded-full bg-white/85 px-4 py-2 text-sm font-bold text-gray-900 shadow md:bottom-6">
						<ChevronDown className="w-5 h-5" /> Glisse vers le haut
					</button>
				)}
			</div>
		</Cadre>
	)
}
