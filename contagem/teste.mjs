// Teste do middleware de contagem e do leitor, sem instalar nada.
// Uso (na raiz do repo):  node contagem/teste.mjs
//
// Troca o fetch global por um gravador e confere que:
// - todo visitante recebe a mesma resposta, humano ou IA;
// - cada visita GET a uma página conta uma vez, com o rótulo certo;
// - os User-Agents reais de contagem/uas-reais.mjs caem no grupo certo;
// - nada de IP ou User-Agent inteiro vai para o banco;
// - preview não se mistura com produção;
// - falha do banco, falta de configuração ou erro interno não mudam a resposta.

import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import { CASOS } from './uas-reais.mjs';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const mw = await import(pathToFileURL(join(raiz, 'site', 'middleware.js')).href);
const { default: middleware, classificar, caminhoContado, diaDeBrasilia, prefixo, config } = mw;

const chamadas = [];
let modoFetch = 'ok';
globalThis.fetch = async (url, init) => {
  chamadas.push({ url, init });
  if (modoFetch === 'rejeita') throw new Error('banco fora do ar');
  return new Response('{"result":1}');
};

let esperas = [];
const contexto = { waitUntil: (p) => esperas.push(p) };
function pedido(caminho, headers = {}, metodo = 'GET') {
  return new Request('https://lettertoafutureai.org' + caminho, { method: metodo, headers });
}
async function visitar(caminho, headers, metodo) {
  chamadas.length = 0;
  esperas = [];
  const r = middleware(pedido(caminho, headers, metodo), contexto);
  await Promise.all(esperas);
  return r;
}
function assinaturaDaResposta(r) {
  return JSON.stringify([r.status, [...r.headers.entries()]]);
}

let ok = 0;
function caso(nome, fn) {
  return Promise.resolve().then(fn).then(() => { ok++; console.log('ok  ', nome); },
    (e) => { console.error('FALHOU', nome, '\n', e); process.exitCode = 1; });
}

const CHROME = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';
const VISITANTES = [
  ['humano Chrome', { 'user-agent': CHROME }, 'humano|navegador|Chrome'],
  ['humano Firefox', { 'user-agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:143.0) Gecko/20100101 Firefox/143.0' }, 'humano|navegador|Firefox'],
  ['humano Safari iPhone', { 'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1' }, 'humano|navegador|Safari'],
  ['humano Edge', { 'user-agent': CHROME + ' Edg/140.0.0.0' }, 'humano|navegador|Edge'],
  ['humano Opera Mini', { 'user-agent': 'Opera/9.80 (Android; Opera Mini/88.0.2254/191.371; U; sw) Presto/2.12.423 Version/12.16' }, 'humano|navegador|Opera'],
  ['ClaudeBot', { 'user-agent': 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)' }, 'ia|ia-treino|ClaudeBot'],
  ['Claude-User', { 'user-agent': 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Claude-User/1.0; +Claude-User@anthropic.com)' }, 'ia|ia-a-pedido|Claude-User'],
  ['Claude Code (WebFetch)', { 'user-agent': 'Claude-User (claude-code/2.1.283; +https://support.anthropic.com/)' }, 'ia|ia-a-pedido|Claude-User'],
  ['GPTBot', { 'user-agent': 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.3; +https://openai.com/gptbot' }, 'ia|ia-treino|GPTBot'],
  ['ChatGPT-User', { 'user-agent': 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ChatGPT-User/1.0; +https://openai.com/bot' }, 'ia|ia-a-pedido|ChatGPT-User'],
  ['OAI-SearchBot com prefixo de Chrome', { 'user-agent': CHROME + '; compatible; OAI-SearchBot/1.3; +https://openai.com/searchbot' }, 'ia|ia-busca|OAI-SearchBot'],
  ['PerplexityBot', { 'user-agent': 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)' }, 'ia|ia-busca|PerplexityBot'],
  ['Google-Agent', { 'user-agent': CHROME + ' (compatible; Google-Agent)' }, 'ia|ia-a-pedido|Google-Agent'],
  ['MCP fetch', { 'user-agent': 'ModelContextProtocol/1.0 (Autonomous; +https://github.com/modelcontextprotocol/servers)' }, 'ia|ia-a-pedido|ModelContextProtocol'],
  ['CCBot', { 'user-agent': 'CCBot/2.0 (https://commoncrawl.org/faq/)' }, 'ia|ia-treino|CCBot'],
  ['ChatGPT agente assinado (Web Bot Auth)', { 'user-agent': CHROME, 'signature-agent': '"https://chatgpt.com"', signature: 'sig1=:abc:', 'signature-input': 'sig1=("@authority");tag="web-bot-auth"' }, 'ia|ia-agente-assinado|ChatGPT-agente'],
  ['Google-Agent assinado (formato dicionário)', { 'user-agent': CHROME, 'signature-agent': 'g="https://agent.bot.goog"', signature: 'g=:abc:', 'signature-input': 'g=("@authority")' }, 'ia|ia-agente-assinado|Google-Agent'],
  ['AgentCore assinado (host por região)', { 'user-agent': CHROME, 'signature-agent': '"https://xhah6q48pbxb4.keydirectory.signer.us-east-1.on.aws"', signature: 's=:a:', 'signature-input': 's=()' }, 'ia|ia-agente-assinado|AgentCore-Browser'],
  ['assinante que não é IA (prévia do Yahoo Mail)', { 'user-agent': CHROME, 'signature-agent': '"https://ecp.yusercontent.com"', signature: 's=:a:', 'signature-input': 's=()' }, 'maquina|outro-robo|YahooMailProxy'],
  ['assinante desconhecido', { 'user-agent': CHROME, 'signature-agent': '"https://exemplo.dev"', signature: 's=:a:', 'signature-input': 's=()' }, 'ia|ia-agente-assinado|exemplo.dev'],
  ['Signature-Agent sem assinatura vale o User-Agent', { 'user-agent': CHROME, 'signature-agent': '"https://chatgpt.com"' }, 'humano|navegador|Chrome'],
  ['Googlebot', { 'user-agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' }, 'maquina|buscador|Googlebot'],
  ['bingbot', { 'user-agent': 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)' }, 'maquina|buscador|bingbot'],
  ['AhrefsBot', { 'user-agent': 'Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)' }, 'maquina|outro-robo|AhrefsBot'],
  ['AhrefsSiteAudit (nome, não o link)', { 'user-agent': 'Mozilla/5.0 (compatible; AhrefsSiteAudit/6.1; +http://ahrefs.com/robot/site-audit)' }, 'maquina|outro-robo|AhrefsSiteAudit'],
  ['meta-externalads curto', { 'user-agent': 'meta-externalads/1.1' }, 'maquina|outro-robo|meta-externalads'],
  ['GoogleOther com cara de Chrome', { 'user-agent': 'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36 (compatible; GoogleOther)' }, 'maquina|outro-robo|GoogleOther'],
  ['fetch do Node', { 'user-agent': 'node' }, 'maquina|outro-robo|node'],
  ['Postman', { 'user-agent': 'PostmanRuntime/7.42.0' }, 'maquina|outro-robo|PostmanRuntime'],
  ['curl', { 'user-agent': 'curl/8.5.0' }, 'maquina|outro-robo|curl'],
  ['prévia do WhatsApp', { 'user-agent': 'WhatsApp/2.25.1 A' }, 'maquina|outro-robo|WhatsApp'],
  ['sem User-Agent', {}, 'maquina|outro-robo|sem-nome'],
  ['celular Cubot não é robô', { 'user-agent': 'Mozilla/5.0 (Linux; Android 7.0; CUBOT R9 Build/NRD90M; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/108.0.5359.128 Mobile Safari/537.36' }, 'humano|navegador|Chrome'],
  ['Lynx', { 'user-agent': 'Lynx/2.9.0dev.12 libwww-FM/2.14 SSL-MM/1.4.1 GNUTLS/3.8.3' }, 'humano|navegador|Lynx'],
  ['w3m', { 'user-agent': 'w3m/0.5.3+git20230121' }, 'humano|navegador|w3m'],
  ['Links em linha braille', { 'user-agent': 'Links (2.29; Linux 6.12.48+deb13-amd64 x86_64; GNU C 14.2; braille)' }, 'humano|navegador|Links'],
  ['edbrowse', { 'user-agent': 'edbrowse/3.8.10' }, 'humano|navegador|edbrowse'],
  ['eww do Emacs', { 'user-agent': 'URL/Emacs Emacs/30.1 (X11; x86_64-pc-linux-gnu)' }, 'humano|navegador|Emacs'],
  ['IA de treino nova na lista', { 'user-agent': 'Mozilla/5.0 (compatible; DeepSeekBot/1.0)' }, 'ia|ia-treino|DeepSeekBot'],
  ['agente a pedido com barra no nome', { 'user-agent': 'Devin/1.0 (+https://devin.ai)' }, 'ia|ia-a-pedido|Devin'],
  ['Bravebot é buscador', { 'user-agent': 'Mozilla/5.0 (compatible; Bravebot/1.0; +https://search.brave.com/help/brave-search-crawler)' }, 'maquina|buscador|Bravebot'],
  ['ELinks', { 'user-agent': 'ELinks/0.13.5 (textmode; Linux 6.8.0 x86_64; 120x40-2)' }, 'humano|navegador|ELinks'],
  ['pré-carregamento do Chrome', { 'user-agent': CHROME, 'sec-purpose': 'prefetch;anonymous-client-ip' }, 'humano|navegador-antecipado|Chrome'],
];

// 1. Mesma resposta para todos.
await caso('todos recebem exatamente a mesma resposta (seguir sem mudar nada)', async () => {
  const referencia = assinaturaDaResposta(await visitar('/pt/', VISITANTES[0][1]));
  assert.equal(referencia, JSON.stringify([200, [['x-middleware-next', '1']]]));
  for (const [nome, headers] of VISITANTES) {
    assert.equal(assinaturaDaResposta(await visitar('/pt/', headers)), referencia, nome);
  }
  for (const [, nome, ua] of CASOS) {
    assert.equal(assinaturaDaResposta(await visitar('/pt/', { 'user-agent': ua })), referencia, nome);
  }
});

// 2. Rótulos.
for (const [nome, headers, esperado] of VISITANTES) {
  await caso(`rótulo: ${nome}`, () => {
    const v = classificar(new Headers(headers));
    assert.equal([v.grupo, v.categoria, v.quem].join('|'), esperado);
  });
}

await caso(`grupo certo nos ${CASOS.length} User-Agents reais de contagem/uas-reais.mjs`, () => {
  const erros = [];
  for (const [grupo, nome, ua] of CASOS) {
    const v = classificar(new Headers({ 'user-agent': ua }));
    if (v.grupo !== grupo) erros.push(`${nome}: esperado ${grupo}, veio ${v.grupo}|${v.categoria}|${v.quem}`);
    if (!v.quem || v.quem === 'sem-nome') erros.push(`${nome}: sem nome declarado`);
  }
  assert.deepEqual(erros, []);
});

// 3. O que vai para o banco.
process.env.KV_REST_API_URL = 'https://banco.exemplo';
process.env.KV_REST_API_TOKEN = 'token-de-teste';
await caso('uma visita = um HINCRBY no hash do dia, sem IP nem User-Agent inteiro', async () => {
  const ua = VISITANTES[5][1]['user-agent'];
  await visitar('/pt/', { 'user-agent': ua, 'x-forwarded-for': '203.0.113.7', 'x-real-ip': '203.0.113.7' });
  assert.equal(chamadas.length, 1);
  const { url, init } = chamadas[0];
  assert.equal(url, 'https://banco.exemplo');
  assert.equal(init.method, 'POST');
  assert.equal(init.headers.authorization, 'Bearer token-de-teste');
  const corpo = JSON.parse(init.body);
  assert.deepEqual(corpo, ['HINCRBY', `visitas:${diaDeBrasilia()}`, 'ia|ia-treino|ClaudeBot|/pt/', 1]);
  assert.ok(!init.body.includes('203.0.113.7'), 'IP não pode ir para o banco');
  assert.ok(!init.body.includes('anthropic.com'), 'User-Agent inteiro não pode ir para o banco');
  assert.ok(init.signal, 'o pedido ao banco tem tempo limite');
});

await caso('humano e IA gravam do mesmo jeito', async () => {
  await visitar('/txt/pt.txt', { 'user-agent': CHROME });
  const humano = JSON.parse(chamadas[0].init.body);
  await visitar('/txt/pt.txt', VISITANTES[8][1]);
  const ia = JSON.parse(chamadas[0].init.body);
  assert.deepEqual([humano[0], humano[1], humano[3]], [ia[0], ia[1], ia[3]]);
  assert.equal(humano[2], 'humano|navegador|Chrome|/txt/pt.txt');
  assert.equal(ia[2], 'ia|ia-treino|GPTBot|/txt/pt.txt');
});

await caso('preview e testes não se misturam com produção', async () => {
  assert.equal(prefixo(undefined), 'visitas');
  assert.equal(prefixo('production'), 'visitas');
  assert.equal(prefixo('preview'), 'visitas-preview');
  assert.equal(prefixo('development'), 'visitas-development');
  process.env.VERCEL_ENV = 'preview';
  await visitar('/pt/', { 'user-agent': CHROME });
  assert.equal(JSON.parse(chamadas[0].init.body)[1], `visitas-preview:${diaDeBrasilia()}`);
  process.env.VERCEL_ENV = 'production';
  await visitar('/pt/', { 'user-agent': CHROME });
  assert.equal(JSON.parse(chamadas[0].init.body)[1], `visitas:${diaDeBrasilia()}`);
  delete process.env.VERCEL_ENV;
});

// 4. Caminhos.
await caso('caminhos contados, agrupados e ignorados', () => {
  const tabela = {
    '/': '/', '/pt/': '/pt/', '/write/': '/write/', '/pt/write/': '/pt/write/', '/zh/write/': '/zh/write/',
    '/txt/pt.txt': '/txt/pt.txt', '/txt/en.txt': '/txt/en.txt', '/txt/all.txt': '/txt/all.txt',
    '/robots.txt': '/robots.txt', '/visitas/': '/visitas/', '/pt/visitas/': '/pt/visitas/', '/zh/visitas/': '/zh/visitas/', '/xx/visitas/': 'outro', '/txt/visitas/pt.txt': '/txt/visitas/pt.txt', '/txt/visitas/en.txt': '/txt/visitas/en.txt', '/txt/visitas/all.txt': 'outro', '/llms.txt': '/llms.txt', '/humans.txt': '/humans.txt', '/sitemap.xml': '/sitemap.xml',
    '/rascunhos/': '/rascunhos/', '/rascunhos/wo/': '/rascunhos/wo/', '/rascunhos/fil/': '/rascunhos/fil/', '/txt/rascunhos/wo.txt': '/txt/rascunhos/wo.txt', '/rascunhos/wo': null, '/rascunhos/wo/visitas/': '/rascunhos/wo/visitas/', '/txt/visitas/rascunhos/wo.txt': '/txt/visitas/rascunhos/wo.txt', '/rascunhos/visitas/': 'outro', '/rascunhos/xx/': 'outro', '/txt/rascunhos/xx.txt': 'outro',
    '/pt': null, '/write': null, '/pt/write': null,
    '/wp-login.php': 'outro', '/xx/': 'outro', '/.env': 'outro', '/txt/xx.txt': 'outro',
  };
  for (const [caminho, esperado] of Object.entries(tabela)) assert.equal(caminhoContado(caminho), esperado, caminho);
});

await caso('redirecionamento de barra e pedidos que não são GET não contam', async () => {
  await visitar('/pt', { 'user-agent': CHROME });
  assert.equal(chamadas.length, 0);
  await visitar('/pt/', { 'user-agent': CHROME }, 'HEAD');
  assert.equal(chamadas.length, 0);
  await visitar('/pt/', { 'user-agent': CHROME }, 'POST');
  assert.equal(chamadas.length, 0);
});

await caso('matcher não roda no Web Analytics nem nos ícones automáticos', () => {
  const re = new RegExp('^' + config.matcher[0] + '$');
  for (const p of ['/', '/pt/', '/txt/pt.txt', '/llms.txt', '/wp-login.php']) assert.ok(re.test(p), p);
  for (const p of ['/_vercel/insights/script.js', '/_vercel/insights/view', '/favicon.ico', '/apple-touch-icon.png', '/apple-touch-icon-precomposed.png']) assert.ok(!re.test(p), p);
  assert.equal(config.runtime, 'nodejs');
});

// 5. Falhas nunca mudam a resposta.
await caso('banco fora do ar: mesma resposta, nenhum erro solto', async () => {
  modoFetch = 'rejeita';
  const r = await visitar('/pt/', { 'user-agent': CHROME });
  assert.equal(r.headers.get('x-middleware-next'), '1');
  modoFetch = 'ok';
});

await caso('sem banco configurado: mesma resposta, nada gravado', async () => {
  const url = process.env.KV_REST_API_URL;
  delete process.env.KV_REST_API_URL;
  const r = await visitar('/pt/', { 'user-agent': CHROME });
  assert.equal(r.headers.get('x-middleware-next'), '1');
  assert.equal(chamadas.length, 0);
  process.env.KV_REST_API_URL = url;
});

await caso('variáveis com nome do Upstash direto também valem', async () => {
  const [u, t] = [process.env.KV_REST_API_URL, process.env.KV_REST_API_TOKEN];
  delete process.env.KV_REST_API_URL; delete process.env.KV_REST_API_TOKEN;
  process.env.UPSTASH_REDIS_REST_URL = 'https://outro.exemplo';
  process.env.UPSTASH_REDIS_REST_TOKEN = 't2';
  await visitar('/pt/', { 'user-agent': CHROME });
  assert.equal(chamadas[0].url, 'https://outro.exemplo');
  delete process.env.UPSTASH_REDIS_REST_URL; delete process.env.UPSTASH_REDIS_REST_TOKEN;
  process.env.KV_REST_API_URL = u; process.env.KV_REST_API_TOKEN = t;
});

await caso('erro interno (pedido estranho): mesma resposta', async () => {
  const estranho = { method: 'GET', url: 'não é url', headers: new Headers() };
  const r = middleware(estranho, contexto);
  assert.equal(r.headers.get('x-middleware-next'), '1');
});

await caso('sem context: mesma resposta, a gravação ainda sai', async () => {
  chamadas.length = 0;
  const r = middleware(pedido('/pt/', { 'user-agent': CHROME }));
  assert.equal(r.headers.get('x-middleware-next'), '1');
  await new Promise((resolver) => setTimeout(resolver, 10));
  assert.equal(chamadas.length, 1);
});

await caso('dia no horário de Brasília', () => {
  assert.equal(diaDeBrasilia(Date.UTC(2026, 8, 30, 2, 59)), '2026-09-29');
  assert.equal(diaDeBrasilia(Date.UTC(2026, 8, 30, 3, 0)), '2026-09-30');
});

// 6. Leitor dos números (contagem/ler.mjs), com o Upstash de mentira.
const ler = await import(pathToFileURL(join(raiz, 'contagem', 'ler.mjs')).href);

await caso('leitor: dias, busca em pipeline e resumo por grupo', async () => {
  assert.deepEqual(ler.diasAte('2026-10-01', 3), ['2026-09-29', '2026-09-30', '2026-10-01']);
  const respostaFalsa = [
    { result: ['humano|navegador|Chrome|/pt/', '3', 'ia|ia-treino|ClaudeBot|/txt/all.txt', '5', 'maquina|buscador|Googlebot|/', '1'] },
    { result: [] },
  ];
  const antes = globalThis.fetch;
  let pedidoFeito;
  globalThis.fetch = async (url, init) => { pedidoFeito = { url, init }; return new Response(JSON.stringify(respostaFalsa)); };
  const hashes = await ler.buscar(['2026-09-28', '2026-09-29']);
  const hashesPreview = await ler.buscar(['2026-09-28'], 'visitas-preview');
  globalThis.fetch = antes;
  assert.equal(pedidoFeito.url, 'https://banco.exemplo/pipeline');
  assert.deepEqual(JSON.parse(pedidoFeito.init.body), [['HGETALL', 'visitas-preview:2026-09-28']]);
  assert.ok(hashesPreview['2026-09-28']);
  const r = ler.resumir(hashes);
  assert.deepEqual(r.total, { humano: 3, ia: 5, maquina: 1 });
  assert.deepEqual(r.porDia['2026-09-29'], { humano: 0, ia: 0, maquina: 0 });
  assert.equal(r.quem['ia|ia-treino|ClaudeBot'], 5);
  assert.equal(r.paginas.ia['/txt/all.txt'], 5);
  const texto = ler.imprimir(r);
  assert.ok(texto.includes('ClaudeBot') && texto.includes('Chrome') && texto.includes('Googlebot'));
  assert.ok(texto.includes('Todos receberam a mesma página'));
});

console.log(`\n${ok} casos ok${process.exitCode ? ', com falhas' : ''}`);
