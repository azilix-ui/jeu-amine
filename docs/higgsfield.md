# Higgsfield : images et vidéos de la famille

Compte du papa (forfait **Plus**), relié à Claude par le connecteur MCP Higgsfield. Workspace `4e64cbea-0ec9-4fa0-a4ee-549fc3718306`. Préférence : pas de projet créé automatiquement.

## Règles

1. **Toujours donner le prix exact avant de générer** (`get_cost: true`), attendre l'accord, puis montrer le résultat avant de publier.
2. Envoyer seulement des **visages recadrés** (jamais une planche de photos d'identité avec numéros, ni un document scolaire).
3. Pas de personnage protégé ni de style nommé d'après une marque ; personnages et créatures originaux.
4. Télécharger les fichiers (domaines `d8j0ntlcm91z4.cloudfront.net`, `d2ol7oe51mr4n9.cloudfront.net`, `upload.higgsfield.ai` autorisés), les alléger (ffmpeg → `.webp` / `.mp4` 960 px) avant de les mettre sur le site, et copier les originaux PNG sur le PC.
5. Envoi d'une image de référence : `media_upload` → `curl -X PUT` → `media_confirm` (type image).

## Modèles utilisés

| Modèle | Usage | Prix constaté |
|---|---|---|
| `flux_3_image` (1k) | avatars, cartes, illustrations, avec images de référence (rôle `image_references`, jusqu'à 10) | 2 crédits / image |
| `seedance_2_5` (5 s, 720p, 16:9) | vidéos ; `mode: omni_reference` + `start_image` pour animer une image | 35 crédits / vidéo |

## Ce qui a été généré (790 → 505 crédits)

| Date | Quoi | Fichiers sur le site | Crédits |
|---|---|---|---|
| 01/11 | Cheval au pas, au trot, au galop (vidéos) | `salma/cheval/{pas,trot,galop}.mp4` + `-poster.webp` | 105 |
| 01/11 | Salma à cheval : 2 images (réaliste, dessin animé) + 2 vidéos ; son = sa vraie voix | `salma/cheval/salma-{realiste,cartoon}.mp4` | 74 |
| 01/11 | Avatars Essil, Salma, Amine | `jeux/avatars/{essil,salma,amine}.webp` | 6 |
| 01/11 | Cartes légendes des enfants (×3 légendes) | `jeux/avatars/<enfant>-{dragon,licorne,phenix}.webp` | 18 (une relance gratuite) |
| 01/11 | Avatars Anis, Imen | `jeux/avatars/{anis,imen}.webp` | 4 |
| 02/11 | Cartes légendes d'Anis et Imen + illustration Ludo (famille autour du plateau) | `jeux/avatars/{anis,imen}-*.webp`, `jeux/avatars/ludo-famille.webp` | 14 |
| 02/11 | 15 cartes illustrées de l'Ardoise magique (un serpent par skin) + Amine devant son ardoise (écran d'accueil) | `jeux/cartes/<skin>.webp`, `amine/ardoise-amine.webp` | 32 |
| 02/11 | Cartes rares : 4 mythiques (Amine, Salma, Essil, les 3 ensemble) + 4 secrètes | `jeux/cartes/{alphabet,polyglotte,hydre,aurore,tonnerre,arclune,tresor}.webp` | 16 |
| 02/11 | Illustration de Grimpe-Glace (la famille saute dans la tour de glace, les 5 avatars en référence) | `jeux/avatars/grimpe-glace.webp` | 2 |
| 04/11 | La Légende du Jasmin : titre (la famille sur les toits de Sidi Bou Saïd, 5 avatars), 5 fonds de monde (21:9), le Scorpion d'Or | `jeux/jasmin/{titre,monde1…5,boss}.webp` | 14 |
| 05/11 | La Légende du Jasmin : 4 nouveaux fonds de monde (21:9, `flux_3_image`) : médina de Tunis, Carthage, Djerba, Matmata (jobs 18469668…, 379786bb…, 4a552b16…, a1aa2957…) | `jeux/jasmin/monde6…9.webp` | 8 |
| 05/11 | La Légende du Jasmin : 4 fonds de plus (21:9, `flux_3_image`) : Tabarka, El Jem, Chott el-Jérid, Lézard Rouge (jobs 9f3b5685…, f6f2202d…, 1c4d4753…, 7bbe527c…) | `jeux/jasmin/monde10…13.webp` | 8 |
| 05/11 | Mascottes de La Légende du Jasmin : Nour (garçon, jasmin à l'oreille) et Farès (jeune homme) (jobs 77ea6059…, ee81e6cb…) | `jeux/avatars/mascotte-{nour,fares}.webp` | 4 |
| 05/11 | Mascotte fille Yasmine (job 34da25b6…) | `jeux/avatars/mascotte-yasmine.webp` | 2 |
| 09/11 | Salma's Weather Station : 14 images (la même maison sous chaque temps et à chaque saison, 1:1) + image d'accueil (Salma présentatrice, avatar en référence, 16:9) (`flux_3_image`) | `salma/meteo/*.webp` | 30 |
| 09/11 | Salma's Weather Station : 47 voix anglaises (`seed_audio`, voix **Raina** `1c3a4775-9afb-52c1-a2bf-b6543231a9a1` choisie par le papa, `speech_rate` −15, mp3), découpées et rognées | `salma/meteo/voix/*.mp3` | ~8 |
| 09/11 | La Légende du Jasmin : 6 fonds (21:9) : Kairouan, Ksar Ouled Soltane, Ichkeul, Tamerza, aqueduc de Zaghouan (+ un Sidi Bou Saïd non utilisé : ce monde existait déjà) | `jeux/jasmin/monde14…18.webp` | 12 |
| 09/11 | Vidéo 1 d'Essil « La clôture des chèvres » : 12 images 9:16 + voix off française (Elodie, refaite en wav car le mp3 coupait les fins) | PC : `videos temple\perimetre-cloture-des-chevres.mp4` | ≈ 44 |
| 09/11 | Essais de 6 voix françaises (ElevenLabs, MiniMax) puis toute la voix off de la vidéo 1 avec **Céline** | `essil/videos/perimetre.mp4` | ≈ 8 |
| 09/11 | Épisode 2 d'Essil « Carreler la cuisine de mamie » (l'aire) : 11 images 9:16 + 14 phrases de Céline | `essil/videos/aire.mp4` | ≈ 27 |
| | **Total** | | **≈ 436** |

La carte mythique de Salma (`verbes`) a une crête de plumes qui rappelle une coiffe ; publiée telle quelle à la demande du papa (02/11).

Originaux PNG sur le PC : `OneDrive\Amine\grande section\avatars serpent legendes\` (avatars, cartes, illustration ; sous-dossier `cartes ardoise\` pour les cartes des skins et les cartes rares) et `OneDrive\Salma etude\video-cheval\` (vidéos de Salma).

## Identifiants à réutiliser (même visage, même style)

Avatars (à passer en `image_references` pour garder la ressemblance) :

| Personne | Job de l'avatar | Visage recadré (media) |
|---|---|---|
| Essil | `b227d137-954b-4b50-92b9-48d38093f44d` | `b9b454c0-6984-4a8f-8a58-65e1c6fb25d1` |
| Salma | `6f770cde-3515-4b15-a440-199ce7fa29b0` | `9d549ae9-421c-4bc2-b097-f85bc5a05cbc` (et photo de la vidéo : `85b8bc08-b5b9-46ee-b7b9-bfcab9174a83`) |
| Amine | `5f2f13ce-4ac0-474e-a2f6-ac2c9009ec46` | `99a026b6-35df-49d8-8a73-04d6a5a2debb` |
| Anis | `89ebb3d9-6c6a-4e61-8ff4-79fd2ae7ce2c` | `be2d86c4-32d0-4204-ab4d-fce778095040` |
| Imen | `9a51905a-ec98-49a9-9a17-3fbf1f85ab10` | `fd516196-f994-4f02-8093-5c20cb0201b9` |

Tenues des avatars : Essil sweat bleu marine à étoile dorée (fond bleu-violet) ; Salma tee-shirt blanc au petit chat violet (fond vert-ciel) ; Amine tee-shirt orange au petit dragon vert (fond violet-orange) ; Anis polo bleu col rose (fond vert sarcelle) ; Imen haut bordeaux, cheveux longs lisses (fond framboise-corail).

## Style des prompts qui marchent

- Avatars : « Stylized 3D animated-movie character portrait of the [âge] [girl/boy/man/woman] in the reference photo: keep face shape, eyes, eyebrows, hair recognizable… Head and shoulders, centered, facing camera. Plain smooth gradient background… Bright cheerful video game avatar, high quality render, no text. »
- Cartes légendes : « …the same [person] as the reference (same face, hair, outfit), proudly riding on the back of a giant friendly cartoon [snake-dragon doré / serpent licorne nacré arc-en-ciel / serpent phénix de feu]… raises one fist in victory… Trophy card composition, ornate thin golden frame… no text. » Format 4:3.
- Une génération peut échouer (statut `failed`) : relancer une fois, elle n'est normalement pas facturée ; vérifier le solde ensuite.
- Voix (`seed_audio`, 0,1 crédit la phrase) : pas plus de 3 ou 4 demandes à la fois (sinon erreur 429) ; une prise de plusieurs phrases séparées par des lignes vides se découpe aux silences, mais les petits mots enchaînés vite se découpent mal : une phrase par demande est plus sûr. **En mp3, les phrases de plus de ~6 s sont coupées à la fin : demander `format: wav`.** Une prise a été refusée deux fois (« nsfw ») sans raison : la refaire en phrases séparées.
- Vidéo (prix vérifiés le 09/11, clip 9:16 de 10 s) : Grok Imagine 1.5 Lite 10 crédits, Kling 3.0 sans son 15 (avec son 20), Wan 2.6 15, Seedance 2.5 70.
