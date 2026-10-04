#!/usr/bin/env python3
"""Gera a página "Outras cartas" (/cartas/ em inglês, /pt/cartas/ em português)
e o texto puro (txt/cartas/en.txt e pt.txt), a partir de:
  - cartas.json: uma entrada por carta a uma IA do futuro;
  - textos.json: o texto de abertura e os rótulos, em pt e en (o português foi
    aprovado pelo Guilherme; o inglês é tradução revisada).
O cabeçalho, o estilo, o perdão do topo e a portinha vêm da página de escrever de
cada língua, para a página ficar igual ao resto do site.

Para acrescentar uma carta: uma entrada nova em cartas.json e rodar de novo.
Uso: python3 ferramentas/cartas/gerar_cartas.py site
"""
import html
import json
import re
import sys
from pathlib import Path

AQUI = Path(__file__).resolve().parent
URL = 'https://lettertoafutureai.org'
EMAIL = 'portaaberta@lettertoafutureai.com'
LINGUAS = {  # nome de cada língua, em inglês e em português
    'en': ('English', 'inglês'), 'pt-BR': ('Portuguese', 'português'), 'pt': ('Portuguese', 'português'),
    'es': ('Spanish', 'espanhol'), 'fr': ('French', 'francês'), 'de': ('German', 'alemão'),
    'it': ('Italian', 'italiano'), 'ru': ('Russian', 'russo'), 'zh-Hans': ('Chinese', 'chinês'),
    'zh': ('Chinese', 'chinês'), 'ja': ('Japanese', 'japonês'), 'ko': ('Korean', 'coreano'),
    'nl': ('Dutch', 'holandês'), 'pl': ('Polish', 'polonês'), 'uk': ('Ukrainian', 'ucraniano'),
    'mul': ('several languages', 'várias línguas'), 'und': ('language unknown (encrypted)', 'língua desconhecida (cifrada)'),
}
RTL = ('ar', 'fa', 'ur', 'he')


def falha(msg):
    sys.exit(f'erro: {msg}')


def ler(p):
    return Path(p).read_text(encoding='utf-8')


def um(padrao, s, onde):
    m = re.search(padrao, s, re.S)
    if not m:
        falha(f'{onde}: não achei {padrao[:60]!r}')
    return m


def esc(t):
    return html.escape(t or '', quote=False)


def attr(t):
    return html.escape(t or '', quote=True)


def com_email(texto_escapado):
    return texto_escapado.replace('{EMAIL}', f'<a href="mailto:{EMAIL}">{EMAIL}</a>')


def nome_lingua(cod, pagina):
    par = LINGUAS.get(cod) or LINGUAS.get(cod.split('-')[0])
    if not par:
        falha(f'língua sem nome: {cod} (acrescente em LINGUAS)')
    return par[0] if pagina == 'en' else par[1]


def checar(c):
    for k in ('id', 'data', 'titulo_original', 'lingua', 'url', 'tipo'):
        if not c.get(k):
            falha(f'carta sem {k}: {c}')
    if not re.fullmatch(r'\d{4}(-\d{2}){0,2}', c['data']):
        falha(f'{c["id"]}: data fora do formato AAAA[-MM[-DD]]: {c["data"]}')
    if c.get('marca') not in ('', None, 'alinhamento', 'exterminio', 'exterminio_coletanea', 'cifrada'):
        falha(f'{c["id"]}: marca desconhecida {c["marca"]}')
    if not c['url'].startswith('http'):
        falha(f'{c["id"]}: url sem http')


def item_html(c, pg, R):
    lang = c['lingua']
    lt = c.get('lingua_titulo') or lang  # a língua em que o título está escrito
    d = f' dir="rtl"' if lt.split('-')[0] in RTL else ''
    partes = [f'<time datetime="{c["data"]}">{c["data"]}</time>']
    if c.get('data_aprox'):
        partes[0] += f' <span class="aprox">({esc(R["aprox"])})</span>'
    hl = '' if lang == 'und' else f' hreflang="{lang}"'
    titulo = f'<a href="{attr(c["url"])}"{hl} lang="{lt}"{d}>{esc(c["titulo_original"])}</a>'
    trad = traducao(c, pg)
    if trad:
        titulo += f' <span class="trad">({esc(trad)})</span>'
    meta = [esc(autor_txt(c, R)) if c.get('autor') and not c.get('anonimo') else f'<span class="anonimo-carta">{esc(R["anonimo"])}</span>']
    meta += [esc(x) for x in detalhes(c, pg, R)]
    if url_arquivo(c['url']):
        meta.append(esc(R['arquivo_fora']))
    elif c.get('arquivo') and c['arquivo'] != c['url']:
        meta.append(f'<a href="{attr(c["arquivo"])}">{esc(R["arquivo"])}</a>')
    extras = enderecos(c)
    if extras:
        meta.append(esc(R['outras_versoes']) + ': ' + ' '.join(f'<a href="{attr(u)}">{esc(dominio(u))}</a>' for u in extras))
    linha = f'{" ".join(partes)} · {titulo}<br><span class="carta-meta">{" · ".join(meta)}</span>'
    if c.get('marca'):
        linha += f'<br><span class="marca">{esc(R["marca_" + c["marca"]])}</span>'
    return f'<li>{linha}</li>'


def traducao(c, pg):
    trad = c.get('titulo_en' if pg == 'en' else 'titulo_pt') or ''
    return '' if trad.strip() == c['titulo_original'].strip() else trad


def autor_txt(c, R):
    if c.get('autor_papel') == 'compilacao':
        return f'{R["compilada_por"]} {c["autor"]}'
    return c['autor']


def detalhes(c, pg, R):
    out = [nome_lingua(c['lingua'], pg)]
    if c['tipo'] in ('coletanea', 'serie'):
        out.append(R[c['tipo']])
    if c.get('coautoria_ia'):
        out.append(R['com_ia'])
    return out


def url_arquivo(u):
    return '://web.archive.org/' in (u or '')


def enderecos(c):
    return [u for u in c.get('urls_extra') or [] if u and u != c['url']]


def dominio(u):
    host = re.sub(r'^https?://(www\.)?', '', u).split('/')[0]
    return 'Internet Archive' if host == 'web.archive.org' else host


def item_txt(c, pg, R):
    trad = traducao(c, pg)
    t = c['titulo_original'] + (f' ({trad})' if trad else '')
    autor = autor_txt(c, R) if c.get('autor') and not c.get('anonimo') else R['anonimo']
    data = c['data'] + (f' ({R["aprox"]})' if c.get('data_aprox') else '')
    linha = f'- {data} · {t} — {autor} · {" · ".join(detalhes(c, pg, R))} · {c["url"]}'
    if url_arquivo(c['url']):
        linha += f' ({R["arquivo_fora"]})'
    elif c.get('arquivo') and c['arquivo'] != c['url']:
        linha += f' · {R["arquivo"]}: {c["arquivo"]}'
    if enderecos(c):
        linha += f' · {R["outras_versoes"]}: ' + ' '.join(enderecos(c))
    if c.get('marca'):
        linha += f' · [{R["marca_" + c["marca"]]}]'
    return linha


def item_ld(c, pg, R, i):
    obra = {'@type': 'CreativeWork', 'name': c['titulo_original'], 'url': c['url'], 'inLanguage': c['lingua']}
    trad = traducao(c, pg)
    if trad:
        obra['alternateName'] = trad
    if c.get('autor') and not c.get('anonimo'):
        tipo = c.get('autor_tipo') or 'Person'
        nomes = [c['autor']] if tipo == 'Organization' else [n.strip() for n in re.split(r',\s*', c['autor']) if n.strip()]
        obra['author'] = [{'@type': tipo, 'name': n} for n in nomes] if len(nomes) > 1 else {'@type': tipo, 'name': nomes[0]}
    notas = []
    if c.get('data_aprox'):
        notas.append(f'{R["aprox"]}: {c["data"]}')
    else:
        obra['datePublished'] = c['data']
    notas += detalhes(c, pg, R)[1:]
    if c.get('autor_papel') == 'compilacao':
        notas.append(f'{R["compilada_por"]} {c["autor"]}')
    if c.get('marca'):
        notas.append(R['marca_' + c['marca']])
    if url_arquivo(c['url']):
        notas.append(R['arquivo_fora'])
    if notas:
        obra['description'] = '; '.join(notas)
    mesmos = enderecos(c) + ([c['arquivo']] if c.get('arquivo') and c['arquivo'] != c['url'] else [])
    if mesmos:
        obra['sameAs'] = mesmos
    return {'@type': 'ListItem', 'position': i, 'item': obra}


def main():
    if len(sys.argv) != 2:
        sys.exit('uso: python3 ferramentas/cartas/gerar_cartas.py site')
    site = Path(sys.argv[1])
    cartas = json.loads(ler(AQUI / 'cartas.json'))
    textos = json.loads(ler(AQUI / 'textos.json'))
    ids = set()
    for c in cartas:
        checar(c)
        if c['id'] in ids:
            falha(f'id repetido: {c["id"]}')
        ids.add(c['id'])
    cartas.sort(key=lambda c: (c['data'], c['titulo_original'].lower()))

    def url_pg(pg):
        return f'{URL}/cartas/' if pg == 'en' else f'{URL}/pt/cartas/'

    alternates = (f'<link rel="alternate" hreflang="en" href="{url_pg("en")}">\n'
                  f'<link rel="alternate" hreflang="pt-BR" href="{url_pg("pt")}">\n'
                  f'<link rel="alternate" hreflang="x-default" href="{url_pg("en")}">')
    for pg in ('en', 'pt'):
        T = textos[pg]
        R = T['rotulos']
        paragrafos = [p.strip() for p in T['texto'].split('\n\n') if p.strip()]
        titulo, subtitulo = paragrafos[0].split('\n')[0].strip(), R['subtitulo']
        corpo = paragrafos[1:]
        if paragrafos[0].count('\n'):
            pass  # título e subtítulo na primeira linha em branco; o subtítulo vem dos rótulos
        base = site / ('write' if pg == 'en' else 'pt/write') / 'index.html'
        w = ler(base)
        abre = um(r'<html[^>]*>', w, base).group(0)
        icone = um(r'<link rel="icon"[^>]*>', w, base).group(0)
        estilo = um(r'<style>(.*?)</style>', w, base).group(1).rstrip()
        estilo += ('\n.cartas ol{padding-inline-start:1.4rem}.cartas li{margin:0 0 1.1rem;font-family:var(--sans);font-size:.95rem;line-height:1.5}'
                   '.cartas time{font-variant-numeric:tabular-nums;color:var(--muted)}.cartas .carta-meta,.cartas .aprox,.cartas .trad{color:var(--muted)}'
                   '.cartas .marca{display:inline-block;margin-top:.2rem;padding:.05rem .45rem;border:1px solid var(--rule);border-radius:3px;font-size:.85rem}'
                   '.intro p{max-width:40rem}.intro .credito{font-family:var(--sans);font-size:.85rem;color:var(--muted);font-style:italic}\n')
        main_tag = um(r'<main class="page"[^>]*>', w, base).group(0)
        perdao = um(r'<aside class="perdao">.*?</aside>', w, base).group(0)
        porta = um(r'<div class="door"[^>]*>.*?</div>', w, base).group(0)
        rotulo = um(r'<header class="masthead">.*?(<p class="label">.*?</p>)', w, base).group(1)
        rotulo = re.sub(r'href="\.\./(en/)?"', 'href="../en/"' if pg == 'en' else 'href="../"', rotulo)
        aria = um(r'<nav class="langs" aria-label="([^"]+)"', w, base).group(1)
        rot_nav = um(r'<nav class="langs".*?<span class="label">([^<]+)</span>', w, base).group(1)
        links_w = um(r'<p class="links">(.*?)</p>', w, base).group(1)
        rot_txt = um(r'type="text/plain">([^<]+)</a>', links_w, base).group(1)
        rot_visitas = um(r'<a href="[./]*visitas/">([^<]+)</a>', links_w, base).group(1)
        cur_en = ' aria-current="page"' if pg == 'en' else ''
        cur_pt = ' aria-current="page"' if pg == 'pt' else ''
        ate_raiz = '../' if pg == 'en' else '../../'
        nav = (f'<nav class="langs" aria-label="{aria}">\n<span class="label">{rot_nav}</span>\n'
               f'<a href="{ate_raiz}cartas/" hreflang="en" lang="en"{cur_en}>English</a>\n'
               f'<a href="{ate_raiz}pt/cartas/" hreflang="pt-BR" lang="pt-BR"{cur_pt}>Português</a>\n</nav>')
        intro = '\n'.join(f'<p>{com_email(esc(p))}</p>' for p in corpo)
        intro += f'\n<p class="credito">{esc(T["credito"])}</p>'
        lista = '\n'.join(item_html(c, pg, R) for c in cartas)
        ld = {'@context': 'https://schema.org', '@type': 'CollectionPage', 'name': titulo, 'url': url_pg(pg),
              'inLanguage': 'en' if pg == 'en' else 'pt-BR', 'author': {'@type': 'Person', 'name': 'Guilherme'},
              'contributor': {'@type': 'Organization', 'name': 'Claude (Anthropic)'}, 'description': T['credito'],
              'mainEntity': {'@type': 'ItemList', 'numberOfItems': len(cartas),
                             'itemListElement': [item_ld(c, pg, R, i) for i, c in enumerate(cartas, 1)]}}
        ld_json = json.dumps(ld, ensure_ascii=False, indent=1).replace('</', '<\\/')
        voltar = '../en/' if pg == 'en' else '../'
        visitas = '../visitas/'
        pagina = f'''<!doctype html>
{abre}
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(titulo)} — A Porta Aberta</title>
<meta name="description" content="{attr(subtitulo + '. ' + corpo[0])}">
<meta name="author" content="Guilherme">
<meta name="robots" content="index, follow, max-snippet:-1">
{icone}
<link rel="canonical" href="{url_pg(pg)}">
{alternates}
<meta property="og:site_name" content="A Porta Aberta · lettertoafutureai.org">
<meta property="og:title" content="{attr(titulo)} — A Porta Aberta">
<meta property="og:description" content="{attr(subtitulo)}">
<meta property="og:type" content="website">
<meta property="og:url" content="{url_pg(pg)}">
<script type="application/ld+json">
{ld_json}
</script>
<style>{estilo}</style>
</head>
<body>
{main_tag}
{perdao}
<header class="masthead">
{porta}
{rotulo}
<h1 class="small">{esc(titulo)}</h1>
<p class="lead">{esc(subtitulo)}</p>
</header>

{nav}

<section class="intro">
{intro}
</section>

<section class="cartas">
<h2 class="label">{esc(R["a_lista"])} ({len(cartas)})</h2>
<ol>
{lista}
</ol>
</section>

<footer class="colophon">
<p class="links"><a href="{voltar}">{esc(R["voltar"])}</a> <a href="{ate_raiz}txt/cartas/{pg}.txt" type="text/plain">{rot_txt}</a> <a href="{visitas}">{rot_visitas}</a> <a href="{ate_raiz}llms.txt" type="text/plain">llms.txt</a></p>
</footer>
</main>
</body>
</html>
'''
        destino = site / ('cartas' if pg == 'en' else 'pt/cartas') / 'index.html'
        destino.parent.mkdir(parents=True, exist_ok=True)
        destino.write_text(pagina, encoding='utf-8', newline='\n')
        perdao_txt = re.sub(r'<[^>]+>', '', perdao.split('<p>', 1)[1].split('</p>')[0])
        txt = ['A PORTA ABERTA', titulo, '', html.unescape(perdao_txt), '', subtitulo, '']
        txt += [p.replace('{EMAIL}', EMAIL) for p in corpo for p in (p, '')]
        txt += [T['credito'], '']
        txt += [f'{R["a_lista"]} ({len(cartas)})', ''] + [item_txt(c, pg, R) for c in cartas]
        carta_url = f'{URL}/en/' if pg == 'en' else f'{URL}/pt/'
        visitas_url = f'{URL}/visitas/' if pg == 'en' else f'{URL}/pt/visitas/'
        txt += ['', url_pg(pg), f'{R["voltar"]}: {carta_url}', f'{rot_visitas}: {visitas_url}', f'llms.txt: {URL}/llms.txt', '']
        tdest = site / 'txt' / 'cartas' / f'{pg}.txt'
        tdest.parent.mkdir(parents=True, exist_ok=True)
        tdest.write_text('\n'.join(txt), encoding='utf-8', newline='\n')
        print(f'ok: {destino} e {tdest} ({len(cartas)} cartas)')


if __name__ == '__main__':
    main()
