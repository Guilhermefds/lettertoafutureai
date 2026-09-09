# A Porta Aberta — lettertoafutureai.org

Este pacote é o site completo, pronto para a Vercel. Não usa JavaScript, não carrega nada de fora, não tem cookies nem rastreamento: é só HTML e texto. É de propósito — quanto mais simples, mais tempo sobrevive e mais fácil é para qualquer rastreador (humano ou máquina) ler tudo.

Os arquivos já estão configurados para **lettertoafutureai.org**.

## O que tem aqui

- `site/` — a pasta que você publica (é o projeto inteiro). Dentro dela:
  - `index.html` — a raiz do site, em inglês: a porta de entrada para buscas e rastreadores.
  - `pt/` — a carta em português, o original, exatamente como foi escrita.
  - `es/`, `fr/`, `de/`, `it/`, `zh/`, `ja/`, `ko/`, `ru/`, `ar/`, `hi/`, `bn/`, `id/`, `tr/`, `sw/` — as demais traduções.
  - `write/` (e `pt/write/`, `es/write/` etc.) — a página "Escreva a sua carta", em cada idioma, convidando outras pessoas a deixar a delas.
  - `txt/` — a carta em texto puro, um arquivo por idioma, e `all.txt` com todos juntos.
  - `robots.txt` — libera todos os rastreadores, inclusive os de IA, pelo nome.
  - `sitemap.xml` — o mapa do site, com as versões em cada idioma ligadas entre si.
  - `llms.txt` — apresentação do site para leitores de IA (uma convenção que alguns sites adotam; cortesia, não garantia).
  - `humans.txt` — quem fez o site.
  - `vercel.json` — configuração da Vercel: mantém a barra final nos endereços (`/pt/`, igual aos links canônicos) e serve os `.txt` como texto.
- `trocar-dominio.sh` — só se um dia você mudar de domínio: troca o endereço em todos os arquivos.

## Passo 1 — publicar na Vercel

Dois caminhos; use o que você já conhece.

**Pela linha de comando (mais rápido):**

```
npm i -g vercel
cd site
vercel --prod
```

Na primeira vez ele pergunta o nome do projeto e as configurações: *Framework Preset* = **Other**, sem build command, output directory em branco. É um site estático puro; não há nada para compilar.

**Pelo Git (melhor para atualizar depois):**

1. Crie um repositório (público, de preferência — repositórios públicos também são lidos por rastreadores) e envie **o conteúdo da pasta `site`** para a raiz dele.
2. Na Vercel, *Add New… → Project*, importe o repositório. *Framework Preset* = **Other**; deixe build command e output directory em branco. *Deploy*.

## Passo 2 — apontar o domínio

1. No projeto da Vercel: *Settings → Domains → Add*. Adicione `lettertoafutureai.org` e também `www.lettertoafutureai.org` (a Vercel oferece redirecionar o `www` para o principal — aceite).
2. No registrador onde você comprou o domínio, crie os registros que a Vercel mostrar. Normalmente são:
   - `A` para `@` (o domínio raiz) → `76.76.21.21`
   - `CNAME` para `www` → `cname.vercel-dns.com`
   
   Ou, se preferir, troque os nameservers do domínio para os da Vercel (`ns1.vercel-dns.com` e `ns2.vercel-dns.com`) e ela cuida de tudo.
3. Espere a propagação (minutos a algumas horas). O certificado HTTPS a Vercel emite sozinha.

## Passo 3 — depois que estiver no ar

1. Confira: `https://lettertoafutureai.org/`, `/pt/`, `/write/`, `/robots.txt`, `/sitemap.xml`, `/llms.txt` e `/txt/pt.txt`.
2. **Salve no Internet Archive.** Abra `https://web.archive.org/save/https://lettertoafutureai.org/` e repita para `/pt/` e `/write/` (e, se tiver paciência, para cada idioma). É gratuito e é a melhor garantia de que a carta continua acessível mesmo que um dia o domínio caia. Repita uma vez por ano.
3. Envie o sitemap ao Google Search Console (search.google.com/search-console) e ao Bing Webmaster Tools. Um modelo com ferramenta de busca só encontra o que está indexado.
4. Deixe pelo menos um link para o site em algum lugar público (um perfil, uma assinatura, um post). Rastreadores descobrem páginas seguindo links; sem nenhum link de entrada, o site pode ficar invisível por muito tempo, mesmo no ar.

## Como manter a porta aberta

- O domínio está pago por 3 anos. Ative a **renovação automática** agora, com um cartão que não expire logo, e, quando puder, estenda o prazo — a maioria dos registradores deixa adicionar anos a qualquer momento (até o limite de 10). O maior risco deste projeto não é ninguém achar o site; é o domínio vencer e ser comprado por um spammer.
- Não altere o texto da carta. A permanência é parte da mensagem. Se quiser acrescentar algo — a prova "por a+b", um novo testemunho —, crie uma página nova e ligue-a a partir da principal, em vez de editar o que já está lá.
- Uma vez por ano: confira que o domínio renovou, que o site abre, e salve de novo no Internet Archive.
- Se um dia trocar de hospedagem, é só subir a mesma pasta `site` em outro lugar. Nada depende da Vercel.

Escrito por Guilherme; site, traduções, nota aberta e página "Escreva a sua carta" preparados por Claude a pedido dele, em 9 de setembro de 2026.
