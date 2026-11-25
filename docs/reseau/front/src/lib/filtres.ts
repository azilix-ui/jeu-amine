// Les filtres de Mechmoum (26/11). Appliqués à l'affichage (CSS), donc la photo ou la vidéo d'origine reste intacte
// et le filtre se change ou s'enlève sans rien perdre. Même liste côté serveur : MC_FILTRES (reseau/api/lib.php).
export const FILTRES: { id: string; nom: string; css: string }[] = [
	{ id: "", nom: "Normal", css: "none" },
	{ id: "jasmin", nom: "Jasmin", css: "sepia(.18) saturate(1.25) brightness(1.06) contrast(1.02)" },
	{ id: "sidibou", nom: "Sidi Bou", css: "saturate(1.35) hue-rotate(-6deg) contrast(1.08) brightness(1.04)" },
	{ id: "sahara", nom: "Sahara", css: "sepia(.45) saturate(1.45) contrast(1.06) brightness(1.02)" },
	{ id: "kairouan", nom: "Kairouan", css: "sepia(.28) saturate(1.7) hue-rotate(-12deg) contrast(1.12)" },
	{ id: "vif", nom: "Vif", css: "saturate(1.65) contrast(1.15)" },
	{ id: "doux", nom: "Doux", css: "brightness(1.1) contrast(.88) saturate(.85)" },
	{ id: "vintage", nom: "Vintage", css: "sepia(.55) contrast(.9) brightness(1.08) saturate(.8)" },
	{ id: "nb", nom: "Noir et blanc", css: "grayscale(1) contrast(1.12)" },
]
export const filtreCss = (id?: string | null) => FILTRES.find((f) => f.id === (id || ""))?.css || "none"
