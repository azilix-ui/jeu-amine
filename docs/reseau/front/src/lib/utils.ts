import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

// Mechmoum est servi sous /reseau/ : les liens écrits à la main (window.location, <a href>) passent par ici.
export const BASE = "/reseau"
export function lien(chemin: string) {
	return BASE + chemin
}
// Le profil de quelqu'un (pages statiques : le nom passe dans l'adresse, ?n=)
export function profil(username: string) {
	return `/u/?n=${encodeURIComponent(username)}`
}

// « il y a 3 min », « il y a 2 j » (en français)
export function ilya(date: string | Date) {
	const d = typeof date === "string" ? new Date(date) : date
	const s = Math.max(0, Math.round((Date.now() - d.getTime()) / 1000))
	if (s < 60) return "à l'instant"
	if (s < 3600) return `il y a ${Math.floor(s / 60)} min`
	if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`
	if (s < 7 * 86400) return `il y a ${Math.floor(s / 86400)} j`
	return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: d.getFullYear() === new Date().getFullYear() ? undefined : "numeric" })
}
