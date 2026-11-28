// 28/11 : envoyer une vidéo. Petite (16 Mo au plus) : en une fois, dans le formulaire. Grosse : par morceaux de 8 Mo
// (route /envoi, recollés dans l'ordre sur le serveur, chaque morceau réessayé 3 fois), puis le formulaire ne donne que son numéro.
// Ainsi une longue vidéo d'Anis ne bute plus sur le temps d'envoi d'une seule requête. Les autres membres restent à 80 Mo (vérifié par le serveur).
import axios_instance from "@/config/axios"

const MORCEAU = 8 * 1024 * 1024
const attends = (ms: number) => new Promise((r) => setTimeout(r, ms))

export async function ajouteVideo(fd: FormData, f: File, progres?: (pourcent: number) => void) {
	if (f.size <= 2 * MORCEAU) { fd.append("video", f); return }
	const id = Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, "0")).join("")
	let debut = 0
	while (debut < f.size) {
		const m = new FormData()
		m.append("id", id); m.append("debut", String(debut)); m.append("morceau", f.slice(debut, debut + MORCEAU), "morceau")
		let r: any = null
		for (let essai = 0; ; essai++) {
			try { r = await axios_instance.post("/envoi", m) } catch { r = null }
			if (r && (r.data?.success || r.status === 409)) break
			if (r && (r.status === 413 || r.status === 415 || r.status === 400)) throw new Error(r.data?.message || "La vidéo n'est pas partie")
			if (essai >= 3) throw new Error("La connexion a coupé pendant l'envoi de la vidéo. Réessaie.")
			await attends(1500 * (essai + 1))
		}
		debut = Number(r.data.recu) || 0
		progres?.(Math.min(99, Math.round((debut / f.size) * 100)))
	}
	fd.append("envoi", id)
}
