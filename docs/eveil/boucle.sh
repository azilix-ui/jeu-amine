#!/bin/sh
# Éveil saison 2 : une vidéo Wan 2.2 (5 s, 832 × 480) -> une boucle sans à-coup pour le film : la fin se fond (0,8 s) dans le début.
# Usage : sh boucle.sh <entrée.mp4> <sortie.mp4>
D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$1")
O=$(echo "$D - 1.6" | bc -l)
ffmpeg -loglevel error -y -i "$1" -filter_complex "[0:v]split[a][b];[a]trim=0.8:$D,setpts=PTS-STARTPTS[m];[b]trim=0:0.8,setpts=PTS-STARTPTS[h];[m][h]xfade=transition=fade:duration=0.8:offset=$O,format=yuv420p[v]" \
  -map "[v]" -an -c:v libx264 -preset veryfast -crf 27 -movflags +faststart "$2"
