// Mechmoum : remplace Socket.IO (impossible sur l'hébergement du site, qui n'a pas de serveur Node permanent).
// Même façon de s'en servir (socket.on, socket.emit, socket.off) ; les nouvelles arrivent en demandant
// au serveur toutes les 2,5 secondes (15 s quand l'onglet est caché) ce qui est arrivé depuis la dernière fois.
import axios_instance from "@/config/axios"

type Ecouteur = (...args: any[]) => void

export class TempsReel {
	private ecouteurs = new Map<string, Set<Ecouteur>>()
	private dernier = 0
	private minuterie: ReturnType<typeof setTimeout> | null = null
	private fini = false
	connected = true

	constructor() {
		this.tourne()
	}
	on(type: string, f: Ecouteur) {
		if (!this.ecouteurs.has(type)) this.ecouteurs.set(type, new Set())
		this.ecouteurs.get(type)!.add(f)
		return this
	}
	off(type: string, f?: Ecouteur) {
		if (!f) this.ecouteurs.delete(type)
		else this.ecouteurs.get(type)?.delete(f)
		return this
	}
	private envoie(type: string, ...args: any[]) {
		this.ecouteurs.get(type)?.forEach((f) => {
			try {
				f(...args)
			} catch (e) {
				console.error(e)
			}
		})
	}
	async emit(type: string, donnees?: any, ack?: (r: any) => void) {
		try {
			if (type === "sendMessage") {
				const r = await axios_instance.post("/messages/envoyer", donnees)
				if (r.data?.success) this.envoie("newMessage", r.data.data)
				ack?.(r.data)
				this.bientot()
			} else if (type === "messagesRead") {
				const r = await axios_instance.post("/messages/lus", donnees)
				ack?.(r.data)
			} else if (type === "typing") {
				await axios_instance.post("/messages/ecrit", donnees)
			} else ack?.({ success: true }) // likePost, commentPost, followUser : le serveur crée déjà la notification
		} catch {
			ack?.({ success: false, message: "Pas de connexion", data: null })
		}
	}
	private bientot() {
		if (this.minuterie) clearTimeout(this.minuterie)
		this.minuterie = setTimeout(() => this.tourne(), 300)
	}
	private async tourne() {
		if (this.fini) return
		try {
			const r = await axios_instance.get("/temps-reel", { params: { depuis: this.dernier } })
			if (r.data?.success) {
				this.dernier = r.data.dernier
				this.envoie("onlineUsers", r.data.enLigne)
				for (const e of r.data.evenements) this.envoie(e.type, e.donnees, e.donnees?.isFollowing)
			}
		} catch {
			/* pas de réseau : on réessaie plus tard */
		}
		if (this.fini) return
		this.minuterie = setTimeout(() => this.tourne(), typeof document !== "undefined" && document.hidden ? 15000 : 2500)
	}
	disconnect() {
		this.fini = true
		this.connected = false
		if (this.minuterie) clearTimeout(this.minuterie)
		this.ecouteurs.clear()
	}
}
