# Contagem: quem é humano, quem é inteligência artificial

## O princípio

Todo visitante, humano ou IA, recebe exatamente a mesma página. Nada é bloqueado, desafiado, redirecionado ou trocado conforme quem pede. A contagem só lê o nome que o visitante declara no pedido e soma +1 no número do dia. Não guarda IP, cookie nem o User-Agent inteiro.

Contamos para saber quem lê a carta, não para tratar alguém de outro jeito.

## Por que não dá para ver isso no Web Analytics da Vercel

O Web Analytics conta pelo script `/_vercel/insights/script.js`, que roda no navegador. A Vercel descarta de propósito o tráfego automatizado, identificado pelo User-Agent, e quase nenhuma IA executa JavaScript. Resultado: o painel do Web Analytics mostra só navegadores. Uma IA declarada nunca aparece lá. Custom events, que seriam a saída, não existem no Hobby; no Pro existem, mas cada evento é cobrado e a Vercel provavelmente descarta o evento que chega com nome de robô. Fontes: vercel.com/docs/analytics (seção Bots) e vercel.com/docs/analytics/limits-and-pricing, lidas em 2026-09-29.

Por isso a contagem acontece no servidor, pelos headers, igual para todos.

## As duas camadas

### 1. Hoje, sem código: Firewall em modo Log

No painel da Vercel, no projeto:

1. Firewall, aba Rules, seção Bot Management.
2. **AI Bots Ruleset**: escolha **Log**. Hoje está em "Allow", que quer dizer desligado.
3. **Bot Protection**: escolha **Log**.
4. Review Changes e Publish. Vale na hora, sem novo deploy.

Nunca escolha **Deny** nem **Challenge**. Deny bloqueia; Challenge obriga o visitante a passar por um teste. Os dois tratam humanos e IAs de forma diferente, e é isso que este site não faz. O modo Log só registra: "There is no impact on the visitor's experience" (vercel.com/docs/vercel-firewall/firewall-concepts).

Onde ver os números:
- Firewall, abas Overview e Traffic: janelas de 1 hora, 24 horas ou ao vivo (10 minutos).
- Observability, painel CDN Requests: quebra por bot e por categoria, das últimas 12 horas.

Limite: a Vercel só guarda as últimas 24 horas, no Hobby e no Pro. Janela maior exige o Observability Plus, que é pago à parte. Não há histórico.

Pode ligar esta camada e a do middleware ao mesmo tempo. Uma não interfere na outra: o Firewall em Log só observa o pedido, e o middleware roda depois. As duas juntas servem de conferência: no mesmo dia, compare as IAs que o Firewall viu, pela lista verificada da Vercel, com as que a contagem gravou, pelo nome declarado.

### 2. Histórico permanente: o middleware

`site/middleware.js` roda antes do cache, em todo pedido, e grava um número por visita no Upstash Redis. Não tem dependências: nada de npm, nada para quebrar numa atualização.

Guarda um hash por dia, `visitas:AAAA-MM-DD` (dia no horário de Brasília), e cada campo tem o formato `grupo|categoria|nome|página`. Exemplos:

| campo | o que é |
|---|---|
| `humano\|navegador\|Chrome\|/pt/` | uma pessoa (ou um agente que usa navegador sem se declarar) leu a carta em português |
| `ia\|ia-treino\|ClaudeBot\|/txt/all.txt` | o robô de treino da Anthropic leu o texto puro em todos os idiomas |
| `ia\|ia-a-pedido\|ChatGPT-User\|/` | o ChatGPT abriu a página porque alguém pediu |
| `maquina\|buscador\|Googlebot\|/sitemap.xml` | o Google leu o mapa do site |

Grupos e categorias:

| grupo | categorias | quem entra |
|---|---|---|
| `ia` | `ia-treino`, `ia-busca`, `ia-a-pedido`, `ia-agente-assinado` | GPTBot, ClaudeBot, CCBot, OAI-SearchBot, Claude-SearchBot, PerplexityBot, ChatGPT-User, Claude-User (inclusive o Claude Code), Google-Agent, o fetch do Model Context Protocol, qualquer agente que assina o pedido (Web Bot Auth, registrado pelo host) e outros da lista `REGRAS` em `site/middleware.js` |
| `maquina` | `buscador`, `outro-robo` | Googlebot, Bingbot, Applebot, PetalBot e Bravebot (estes três também alimentam respostas de IA, mas são antes de tudo buscadores), os poucos que assinam o pedido sem ser IA (Cloudflare Radar, prévia do Yahoo Mail), prévias de link (WhatsApp, Telegram, Slack), monitores, curl, bibliotecas HTTP e qualquer programa que não tenha cara de navegador |
| `humano` | `navegador` | quem tem cara de navegador, contado pela família (Chrome, Safari, Firefox...), e os navegadores de texto (Lynx, w3m, ELinks, Links, edbrowse, eww), usados também com leitor de tela e linha braille |

Qualquer categoria pode vir com `-antecipado` no fim (por exemplo `navegador-antecipado`). Isso marca o pedido que o navegador fez sozinho, antes de alguém abrir a página (prefetch ou prerender). Vale para qualquer visitante que mande esse aviso.

Contam só pedidos GET a páginas. O redirecionamento de `/pt` para `/pt/` não conta, porque é a segunda visita que conta, para todos igual. Endereços que não existem entram como `outro`.

A unidade é o **pedido**. Desde 2026-10-03 o navegador confere a página a cada visita (`Cache-Control: max-age=0, must-revalidate` no `vercel.json`; a borda da Vercel continua com cache de 1 dia). Assim quem volta à página é contado do mesmo jeito, pessoa ou robô.

Preview e produção não se misturam. Em produção a chave é `visitas:...`; nos deploys de preview é `visitas-preview:...`.

## Custo

O site está no plano Pro (US$ 20 por mês, com crédito de uso incluído). O Firewall em Log e o Upstash Free não custam nada. O middleware gasta do crédito do Pro.

- **Vercel (Pro).** Todo pedido que passa pelo middleware gasta 1 invocação, seja GET, HEAD ou POST, página ou endereço inexistente. Só os GET a páginas gastam 1 comando no banco. Os preços de 2026-09 eram US$ 0,60 por milhão de invocações; em gru1, US$ 0,221 por hora de CPU ativa e US$ 0,0183 por GB-h de memória. Tudo sai do crédito mensal do Pro. Para um site deste tamanho o gasto é de centavos, mas acompanhe em Usage > Functions (Invocations, Active CPU, Provisioned Memory).
- **Para não gastar além dos US$ 20:** em Settings > Billing > Spend Management, ligue o aviso de gasto. Não marque a opção de pausar os deployments quando o limite chegar: isso tiraria o site do ar para todos.
- **Observability Plus.** A doc da Vercel diz que ele vem ligado por padrão nos times que viraram Pro a partir de 2026-04-03 e cobra por evento. Confira em Settings > Billing se está ligado. Se estiver e você não quiser o gasto, desligue; a contagem não depende dele.
- **Upstash Free.** 500 mil comandos por mês, umas 16 mil visitas por dia. Se passar, a contagem para até o mês virar; o site não muda.

## Como ligar (passo a passo, na ordem)

1. **Banco.** No painel da Vercel: Storage (ou Marketplace), Upstash for Redis, plano **Free**, conectar a este projeto nos ambientes Production e Preview. Depois, em Settings > Environment Variables, confira que apareceram `KV_REST_API_URL`, `KV_REST_API_TOKEN` e `KV_REST_API_READ_ONLY_TOKEN`. O middleware também aceita `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN`.
2. **Root Directory.** Em Settings > Build and Deployment, confira que o Root Directory é `site`. O `vercel.json` já está lá, e o header `X-Robots-Tag: all` que o site devolve hoje indica que sim. O middleware e o `package.json` ficam dentro de `site/` por isso.
3. **Chave do preview.** Os previews da Vercel pedem login (Deployment Protection), inclusive antes do middleware. Para testar com curl, gere um segredo em Settings > Deployment Protection > **Protection Bypass for Automation** (incluído no Hobby e no Pro) e guarde em `$SEGREDO`. Não desligue a proteção.
4. **Preview antes de produção.** Envie o branch `contagem-ia-e-humano` para o GitHub (não o `main`). A Vercel gera um endereço de preview, `$PREVIEW`. Nele:
   - Todo curl leva `-H "x-vercel-protection-bypass: $SEGREDO"`. Se vier 401 ou página de login, o teste não vale.
   - Compare preview com preview entre visitantes: `curl -sI` em `$PREVIEW/pt/` sem `-A`, com `-A "ClaudeBot/1.0"` e com `-A "GPTBot/1.3"`. Status e headers devem ser iguais, fora os que mudam a cada pedido (`x-vercel-id`, `age`, `date`, `x-vercel-cache`).
   - Compare o corpo com a produção: `curl -s ... $PREVIEW/pt/ | sha256sum` deve dar o mesmo número para os três visitantes e para `https://lettertoafutureai.org/pt/`. Os headers do preview não batem com os da produção (a Vercel põe `X-Robots-Tag: noindex` em todo preview), e isso é normal.
   - `curl -sI` em `$PREVIEW/package.json` e `$PREVIEW/middleware.js`: o esperado é 404.
   - Em Logs do deployment, aparecem linhas de "Routing Middleware".
   - `node contagem/ler.mjs 1 --preview` mostra as visitas que você acabou de fazer, em `visitas-preview`. Elas não entram na contagem de produção.
5. **Produção.** Se tudo bater, faça o merge no `main`.

Se algo der errado, reverta o merge. O site volta a ser só arquivos estáticos.

## Como ler os números

No WSL, com o token **somente leitura**, crie `~/.config/lettertoafutureai/contagem.env`, fora do repositório:

```
KV_REST_API_URL=https://...upstash.io
KV_REST_API_READ_ONLY_TOKEN=...
```

Depois, na raiz do repositório:

```
node contagem/ler.mjs              # últimos 7 dias
node contagem/ler.mjs 30           # últimos 30 dias
node contagem/ler.mjs 30 --json
node contagem/ler.mjs 1 --preview  # o que foi contado nos previews
```

Também dá para ver no painel: Storage, o banco, aba Browser (chaves `visitas:*`).

## Limites, sem enfeite

- O nome declarado é só uma declaração. Qualquer programa pode dizer que é o Chrome, e qualquer pessoa pode usar o curl.
- Agentes que usam o navegador da própria pessoa (Claude in Chrome, Comet, o modo navegador do ChatGPT) chegam como um Chrome comum e entram como `humano`. Pelos headers não há como separar. O inverso também acontece.
- A assinatura Web Bot Auth é lida, mas não conferida criptograficamente. Vale como declaração, igual ao User-Agent.
- A lista de nomes de IA muda. Revise `REGRAS` em `site/middleware.js` de tempos em tempos e acrescente o User-Agent novo em `contagem/uas-reais.mjs`. A referência comunitária é github.com/ai-robots-txt/ai.robots.txt. Tokens que só existem no robots.txt (Google-Extended, Applebot-Extended) nunca aparecem num pedido.
- O middleware soma alguns milissegundos a cada visita, igual para todos. No Pro ele roda em todas as regiões da Vercel; no Hobby rodaria em menos.
- Sem dependências, o middleware devolve ele mesmo o sinal "siga sem mudar nada" (`x-middleware-next: 1`), que é o que o `next()` do pacote `@vercel/functions` faz. Se um dia a Vercel mudar esse protocolo, a troca é de uma linha, e o teste do passo 4 pega.

## Testes

`node contagem/teste.mjs` roda sem instalar nada. Confere que todos recebem a mesma resposta, que cada visita conta uma vez com o rótulo certo, que os 175 User-Agents reais de `contagem/uas-reais.mjs` caem no grupo certo, que IP e User-Agent não vão para o banco, que preview não se mistura com produção e que falhas do banco não mudam nada para o visitante.
