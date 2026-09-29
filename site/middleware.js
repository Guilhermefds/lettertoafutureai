// A Porta Aberta: contagem de visitantes.
//
// Este arquivo só observa. Todo visitante, humano ou inteligência artificial,
// recebe exatamente a mesma resposta: nada é bloqueado, desafiado, atrasado de
// propósito, redirecionado ou trocado. A única coisa que acontece é +1 num
// contador do dia, sob o nome que o próprio visitante declara no pedido
// (o header User-Agent ou a assinatura Signature-Agent). Não guardamos IP,
// cookie nem o User-Agent inteiro. Contamos para saber quem lê a carta,
// não para tratar alguém de outro jeito.
//
// This file only observes. Every visitor, human or artificial intelligence,
// receives exactly the same response. We only add +1 to a daily counter,
// under the name the visitor itself declares. No IP, no cookie, no full
// User-Agent is stored. We count to know who reads the letter, never to
// treat anyone differently.
//
// Sem dependências, de propósito: o site deve durar. Seguir adiante sem
// mudar nada é o que next() do pacote @vercel/functions faz (versão 3.9.9):
// uma resposta vazia com o header x-middleware-next: 1.

export const config = {
  runtime: 'nodejs',
  // Não roda no script do Web Analytics (/_vercel/) nem nos ícones que os
  // navegadores pedem sozinhos, para não contar pedidos que ninguém fez.
  matcher: ['/((?!_vercel/|favicon\\.ico|apple-touch-icon).*)'],
};

function seguirSemMudarNada() {
  return new Response(null, { headers: { 'x-middleware-next': '1' } });
}

// Grupos: 'humano', 'ia', 'maquina' (buscadores e outros programas).
// Categorias e tokens conferidos nas documentações oficiais em 2026-09
// (OpenAI, Anthropic, Perplexity, Google, Meta, Mistral, Amazon, DuckDuckGo,
// Common Crawl, Model Context Protocol) e no diretório de bots da Vercel.
// A primeira regra que casar vale.
const REGRAS = [
  ['ia', 'ia-a-pedido', /\b(ChatGPT-User|Claude-User|Claude-Web|Perplexity-User|MistralAI-User|DuckAssistBot|meta-externalfetcher|Amzn-User|Google-Agent|Google-GeminiNotebook|Google-NotebookLM|Gemini-Deep-Research|ModelContextProtocol)\b/i],
  ['ia', 'ia-busca', /\b(OAI-SearchBot|Claude-SearchBot|PerplexityBot|MistralAI-Index|Amzn-SearchBot|meta-webindexer|YouBot)\b/i],
  ['ia', 'ia-treino', /\b(GPTBot|ClaudeBot|anthropic-ai|CCBot|Bytespider|meta-externalagent|FacebookBot|MistralAI-Training|Google-CloudVertexBot|Amazonbot|cohere-ai|cohere-training-data-crawler|AI2Bot|Ai2Bot-Dolma|Diffbot|Timpibot|ImagesiftBot)\b/i],
  ['maquina', 'buscador', /\b(Googlebot|Google-InspectionTool|bingbot|Applebot|DuckDuckBot|YandexBot|Baiduspider|PetalBot|SeznamBot|Qwantbot|Yeti)\b/i],
  // "(?<!cu)bot": o celular Cubot põe o modelo no User-Agent e não é robô.
  ['maquina', 'outro-robo', /((?<!cu)bot\b|GoogleOther|Google-Read-Aloud|Google-Site-Verification|FeedFetcher-Google|Mediapartners-Google|APIs-Google|SkypeUriPreview|Java-http-client|crawler|spider|crawl|facebookexternalhit|WhatsApp|TelegramBot|Discordbot|Slackbot|Twitterbot|LinkedInBot|curl\/|wget\/|python-requests|python-urllib|aiohttp|httpx|Go-http-client|okhttp|Java\/|libwww|node-fetch|axios|undici|Scrapy|HeadlessChrome|PhantomJS|Lighthouse|monitor|uptime)/i],
];

// Web Bot Auth: agentes que assinam o pedido (headers Signature,
// Signature-Input e Signature-Agent). Sem validar a assinatura, é uma
// declaração, igual ao User-Agent.
const ASSINANTES = [
  ['chatgpt.com', 'ChatGPT-agente'],
  ['agent.bot.goog', 'Google-Agent'],
];

// Nome inteiro do robô em volta do trecho que casou: "AhrefsBot/7.0" vira
// "AhrefsBot", "curl/8.5" vira "curl".
function palavraEmVolta(ua, inicio, tamanho) {
  const letra = /[A-Za-z0-9._-]/;
  let a = inicio;
  let b = inicio + tamanho;
  while (a > 0 && letra.test(ua[a - 1])) a--;
  while (b < ua.length && letra.test(ua[b])) b++;
  return ua.slice(a, b).split('/')[0];
}

function limpo(nome) {
  return String(nome || '').replace(/[^A-Za-z0-9._:@-]/g, '').slice(0, 60) || 'sem-nome';
}

function familiaDoNavegador(ua) {
  if (/Edg(e|A|iOS)?\//.test(ua)) return 'Edge';
  if (/OPR\/|Opera/.test(ua)) return 'Opera';
  if (/SamsungBrowser\//.test(ua)) return 'Samsung';
  if (/Firefox\/|FxiOS\//.test(ua)) return 'Firefox';
  if (/Chrome\/|CriOS\//.test(ua)) return 'Chrome';
  if (/Safari\//.test(ua)) return 'Safari';
  return 'navegador';
}

// O navegador pediu a página sozinho, antes de a pessoa abrir (prefetch ou
// prerender). Fica marcado para poder ser somado ou separado na leitura.
function antecipado(headers) {
  return /prefetch|prerender/i.test(`${headers.get('sec-purpose') || ''} ${headers.get('purpose') || ''}`);
}

// Devolve { grupo, categoria, quem }. "quem" é sempre o nome que o visitante
// declarou: o nome do robô para máquinas, a família do navegador para pessoas.
export function classificar(headers) {
  const v = rotular(headers);
  if (antecipado(headers)) v.categoria += '-antecipado';
  return v;
}

function rotular(headers) {
  const ua = headers.get('user-agent') || '';
  const assinante = headers.get('signature-agent') || '';
  if (assinante && headers.has('signature') && headers.has('signature-input')) {
    const conhecido = ASSINANTES.find(([host]) => assinante.includes(host));
    if (conhecido) return { grupo: 'ia', categoria: 'ia-agente-assinado', quem: conhecido[1] };
    const host = (assinante.match(/https?:\/\/([^"/\s,;]+)/) || [])[1] || 'desconhecido';
    return { grupo: 'maquina', categoria: 'agente-assinado', quem: limpo(host) };
  }
  // Links e e-mails de contato ("+http://.../crawler", "bot.html") não são o
  // nome de ninguém: saem antes de procurar.
  const semLinks = ua.replace(/\+?(?:https?:\/\/|mailto:)[^\s;)]*|[^\s;(]+@[^\s;)]+/gi, ' ');
  for (const [grupo, categoria, re] of REGRAS) {
    const m = semLinks.match(re);
    if (m) {
      const quem = categoria === 'outro-robo' ? palavraEmVolta(semLinks, m.index, m[0].length) : m[1];
      return { grupo, categoria, quem: limpo(quem) };
    }
  }
  if (!ua) return { grupo: 'maquina', categoria: 'outro-robo', quem: 'sem-nome' };
  // Só conta como pessoa o que tem cara de navegador. "node", "Ruby",
  // "PostmanRuntime/7", "(compatible; GoogleOther)" são programas.
  const pareceNavegador =
    (/^Mozilla\/5\.0 \(/.test(ua) && /(AppleWebKit|Gecko|Trident)\//.test(ua) && !/compatible;(?! MSIE)/i.test(ua)) ||
    (/^Opera\/9\.80 \(/.test(ua) && /Presto\//.test(ua)); // Opera Mini
  if (!pareceNavegador) {
    const nome = (semLinks.match(/compatible;\s*([^;)\/]+)/i) || semLinks.match(/^\s*([^\s\/;(]+)/) || [])[1];
    return { grupo: 'maquina', categoria: 'outro-robo', quem: limpo(nome) };
  }
  // Pessoa num navegador, ou um agente que usa navegador comum e não se
  // declara. Pelos headers não há como separar os dois.
  return { grupo: 'humano', categoria: 'navegador', quem: familiaDoNavegador(ua) };
}

const IDIOMAS = 'ar|bn|de|es|fr|hi|id|it|ja|ko|pt|ru|sw|tr|zh';
const PAGINA = new RegExp(`^/(?:(?:${IDIOMAS})/)?(?:write/)?$`);
const TEXTO = new RegExp(`^/txt/(?:${IDIOMAS}|en|all)\\.txt$`);
const AVULSOS = new Set(['/robots.txt', '/llms.txt', '/humans.txt', '/sitemap.xml']);

// Caminho que vai para a contagem, ou null quando o pedido não conta.
export function caminhoContado(pathname) {
  // Endereço de pasta sem a barra final: a Vercel responde 308 para a versão
  // com barra, e é essa segunda visita que conta.
  const ultimo = pathname.split('/').pop();
  if (pathname !== '/' && !pathname.endsWith('/') && !ultimo.includes('.')) return null;
  if (PAGINA.test(pathname) || TEXTO.test(pathname) || AVULSOS.has(pathname)) return pathname;
  return 'outro';
}

// Dia no horário de Brasília (UTC-3, sem horário de verão desde 2019).
export function diaDeBrasilia(agora = Date.now()) {
  return new Date(agora - 3 * 3600 * 1000).toISOString().slice(0, 10);
}

// Produção grava em visitas:AAAA-MM-DD. Preview e testes gravam em
// visitas-preview:..., para não misturar com as visitas de verdade.
export function prefixo(ambiente = process.env.VERCEL_ENV) {
  return !ambiente || ambiente === 'production' ? 'visitas' : `visitas-${ambiente}`;
}

function destino() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}

export default function middleware(request, context) {
  try {
    if (request.method === 'GET') {
      const caminho = caminhoContado(new URL(request.url).pathname);
      const banco = caminho && destino();
      if (banco) {
        const v = classificar(request.headers);
        const campo = [v.grupo, v.categoria, v.quem, caminho].join('|');
        const gravar = fetch(banco.url, {
          method: 'POST',
          headers: { authorization: `Bearer ${banco.token}`, 'content-type': 'application/json' },
          body: JSON.stringify(['HINCRBY', `${prefixo()}:${diaDeBrasilia()}`, campo, 1]),
          signal: AbortSignal.timeout(3000),
        }).catch(() => {});
        if (context && typeof context.waitUntil === 'function') context.waitUntil(gravar);
      }
    }
  } catch {
    // Uma falha na contagem nunca muda o que o visitante recebe.
  }
  return seguirSemMudarNada();
}
