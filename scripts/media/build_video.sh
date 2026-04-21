#!/usr/bin/env bash
# Fast LinkedIn launch video builder — crossfade slideshow at 1080x1350
# Run from the repository root: bash scripts/media/build_video.sh
set -e
cd "$(dirname "$0")/../.."

IMG_DIR="archive/social-launch/LINKEDIN-LAUNCH/images"
OUT="archive/social-launch/LINKEDIN-LAUNCH/video/szl-holdings-launch-demo.mp4"
mkdir -p archive/social-launch/LINKEDIN-LAUNCH/video
rm -f "$OUT"

DUR=3.6
XFADE=0.55
W=1080
H=1350
FPS=24

mapfile -t SLIDES < <(ls "$IMG_DIR"/*.jpg | sort)
N=${#SLIDES[@]}
echo "Building from $N slides..."

INPUTS=()
FILTERS=()
for i in "${!SLIDES[@]}"; do
  INPUTS+=(-loop 1 -t "$DUR" -i "${SLIDES[$i]}")
  FILTERS+=("[$i:v]scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:black,setsar=1,fps=${FPS},format=yuv420p[v$i]")
done

CHAIN=""
PREV="v0"
OFFSET=0
for ((i=1;i<N;i++)); do
  OFFSET=$(awk "BEGIN{printf \"%.3f\", $OFFSET + $DUR - $XFADE}")
  OUT_LBL="x$i"
  [ $i -eq $((N-1)) ] && OUT_LBL="vout"
  CHAIN+=";[$PREV][v$i]xfade=transition=fade:duration=${XFADE}:offset=${OFFSET}[$OUT_LBL]"
  PREV="$OUT_LBL"
done

FILTER=$(IFS=';'; echo "${FILTERS[*]}")$CHAIN

ffmpeg -y -hide_banner -loglevel error "${INPUTS[@]}" \
  -filter_complex "$FILTER" \
  -map "[vout]" \
  -c:v libx264 -pix_fmt yuv420p -preset ultrafast -crf 23 -movflags +faststart \
  -r $FPS \
  "$OUT"

ls -lh "$OUT"
ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "$OUT"
