// Mechmoum (مشموم) : le petit bouquet de jasmin que l'on porte à l'oreille en Tunisie. Logo dessiné pour le réseau de la famille.
import React, { useId } from "react"

export const Fleur = ({ taille = 28 }: { taille?: number }) => {
	const id = "mc-tige" + useId().replace(/:/g, "")
	return (
	<svg width={taille} height={taille} viewBox="0 0 64 64" aria-hidden="true">
		<defs>
			<linearGradient id={id} x1="0" x2="1">
				<stop offset="0" stopColor="#0f766e" />
				<stop offset="1" stopColor="#1f5fbf" />
			</linearGradient>
		</defs>
		<rect x="2" y="2" width="60" height="60" rx="18" fill={`url(#${id})`} />
		{[0, 72, 144, 216, 288].map((a) => (
			<ellipse key={a} cx="32" cy="19" rx="7.5" ry="12" fill="#fffdf6" transform={`rotate(${a} 32 32)`} />
		))}
		<circle cx="32" cy="32" r="6" fill="#e0a100" />
		<circle cx="30" cy="30" r="2" fill="#fff3c4" />
	</svg>
	)
}

const InstagramLogo = ({ compact = false }: { compact?: boolean }) => (
	<div className="flex items-center gap-2 select-none" title="Mechmoum, le réseau de la famille Missaoui">
		<Fleur taille={compact ? 30 : 34} />
		{!compact && (
			<span className="flex flex-col leading-none">
				<span className="mc-logo text-[28px] text-gray-900 dark:text-gray-50">Mechmoum</span>
				<span className="text-[11px] text-gray-500 font-semibold tracking-wide" dir="rtl" lang="ar">
					مشموم · famille Missaoui
				</span>
			</span>
		)}
	</div>
)

export default InstagramLogo
