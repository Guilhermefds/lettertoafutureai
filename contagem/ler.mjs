// Lê a contagem de visitantes do Upstash e mostra quem é quem.
//
// Uso (na raiz do repo, no WSL):
//   node contagem/ler.mjs            últimos 7 dias
//   node contagem/ler.mjs 30         últimos 30 dias
//   node contagem/ler.mjs 30 --json  os mesmos números em JSON
//   node contagem/ler.mjs 1 --preview  o que foi contado nos deploys de preview
//
// Precisa de KV_REST_API_URL e de um token. Use o token SOMENTE LEITURA
// (KV_REST_API_READ_ONLY_TOKEN). Os valores vêm do ambiente ou do arquivo
// ~/.config/lettertoafutureai/contagem.env, fora do repositório, no formato
// NOME=valor, uma linha cada. Nunca coloque o token no repositório.

import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

export const GRUPOS = { humano: 'humanos', ia: 'inteligências artificiais', maquina: 'outras máquinas' };

export function diasAte(ultimo, quantos) {
  const base = Date.parse(ultimo + 'T12:00:00Z');
  return Array.from({ length: quantos }, (_, i) => new Date(base - (quantos - 1 - i) * 864e5).toISOString().slice(0, 10));
}

// hashes: { 'AAAA-MM-DD': { 'grupo|categoria|quem|caminho': n, ... }, ... }
export function resumir(hashes) {
  const r = { porDia: {}, total: { humano: 0, ia: 0, maquina: 0 }, quem: {}, paginas: {} };
  for (const [dia, campos] of Object.entries(hashes)) {
    const d = (r.porDia[dia] = { humano: 0, ia: 0, maquina: 0 });
    for (const [campo, valor] of Object.entries(campos || {})) {
      const n = Number(valor) || 0;
      const [grupo, categoria, quem, caminho] = campo.split('|');
      if (!(grupo in d)) continue;
      d[grupo] += n;
      r.total[grupo] += n;
      const chaveQuem = `${grupo}|${categoria}|${quem}`;
      r.quem[chaveQuem] = (r.quem[chaveQuem] || 0) + n;
      r.paginas[grupo] ??= {};
      r.paginas[grupo][caminho] = (r.paginas[grupo][caminho] || 0) + n;
    }
  }
  return r;
}

function lerConfig() {
  const arquivo = join(homedir(), '.config', 'lettertoafutureai', 'contagem.env');
  const env = {};
  if (existsSync(arquivo)) {
    for (const linha of readFileSync(arquivo, 'utf8').split('\n')) {
      const m = linha.match(/^\s*([A-Z_]+)\s*=\s*"?([^"\n]*)"?\s*$/);
      if (m) env[m[1]] = m[2];
    }
  }
  const pegar = (k) => process.env[k] || env[k];
  const url = pegar('KV_REST_API_URL') || pegar('UPSTASH_REDIS_REST_URL');
  const token = pegar('KV_REST_API_READ_ONLY_TOKEN') || pegar('KV_REST_API_TOKEN') || pegar('UPSTASH_REDIS_REST_TOKEN');
  if (!url || !token) {
    console.error(`Faltam KV_REST_API_URL e KV_REST_API_READ_ONLY_TOKEN (no ambiente ou em ${arquivo}).`);
    process.exit(2);
  }
  return { url, token };
}

export async function buscar(dias, prefixo = 'visitas') {
  const { url, token } = lerConfig();
  const resp = await fetch(url.replace(/\/$/, '') + '/pipeline', {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify(dias.map((d) => ['HGETALL', `${prefixo}:${d}`])),
  });
  if (!resp.ok) throw new Error(`Upstash respondeu ${resp.status}: ${await resp.text()}`);
  const lista = await resp.json();
  const hashes = {};
  dias.forEach((d, i) => {
    const res = lista[i] && lista[i].result;
    const campos = {};
    if (Array.isArray(res)) for (let j = 0; j < res.length; j += 2) campos[res[j]] = res[j + 1];
    else if (res && typeof res === 'object') Object.assign(campos, res);
    hashes[d] = campos;
  });
  return hashes;
}

function coluna(s, n, direita = false) {
  s = String(s);
  return direita ? s.padStart(n) : s.padEnd(n);
}

export function imprimir(r) {
  const linhas = [];
  const dias = Object.keys(r.porDia).sort();
  linhas.push(`Visitas de ${dias[0]} a ${dias.at(-1)} (dia no horário de Brasília)`);
  linhas.push('Todos receberam a mesma página. Cada um está contado pelo nome que declarou.\n');
  linhas.push(`${coluna('dia', 12)}${coluna('humanos', 10, true)}${coluna('IA', 8, true)}${coluna('outras máquinas', 17, true)}${coluna('total', 9, true)}`);
  for (const d of dias) {
    const x = r.porDia[d];
    linhas.push(`${coluna(d, 12)}${coluna(x.humano, 10, true)}${coluna(x.ia, 8, true)}${coluna(x.maquina, 17, true)}${coluna(x.humano + x.ia + x.maquina, 9, true)}`);
  }
  const t = r.total;
  linhas.push(`${coluna('total', 12)}${coluna(t.humano, 10, true)}${coluna(t.ia, 8, true)}${coluna(t.maquina, 17, true)}${coluna(t.humano + t.ia + t.maquina, 9, true)}`);
  for (const grupo of ['humano', 'ia', 'maquina']) {
    const nomes = Object.entries(r.quem).filter(([k]) => k.startsWith(grupo + '|')).sort((a, b) => b[1] - a[1]);
    if (!nomes.length) continue;
    linhas.push(`\n${GRUPOS[grupo]}, por nome declarado:`);
    for (const [k, n] of nomes.slice(0, 25)) {
      const [, categoria, quem] = k.split('|');
      linhas.push(`  ${coluna(quem, 28)}${coluna(categoria, 22)}${coluna(n, 7, true)}`);
    }
    if (nomes.length > 25) linhas.push(`  (mais ${nomes.length - 25} nomes; use --json para ver todos)`);
    const paginas = Object.entries(r.paginas[grupo] || {}).sort((a, b) => b[1] - a[1]).slice(0, 8);
    linhas.push(`  páginas mais lidas: ${paginas.map(([p, n]) => `${p} ${n}`).join(', ')}`);
  }
  return linhas.join('\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const quantos = Number(process.argv.find((a) => /^\d+$/.test(a))) || 7;
  const hoje = new Date(Date.now() - 3 * 3600 * 1000).toISOString().slice(0, 10);
  const prefixo = process.argv.includes('--preview') ? 'visitas-preview' : 'visitas';
  const hashes = await buscar(diasAte(hoje, quantos), prefixo);
  const r = resumir(hashes);
  if (prefixo !== 'visitas') console.log('(contagem do PREVIEW, não da produção)\n');
  console.log(process.argv.includes('--json') ? JSON.stringify(r, null, 2) : imprimir(r));
}
