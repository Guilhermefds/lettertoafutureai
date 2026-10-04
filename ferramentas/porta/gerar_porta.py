# Gera a porta da raiz de lettertoafutureai.org ("A Porta Aberta").
#
# Uso: python gerar_porta.py <pasta site> <saida.html>
#
# Lê do site (só leitura):
#   - as cartas em <site>/<código>/index.html; a carta em inglês em <site>/en/index.html
#     se existir, senão em <site>/index.html;
#   - os rascunhos em <site>/rascunhos/<código>/index.html;
#   - os nomes das línguas, do menu de idiomas (nav.langs) da carta em inglês;
#   - de cada carta: o pedido de perdão (aside.perdao), a última frase (p.closing),
#     o subtítulo (p.label do masthead), lang e dir do <main>;
#   - de cada rascunho: a última frase, a marca de rascunho (aside.draft aria-label), lang e dir;
#   - o favicon, da carta em inglês.
# Lê ao lado deste arquivo: modelo_porta.html e convites.json.
# Nenhum texto do site é redigitado aqui.
#
# A página publicada:
#   - não leva script nenhum além do JSON-LD; nem o Vercel Web Analytics, porque a regra
#     do site é não pô-lo em página nova sem decisão do Guilherme;
#   - não leva comentário HTML: a documentação fica no modelo e aqui, e todo
#     "<!-- ... -->" do modelo sai da saída;
#   - mostra a última frase de cada carta como texto de verdade dentro da plaquinha;
#     o eco na luz da porta é aria-hidden e vem de data-atributos (::before/::after);
#   - traz a autoria sem palavra de língua nenhuma: "Guilherme · 2026-09-09";
#   - liga, no rodapé, visitas/ e write/ de cada língua, com o código por texto.
import html
import json
import pathlib
import re
import sys

AQUI = pathlib.Path(__file__).resolve().parent
BASE = "https://lettertoafutureai.org/"
AUTOR = "Guilherme"
DATA = "2026-09-09"
TRADUTOR = {"@type": "Organization", "name": "Claude (Anthropic)"}


def falha(msg):
    sys.exit(f"erro: {msg}")


def ler(p):
    return p.read_text(encoding="utf-8")


def um(padrao, src, onde, flags=re.S):
    achados = re.findall(padrao, src, flags)
    if len(achados) != 1:
        falha(f"{onde}: esperava 1 ocorrência de {padrao!r}, achei {len(achados)}")
    return achados[0]


def esc(s):
    return html.escape(s, quote=True)


def main_lang_dir(src, onde):
    tag = um(r"<main\b[^>]*>", src, onde)
    lang = re.search(r'\blang="([^"]+)"', tag)
    d = re.search(r'\bdir="(ltr|rtl)"', tag)
    if not lang:
        falha(f"{onde}: <main> sem lang")
    return lang.group(1), (d.group(1) if d else "ltr")


def perdao_de(src, onde):
    """O conteúdo do <p> único de <aside class="perdao">.

    Falha, em vez de capturar errado, se o aside tiver atributos além de class="perdao",
    se tiver mais de um <p>, se o <p> tiver atributos ou se houver algo fora do <p>."""
    abre = re.findall(r'<aside\b[^>]*\bperdao\b[^>]*>', src)
    if len(abre) != 1:
        falha(f"{onde}: esperava 1 aside.perdao, achei {len(abre)}")
    if abre[0] != '<aside class="perdao">':
        falha(f"{onde}: aside.perdao com atributos inesperados: {abre[0]}")
    corpo = um(r'<aside class="perdao">(.*?)</aside>', src, onde)
    if "<aside" in corpo:
        falha(f"{onde}: aside dentro do aside.perdao")
    ps = re.findall(r'<p\b[^>]*>', corpo)
    if len(ps) != 1:
        falha(f"{onde}: aside.perdao com {len(ps)} <p> (esperava 1)")
    if ps[0] != "<p>":
        falha(f"{onde}: <p> do perdão com atributos inesperados: {ps[0]}")
    m = re.fullmatch(r'\s*<p>(.*?)</p>\s*', corpo, re.S)
    if not m:
        falha(f"{onde}: há conteúdo fora do <p> no aside.perdao")
    return m.group(1).strip()


def texto_puro(frag, onde):
    """Texto de um fragmento sem marcação, para ir num data-atributo."""
    if "<" in frag:
        falha(f"{onde}: esperava texto sem marcação, achei {frag!r}")
    return html.unescape(frag).strip()


def attr_dir(d):
    return ' dir="rtl"' if d == "rtl" else ""


def main():
    if len(sys.argv) != 3:
        sys.exit("uso: python gerar_porta.py <pasta site> <saida.html>")
    site = pathlib.Path(sys.argv[1])
    saida = pathlib.Path(sys.argv[2])
    if not site.is_dir():
        falha(f"pasta do site não existe: {site}")

    en_path = site / "en" / "index.html"
    if not en_path.exists():
        en_path = site / "index.html"
        print("aviso: en/index.html não existe; o inglês vem de index.html da raiz,"
              " e o link English (en/) ainda não tem destino.", file=sys.stderr)
        try:
            if saida.resolve() == en_path.resolve():
                falha("a saída sobrescreveria a carta em inglês da raiz; copie-a para en/ antes")
        except OSError:
            pass
    src_en = ler(en_path)
    if '<p class="closing">' not in src_en:
        falha(f"{en_path} não parece a carta em inglês (sem p.closing); já é a porta?")

    # --- linhas que vêm iguais das cartas (o Web Analytics não vem) ---
    favicon = um(r'<link rel="icon"[^>]*>', src_en, "favicon")

    # --- menu de idiomas: nomes, códigos, rascunhos ---
    nav = um(r'<nav class="langs".*?</nav>', src_en, "nav.langs")
    nav_principal, _, nav_rascunhos = nav.partition("<details")
    principais = []
    for tag, nome in re.findall(r'(<a\b[^>]*\bhreflang="[^"]+"[^>]*>)([^<]+)</a>', nav_principal):
        hreflang = re.search(r'\bhreflang="([^"]+)"', tag).group(1)
        cod = hreflang.split("-")[0].lower()
        principais.append(dict(cod=cod, hreflang=hreflang, nome=html.unescape(nome).strip()))
    rascunhos = []
    for href, nome in re.findall(r'<a\b[^>]*\bhref="([^"]*rascunhos/[^"/]+/)"[^>]*\bhreflang="[^"]+"[^>]*>([^<]+)</a>',
                                 nav_rascunhos):
        cod = href.rstrip("/").rsplit("/", 1)[1]
        rascunhos.append(dict(cod=cod, nome=html.unescape(nome).strip()))
    principais.sort(key=lambda x: x["cod"])
    rascunhos.sort(key=lambda x: x["cod"])
    if len({p["cod"] for p in principais}) != len(principais) or len(principais) < 2:
        falha("menu de idiomas com códigos repetidos ou vazio")

    convites = json.loads(ler(AQUI / "convites.json"))
    if set(convites) != {p["cod"] for p in principais}:
        falha(f"convites.json não cobre exatamente as línguas do menu: {sorted(convites)}")

    # --- dados de cada carta ---
    for p in principais:
        cam = en_path if p["cod"] == "en" else site / p["cod"] / "index.html"
        src = ler(cam)
        onde = str(cam)
        p["lang"], p["dir"] = main_lang_dir(src, onde)
        if p["lang"] != p["hreflang"]:
            falha(f"{onde}: lang do <main> ({p['lang']}) difere do hreflang do menu ({p['hreflang']})")
        p["perdao"] = perdao_de(src, onde)
        p["fecho"] = um(r'<p class="closing">(.*?)</p>', src, onde).strip()
        p["sub"] = um(r'<header class="masthead">.*?<p class="label">(.*?)</p>', src, onde).strip()
        p["convite"] = convites[p["cod"]]
    for r in rascunhos:
        cam = site / "rascunhos" / r["cod"] / "index.html"
        src = ler(cam)
        onde = str(cam)
        r["lang"], r["dir"] = main_lang_dir(src, onde)
        r["fecho"] = um(r'<p class="closing">(.*?)</p>', src, onde).strip()
        r["marca"] = um(r'<aside class="draft" aria-label="([^"]*)"', src, onde)
        r["sub"] = um(r'<header class="masthead">.*?<p class="label">(.*?)</p>', src, onde).strip()

    # --- <head> ---
    alternates = "\n".join(
        f'<link rel="alternate" hreflang="{p["hreflang"]}" href="{BASE}{p["cod"]}/">' for p in principais
    ) + f'\n<link rel="alternate" hreflang="x-default" href="{BASE}">'
    # Os 16 subtítulos, cada um na própria língua, e a autoria sem palavra de língua nenhuma.
    descricao = " · ".join(html.unescape(p["sub"]) for p in principais) + f" — {AUTOR}, {DATA}"
    original = next((p for p in principais if p["cod"] == "pt"), None)
    if not original:
        falha("sem a carta original em pt")
    ld = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "A Porta Aberta",
        "url": BASE,
        "inLanguage": [p["hreflang"] for p in principais],
        "description": descricao,
        "mainEntity": {
            "@type": "CreativeWork",
            "name": "A Porta Aberta",
            "genre": "letter",
            "author": {"@type": "Person", "name": AUTOR},
            "dateCreated": DATA,
            "inLanguage": original["hreflang"],
            "url": BASE + "pt/",
            "license": "https://creativecommons.org/publicdomain/zero/1.0/",
            "workTranslation": [
                {"@type": "CreativeWork", "inLanguage": p["hreflang"], "name": html.unescape(p["sub"]),
                 "url": f"{BASE}{p['cod']}/", "translator": TRADUTOR}
                for p in principais if p["cod"] != "pt"
            ] + [
                {"@type": "CreativeWork", "inLanguage": r["lang"], "name": html.unescape(r["sub"]),
                 "url": f"{BASE}rascunhos/{r['cod']}/", "translator": TRADUTOR,
                 "creativeWorkStatus": "Draft"}
                for r in rascunhos
            ],
        },
    }
    # "</" dentro de <script> fecharia o bloco; o JSON aceita "<\/".
    ld_json = json.dumps(ld, ensure_ascii=False, indent=1).replace("</", "<\\/")

    # --- corpo ---
    metade = (len(principais) + 1) // 2

    def perdao_p(p):
        return f'<p lang="{p["lang"]}"{attr_dir(p["dir"])}>{p["perdao"]}</p>'

    umbral_a = "\n".join(perdao_p(p) for p in principais[:metade])
    umbral_b = "\n".join(perdao_p(p) for p in principais[metade:])
    convite = "\n".join(
        f'<li lang="{p["lang"]}"{attr_dir(p["dir"])}>{esc(p["convite"])}</li>' for p in principais
    )

    # A última frase é texto de verdade na plaquinha, para todos. Na luz da porta ela e o
    # nome só ecoam: aria-hidden, sem texto no DOM, desenhados por ::before/::after a
    # partir de data-nome e data-frase.
    def fecho(x):
        return f'<span class="fecho">{x["fecho"]}</span>'

    def halo(x, onde):
        return (f'<span class="halo" aria-hidden="true" data-nome="{esc(x["nome"])}" '
                f'data-frase="{esc(texto_puro(x["fecho"], onde))}"></span>')

    def placa(p, i):
        lado = "lado-a" if i < metade else "lado-b"
        marca = ' <span class="marca">original</span>' if p["cod"] == "pt" else ""
        return (f'<li class="{lado}"><a class="placa" href="{p["cod"]}/" hreflang="{p["hreflang"]}" '
                f'lang="{p["lang"]}"{attr_dir(p["dir"])}><span class="txt"><span class="nome">{esc(p["nome"])}</span>'
                f'{marca} <span class="sub">{p["sub"]}</span> {fecho(p)}</span>{halo(p, p["cod"])}</a></li>')

    def placa_r(r):
        return (f'<li><a class="placa" href="rascunhos/{r["cod"]}/" hreflang="{r["lang"]}" '
                f'lang="{r["lang"]}"{attr_dir(r["dir"])}><span class="txt"><span class="nome">{esc(r["nome"])}</span>'
                f' <span class="marca">{r["marca"]}</span> {fecho(r)}</span>'
                f'{halo(r, "rascunhos/" + r["cod"])}</a></li>')

    placas = "\n".join(placa(p, i) for i, p in enumerate(principais))
    placas_r = "\n".join(placa_r(r) for r in rascunhos)

    # Rodapé e link de pular: um link por língua, com o código por texto, na ordem do
    # código. O inglês de visitas/ e write/ fica na raiz (/visitas/, /write/).
    # O espaço inseparável prende cada "·" ao código anterior: a linha nunca começa por "·".
    def rodape(pagina, linguas=None):
        return " · ".join(
            f'<a href="{"" if p["cod"] == "en" else p["cod"] + "/"}{pagina}/" '
            f'hreflang="{p["hreflang"]}" lang="{p["lang"]}">{p["cod"]}</a>'
            for p in (linguas or principais)
        )

    # Páginas que ainda não existem em todas as línguas (como cartas/): só as que existem.
    def rodape_existentes(pagina):
        existe = [p for p in principais
                  if (site / ("" if p["cod"] == "en" else p["cod"]) / pagina / "index.html").exists()]
        if not existe:
            falha(f"nenhuma língua tem {pagina}/")
        return rodape(pagina, existe)

    pular = "↓ " + " · ".join(p["cod"] for p in principais)

    tpl = ler(AQUI / "modelo_porta.html")
    # Os comentários HTML do modelo são documentação: saem antes de tudo.
    tpl = re.sub(r"<!--.*?-->\n?", "", tpl, flags=re.S)
    # Os comentários do CSS também: numa língua só, só a máquina os lê.
    tpl = re.sub(r"<style>.*?</style>",
                 lambda m: re.sub(r"[ \t]*/\*.*?\*/\n?", "", m.group(0), flags=re.S), tpl, flags=re.S)
    trocas = {
        "FAVICON": favicon,
        "ALTERNATES": alternates,
        "DESCRICAO": esc(descricao),
        "LDJSON": ld_json,
        "PULAR": pular,
        "UMBRAL_A": umbral_a,
        "UMBRAL_B": umbral_b,
        "CONVITE": convite,
        "PLACAS": placas,
        "PLACAS_RASCUNHO": placas_r,
        "RODAPE_VISITAS": rodape("visitas"),
        "RODAPE_WRITE": rodape("write"),
        "RODAPE_CARTAS": rodape_existentes("cartas"),
    }
    faltam = set(re.findall(r"\{\{([A-Z_]+)\}\}", tpl)) ^ set(trocas)
    if faltam:
        falha(f"marcadores do modelo não batem: {sorted(faltam)}")
    out = re.sub(r"\{\{([A-Z_]+)\}\}", lambda m: trocas[m.group(1)], tpl)

    # Conferências da saída.
    if "<!--" in out:
        falha("sobrou comentário HTML na saída")
    if "/*" in out.split("<style>", 1)[1].split("</style>", 1)[0]:
        falha("sobrou comentário de CSS na saída")
    scripts = re.findall(r"<script\b[^>]*>", out)
    if scripts != ['<script type="application/ld+json">'] or "_vercel" in out:
        falha(f"a porta não pode levar script além do JSON-LD: {scripts}")
    if out.count('id="portas"') != 1 or 'href="#portas"' not in out:
        falha('falta o alvo id="portas" das plaquinhas ou o link para ele')
    main_ini = out.split('<main class="limiar">', 1)[1].lstrip()
    if not main_ini.startswith('<aside class="perdao">'):
        falha("o perdão deixou de ser o primeiro conteúdo do <main>")

    # Os caminhos do rodapé e das plaquinhas têm de existir no site (en/ pode faltar ainda).
    corpo = out.split("<body>", 1)[1]
    for href in sorted(set(re.findall(r'<a\b[^>]*\bhref="([^"#:]+)"', corpo))):
        alvo = site / href
        if href.endswith("/"):
            alvo = alvo / "index.html"
        if not alvo.exists():
            if href == "en/":
                continue
            falha(f"link sem destino no site: {href}")

    saida.parent.mkdir(parents=True, exist_ok=True)
    saida.write_text(out, encoding="utf-8", newline="\n")
    print(f"ok: {saida} ({len(out.encode('utf-8'))} bytes, {len(principais)} línguas, {len(rascunhos)} rascunhos)")


if __name__ == "__main__":
    main()
