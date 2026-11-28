"use client"
// L'administration de Mechmoum : le tableau de bord, les membres, les signalements, la modération des contenus,
// les invitations, les réglages (réseau privé, inscriptions, messages des enfants), le journal et les sauvegardes.
// Anis voit tout ; un modérateur voit seulement les signalements et les contenus.
import { useState } from "react"
import Link from "next/link"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"
import { Shield, Users, Flag, Images, Ticket, Settings, ScrollText, HardDriveDownload, Copy, Youtube, Eye, EyeOff, Trash2, RefreshCw } from "lucide-react"
import Cadre from "@/components/Cadre"
import axios_instance from "@/config/axios"
import { profil, ilya } from "@/lib/utils"
import { API } from "@/config/axios"

type Onglet = "tableau" | "membres" | "signalements" | "contenus" | "invitations" | "journal" | "sauvegardes" | "shorts"

const RAISONS: Record<string, string> = { mechant: "Méchant ou moqueur", "fait-peur": "Fait peur / mal à l'aise", prive: "Montre quelque chose de privé", faux: "Faux ou arnaque", autre: "Autre chose" }
const GENRES: Record<string, string> = { post: "Publication", comment: "Commentaire", story: "Story", user: "Profil", message: "Message" }

const lire = async (u: string) => {
	const { data } = await axios_instance.get(u)
	if (!data.success) throw new Error(data.message)
	return data
}
const agir = async (u: string, corps: any, apres?: (d: any) => void) => {
	const { data } = await axios_instance.post(u, corps)
	if (!data.success) return toast.error(data.message || "Ça n'a pas marché")
	toast.success(data.message || "C'est fait")
	apres?.(data)
}
const taille = (o: number) => (o > 1e9 ? (o / 1e9).toFixed(1) + " Go" : o > 1e6 ? (o / 1e6).toFixed(1) + " Mo" : Math.round(o / 1e3) + " Ko")
const btn = "min-h-11 px-4 rounded-xl text-sm font-bold cursor-pointer disabled:opacity-50"
const carte = "rounded-2xl border border-gray-200 bg-white p-4"

function Bascule({ oui, libelle, aide, change }: { oui: boolean; libelle: string; aide: string; change: (v: boolean) => void }) {
	return (
		<label className="flex items-start gap-4 py-3 cursor-pointer">
			<span className="flex-1">
				<span className="block font-bold">{libelle}</span>
				<span className="block text-sm text-gray-500">{aide}</span>
			</span>
			<button type="button" role="switch" aria-checked={oui} onClick={() => change(!oui)}
				className={`relative h-8 w-14 shrink-0 rounded-full transition-colors cursor-pointer ${oui ? "bg-[#0f766e]" : "bg-gray-300"}`}>
				<span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${oui ? "left-7" : "left-1"}`} />
			</button>
		</label>
	)
}

function Apercu({ c }: { c: any }) {
	if (!c?.existe) return <span className="text-gray-400 italic">Contenu déjà supprimé</span>
	return (
		<div className="flex gap-3 items-start min-w-0">
			{c.image && (
				// eslint-disable-next-line @next/next/no-img-element
				<img src={c.image} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0 bg-gray-100" />
			)}
			<div className="min-w-0 text-sm">
				{c.auteur && (
					<Link href={profil(c.auteur.username)} className="font-bold">{c.auteur.username}</Link>
				)}
				{c.video && <span className="ml-2 text-xs rounded bg-gray-100 px-1.5 py-0.5">vidéo</span>}
				{c.cache && <span className="ml-2 text-xs rounded bg-amber-100 text-amber-800 px-1.5 py-0.5">masqué</span>}
				{c.texte && <p className="text-gray-700 whitespace-pre-wrap break-words line-clamp-4">{c.texte}</p>}
				{c.createdAt && <p className="text-xs text-gray-400">{ilya(c.createdAt)}</p>}
			</div>
		</div>
	)
}

function AncienMur() {
	const qc = useQueryClient()
	const { data, refetch } = useQuery({ queryKey: ["admin", "migrer-mur"], queryFn: () => lire("/admin/migrer-mur") })
	const [encours, setEncours] = useState(false)
	const [faits, setFaits] = useState(0)
	if (!data || data.absent || data.total === 0) return null
	const lancer = async () => {
		setEncours(true)
		let n = 0
		for (let tour = 0; tour < 200; tour++) {
			const { data: d } = await axios_instance.post("/admin/migrer-mur", {})
			if (!d.success) { toast.error(d.message || "Ça n'a pas marché"); break }
			n += d.faits
			setFaits(n)
			if (d.restants <= 0 || d.faits === 0) break
		}
		setEncours(false)
		toast.success(`${n} publication(s) recopiée(s) du mur 🌼`)
		refetch()
		qc.invalidateQueries()
	}
	return (
		<div className={carte + " space-y-2"}>
			<h3 className="font-extrabold text-lg">🧱 L&apos;ancien mur de la famille</h3>
			<p className="text-sm text-gray-600">
				{data.total} photo(s), dessin(s) et vidéo(s) sur le mur, dont <b>{data.deja}</b> déjà dans Mechmoum. Elles gardent leur date, leur texte, leur auteur et leurs commentaires ; les vidéos gardent leur musique.
				{data.textes > 0 && ` Les ${data.textes} message(s) sans image restent sur le mur.`} Le mur n&apos;est pas effacé.
			</p>
			{data.restants > 0 ? (
				<button type="button" disabled={encours} onClick={lancer} className={btn + " mc-degrade text-white"}>
					{encours ? `Copie en cours… ${faits}` : `Recopier les ${data.restants} dans Mechmoum`}
				</button>
			) : (
				<p className="text-sm font-bold text-teal-700">✓ Tout est recopié.</p>
			)}
		</div>
	)
}

function Tableau({ etat, recharger }: { etat: any; recharger: () => void }) {
	const s = etat?.stats || {}
	const r = etat?.reglages || {}
	const regle = (k: string, v: any) => agir("/admin/reglages", { [k]: v }, recharger)
	const tuiles: [string, any][] = [
		["Membres actifs", s.membres], ["En ligne", s.enLigne], ["Actifs (7 j)", s.actifs7j], ["Publications", s.publications],
		["Reels", s.reels], ["Stories du jour", s.stories], ["Commentaires", s.commentaires], ["Messages", s.messages],
		["Signalements ouverts", s.signalements], ["Contenus masqués", s.masques], ["Invitations valables", s.invitations], ["Photos et vidéos", s.stockage != null ? taille(s.stockage) : "…"],
	]
	return (
		<div className="space-y-4">
			<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
				{tuiles.map(([t, v]) => (
					<div key={t} className={carte}>
						<div className="text-2xl font-extrabold">{v ?? "…"}</div>
						<div className="text-sm text-gray-500">{t}</div>
					</div>
				))}
			</div>
			{etat?.admin && <AncienMur />}
			{etat?.admin && (
				<div className={carte + " divide-y"}>
					<h3 className="font-extrabold text-lg pb-2 flex items-center gap-2"><Settings className="w-5 h-5" /> Réglages</h3>
					<Bascule oui={!!r.prive} libelle="Réseau privé (sur invitation)" aide="Personne ne peut créer de compte sans un lien d'invitation. Conseillé." change={(v) => regle("prive", v)} />
					<Bascule oui={!!r.inscriptions} libelle="Inscriptions ouvertes" aide="Si c'est coupé, même un lien d'invitation ne permet plus de créer un compte." change={(v) => regle("inscriptions", v)} />
					<Bascule oui={r.enfants_dm === "tous"} libelle="Les enfants peuvent écrire aux invités" aide="Coupé : Essil, Salma et Amine n'échangent des messages qu'avec la famille." change={(v) => regle("enfants_dm", v ? "tous" : "famille")} />
				</div>
			)}
		</div>
	)
}

function Membres() {
	const qc = useQueryClient()
	const { data } = useQuery({ queryKey: ["admin", "membres"], queryFn: () => lire("/admin/utilisateurs") })
	const [mdp, setMdp] = useState<{ u: string; m: string } | null>(null)
	const faire = (id: string, faire: string, extra: any = {}, apres?: (d: any) => void) =>
		agir(`/admin/utilisateurs/${id}`, { faire, ...extra }, (d) => { apres?.(d); qc.invalidateQueries({ queryKey: ["admin"] }) })
	return (
		<div className="space-y-3">
			{mdp && (
				<div className="rounded-2xl border-2 border-amber-400 bg-amber-50 p-4">
					<p className="font-bold">Mot de passe provisoire de {mdp.u} (affiché une seule fois) :</p>
					<p className="mt-2 font-mono text-lg select-all">{mdp.m}</p>
					<button type="button" className={btn + " mt-2 bg-white border"} onClick={() => setMdp(null)}>J&apos;ai noté</button>
				</div>
			)}
			{(data?.data || []).map((u: any) => (
				<div key={u._id} className={carte + " flex flex-wrap items-center gap-3"}>
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img src={u.image || "/reseau/avatar.svg"} alt="" className="w-12 h-12 rounded-full object-cover" />
					<div className="flex-1 min-w-[180px]">
						<Link href={profil(u.username)} className="font-bold">{u.username}</Link>
						<span className="ml-2 text-sm text-gray-500">{u.name}</span>
						<div className="flex flex-wrap gap-1 mt-1 text-xs">
							{u.famille && <span className="rounded bg-teal-100 text-teal-800 px-1.5 py-0.5">famille</span>}
							{u.role !== "membre" && <span className="rounded bg-blue-100 text-blue-800 px-1.5 py-0.5">{u.role === "admin" ? "administrateur" : "modérateur"}</span>}
							{u.etat !== "actif" && <span className="rounded bg-red-100 text-red-800 px-1.5 py-0.5">suspendu</span>}
							{u.signalements > 0 && <span className="rounded bg-amber-100 text-amber-800 px-1.5 py-0.5">{u.signalements} signalement(s)</span>}
							{u.invitation && <span className="rounded bg-gray-100 px-1.5 py-0.5">invité : {u.invitation}</span>}
						</div>
						<p className="text-xs text-gray-400 mt-1">
							{u.posts} publication(s) · {u.abonnes} abonné(s) · {u.vu ? `vu ${ilya(u.vu)}` : "jamais venu"}
						</p>
					</div>
					{u.famille !== "Anis" && (
						<div className="flex flex-wrap gap-2">
							{u.etat === "actif" ? (
								<button type="button" className={btn + " bg-amber-100 text-amber-900"} onClick={() => confirm(`Suspendre ${u.username} ?`) && faire(u._id, "suspendre")}>Suspendre</button>
							) : (
								<button type="button" className={btn + " bg-teal-100 text-teal-900"} onClick={() => faire(u._id, "reactiver")}>Réactiver</button>
							)}
							<select aria-label={`Rôle de ${u.username}`} value={u.role} onChange={(e) => faire(u._id, "role", { role: e.target.value })} className="min-h-11 rounded-xl border border-gray-300 px-2 text-sm">
								<option value="membre">Membre</option>
								<option value="moderateur">Modérateur</option>
								<option value="admin">Administrateur</option>
							</select>
							{!u.famille && (
								<>
									<button type="button" className={btn + " bg-gray-100"} onClick={() => confirm(`Créer un mot de passe provisoire pour ${u.username} ? Son ancien mot de passe ne marchera plus.`) && faire(u._id, "motdepasse", {}, (d) => setMdp({ u: u.username, m: d.motdepasse }))}>Mot de passe</button>
									<button type="button" className={btn + " bg-red-50 text-red-700"} onClick={() => confirm(`Supprimer le compte de ${u.username} et tout son contenu ? C'est définitif.`) && faire(u._id, "supprimer")}>Supprimer</button>
								</>
							)}
						</div>
					)}
				</div>
			))}
		</div>
	)
}

function Signalements({ admin }: { admin: boolean }) {
	const [etat, setEtat] = useState("ouvert")
	const qc = useQueryClient()
	const { data } = useQuery({ queryKey: ["admin", "signalements", etat], queryFn: () => lire(`/admin/signalements?etat=${etat}`) })
	const decider = (id: string, decision: string) => agir(`/admin/signalements/${id}`, { decision }, () => qc.invalidateQueries({ queryKey: ["admin"] }))
	const l = data?.data || []
	return (
		<div className="space-y-3">
			<div className="flex gap-2 flex-wrap">
				{[["ouvert", "À traiter"], ["traite", "Traités"], ["rejete", "Rejetés"], ["tous", "Tous"]].map(([k, t]) => (
					<button key={k} type="button" aria-pressed={etat === k} onClick={() => setEtat(k)} className={btn + (etat === k ? " bg-gray-900 text-white" : " bg-gray-100")}>{t}</button>
				))}
			</div>
			{l.length === 0 && <p className="text-gray-500 py-8 text-center">Aucun signalement ici. 🌼</p>}
			{l.map((s: any) => (
				<div key={s._id} className={carte}>
					<div className="flex flex-wrap items-center gap-2 text-sm mb-3">
						<span className="rounded bg-gray-100 px-2 py-0.5 font-bold">{GENRES[s.genre] || s.genre}</span>
						<span className="font-bold text-red-700">{RAISONS[s.raison] || s.raison}</span>
						<span className="text-gray-500">par {s.par?.username || "?"} · {ilya(s.createdAt)}</span>
						{s.etat !== "ouvert" && <span className="text-gray-500">→ {s.decision} ({s.traitePar})</span>}
					</div>
					{s.detail && <p className="mb-3 rounded-lg bg-gray-50 p-2 text-sm">« {s.detail} »</p>}
					<Apercu c={s.cible} />
					{s.etat === "ouvert" && (
						<div className="flex flex-wrap gap-2 mt-3">
							{s.genre !== "user" && <button type="button" className={btn + " bg-amber-100 text-amber-900"} onClick={() => decider(s._id, "masquer")}>Masquer</button>}
							{s.genre !== "user" && <button type="button" className={btn + " bg-red-50 text-red-700"} onClick={() => confirm("Supprimer ce contenu pour de bon ?") && decider(s._id, "supprimer")}>Supprimer</button>}
							{admin && <button type="button" className={btn + " bg-red-600 text-white"} onClick={() => confirm("Suspendre l'auteur ?") && decider(s._id, "suspendre")}>Suspendre l&apos;auteur</button>}
							<button type="button" className={btn + " bg-gray-100"} onClick={() => decider(s._id, "rejeter")}>Ce n&apos;est rien</button>
						</div>
					)}
				</div>
			))}
		</div>
	)
}

function Contenus() {
	const [genre, setGenre] = useState("post")
	const qc = useQueryClient()
	const { data } = useQuery({ queryKey: ["admin", "contenus", genre], queryFn: () => lire(`/admin/contenus?genre=${genre}`) })
	const faire = (id: string, f: string) => agir(`/admin/contenus/${id}`, { genre, faire: f }, () => qc.invalidateQueries({ queryKey: ["admin"] }))
	return (
		<div className="space-y-3">
			<div className="flex gap-2 flex-wrap">
				{[["post", "Publications"], ["comment", "Commentaires"], ["story", "Stories"]].map(([k, t]) => (
					<button key={k} type="button" aria-pressed={genre === k} onClick={() => setGenre(k)} className={btn + (genre === k ? " bg-gray-900 text-white" : " bg-gray-100")}>{t}</button>
				))}
			</div>
			{(data?.data || []).length === 0 && <p className="text-gray-500 py-8 text-center">Rien pour l&apos;instant.</p>}
			<div className="grid gap-3 lg:grid-cols-2">
				{(data?.data || []).map((c: any) => (
					<div key={c._id} className={carte + " flex flex-col gap-3"}>
						<Apercu c={c} />
						<div className="flex flex-wrap gap-2">
							{c.cache ? (
								<button type="button" className={btn + " bg-teal-100 text-teal-900"} onClick={() => faire(c._id, "afficher")}>Réafficher</button>
							) : (
								<button type="button" className={btn + " bg-amber-100 text-amber-900"} onClick={() => faire(c._id, "masquer")}>Masquer</button>
							)}
							<button type="button" className={btn + " bg-red-50 text-red-700"} onClick={() => confirm("Supprimer pour de bon ?") && faire(c._id, "supprimer")}>Supprimer</button>
						</div>
					</div>
				))}
			</div>
		</div>
	)
}

function Invitations() {
	const qc = useQueryClient()
	const { data } = useQuery({ queryKey: ["admin", "invitations"], queryFn: () => lire("/admin/invitations") })
	const [nom, setNom] = useState("")
	const [jours, setJours] = useState(7)
	const [usages, setUsages] = useState(1)
	const [lien, setLien] = useState("")
	const creer = () =>
		agir("/admin/invitations", { nom, jours, usages }, (d) => {
			setLien(window.location.origin + d.lien)
			setNom("")
			qc.invalidateQueries({ queryKey: ["admin"] })
		})
	const copier = async () => {
		try {
			await navigator.clipboard.writeText(lien)
			toast.success("Lien copié")
		} catch {
			toast.error("Copie impossible : sélectionne le lien à la main")
		}
	}
	const champ = "min-h-11 rounded-xl border border-gray-300 px-3 text-base"
	return (
		<div className="space-y-4">
			<div className={carte + " space-y-3"}>
				<h3 className="font-extrabold">Nouvelle invitation</h3>
				<div className="flex flex-wrap gap-3 items-end">
					<label className="flex flex-col text-sm font-bold gap-1 flex-1 min-w-[180px]">Pour qui ?
						<input className={champ} value={nom} maxLength={40} placeholder="ex. : Nour (cousine)" onChange={(e) => setNom(e.target.value)} />
					</label>
					<label className="flex flex-col text-sm font-bold gap-1">Valable
						<select className={champ} value={jours} onChange={(e) => setJours(+e.target.value)}>
							{[1, 3, 7, 14, 30].map((j) => <option key={j} value={j}>{j} jour{j > 1 ? "s" : ""}</option>)}
						</select>
					</label>
					<label className="flex flex-col text-sm font-bold gap-1">Comptes
						<select className={champ} value={usages} onChange={(e) => setUsages(+e.target.value)}>
							{[1, 2, 3, 5, 10].map((j) => <option key={j} value={j}>{j}</option>)}
						</select>
					</label>
					<button type="button" className={btn + " mc-degrade text-white"} disabled={nom.trim().length < 2} onClick={creer}>Créer le lien</button>
				</div>
				{lien && (
					<div className="rounded-xl border-2 border-teal-500 bg-teal-50 p-3">
						<p className="text-sm font-bold">Le lien (montré une seule fois) : envoie-le à la personne.</p>
						<p className="mt-1 break-all font-mono text-sm select-all">{lien}</p>
						<button type="button" className={btn + " mt-2 bg-white border flex items-center gap-2"} onClick={copier}><Copy className="w-4 h-4" /> Copier</button>
					</div>
				)}
			</div>
			{(data?.data || []).map((i: any) => (
				<div key={i._id} className={carte + " flex flex-wrap items-center gap-3"}>
					<div className="flex-1 min-w-[200px]">
						<span className="font-bold">{i.nom}</span>
						<span className={`ml-2 text-xs rounded px-1.5 py-0.5 ${i.valable ? "bg-teal-100 text-teal-800" : "bg-gray-100 text-gray-500"}`}>{i.valable ? "valable" : i.revoquee ? "retirée" : "terminée"}</span>
						<p className="text-xs text-gray-500">
							{i.usages}/{i.usagesMax} compte(s) · expire {new Date(i.expire).toLocaleDateString("fr-FR")} {i.comptes && `· ${i.comptes}`}
						</p>
					</div>
					{i.valable && <button type="button" className={btn + " bg-red-50 text-red-700"} onClick={() => agir(`/admin/invitations/${i._id}/revoquer`, {}, () => qc.invalidateQueries({ queryKey: ["admin"] }))}>Retirer</button>}
				</div>
			))}
		</div>
	)
}

function Journal() {
	const { data } = useQuery({ queryKey: ["admin", "journal"], queryFn: () => lire("/admin/journal") })
	return (
		<div className={carte + " divide-y text-sm"}>
			{(data?.data || []).map((j: any, n: number) => (
				<div key={n} className="py-2 flex flex-wrap gap-x-3">
					<span className="text-gray-400 w-28 shrink-0">{ilya(j.createdAt)}</span>
					<span className="font-bold">{j.qui}</span>
					<span>{j.action}</span>
					<span className="text-gray-500 break-all">{j.detail}</span>
				</div>
			))}
			{(data?.data || []).length === 0 && <p className="py-6 text-center text-gray-500">Le journal est vide.</p>}
		</div>
	)
}

function Sauvegardes() {
	const qc = useQueryClient()
	const [encours, setEncours] = useState(false)
	const { data } = useQuery({ queryKey: ["admin", "sauvegardes"], queryFn: () => lire("/admin/sauvegarde") })
	return (
		<div className="space-y-3">
			<div className={carte}>
				<p className="text-sm text-gray-600">Une sauvegarde contient toute la base (comptes, publications, messages…) et toutes les photos et vidéos, dans un seul fichier .zip. Le serveur garde les 3 dernières ; télécharge-les sur ton ordinateur de temps en temps. La façon de restaurer est dans la documentation du site (docs/reseau.md).</p>
				<button type="button" disabled={encours} className={btn + " mt-3 bg-gray-900 text-white"} onClick={async () => {
					setEncours(true)
					await agir("/admin/sauvegarde", {}, () => qc.invalidateQueries({ queryKey: ["admin", "sauvegardes"] }))
					setEncours(false)
				}}>{encours ? "Sauvegarde en cours…" : "Faire une sauvegarde maintenant"}</button>
			</div>
			{(data?.data || []).map((f: any) => (
				<div key={f.fichier} className={carte + " flex flex-wrap items-center gap-3"}>
					<HardDriveDownload className="w-6 h-6 text-gray-500" />
					<div className="flex-1 min-w-[200px]">
						<p className="font-bold break-all">{f.fichier}</p>
						<p className="text-xs text-gray-500">{taille(f.taille)} · {ilya(f.date)}</p>
					</div>
					<a className={btn + " inline-flex items-center bg-[#1f5fbf] text-white"} href={`${API}/admin/sauvegarde?f=${encodeURIComponent(f.fichier)}`} download>Télécharger</a>
				</div>
			))}
		</div>
	)
}

// les Shorts (28/11) : les chaînes YouTube et les vidéos du fil, ajoutées par un lien ; on peut cacher un short
function Shorts() {
	const qc = useQueryClient()
	const { data, refetch, isLoading } = useQuery({ queryKey: ["admin", "shorts"], queryFn: () => lire("/admin/shorts") })
	const [url, setUrl] = useState("")
	const [encours, setEncours] = useState(false)
	const [voir, setVoir] = useState(24)
	const fais = async (corps: any) => {
		setEncours(true)
		await agir("/admin/shorts", corps, () => { if (corps.faire === "ajouter") setUrl(""); qc.invalidateQueries({ queryKey: ["shorts"] }) })
		await refetch()
		setEncours(false)
	}
	const chaines: any[] = data?.sources?.chaines || []
	const videos: any[] = data?.sources?.videos || []
	const liste: any[] = data?.liste || []
	const caches = liste.filter((x) => x.cache).length
	return (
		<div className="space-y-4">
			<div className={carte + " space-y-3"}>
				<h3 className="font-extrabold text-lg flex items-center gap-2"><Youtube className="w-5 h-5 text-red-600" /> Ajouter au fil des Shorts</h3>
				<p className="text-sm text-gray-600">Colle le lien d&apos;une <b>vidéo</b> (youtube.com/shorts/…, youtu.be/…, watch?v=…) : elle passe en tête du fil. Ou le lien d&apos;une <b>chaîne</b> (youtube.com/@…) : ses shorts arrivent tout seuls, et les nouveaux aussi (relus toutes les 6 heures).</p>
				<form className="flex flex-col sm:flex-row gap-2" onSubmit={(e) => { e.preventDefault(); if (url.trim()) fais({ faire: "ajouter", url: url.trim() }) }}>
					<input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.youtube.com/@… ou https://youtube.com/shorts/…" inputMode="url" autoCapitalize="off" autoCorrect="off"
						className="flex-1 min-h-11 rounded-xl border border-gray-300 px-3 text-base" />
					<button type="submit" disabled={encours || !url.trim()} className={btn + " mc-degrade text-white"}>{encours ? "Un instant…" : "Ajouter"}</button>
				</form>
			</div>

			<div className={carte + " space-y-2"}>
				<div className="flex items-center justify-between gap-2 flex-wrap">
					<h3 className="font-extrabold text-lg">Les chaînes ({chaines.length})</h3>
					<button type="button" disabled={encours} onClick={() => fais({ faire: "actualiser" })} className={btn + " bg-gray-100 flex items-center gap-1"}><RefreshCw className="w-4 h-4" /> Actualiser</button>
				</div>
				{chaines.length === 0 && <p className="text-sm text-gray-500">Aucune chaîne.</p>}
				{chaines.map((c) => (
					<div key={c.id} className="flex items-center gap-3 rounded-xl bg-gray-50 p-2">
						<Youtube className="w-6 h-6 text-red-600 shrink-0" />
						<div className="flex-1 min-w-0">
							<a href={`https://www.youtube.com/${c.chemin}/shorts`} target="_blank" rel="noreferrer" className="font-bold hover:underline">{c.nom}</a>
							<p className="text-xs text-gray-500 truncate">{c.chemin} · {liste.filter((x) => x.chaine === c.nom).length} short(s)</p>
						</div>
						<button type="button" disabled={encours} onClick={() => confirm(`Retirer la chaîne « ${c.nom} » du fil ?`) && fais({ faire: "retirer-chaine", id: c.id })}
							className={btn + " bg-red-50 text-red-700 flex items-center gap-1"}><Trash2 className="w-4 h-4" /> Retirer</button>
					</div>
				))}
				{videos.length > 0 && <h3 className="font-extrabold text-lg pt-2">Les vidéos ajoutées une par une ({videos.length})</h3>}
				{[...videos].reverse().map((v) => (
					<div key={v.id} className="flex items-center gap-3 rounded-xl bg-gray-50 p-2">
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img src={`https://i.ytimg.com/vi/${v.id}/default.jpg`} alt="" className="w-16 h-12 rounded-lg object-cover shrink-0" />
						<div className="flex-1 min-w-0">
							<p className="font-bold text-sm line-clamp-2">{v.titre || v.id}</p>
							<p className="text-xs text-gray-500">{v.chaine} · ajoutée {ilya(new Date(v.ajout * 1000).toISOString())}</p>
						</div>
						<button type="button" disabled={encours} onClick={() => fais({ faire: "retirer-video", id: v.id })} className={btn + " bg-red-50 text-red-700 flex items-center gap-1"}><Trash2 className="w-4 h-4" /> Retirer</button>
					</div>
				))}
			</div>

			<div className={carte + " space-y-2"}>
				<h3 className="font-extrabold text-lg">Le fil, dans l&apos;ordre ({liste.length - caches} visibles{caches ? `, ${caches} caché(s)` : ""})</h3>
				<p className="text-sm text-gray-600">Un short qui ne convient pas ? « Cacher » le retire du fil des enfants, sans toucher au reste de la chaîne.</p>
				{isLoading && <p className="text-2xl">🌼</p>}
				<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
					{liste.slice(0, voir).map((x) => (
						<div key={x.id} className={"rounded-xl border overflow-hidden " + (x.cache ? "border-gray-200 opacity-50" : "border-gray-200")}>
							<a href={`https://www.youtube.com/shorts/${x.id}`} target="_blank" rel="noreferrer" className="block aspect-video bg-black">
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img src={`https://i.ytimg.com/vi/${x.id}/mqdefault.jpg`} alt="" loading="lazy" className="w-full h-full object-cover" />
							</a>
							<div className="p-2 space-y-1">
								<p className="text-xs font-bold line-clamp-2 min-h-8">{x.titre || "Sans titre"}</p>
								<p className="text-[11px] text-gray-500 truncate">{x.chaine}</p>
								<button type="button" disabled={encours} onClick={() => fais({ faire: x.cache ? "montrer" : "cacher", id: x.id })}
									className={btn + " w-full flex items-center justify-center gap-1 " + (x.cache ? "bg-teal-50 text-teal-800" : "bg-gray-100")}>
									{x.cache ? <><Eye className="w-4 h-4" /> Remontrer</> : <><EyeOff className="w-4 h-4" /> Cacher</>}
								</button>
							</div>
						</div>
					))}
				</div>
				{liste.length > voir && <button type="button" onClick={() => setVoir(voir + 24)} className={btn + " bg-gray-100 w-full"}>Voir les suivants ({liste.length - voir})</button>}
			</div>
		</div>
	)
}

export default function AdminPage() {
	const [onglet, setOnglet] = useState<Onglet>("tableau")
	const { data: etat, error, refetch } = useQuery({ queryKey: ["admin", "etat"], queryFn: () => lire("/admin/etat"), retry: false })
	const admin = !!etat?.admin
	const tabs: [Onglet, string, React.ReactNode, boolean][] = [
		["tableau", "Tableau de bord", <Shield key="a" className="w-4 h-4" />, true],
		["signalements", `Signalements${etat?.stats?.signalements ? ` (${etat.stats.signalements})` : ""}`, <Flag key="b" className="w-4 h-4" />, true],
		["contenus", "Contenus", <Images key="c" className="w-4 h-4" />, true],
		["membres", "Membres", <Users key="d" className="w-4 h-4" />, admin],
		["invitations", "Invitations", <Ticket key="e" className="w-4 h-4" />, admin],
		["journal", "Journal", <ScrollText key="f" className="w-4 h-4" />, true],
		["shorts", "Shorts", <Youtube key="h" className="w-4 h-4" />, admin],
		["sauvegardes", "Sauvegardes", <HardDriveDownload key="g" className="w-4 h-4" />, admin],
	]
	return (
		<Cadre>
			<div className="flex-1 min-w-0">
				<div className="max-w-5xl mx-auto p-3 md:p-6 pb-24 md:pb-6">
					<h1 className="text-2xl font-extrabold mb-4 flex items-center gap-2"><Shield /> Administration</h1>
					{error ? (
						<p className="text-red-600">{(error as Error).message}</p>
					) : (
						<>
							<div className="flex gap-2 overflow-x-auto mc-sans-barre pb-3 mb-2">
								{tabs.filter((t) => t[3]).map(([k, t, i]) => (
									<button key={k} type="button" aria-pressed={onglet === k} onClick={() => setOnglet(k)}
										className={`${btn} shrink-0 flex items-center gap-2 ${onglet === k ? "bg-gray-900 text-white" : "bg-white border border-gray-200"}`}>{i}{t}</button>
								))}
							</div>
							{onglet === "tableau" && <Tableau etat={etat} recharger={refetch} />}
							{onglet === "membres" && <Membres />}
							{onglet === "signalements" && <Signalements admin={admin} />}
							{onglet === "contenus" && <Contenus />}
							{onglet === "invitations" && <Invitations />}
							{onglet === "journal" && <Journal />}
							{onglet === "shorts" && <Shorts />}
							{onglet === "sauvegardes" && <Sauvegardes />}
						</>
					)}
				</div>
			</div>
		</Cadre>
	)
}
