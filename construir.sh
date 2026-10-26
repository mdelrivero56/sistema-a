#!/usr/bin/env bash
# Regenera los archivos que carga index.html a partir de los archivos fuente.
#   css/00-…21-*.css  ->  css/estilos.css   (se unen en orden numérico)
#   js/demo-video.js + js/app.js + js/galeria-flechas.js + js/scroll-fx.js  ->  js/app.min.js (minificado)
# Requiere Node.js. Uso:  ./construir.sh
# Después de editar cualquier CSS o JS fuente, vuelve a ejecutarlo y sube los archivos generados.
set -euo pipefail
cd "$(dirname "$0")"
V="$(date +%Y%m%d-%H%M)"
cat css/[0-9][0-9]-*.css > css/estilos.css
{ for f in js/demo-video.js js/app.js js/galeria-flechas.js js/scroll-fx.js; do cat "$f"; printf '\n;\n'; done; } > /tmp/_gobhub_all.js
npx --yes terser /tmp/_gobhub_all.js --compress --mangle -o js/app.min.js
sed -i -E "s#(css/estilos\.css|js/config\.js|js/app\.min\.js)\?v=[0-9A-Za-z-]+#\1?v=$V#g" index.html
echo "Listo. Versión $V · css/estilos.css $(wc -c < css/estilos.css) bytes · js/app.min.js $(wc -c < js/app.min.js) bytes"
