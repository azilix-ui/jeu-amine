"use client"
// Modifier son profil : photo, prénom, nom d'utilisateur (pas pour la famille), bio, pronom.
import { useState } from "react"
import { useForm } from "react-hook-form"
import { Camera } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import toast from "react-hot-toast"
import { useUserStore } from "@/store/store"
import axios_instance from "@/config/axios"
import { BASE, profil } from "@/lib/utils"

interface EditProfileDialogProps {
	children: React.ReactNode
	currentProfile: { name: string; username: string; bio: string; gender: string; image: string }
}
interface FormData { name: string; username: string; bio: string; gender: string }

const EditProfileDialog = ({ children, currentProfile }: EditProfileDialogProps) => {
	const [open, setOpen] = useState(false)
	const [apercu, setApercu] = useState<string | null>(null)
	const [fichier, setFichier] = useState<File | null>(null)
	const { setUserAsync } = useUserStore()
	const famille = useUserStore((s) => s.famille)
	const [isLoading, setIsLoading] = useState(false)
	const { register, handleSubmit, reset, watch } = useForm<FormData>()

	const ouvrir = (o: boolean) => {
		setOpen(o)
		if (o) {
			reset({ name: currentProfile.name || "", username: currentProfile.username, bio: currentProfile.bio || "", gender: currentProfile.gender || "" })
			setApercu(null); setFichier(null)
		}
	}

	const onSubmit = (d: FormData) => {
		const fd = new FormData()
		if (d.name.trim() !== (currentProfile.name || "")) fd.append("name", d.name.trim())
		if (!famille && d.username.trim().toLowerCase() !== currentProfile.username) fd.append("username", d.username.trim().toLowerCase())
		if (d.bio.trim() !== (currentProfile.bio || "")) fd.append("bio", d.bio.trim())
		if (d.gender !== (currentProfile.gender || "")) fd.append("gender", d.gender)
		if (fichier) fd.append("image", fichier)
		if ([...fd.keys()].length === 0) return setOpen(false)
		setIsLoading(true)
		toast
			.promise(
				(async () => {
					const { data: r } = await axios_instance.post("/users/profile/edit", fd)
					if (!r.success) throw new Error(r.message)
					setOpen(false)
					const { data } = await axios_instance.get("/users/me")
					await setUserAsync(data.data)
					window.location.href = BASE + profil(data.data.username)
				})(),
				{ loading: "Enregistrement…", success: "Profil mis à jour", error: (e) => e?.message || "Ça n'a pas marché" }
			)
			.finally(() => setIsLoading(false))
	}

	const champ = "min-h-12 w-full rounded-xl border border-gray-300 px-4 text-base outline-none focus:border-gray-600"
	const libelle = "flex flex-col gap-1 text-sm font-bold text-gray-700"
	return (
		<Dialog open={open} onOpenChange={ouvrir}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="sm:max-w-[480px] max-h-[90dvh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Modifier le profil</DialogTitle>
					<DialogDescription className="sr-only">Ta photo, ton prénom et ta bio</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
					<label className="mx-auto relative cursor-pointer" aria-label="Changer la photo de profil">
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img src={apercu || currentProfile.image || "/reseau/avatar.svg"} alt="" className="w-28 h-28 rounded-full object-cover" />
						<span className="absolute bottom-0 right-0 flex h-11 w-11 items-center justify-center rounded-full bg-gray-900 text-white shadow"><Camera className="w-5 h-5" /></span>
						<input type="file" accept="image/*" className="sr-only" onChange={(e) => {
							const f = e.target.files?.[0]
							if (!f) return
							if (f.size > 15 * 1024 * 1024) return toast.error("Photo trop lourde (15 Mo au plus)")
							setFichier(f); setApercu(URL.createObjectURL(f))
						}} />
					</label>
					<label className={libelle}>Prénom et nom<input className={champ} maxLength={40} {...register("name")} /></label>
					<label className={libelle}>Nom d&apos;utilisateur
						<input className={champ + (famille ? " bg-gray-100 text-gray-500" : "")} disabled={!!famille} autoCapitalize="none" spellCheck={false} maxLength={30} {...register("username")} />
						{famille && <span className="text-xs font-normal text-gray-500">Les comptes de la famille gardent leur prénom.</span>}
					</label>
					<label className={libelle}>Bio
						<textarea className={champ + " py-3 min-h-24"} maxLength={150} placeholder="Quelques mots sur toi…" {...register("bio")} />
						<span className="text-xs font-normal text-gray-400 text-right">{(watch("bio") || "").length}/150</span>
					</label>
					<label className={libelle}>Pronom
						<select className={champ} {...register("gender")}>
							<option value="">Ne pas afficher</option>
							<option value="male">il</option>
							<option value="female">elle</option>
						</select>
					</label>
					<button type="submit" disabled={isLoading} className="min-h-12 rounded-xl bg-[#1f5fbf] font-bold text-white cursor-pointer disabled:opacity-60">
						{isLoading ? "Enregistrement…" : "Enregistrer"}
					</button>
				</form>
			</DialogContent>
		</Dialog>
	)
}

export default EditProfileDialog
