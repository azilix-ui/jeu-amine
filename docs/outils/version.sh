#!/bin/sh
# À lancer juste avant chaque commit de mise à jour du site : version.js = 3.<numéro du prochain commit> + date du jour,
# affichée en bas de la page d'accueil. Usage : sh docs/outils/version.sh
n=$(( $(git rev-list --count HEAD) + 1 ))
d=$(TZ=Europe/Paris date +%d/%m/%Y)
printf "// mis à jour par docs/outils/version.sh avant chaque commit\nwindow.SITE_VERSION = { v:'3.%s', date:'%s' };\n" "$n" "$d" > version.js
echo "version 3.$n du $d"
