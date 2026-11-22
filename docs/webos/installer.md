# L'application « Famille Missaoui » sur la télé LG (22/11)

Télé du salon : LG OLED77C35LA, webOS 24 (9.2.0). L'application ouvre la **salle de jeux télé** du site (`/tele/`), où tout se fait à la télécommande. Pour l'instant, un seul jeu a le mode télécommande : **le Jasmin** (`jeux/legende-du-jasmin-4.html`, une copie du Jasmin 3 : le Jasmin 3 n'est pas touché ; même sauvegarde).

Fichier à installer : `com.missaoui.famille_1.0.0_all.ipk` (dans ce dossier et sur le PC : `documentation site\webos\`). Il est fabriqué par `ares-package docs/webos/app` (outil gratuit de LG, `npm i @webos-tools/cli`). L'application ne contient qu'une page qui ouvre le site : les mises à jour du site arrivent sans la réinstaller.

## Une seule fois
1. **Compte LG développeur** (gratuit) : https://webostv.developer.lge.com, « Sign in » puis « Create account ».
2. **Sur la télé** : magasin LG (LG Content Store / Apps), chercher **« Developer Mode »**, l'installer, l'ouvrir, se connecter avec le compte LG développeur, mettre **Dev Mode Status** sur ON. La télé redémarre.
3. Rouvrir **Developer Mode** : noter l'**adresse IP** de la télé, et mettre **Key Server** sur ON.
4. **Sur le PC** : installer **webOS Dev Manager** (gratuit, https://github.com/webosbrew/dev-manager-desktop, rubrique « Releases », fichier Windows `.msi`).
5. Dans Dev Manager : « Add device » → le nom (Télé salon), l'adresse IP de la télé, « Developer Mode » ; il demande la **phrase de passe** (6 caractères) affichée dans l'application Developer Mode de la télé.
6. Onglet **Apps** → « Install » → choisir `com.missaoui.famille_1.0.0_all.ipk`. L'icône « Famille Missaoui » apparaît dans le menu de la télé.

## À savoir
- Le mode développeur dure un temps limité : de temps en temps, ouvrir **Developer Mode** sur la télé et appuyer sur **EXTEND** (la télé doit être connectée à Internet). S'il expire, la télé efface l'application : refaire l'étape 6.
- La télé passe la porte du site parce qu'elle est sur le Wi-Fi de la maison.
- Télécommande : dans la salle, ◀ ▲ ▼ ▶ pour choisir, OK pour jouer, Retour pour quitter. Dans le Jasmin : ◀ ▶ avancer, ▲ ou OK sauter, ▼ s'accroupir, bouton rouge = lancer, Retour = pause ; dans les menus, les flèches passent d'un bouton à l'autre (cadre doré). On peut aussi pointer avec la Magic Remote.
- Le temps de jeu compte comme sur la tablette.
