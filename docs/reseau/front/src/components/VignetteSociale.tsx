// 28/11 : la vignette d'une vidéo Facebook ou Instagram dans les Shorts (pas d'image d'aperçu sans compte développeur)
export function Vignette({ src }: { src: string }) {
	return (
		<div className={"absolute inset-0 flex flex-col items-center justify-center gap-2 text-white " + (src === "ig" ? "bg-gradient-to-br from-amber-500 via-pink-600 to-purple-700" : "bg-gradient-to-br from-blue-600 to-blue-900")}>
			<span className="text-5xl font-black">{src === "ig" ? "◎" : "f"}</span>
			<span className="text-sm font-bold">{src === "ig" ? "Instagram" : "Facebook"}</span>
		</div>
	)
}
