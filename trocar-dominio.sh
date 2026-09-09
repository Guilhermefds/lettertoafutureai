#!/bin/sh
# Troca o domínio atual pelo novo em todos os arquivos da pasta site/.
# Uso:  sh trocar-dominio.sh novodominio.com
set -e
NOVO="$1"
if [ -z "$NOVO" ]; then
  echo "Uso: sh trocar-dominio.sh novodominio.com"
  exit 1
fi
DIR="$(cd "$(dirname "$0")" && pwd)/site"
if [ ! -d "$DIR" ]; then
  echo "Pasta site/ não encontrada ao lado deste script."
  exit 1
fi
ATUAL="$(grep -o 'https://[^/<]*' "$DIR/sitemap.xml" | head -1 | sed 's#https://##')"
echo "Trocando $ATUAL por $NOVO ..."
find "$DIR" -type f \( -name '*.html' -o -name '*.xml' -o -name '*.txt' -o -name '*.json' \) | while read -r f; do
  sed -i.bak "s/$(printf '%s' "$ATUAL" | sed 's/\./\\./g')/$NOVO/g" "$f" && rm -f "$f.bak"
done
echo "Pronto. $(grep -c "$NOVO" "$DIR/sitemap.xml") ocorrências no sitemap.xml."
