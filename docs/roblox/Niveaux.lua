--[[ Yajour (ياجور) : les 8 mondes et les 40 niveaux, recopiés du jeu du site missaoui-family.com.
  Les mesures sont en MÈTRES, comme sur le site : le jeu les multiplie par Config.K (4 studs = 1 mètre).
  Le plateau fait 9 m × 9 m, son centre est en (0, 0, 0) et son dessus à y = 0. Le héros part de derrière (z = -13).

  POUR CRÉER TON PROPRE NIVEAU, Essil : copie un niveau de la liste en bas, change son nom et ses blocs.
  Les outils pour poser les blocs (x = gauche/droite, z = devant/derrière, y = hauteur) :
    cube(matière, x, y, z, taille)                → un cube
    tour(matière, x, z, nombre, taille)            → une pile de cubes
    mur(matière, x, z, largeur, hauteur)           → un mur de briques en quinconce
    pyramide(matière, x, z, base, taille)          → une pyramide
    dalle(matière, x, y, z, largeur, profondeur, épaisseur) → une planche posée à plat
    colonne(matière, x, z, hauteur, rayon)         → une colonne ronde
    jarre(x, y, z)  ou  jarre(x, y, z, { cible = true })   → une jarre (d’or si cible)
    cage(x, y, z)                                  → le chaton dans sa cage
    rangee({ x1, x2, … }, function(x) return … end) → répéter un bloc
  Les matières : brique, bois, pierre, palmier, marbre (glisse), matelas (rebondit), jarre (se casse),
                 feux (caisse de feux d’artifice : explose), zellige (pilier qui ne bouge pas), chat.
  Le but : { type = "tomber", min = 5 } (faire tomber 5 blocs), { type = "cible" } (casser les jarres d’or),
           { type = "chat" } (libérer le chaton sans le faire tomber). ]]

local Niveaux = {}

Niveaux.MONDES = {
	{ id = "sidibou", nom = "Sidi Bou Saïd", ar = "سيدي بو سعيد", ciel = Color3.fromRGB(143, 208, 255) },
	{ id = "eljem", nom = "El Jem", ar = "الجم", ciel = Color3.fromRGB(169, 205, 240) },
	{ id = "sahara", nom = "Le Sahara", ar = "الصحراء", ciel = Color3.fromRGB(240, 160, 112) },
	{ id = "djerba", nom = "Djerba, les potiers", ar = "جربة", ciel = Color3.fromRGB(143, 216, 240) },
	{ id = "tabarka", nom = "Le fort de Tabarka", ar = "طبرقة", ciel = Color3.fromRGB(126, 196, 236) },
	{ id = "kairouan", nom = "Kairouan, le souk des tapis", ar = "القيروان", ciel = Color3.fromRGB(156, 200, 238) },
	{ id = "tozeur", nom = "Tozeur, l’oasis", ar = "توزر", ciel = Color3.fromRGB(242, 183, 122) },
	{ id = "carthage", nom = "Carthage, le port punique", ar = "قرطاج", ciel = Color3.fromRGB(134, 204, 242) },
}

-- d = densité, f = frottement, r = rebond, pts = points quand le bloc tombe
Niveaux.MATIERES = {
	brique = { d = 1.6, f = 0.75, r = 0.05, pts = 100 },
	bois = { d = 0.6, f = 0.6, r = 0.1, pts = 100 },
	pierre = { d = 2.4, f = 0.8, r = 0.02, pts = 150 },
	palmier = { d = 0.8, f = 0.7, r = 0.1, pts = 100 },
	marbre = { d = 2.2, f = 0.04, r = 0.05, pts = 150 },
	matelas = { d = 0.4, f = 0.9, r = 0.95, pts = 50 },
	jarre = { d = 1.2, f = 0.6, r = 0.05, pts = 200, fragile = true },
	feux = { d = 0.7, f = 0.6, r = 0.1, pts = 200, explose = true },
	zellige = { d = 2, f = 0.8, r = 0.02, pts = 0, fixe = true },
	chat = { d = 0.5, f = 0.9, r = 0, pts = 0 },
}

---------- les outils pour écrire les niveaux ----------
local function B(t, x, y, z, sx, sy, sz, o)
	local b = { t = t, p = { x, y, z }, s = { sx, sy, sz } }
	if o then for k, v in pairs(o) do b[k] = v end end
	return b
end
local function cube(t, x, y, z, c, o) c = c or 1; return B(t, x, y + c / 2, z, c, c, c, o) end
local function tour(t, x, z, n, c, y0)
	c = c or 1; y0 = y0 or 0
	local out = {}
	for k = 0, n - 1 do table.insert(out, cube(t, x, y0 + k * c, z, c)) end
	return out
end
local function mur(t, x, z, larg, haut, y0)   -- briques en quinconce (0,8 × 0,4 × 0,4)
	y0 = y0 or 0
	local out, L, H = {}, 0.8, 0.4
	for r = 0, haut - 1 do
		local dec = (r % 2 == 1) and L / 2 or 0
		local n = (r % 2 == 1) and larg - 1 or larg
		for k = 0, n - 1 do
			table.insert(out, B(t, x - (larg - 1) * L / 2 + k * L + dec, y0 + H / 2 + r * H, z, L * 0.98, H * 0.98, H))
		end
	end
	return out
end
local function pyramide(t, x, z, base, c)
	c = c or 0.8
	local out = {}
	for r = 0, base - 1 do
		for k = 0, base - r - 1 do
			table.insert(out, cube(t, x - (base - r - 1) * c / 2 + k * c, r * c, z, c * 0.98))
		end
	end
	return out
end
local function dalle(t, x, y, z, larg, prof, ep) prof = prof or 1.2; ep = ep or 0.25; return B(t, x, y + ep / 2, z, larg, ep, prof) end
local function colonne(t, x, z, h, r, y0) r = r or 0.35; y0 = y0 or 0; return { t = t, forme = "cyl", p = { x, y0 + h / 2, z }, s = { r * 2, h, r * 2 } } end
local function jarre(x, y, z, o) return B("jarre", x, y + 0.45, z, 0.6, 0.9, 0.6, { forme = "jarre", cible = o and o.cible or nil }) end
local function cage(x, y, z)   -- le chaton dans une cage de planches : 4 barreaux, un toit
	local c, h = {}, 0.9
	for _, d in ipairs({ { -0.4, -0.4 }, { 0.4, -0.4 }, { -0.4, 0.4 }, { 0.4, 0.4 } }) do
		table.insert(c, B("bois", x + d[1], y + h / 2, z + d[2], 0.14, h, 0.14, { cage = true }))
	end
	table.insert(c, B("bois", x, y + h + 0.07, z, 1.0, 0.14, 1.0, { cage = true }))
	table.insert(c, B("chat", x, y + 0.25, z, 0.4, 0.5, 0.4, { chat = true }))
	return c
end
local function rangee(liste, f) local out = {}; for _, v in ipairs(liste) do table.insert(out, f(v)) end; return out end

---------- les niveaux (m = le monde : 1 Sidi Bou Saïd … 8 Carthage) ----------
local LISTE = {
	-- Sidi Bou Saïd : briques et bois (on apprend)
	{ m = 1, nom = "La petite tour", tirs = 3, but = { type = "tomber", min = 3 }, par = 900,
		aide = "Glisse le doigt pour viser, lâche pour t’envoler ! Fais tomber 3 blocs du toit.",
		blocs = { tour("bois", 0, 0, 4) } },
	{ m = 1, nom = "Le mur de yajour", tirs = 3, but = { type = "tomber", min = 8 }, par = 1600,
		aide = "Un mur de briques : vise le milieu !",
		blocs = { mur("brique", 0, 0, 5, 5) } },
	{ m = 1, nom = "Les deux tours", tirs = 3, but = { type = "tomber", min = 6 }, par = 1100,   -- 7 sur le site ; 6 dans Roblox
		aide = "Deux tours : peux-tu les faire tomber toutes les deux ?",
		blocs = { tour("bois", -1.4, .5, 4), tour("brique", 1.4, .5, 4), dalle("bois", 0, 4, .5, 3.6) } },
	{ m = 1, nom = "Le chat sur le toit", tirs = 3, but = { type = "chat" }, par = 1200,
		aide = "Un chaton est enfermé ! Casse sa cage sans le faire tomber du toit.",
		blocs = { cage(0, 0, 1.5), tour("bois", -1.5, -.5, 2), tour("bois", 1.5, -.5, 2) } },
	{ m = 1, nom = "La jarre d’or", tirs = 3, but = { type = "cible" }, par = 1000,
		aide = "Touche la jarre d’or cachée derrière le mur.",
		blocs = { mur("brique", 0, -.5, 4, 3), jarre(0, 0, 1.2, { cible = true }), tour("bois", -2.3, 1.2, 3), tour("bois", 2.3, 1.2, 3) } },
	-- El Jem : pierre, colonnes, jarres fragiles, marbre glissant
	{ m = 2, nom = "Les colonnes", tirs = 3, vitesse = 18, but = { type = "tomber", min = 3 }, par = 1200,
		aide = "Les colonnes de pierre sont lourdes : vise le haut pour les renverser.",
		blocs = { colonne("pierre", -1.5, 0, 2.6), colonne("pierre", 0, 0, 2.6), colonne("pierre", 1.5, 0, 2.6), dalle("pierre", 0, 2.6, 0, 4.2, 1) } },
	{ m = 2, nom = "Les jarres de Nabeul", tirs = 3, but = { type = "cible" }, par = 1050,
		aide = "Les jarres se cassent quand on les cogne fort. Casse les deux jarres d’or !",
		blocs = { tour("pierre", -1.6, 0, 2), jarre(-1.6, 2, 0, { cible = true }), tour("pierre", 1.6, 0, 2), jarre(1.6, 2, 0, { cible = true }), dalle("marbre", 0, 0, 1.5, 2) } },
	{ m = 2, nom = "Le sol de marbre", tirs = 3, but = { type = "tomber", min = 6 }, par = 1000,
		aide = "Le marbre glisse : pousse les blocs jusqu’au bord !",
		blocs = { dalle("zellige", 0, -.25, .5, 6, 3, .25), rangee({ -1.5, -.5, .5, 1.5 }, function(x) return cube("marbre", x, 0, .5, .8) end), rangee({ -1, 0, 1 }, function(x) return cube("pierre", x, .8, .5, .8) end) } },
	{ m = 2, nom = "L’arène", tirs = 4, vitesse = 17, but = { type = "tomber", min = 7 }, par = 1700,
		aide = "Une arène comme à El Jem : fais tout tomber !",
		blocs = { rangee({ -2.2, -.75, .75, 2.2 }, function(x) return colonne("pierre", x, 1, 1.8, .3) end), dalle("pierre", -1.5, 1.8, 1, 1.9, 1), dalle("pierre", 1.5, 1.8, 1, 1.9, 1), tour("brique", 0, 1, 2, .8), pyramide("brique", 0, -1.2, 3) } },
	{ m = 2, nom = "Le chaton des gradins", tirs = 3, but = { type = "chat" }, par = 1100,
		aide = "Libère le chaton, mais attention : il ne doit pas tomber !",
		blocs = { dalle("zellige", 0, -.25, 1.5, 3, 3, .25), cage(0, 0, 1.5), tour("pierre", -1.8, -.5, 3, .8), tour("pierre", 1.8, -.5, 3, .8), jarre(0, 0, -.6) } },
	-- Le Sahara : troncs de palmier, caisses de feux d'artifice qui explosent, matelas qui rebondissent
	{ m = 3, nom = "Le feu d’artifice", tirs = 2, but = { type = "tomber", min = 8 }, par = 1500,
		aide = "La caisse rouge est pleine de feux d’artifice : touche-la et… boum !",
		blocs = { tour("palmier", -1.2, .5, 3), tour("palmier", 1.2, .5, 3), cube("feux", 0, 0, .5, .9), tour("palmier", 0, -1, 2, .8) } },
	{ m = 3, nom = "Le matelas", tirs = 3, but = { type = "tomber", min = 5 }, par = 1100,
		aide = "Rebondis sur le matelas pour atteindre la tour du fond.",
		blocs = { B("matelas", 0, .3, -1.6, 2.6, .6, 1.4), tour("palmier", 0, 2, 5, .8) } },
	{ m = 3, nom = "L’oasis", tirs = 3, but = { type = "cible" }, par = 1700,
		aide = "Les jarres d’or sont près de l’oasis. Une caisse de feux peut t’aider !",
		blocs = { jarre(-1.8, 0, 1.2, { cible = true }), jarre(1.8, 0, 1.2, { cible = true }), cube("feux", 0, 0, 1.2, .9), mur("brique", 0, -.6, 5, 2) } },
	{ m = 3, nom = "La caravane", tirs = 4, but = { type = "tomber", min = 12 }, par = 1700,
		aide = "Une grande caravane de caisses : fais tout tomber du plateau !",
		blocs = { pyramide("palmier", -1.6, .5, 3), pyramide("palmier", 1.6, .5, 3), cube("feux", 0, 0, .5, .8), tour("brique", 0, -1.5, 3, .6) } },
	{ m = 3, nom = "Le grand final", tirs = 4, but = { type = "chat" }, par = 1500,
		aide = "Le dernier chaton est tout en haut ! Libère-le sans le faire tomber.",
		blocs = { dalle("zellige", 0, 1.6, 1, 2.4, 2.4, .3), colonne("zellige", -.9, 1, 1.6, .25), colonne("zellige", .9, 1, 1.6, .25), cage(0, 1.9, 1), cube("feux", -2.2, 0, -.5, .8), tour("palmier", 2.2, -.5, 3, .8) } },
	-- Djerba (20/11) : les jarres des potiers de Guellala, les murs blanchis, les palmiers
	{ m = 4, nom = "L’atelier du potier", tirs = 3, but = { type = "cible" }, par = 1150,
		aide = "Chez le potier de Guellala : casse les trois jarres d’or sur les étagères !",
		blocs = { dalle("bois", 0, 1.2, .5, 4.2, 1, .2), tour("bois", -1.8, .5, 1, 1.2), tour("bois", 1.8, .5, 1, 1.2), jarre(-1.2, 1.4, .5, { cible = true }), jarre(0, 1.4, .5, { cible = true }), jarre(1.2, 1.4, .5, { cible = true }) } },
	{ m = 4, nom = "Le menzel", tirs = 3, but = { type = "tomber", min = 8 }, par = 1600,
		aide = "Une maison blanche de Djerba : fais tomber ses briques !",
		blocs = { mur("brique", 0, 0, 5, 4), pyramide("bois", 0, -1.2, 3) } },
	{ m = 4, nom = "Les jarres en équilibre", tirs = 3, but = { type = "tomber", min = 5 }, par = 1000,
		aide = "Les jarres sont empilées sur des planches : fais-les toutes tomber du plateau.",
		blocs = { tour("palmier", -1.5, 0, 2), tour("palmier", 1.5, 0, 2), dalle("bois", 0, 2, 0, 4, 1, .2), jarre(-1, 2.2, 0), jarre(0, 2.2, 0), jarre(1, 2.2, 0), jarre(0, 0, 0) } },
	{ m = 4, nom = "Le chat du potier", tirs = 3, but = { type = "chat" }, par = 900,
		aide = "Le chat du potier est enfermé : libère-le sans le faire tomber !",
		blocs = { dalle("zellige", 0, -.25, 0, 3, 3, .25), cage(0, 0, 0), jarre(-1.8, 0, 1), jarre(1.8, 0, 1) } },
	{ m = 4, nom = "Le four de Guellala", tirs = 4, but = { type = "tomber", min = 9 }, par = 2500,
		aide = "Le grand four : une caisse de feux d’artifice est cachée dedans !",
		blocs = { pyramide("brique", 0, .5, 4), cube("feux", 0, 0, -.7, .8), tour("palmier", -2.4, .5, 3), tour("palmier", 2.4, .5, 3) } },
	-- Tabarka (20/11) : le fort génois, les troncs de pins, le corail (matelas), la pierre
	{ m = 5, nom = "Les remparts", tirs = 3, vitesse = 17, but = { type = "tomber", min = 8 }, par = 1400,
		aide = "Le fort de Tabarka : vise le haut des remparts de pierre !",
		blocs = { mur("pierre", 0, 0, 5, 4), tour("pierre", -2.4, 0, 2), tour("pierre", 2.4, 0, 2) } },
	{ m = 5, nom = "La forêt de pins", tirs = 3, but = { type = "tomber", min = 6 }, par = 1100,
		aide = "Des troncs de pins debout : fais-les tomber comme des quilles !",
		blocs = { colonne("palmier", -1.6, 0, 2.4, .3), colonne("palmier", -.5, .6, 2.4, .3), colonne("palmier", .5, 0, 2.4, .3), colonne("palmier", 1.6, .6, 2.4, .3), colonne("palmier", 0, 1.4, 2.4, .3), colonne("palmier", 0, -.9, 2.4, .3) } },
	{ m = 5, nom = "Le rocher du corail", tirs = 3, but = { type = "cible" }, par = 1050,
		aide = "Rebondis sur le matelas de corail pour toucher la jarre d’or tout en haut !",
		blocs = { B("matelas", 0, .3, -1.6, 2.6, .6, 1.4), tour("pierre", 0, 1.5, 3, .9), jarre(0, 2.7, 1.5, { cible = true }) } },
	{ m = 5, nom = "Le canon du fort", tirs = 3, but = { type = "tomber", min = 7 }, par = 1400,
		aide = "Les caisses de poudre du fort : une étincelle, et tout saute !",
		blocs = { cube("feux", 0, 0, 0, .8), tour("bois", -1.1, 0, 3), tour("bois", 1.1, 0, 3), dalle("bois", 0, 3, 0, 3, 1, .2) } },
	{ m = 5, nom = "Le chaton du phare", tirs = 4, but = { type = "chat" }, par = 1400,
		aide = "Le dernier chaton est en haut de la tour de pierre : libère-le sans le faire tomber !",
		blocs = { dalle("zellige", 0, 1.6, .5, 2.4, 2.4, .3), colonne("zellige", -.9, .5, 1.6, .25), colonne("zellige", .9, .5, 1.6, .25), cage(0, 1.9, .5), tour("pierre", -2.2, 0, 2), tour("pierre", 2.2, 0, 2) } },
	-- Kairouan (22/11) : les tapis (matelas qui rebondissent), les briques de la médina, le bassin des Aghlabides
	{ m = 6, nom = "Le souk des tapis", tirs = 3, but = { type = "tomber", min = 5 }, par = 1200,
		aide = "Au souk de Kairouan, les rouleaux de tapis rebondissent ! Fais tomber 5 blocs.",
		blocs = { tour("matelas", -1.3, 0, 3, .9), tour("bois", 1.3, 0, 4), tour("bois", 0, 1.2, 3) } },
	{ m = 6, nom = "La porte de la médina", tirs = 3, but = { type = "tomber", min = 6 }, par = 1100,   -- 7 sur le site ; 6 dans Roblox
		aide = "La vieille porte de la médina : vise le haut de l’arche !",
		blocs = { tour("brique", -1.3, 0, 3, .8), tour("brique", 1.3, 0, 3, .8), dalle("pierre", 0, 2.4, 0, 3.4, 1, .3), pyramide("brique", 0, 1.4, 3, .7) } },
	{ m = 6, nom = "Le bassin des Aghlabides", tirs = 3, but = { type = "cible" }, par = 950,
		aide = "La jarre d’or est au milieu du grand bassin rond : vole par-dessus les pierres !",
		blocs = { rangee({ 0, 60, 120, 180, 240, 300 }, function(a) return cube("pierre", 1.5 * math.cos(a * math.pi / 180), 0, 1 + 1.5 * math.sin(a * math.pi / 180), .7) end), jarre(0, 0, 1, { cible = true }) } },
	{ m = 6, nom = "Les makrouds", tirs = 4, but = { type = "tomber", min = 10 }, par = 1300,
		aide = "Une montagne de makrouds en briques : fais-en tomber 10 !",
		blocs = { pyramide("brique", 0, .5, 5, .7) } },
	{ m = 6, nom = "Le chaton du souk", tirs = 3, but = { type = "chat" }, par = 1000,
		aide = "Un chaton s’est caché entre les tapis : libère-le sans le faire tomber !",
		blocs = { dalle("zellige", 0, -.25, .8, 3, 3, .25), cage(0, 0, .8), tour("matelas", -2.2, .8, 2, .9), tour("matelas", 2.2, .8, 2, .9) } },
	-- Tozeur (22/11) : les briques décorées, les palmiers dattiers, le chott salé qui glisse, la cascade de Chebika
	{ m = 7, nom = "Le mur de Tozeur", tirs = 3, but = { type = "tomber", min = 10 }, par = 1700,
		aide = "Les maisons de Tozeur ont des murs de briques dorées : fais-en tomber 10 !",
		blocs = { mur("brique", 0, 0, 6, 5) } },
	{ m = 7, nom = "Les palmiers dattiers", tirs = 3, but = { type = "tomber", min = 5 }, par = 1000,
		aide = "La palmeraie : fais tomber les palmiers comme des quilles !",
		blocs = { colonne("palmier", -1.6, 0, 2.6, .28), colonne("palmier", -.8, .9, 2.6, .28), colonne("palmier", 0, 0, 2.6, .28), colonne("palmier", .8, .9, 2.6, .28), colonne("palmier", 1.6, 0, 2.6, .28), colonne("palmier", 0, 1.8, 2.6, .28) } },
	{ m = 7, nom = "Le chott salé", tirs = 3, but = { type = "tomber", min = 5 }, par = 850,
		aide = "Le grand lac de sel glisse comme une patinoire : pousse les blocs jusqu’au bord !",
		blocs = { dalle("zellige", 0, -.25, 1.5, 6, 3, .25), rangee({ -1.5, -.5, .5, 1.5 }, function(x) return cube("marbre", x, 0, 1.5, .8) end), cube("marbre", -1, 0, 2.5, .8), cube("marbre", 1, 0, 2.5, .8) } },
	{ m = 7, nom = "La cascade de Chebika", tirs = 3, but = { type = "cible" }, par = 1000,
		aide = "Rebondis sur le matelas pour toucher les deux jarres d’or près de la cascade !",
		blocs = { B("matelas", 0, .3, -1.6, 3, .6, 1.4), tour("pierre", -1, 1.5, 2, .9), jarre(-1, 1.8, 1.5, { cible = true }), tour("pierre", 1, 1.5, 3, .9), jarre(1, 2.7, 1.5, { cible = true }) } },
	{ m = 7, nom = "Le chaton de l’oasis", tirs = 3, but = { type = "chat" }, par = 1000,
		aide = "Le chaton est caché entre les palmiers : libère-le, mais il ne doit pas tomber !",
		blocs = { dalle("zellige", 0, -.25, 1, 3.4, 3.4, .25), cage(0, 0, 1), tour("palmier", -2.3, 0, 2), tour("palmier", 2.3, 0, 2) } },
	-- Carthage (22/11) : les colonnes des thermes, les amphores du port, le bateau, la colline de Byrsa
	{ m = 8, nom = "Les thermes d’Antonin", tirs = 3, vitesse = 18, but = { type = "tomber", min = 4 }, par = 900,
		aide = "Les grandes colonnes des thermes, au bord de la mer : renverse-les !",
		blocs = { rangee({ -2.1, -.7, .7, 2.1 }, function(x) return colonne("marbre", x, 0, 2.6, .32) end), dalle("pierre", -1.4, 2.6, 0, 2, 1), dalle("pierre", 1.4, 2.6, 0, 2, 1) } },
	{ m = 8, nom = "Les amphores du port", tirs = 3, but = { type = "cible" }, par = 1200,
		aide = "Au port punique : casse les trois amphores d’or sur les étagères !",
		blocs = { dalle("bois", 0, 1.4, .5, 4.4, 1, .2), tour("bois", -2, .5, 1, 1.4), tour("bois", 2, .5, 1, 1.4), jarre(-1.2, 1.6, .5, { cible = true }), jarre(0, 1.6, .5, { cible = true }), jarre(1.2, 1.6, .5, { cible = true }), jarre(0, 0, -.5) } },
	{ m = 8, nom = "Le bateau phénicien", tirs = 3, but = { type = "tomber", min = 6 }, par = 1300,
		aide = "Un bateau phénicien tout en bois : fais tomber sa cargaison !",
		blocs = { dalle("bois", 0, 0, .5, 4.4, 1.6, .3), rangee({ -1.6, -.8, 0, .8, 1.6 }, function(x) return cube("bois", x, .3, .5, .7) end), rangee({ -1.2, -.4, .4, 1.2 }, function(x) return cube("bois", x, 1, .5, .7) end), colonne("palmier", 0, 1.6, 3, .2) } },
	{ m = 8, nom = "La colline de Byrsa", tirs = 4, vitesse = 17, but = { type = "tomber", min = 10 }, par = 2200,
		aide = "La colline de Byrsa : une caisse de feux d’artifice est cachée sous les pierres !",
		blocs = { pyramide("pierre", 0, .6, 5, .75), cube("feux", 0, 0, -.5, .7) } },
	{ m = 8, nom = "Le chaton de Carthage", tirs = 4, but = { type = "chat" }, par = 1400,
		aide = "Le dernier chaton est sur le temple : libère-le sans le faire tomber !",
		blocs = { dalle("zellige", 0, 1.6, .5, 2.4, 2.4, .3), colonne("marbre", -.9, .5, 1.6, .25), colonne("marbre", .9, .5, 1.6, .25), cage(0, 1.9, .5), cube("feux", -2.2, 0, -.5, .8), tour("pierre", 2.2, -.5, 2, .8) } },

}

-- met tous les blocs d'un niveau dans une seule liste
local function aplatir(liste, out)
	for _, e in ipairs(liste) do
		if e.t then table.insert(out, e) else aplatir(e, out) end
	end
	return out
end
for _, niv in ipairs(LISTE) do niv.blocs = aplatir(niv.blocs, {}) end
Niveaux.LISTE = LISTE

-- les numéros des niveaux d'un monde
function Niveaux.duMonde(m)
	local out = {}
	for i, niv in ipairs(LISTE) do if niv.m == m then table.insert(out, i) end end
	return out
end

return Niveaux
