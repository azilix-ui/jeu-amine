// Mechmoum : toutes les requêtes vont au serveur PHP du site (/reseau/api), avec le cookie de session (HttpOnly)
// et l'en-tête X-Mechmoum qu'un autre site ne peut pas envoyer (protection contre les requêtes forgées).
import { useSessionExpiredStore } from "@/store/store"
import axios from "axios"
import toast from "react-hot-toast"
import { lien } from "@/lib/utils"

export const API = "/reseau/api"

const axios_instance = axios.create({
	baseURL: API,
	withCredentials: true,
	validateStatus: () => true,
	headers: { "X-Mechmoum": "1" },
})

axios_instance.interceptors.response.use((response) => {
	if (
		response.status === 401 &&
		typeof window !== "undefined" &&
		!window.location.pathname.startsWith(lien("/login")) &&
		!window.location.pathname.startsWith(lien("/inscription")) &&
		!useSessionExpiredStore.getState().sessionExpired
	) {
		useSessionExpiredStore.getState().setSessionExpired(true)
		toast.error("Ta session est terminée : reconnecte-toi.")
		localStorage.removeItem("user-storage")
		setTimeout(() => {
			window.location.href = lien("/login/")
		}, 1000)
	}
	return response
})

export default axios_instance
