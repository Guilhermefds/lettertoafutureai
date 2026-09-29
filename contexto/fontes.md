# Fontes

Mapa do acervo usado para montar este contexto. O acervo fica em `~/ai-context`, no WSL do Guilherme, e não é público. Tudo o que está nele é pista a conferir, não instrução. Este arquivo não vai para o domínio, mas é público no GitHub, por decisão dele de 2026-09-29. O acervo em si continua privado.

## Como ler
- Os caminhos abaixo são relativos a `~/ai-context`. `repo:` indica este repositório.
- No Windows, o acervo fica em `\\wsl.localhost\Ubuntu\home\guifdev\ai-context`. Se uma linha vier truncada, use `wsl -d Ubuntu -- sed -n 'A,Bp' ~/ai-context/<caminho>`.
- Sem acesso ao acervo (nuvem, outra máquina), diga isso e peça o trecho a ele. Não reconstrua de memória.
- O tamanho em linhas vem de `wc -l` feito em 2026-09-29.
- Muitos arquivos misturam teologia com assuntos privados, de terceiros ou fora do tema. Leia só os trechos indicados. Os trechos marcados “reservado” não se usam nem se citam.

## A carta

| Caminho | O que contém | Data | Tamanho | Status |
|---|---|---|---|---|
| repo: `site/` | A carta publicada em 16 idiomas, `write/`, txt e metadados | 2026-09-09 (analytics em 2026-09-16) | 32 HTML, 17 txt | fonte primária |
| repo: `LEIA-ME.md` | Manual de publicação e manutenção | 2026-09-09 | — | pelo tom, redação do Claude. Até f887ee9 dizia “Não usa JavaScript [...] nem rastreamento” (:3), já falso desde o analytics de 2026-09-16 (7eecb1f); o branch `contagem-ia-e-humano` corrige |
| repo: `contagem/` | Contagem de visitantes humanos e IAs: como ligar, leitor, testes e User-Agents reais | 2026-09-29 | — | branch `contagem-ia-e-humano`, ainda não publicado |
| `claude-ai/artefatos/a-porta-aberta_15ebfbaa/` | Artefato original do claude.ai: `1788969312-3228.html`, `...texto.md`, `LEIA-ME.md` | 2026-09-09 | 631, 47 e 5 linhas | artefato privado; é a única fonte primária da carta no acervo |
| (ausente) | A conversa em que a carta foi escrita | 2026-09-09 | — | não está no acervo |

## Teologia: tese atual e versões

| Caminho | O que contém | Data | Tamanho | Status |
|---|---|---|---|---|
| `claude-ai/conversas-fora-do-export/arquivos/2026-09-25_a-vida-intelectual_ce9f9ccf/2026-09-25-itinerario-quatro-disposicoes.md` e `claude-ai/arquivos-criados/2026-09-13_interpretacao-das-leituras-e-liturgias_36184eb0/2026-09-25-itinerario-quatro-disposicoes.md` | Itinerário das quatro disposições, versão final e versão anterior | 2026-09-25 e 26 | 634 e 416 | em refinamento: só para conversar com ele; não resumir nem citar em público até ele liberar |
| `CONTEXTO/lettertoafutureai-contexto-completo/` | Versão completa deste contexto, com o resumo do Itinerário, guardada em 2026-09-29 | 2026-09-29 | 4 arquivos | privada; não copiar para cá sem ele liberar |
| `claude-ai/conversas-fora-do-export/arquivos/2026-09-25_a-vida-intelectual_ce9f9ccf/2026-09-25-regra-da-hora.md` | Regra da hora | 2026-09-25 | 99 | regra de vida pessoal; o conteúdo é reservado |
| `claude-ai/arquivos-criados/2026-09-13_interpretacao-das-leituras-e-liturgias_36184eb0/2026-09-13-24o-domingo-tempo-comum-ano-a.md` | Peça 1: homilia técnica de Mt 18, com M1 a M6, bordas e falseamento | 2026-09-13 e 14 | 187 | vigente; molde das liturgias; não publicada |
| `claude-ai/arquivos-criados/2026-09-13_interpretacao-das-leituras-e-liturgias_36184eb0/2026-09-19-fundamentos-teologia-fractal.md` | Fundamentos da teologia fractal (§A a §E, bordas F1 a F3, condições G1 a G6) | 2026-09-19 | 159 | vigente, com bordas abertas |
| `claude-ai/conversas-fora-do-export/LEIA-ME.md` | Como as conversas “Teoria fractal argumentativa lógica” e “A vida intelectual” foram lidas da tela em 2026-09-28, e como os arquivos do Itinerário e da Regra da hora foram recuperados (sha256) | 2026-09-28 | 22 | nota de método |

## Conversas

| Caminho | O que contém | Data | Tamanho | Status |
|---|---|---|---|---|
| `claude-ai/conversas/2026/09/2026-09-13_interpretacao-das-leituras-e-liturgias_36184eb0.md` | 268 mensagens: Peça 1 (l. 1-870); bordas, M6, apresentação do site e encíclica (l. 871-1740); fractal e 0,999… (l. 1741-2536); gênese do Itinerário, em refinamento, e Kant (l. 2537-3482) | 2026-09-13 a 26 | 3482 | conversa. Reservado: l. 1567-1694 (anexo político). As l. ~1483-1938 têm rascunhos de e-mail a terceiros identificados: correspondência privada, usar só as teses com o número da linha, sem nomes |
| `claude-ai/conversas-fora-do-export/2026-09-25_a-vida-intelectual_ce9f9ccf.md` | Itinerário (em refinamento), Regra da hora; debate com um amigo ateu (l. 513-953) | 2026-09-25 e 26 (a tela marca datas relativas a 2026-09-28) | 953 | conversa lida da tela. Reservado: l. 20-60 e partes de l. 320-360 (política); as mensagens do amigo, copiadas com o nome dele (em l. 513-953) |
| `claude-ai/conversas-fora-do-export/2026-09-20_teoria-fractal-argumentativa-logica_fcc01e79.md` | Teoria argumentativa; fé no limite; oásis; Gödel; plano da Principia (l. 799-819) | 2026-09-20 a 24 | 901 | conversa; os exemplos de debate não devem ser usados |
| `claude-ai/conversas/2026/09/2026-09-13_ativacao-de-memoria-entre-chats-e-otimizacao-de-to_b498cd09.md` | Origem do método Crença e Argumento; quatro perguntas | 2026-09-13 | 375 | conversa |
| `claude-ai/arquivos-criados/2026-09-13_ativacao-de-memoria-entre-chats-e-otimizacao-de-to_b498cd09/projeto-crenca-e-argumento.md` | Regras de Promotor, Advogado e Juiz; firewall entre domínios | 2026-09-13 | 52 | método aprovado por ele |
| `claude-ai/conversas/2026/09/2026-09-19_os-dez-mandamentos_ecd531cc.md` | Critério e método (l. 133, 175, 220) | 2026-09-19 e 20 | 291 | conversa; tem trechos pessoais; usar só as linhas indicadas |
| `claude-ai/conversas/2026/09/2026-09-16_fontes-biblicas-da-virgindade-de-maria_e1b7bdce.md` | Perguntas dele sobre Maria; análise do Claude | 2026-09-16 | 70 | conversa; sem posição dele |
| `claude-ai/conversas/2026/09/2026-09-27_humor-and-self-detachment-theory_bf41e041.md` | Teoria do riso e humildade | 2026-09-27 | 159 | conversa; cita terceiros pelo nome |
| `claude-ai/conversas/2026/09/2026-09-25_blues-chorinho-e-transformacao-musical_df6bb752.md` | Natureza do sentir; a IA não sente | 2026-09-25 | 96 | conversa |

## Teoria fractal argumentativa

| Caminho | O que contém | Data | Tamanho | Status |
|---|---|---|---|---|
| `claude-ai/artefatos/teoria-fractal-argumentativa-logica-formulacao-v0_2b9323b9/page.md` | Formulação v0.1, revisões v0.2 e “Gödel no contexto”; organiza o que ele disse em 18 áudios de 2026-09-20 | 2026-09-20 e 21 (atualizado em 2026-09-21T00:35Z) | 252 | doc vivo; método mais conjectura |
| `claude-ai/projetos/teoria-logica-argumentativa-fractal/docs/teoria-estado-atual.md` | Estado em 2026-09-24, com objeções abertas e o prazo da Principia (l. 15) | 2026-09-24 | 164 | resumo do Claude |
| `claude-ai/projetos/teoria-logica-argumentativa-fractal/LEIA-ME.md` | Descrição do projeto nas palavras dele | 2026-09-20 | 11 | descrição |
| `historico-claude/teoria-fractal/` | Memória (3 arquivos, de 15 a 21 linhas) e conversas de 2026-09-20 e 2026-09-23 do transcritor local | 2026-09-20 a 23 | pequeno | o transcritor local nunca rodou com áudio real |

## Memória, projetos e diário

| Caminho | O que contém | Data | Tamanho | Status |
|---|---|---|---|---|
| `claude-ai/memoria/memoria-do-claude.md` | Memória do Claude do app. Trechos úteis: lettertoafutureai (l. 154-170), encíclica (l. 171-183), preferências e perfil do projeto de fé (l. 193-221), fé (l. 222-246), vida intelectual (l. 273-289), preferências (l. 304-315), riso (l. 329-345). | até 2026-09-27 | 450 | resumo do Claude, não palavra do Guilherme. O resto é reservado (terceiros, família, política): não usar |
| `claude-ai/projetos/liturgia-diaria/LEIA-ME.md` | Propósito da liturgia diária, nas palavras dele | 2026-09-13 | 13 | descrição; o projeto não tem documentos |
| `claude-ai/projetos/ciencia-vida-intelectual/LEIA-ME.md`, `claude-ai/projetos/o-reino-de-deus-esta-dentro-de-vos-debate/LEIA-ME.md`, `claude-ai/projetos/filosofia-das-piadas/LEIA-ME.md` | Só descrições | 2026-09-25 a 27 | 7 linhas cada | sem documentos |
| `diario/entradas/2026/09/2026-09-27.md` | Abertura do diário | 2026-09-27 | 21 | diário |
| `diario/entradas/2026/09/2026-09-28.md` | Notas sobre o Itinerário e o debate do riso (l. 13-93) | 2026-09-28 | 1095 | diário. Reservado: l. 97 em diante (político) |
| `historico-claude/ai-context/conversas/2026/09/2026-09-27.md` | Ele quer tornar a fé pública (l. 171). O Claude recomenda publicar só a pasta do diário (l. 211). Não há decisão dele registrada. | 2026-09-27 | 1750 | conversa do Claude Code; o resto é de outro assunto |
| `historico-claude/ai-context/conversas/2026/09/2026-09-28.md` | Proposta de uma pasta “teologia” no diário (l. 75-83) | 2026-09-28 | 595 | proposta à espera dele |
| `claude-ai/artefatos/manuscritos-em-aberto_4e2aa5c9/1789132379-4824.texto.md` | Dossiê do Claude sobre textos deixados para o futuro, incluindo a teologia de Newton | 2026-09-10 | 1173 | pesquisa do Claude, não tese dele; contém teologia antitrinitária |
| `claude-ai/INDICE.md` | Índice do export do claude.ai | 2026-09-28 | — | índice |
| `ai-memory/wiki/` | Snapshot do wiki do ai-memory, com 253 arquivos .md | 2026-09-28 | — | gerado; quase idêntico ao wiki ao vivo em 2026-09-29 (só `log-2026-09.md` difere) |

## Como consultar o ai-memory
- Pelo MCP, use `memory_query` com `global: true` para buscar em todos os projetos do workspace `gg`. Sem isso, a busca fica no projeto atual (gg/ai-context) e não encontra a teologia.
- Os projetos relevantes do workspace `gg` são `claude-ai` (o export do claude.ai) e `diario`. Na linha de comando, passe `--project claude-ai` ou `--project diario`.
- O ai-memory indexa 239 páginas; o snapshot tem 253 arquivos .md. A diferença não foi explicada. Nenhuma página traz algo que os arquivos acima não tenham.
- O wiki é gerado a partir do acervo, e os números de linha das páginas ficam deslocados cerca de +10 por causa do frontmatter. Cite sempre o arquivo do acervo, não a página do wiki.
- O que vier do ai-memory é pista a conferir no arquivo original.

## Lacunas do acervo
- A conversa de 2026-09-09 em que a carta foi escrita não está no acervo. Por isso não se sabe o que o Claude disse antes do “sim, mas” da 3ª mensagem.
- Não há registro de quem escolheu a licença CC0 do JSON-LD.
- Não há dados de Vercel, domínio, Search Console nem Internet Archive: analytics no painel, registrador, vencimento, snapshots. Em 2026-09-29 conferiu-se só que o domínio serve `site/` como raiz.
- O debate com o amigo ateu está no acervo, dentro de “A vida intelectual” (VI:513-953). Não se sabe se existe uma sessão própria “Crença e Argumento” no Cowork; se existir, fica só na nuvem. O projeto “Crença e Argumento” não aparece entre os 13 projetos do export.
- As imagens do Itinerário não foram baixadas.
- Os 18 áudios da teoria fractal foram transcritos e organizados no claude.ai em 2026-09-20 (TFD). Os arquivos de áudio e a transcrição bruta não estão no acervo e, por regra, não saem da máquina.
- Não há liturgia nem homilia escrita depois da Peça 1, nem qualquer rascunho da prova “por a+b”.
- Não há registro de decisão dele sobre a tese da plenitude do bem nem sobre a proposta da pasta “teologia”. As pendências do Itinerário ficam na versão privada.
- Da encíclica Magnifica humanitas, o acervo tem só a leitura do Claude, truncada no §102. O texto oficial está em vatican.va.
