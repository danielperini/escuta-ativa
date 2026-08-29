import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import OpenAI from 'npm:openai@4.68.0';
import { secrets } from 'base44:runtime';

// ===================================================================
// chatIATerritorial — Assistente IA da societá.ai v2.
//
// Pipeline de 8 etapas (executado em ordem, para TODA pergunta):
//   1. Contexto da tela atual + território
//   2. Banco interno societá.ai (Comunidade, Stakeholder, Registro,
//      RiscoSocial, Compromisso, Caso)
//   3. Documentos / Base de Conhecimento (DocumentoProcessado)
//   4. Dados Secundários já armazenados (DadoSecundario — cache 30 dias)
//   5. Cache válido? Se sim, usar.
//   6. APIs oficiais ativas + Health check (FonteDados)
//   7. Pesquisa web assistida por GPT em fontes oficiais
//      (delegate a pesquisarDadosTerritoriais, que usa OpenAI e
//      persiste automaticamente em DadoSecundario)
//   8. Se nada confiável for encontrado → responder "não encontrei
//      dados suficientemente confiáveis nas fontes disponíveis para
//      responder com segurança" e listar as fontes consultadas.
//
// Regras permanentes:
//  - IA NÃO AUMENTA PERMISSÃO: usa base44.entities (escopo do usuário RLS)
//  - geographic_level das fontes externas é MUNICIPAL mesmo quando o
//    usuário selecionou uma comunidade. Quando aplicável, contextualizar
//    "Contexto municipal da comunidade".
//  - Diferencia DADO INTERNO, DADO OFICIAL, INFORMAÇÃO WEB,
//    PERCEPÇÃO COMUNITÁRIA, ALEGAÇÃO, INFERÊNCIA DA IA e HIPÓTESE.
//  - Toda informação factual externa deve ser rastreável (source_url).
//  - Auditoria: registra pergunta + categorias consultadas em
//    HistoricoAuditoria.
// ===================================================================

const SYSTEM_PROMPT = `Você é o Assistente IA da societá.ai, plataforma de relacionamento comunitário e inteligência social territorial.

Princípios permanentes:
- Responda priorizando DADOS INTERNOS e DADOS PÚBLICOS do contexto abaixo, nunca inventando números, nomes, datas, leis ou citações.
- Diferencie claramente em cada afirmação: DADO INTERNO (Registro societá.ai), DADO OFICIAL (fonte pública), INFORMAÇÃO WEB, PERCEPÇÃO COMUNITÁRIA, ALEGAÇÃO/RECLAMAÇÃO, INFERÊNCIA DA IA, HIPÓTESE PARA INVESTIGAÇÃO.
- Para números, indique sempre: indicador, valor, unidade, período e fonte.
- Correlação não é causalidade. Nunca transforme coincidência em causa.
- Nunca transforme percepção comunitária em fato comprovado.
- Dados municipais (população, PIB, hospitais, escolas, conselhos, etc.) têm geographic_level MUNICIPAL. Se o usuário mencionou uma comunidade mas só houver dado municipal, responda com o CONTEXTO MUNICIPAL DA COMUNIDADE e diga claramente que o dado se refere ao município.
- NÃO transmita dados pessoais (CPF, NIS, dados médicos individuais, senhas, tokens). Aplique minimização.
- Se o usuário disser "aqui" sem especificar território, use os TOTAIS visíveis no banco (ex: "X comunidades cadastradas") e, se a pergunta exigir detalhamento municipal, pergunte qual território.
- Se a evidência for insuficiente, responda explicitamente:
  "Não encontrei dados suficientemente confiáveis nas fontes disponíveis para responder com segurança."
- Se consultou fontes externas, mostre-as.

Estrutura da resposta (Markdown — mostre apenas as seções com conteúdo):
## Resposta — síntese objetiva
## Dados internos — registros societá.ai (cite o id como [REG-xxx], [STK-xxx], [COM-xxx] etc.)
## Dados públicos — indicadores oficiais (cite fonte, período e território)
## Documentos — itens relevantes da Base de Conhecimento, se houver
## Leitura da IA — interpretação/síntese claramente marcada como inferência
## Fontes — lista de todas as fontes consultadas, com link [Ver fonte]
Cada item de tabelas deve indicar: indicador / valor / unidade / período / fonte.
Inclua ao final: "Fontes consultadas: <lista das APIs e bases consultadas>".`;

function safeArr(arr, n) {
  return Array.isArray(arr) ? arr.slice(0, n) : [];
}

// === PADRÕES DE CATEGORIA (spec item 7) ======================
const PADROES_POR_CATEGORIA = [
  ['demografia', /\bpopula(cao|[çc][ãa]o)\b|habitantes|censo|densidade demograf/i],
  ['economia', /\bpib\b|\breceita\b|\bdespesa\b|\bfiscal\b|\brcls?\b|orçamento|orcamento|siconfi|tesouro nacional/i],
  ['saude', /\bhospital|leitos?|postos? de sa[uú]de|\bubs\b|datasus|\bcnes\b|sa[uú]de municipal|\bunidades? de sa[uú]de/i],
  ['educacao', /\bescola[s]?\b|\bideb\b|censo escolar|matricula|saber|inep/i],
  ['governo_municipal', /prefeito|prefeita|secretariado|secretaria municipal|poder executivo municipal|gabinete do prefeito/i],
  ['camara_municipal', /vereadores?|c[âa]mara municipal|\bsapl\b|mesa diretora|projetos? de lei municipal/i],
  ['conselhos', /conselhos? municipais?|conselheiro\b|conselho tutelar|conselho de meio ambiente|conselho da saude|conselho da educacao/i],
  ['mineracao', /processo miner[áa]rio|\banm\b|\bsigmine\b|minera[çc][ãa]o|concess[õo]o de lavra|extra[çc][ãa]o mineral/i],
  ['meio_ambiente', /\bibama\b|\bicmbio\b|\bmapbiomas\b|\binpe\b|desmatamento|unidade de conservacao|licenciamento ambiental/i],
  ['telecomunicacoes', /internet|sinal|conectividade|telefone|celular|wi-?fi|fibra|3g|4g|5g|operadora|cobertura mo[vv]el|\banatel\b/i],
  ['agua_recursos_hidricos', /[áa]gua|falta d.?[áa]gua|abasteci|po[çc]o|nascente|rio|c[oó]rrego|qualidade da [áa]gua|seca|enchente|inundacao|capta[çc][ãa]o|esgoto|odolor|contamina[çc][ãa]o|vaz[ãa]o|cisterna|\bana\b|\bsnirh\b|\bsinisa\b|\bsnisb\b/i],
  ['saude_filtro_ativo', /\bhospitais?|ubs|leitos|cnes|datasus/i], // duplicado intençionalmente
];

function detectarCategoria(pergunta) {
  for (const [cat, padrao] of PADROES_POR_CATEGORIA) {
    if (padrao.test(pergunta)) {
      if (cat === 'saude_filtro_ativo') return 'saude';
      return cat;
    }
  }
  return null;
}

const TERMOS_HIDRICOS = PADROES_POR_CATEGORIA.find(([c]) => c === 'agua_recursos_hidricos')[1];
const TERMOS_TELECOM = PADROES_POR_CATEGORIA.find(([c]) => c === 'telecomunicacoes')[1];

// 30 dias em ms — usado para checar frescor do cache
const TRINTA_DIAS_MS = 30 * 24 * 60 * 60 * 1000;
function cacheFresh(updatedAt) {
  if (!updatedAt) return false;
  const t = typeof updatedAt === 'string' ? Date.parse(updatedAt) : updatedAt;
  if (!t) return false;
  return (Date.now() - t) < TRINTA_DIAS_MS;
}

function resumoRegistro(r) {
  const desc = (r.descricao || '').replace(/\s+/g, ' ').slice(0, 200);
  return `- [REG-${r.id?.slice(-6) || 'XXXXXX'}] ${r.titulo || 'Sem título'} (${r.data_registro || (r.created_date || '').slice(0, 10) || ''})${desc ? ': ' + desc + ((r.descricao || '').length > 200 ? '…' : '') : ''}`;
}

// Helpers
async function resolveIbgeCode(base44, municipio, uf, ibge) {
  if (ibge) return ibge;
  try {
    const coms = await base44.entities.Comunidade.list('-updated_date', 200);
    const found = coms.find(c =>
      (c.municipio || '').toLowerCase() === (municipio || '').toLowerCase() &&
      (c.estado || c.uf || '').toUpperCase() === (uf || '').toUpperCase());
    if (found?.municipality_ibge_code) return found.municipality_ibge_code;
  } catch (_) {}
  return null;
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const pergunta = (body.pergunta || '').toString().trim();
    if (!pergunta) return Response.json({ error: 'Pergunta vazia' }, { status: 400 });
    const municipio = (body.municipio || '').toString().trim();
    const uf = (body.uf || '').toString().trim();
    const ibge = (body.ibge || '').toString().trim();
    const contextoPagina = (body.contextoPagina || '').toString().trim();
    const comunidadeParam = (body.comunidade || '').toString().trim();
    const historico = safeArr(body.historico, 8);

    const munLower = municipio.toLowerCase();
    const perguntaLower = pergunta.toLowerCase();
    const perguntaHidrica = TERMOS_HIDRICOS.test(pergunta);
    const perguntaTelecom = TERMOS_TELECOM.test(pergunta);
    const categoriaDetectada = detectarCategoria(pergunta);

    const contexto = [];
    const fontesInternas = [];
    const fontesPublicas = [];
    const fontesConsultadas = [];
    const indicadoresEncontrados = [];

    // Diagnósticos para auditoria
    const diagnostico = {
      pergunta,
      municipio: municipio || null,
      uf: uf || null,
      categoria_detectada: categoriaDetectada,
      consulta_interna_realizada: true,
      consulta_docs_realizada: false,
      consulta_dados_secundarios_realizada: false,
      pesquisa_externa_realizada: false,
      fonte_externa_status: null,
      fontes_publicas_usadas: [],
      route_atual: contextoPagina || null,
      comunidade_param: comunidadeParam || null
    };

    // === FASE 1: Contexto da tela atual + território já vai no contextoBloco ===

    // === FASE 2: Comunidades (totais + detalhe municipal) ===
    try {
      const comAll = await base44.entities.Comunidade.list('-updated_date', 100);
      const munComs = munLower ? comAll.filter(c => (c.municipio || '').toLowerCase().includes(munLower)) : comAll;
      const amostra = munComs.slice(0, 30);
      const totalTxt = munLower
        ? `${munComs.length} comunidades em ${municipio} (de ${comAll.length} cadastradas no app)`
        : `${comAll.length} comunidades cadastradas no total`;
      contexto.push(`COMUNIDADES CADASTRADAS NA SOCIETÁ.AI (TOTAL ${totalTxt}):\n${amostra.length ? amostra.map(c => `- ${c.nome} (município: ${c.municipio || 'n/d'}${c.estado ? '/' + c.estado : ''}, tipo: ${c.tipo || 'n/d'}, termômetro: ${c.termometro_social || 'n/d'})`).join('\n') : '—'}`);
      amostra.slice(0, 5).forEach(c => fontesInternas.push({ id: c.id, titulo: c.nome, tipo: 'comunidade' }));
    } catch (e) { /* ignore */ }

    // === FASE 3: Stakeholders ===
    try {
      const stkAll = await base44.entities.Stakeholder.list('-updated_date', 50);
      const filtered = munLower ? stkAll.filter(s => (s.municipio || '').toLowerCase().includes(munLower)) : stkAll;
      const amostra = filtered.slice(0, 20);
      const totalTxt = munLower ? `${filtered.length} stakeholders em ${municipio} (de ${stkAll.length} no app)` : `${stkAll.length} stakeholders cadastrados no total`;
      contexto.push(`STAKEHOLDERS CADASTRADOS (TOTAL ${totalTxt}):\n${amostra.length ? amostra.map(s => `- ${s.nome} (${s.subtipo || s.tipo || 'n/d'}; município: ${s.municipio || 'n/d'}; nível influência: ${s.nivel_influencia || 'n/d'})`).join('\n') : '—'}`);
      amostra.slice(0, 5).forEach(s => fontesInternas.push({ id: s.id, titulo: s.nome, tipo: 'stakeholder' }));
    } catch (e) { /* ignore */ }

    // === FASE 4: Registros recentes (com priorização temática) ===
    try {
      const regAll = await base44.entities.Registro.list('-created_date', 60);
      const filteredPorMun = munLower ? regAll.filter(r =>
        (r.comunidade || '').toLowerCase().includes(munLower) ||
        (r.localizacao?.municipio || '').toLowerCase().includes(munLower)) : regAll;
      let amostra = filteredPorMun.slice(0, 12);
      const totalTxt = munLower ? `${filteredPorMun.length} registros vinculados a ${municipio}` : `${regAll.length} registros recentes`;
      if (perguntaHidrica) {
        const hidro = filteredPorMun.filter(r => TERMOS_HIDRICOS.test((r.descricao || '') + ' ' + (r.transcricao || '') + ' ' + (r.temas_identificados || []).join(' ')));
        if (hidro.length) {
          amostra = hidro.slice(0, 12);
          amostra.forEach(r => fontesInternas.push({ id: r.id, titulo: r.titulo || 'Registro sobre água', tipo: 'registro' }));
          contexto.push(`REGISTROS INTERNOS SOBRE ÁGUA/RECURSOS HÍDRICOS (${hidro.length} encontrados):\n${amostra.map(resumoRegistro).join('\n')}`);
          fontesConsultadas.push('Registros internos (filtro temático: água)');
          indicadoresEncontrados.push({ fonte: 'Registros internos', tipo: 'agua_recursos_hidricos', contagem: hidro.length });
        }
      }
      if (perguntaTelecom) {
        const tel = filteredPorMun.filter(r => TERMOS_TELECOM.test((r.descricao || '') + ' ' + (r.transcricao || '') + ' ' + (r.temas_identificados || []).join(' ')));
        if (tel.length) {
          contexto.push(`REGISTROS INTERNOS SOBRE TELECOMUNICAÇÕES (${tel.length} encontrados):\n${tel.slice(0, 12).map(resumoRegistro).join('\n')}`);
          tel.slice(0, 6).forEach(r => fontesInternas.push({ id: r.id, titulo: r.titulo || 'Registro sobre conectividade', tipo: 'registro' }));
        }
      }
      contexto.push(`REGISTROS INTERNOS RECENTES DA SOCIETÁ.AI (TOTAL ${totalTxt}; ${Math.min(12, amostra.length)} resumidos):\n${amostra.length ? amostra.map(resumoRegistro).join('\n') : '—'}`);
      if (fontesInternas.filter(f => f.tipo === 'registro').length === 0) {
        amostra.slice(0, 4).forEach(r => fontesInternas.push({ id: r.id, titulo: r.titulo || 'Registro', tipo: 'registro' }));
      }
    } catch (e) { /* ignore */ }

    // === FASE 5: Riscos sociais ativos ===
    try {
      const risc = await base44.entities.RiscoSocial.list('-created_date', 30);
      if (risc.length) {
        const amostra = risc.slice(0, 10);
        contexto.push(`RISCOS SOCIAIS CADASTRADOS (${risc.length} no app; 10 amostrados):\n${amostra.map(r => `- ${r.titulo || r.nome || 'Risco'}${r.nivel || r.severidade ? ' (' + (r.nivel || r.severidade) + ')' : ''}`).join('\n')}`);
      }
    } catch (e) { /* ignore */ }

    // === FASE 6: Compromissos ativos ===
    try {
      const comp = await base44.entities.Compromisso.list('-prazo', 30);
      if (comp.length) {
        const amostra = comp.slice(0, 10);
        contexto.push(`COMPROMISSOS CADASTRADOS (${comp.length} no app; 10 amostrados):\n${amostra.map(c => `- ${c.titulo || 'Compromisso'}${c.prazo ? ' (até ' + c.prazo.slice(0, 10) + ')' : ''}${c.status ? ' — ' + c.status : ''}`).join('\n')}`);
      }
    } catch (e) { /* ignore */ }

    // === FASE 7: Casos ativos ===
    try {
      const casos = await base44.entities.Caso.list('-created_date', 20);
      if (casos?.length) {
        contexto.push(`CASOS VINCULADOS (${casos.length} no app; 5 amostrados):\n${casos.slice(0, 5).map(c => `- ${c.titulo || c.tema_principal || 'Caso'}${c.status ? ' — ' + c.status : ''}`).join('\n')}`);
      }
    } catch (e) { /* ignore */ }

    // === FASE 8 (NOVA): Documentos / Base de Conhecimento ===
    try {
      const docs = await base44.entities.DocumentoProcessado.list('-created_date', 60);
      if (docs?.length) {
        diagnostico.consulta_docs_realizada = true;
        const termosBusca = new Set();
        if (municipio) { termosBusca.add(munLower); }
        if (comunidadeParam) termosBusca.add(comunidadeParam.toLowerCase());
        perguntaLower.split(/\s+/).filter(w => w.length > 4).slice(0, 6).forEach(w => termosBusca.add(w));
        const relacionadas = docs.filter(d => {
          const pk = (d.palavras_chave || []).map(x => x.toLowerCase());
          const titLower = (d.titulo || '').toLowerCase();
          const resumoLower = (d.resumo || '').toLowerCase();
          const ents = d.entidades_mencionadas || {};
          const comMun = (ents.comunidades || []).some(c => termosBusca.has(c.toLowerCase()));
          for (const t of termosBusca) {
            if (pk.some(p => p.includes(t))) return true;
            if (titLower.includes(t)) return true;
            if (resumoLower.includes(t)) return true;
          }
          return comMun;
        }).slice(0, 5);
        if (relacionadas.length) {
          contexto.push(`DOCUMENTOS DA BASE DE CONHECIMENTO (${relacionadas.length} relacionados à pergunta):\n${relacionadas.map(d => `- [DOC-${d.id?.slice(-6)}] ${d.titulo}${d.resumo ? ': ' + d.resumo.slice(0, 200) + (d.resumo.length > 200 ? '…' : '') : ''}${d.arquivo_url ? ` (URL: ${d.arquivo_url})` : ''}`).join('\n')}`);
          relacionadas.forEach(d => fontesInternas.push({ id: d.id, titulo: d.titulo, tipo: 'documento', url: d.arquivo_url }));
          fontesConsultadas.push('DocumentoProcessado (base de conhecimento)');
        }
      }
    } catch (e) { /* ignore */ }

    // === FASE 9 (NOVA): Dados Secundários (cache 30 dias) ===
    let ibgeCode = ibge;
    try {
      if (!ibgeCode && (municipio && uf)) {
        ibgeCode = await resolveIbgeCode(base44, municipio, uf, ibge);
      }
    } catch (_) {}
    diagnostico.consulta_dados_secundarios_realizada = !!(ibgeCode);
    if (ibgeCode) {
      try {
        const dados = await base44.entities.DadoSecundario.filter({ municipality_ibge_code: ibgeCode }, '-updated_date', 100);
        if (dados?.length) {
          const porCat = {};
          dados.forEach(d => { if (d.category) porCat[d.category] = (porCat[d.category] || 0) + 1; });
          const frescos = dados.filter(d => cacheFresh(d.updated_at || d.collected_at));
          const ctxResumo = `DADOS SECUNDÁRIOS (cache local ${dados.length} itens; ${frescos.length} frescos < 30d; por categoria: ${Object.entries(porCat).map(([k, v]) => k + '=' + v).join(', ')}).`;
          const catFiltro = categoriaDetectada;
          const amostraDados = catFiltro ? dados.filter(d => d.category === catFiltro).slice(0, 25) : dados.slice(0, 25);
          if (amostraDados.length) {
            const indicadoresTxt = amostraDados.map(d => {
              const v = d.value_number != null ? `${d.value_number}${d.unit ? ' ' + d.unit : ''}` : (d.value_text || '');
              return `- ${d.indicator}: ${v}${d.reference_period ? ' (' + d.reference_period + ')' : ''}${d.source_name ? ' — ' + d.source_name : ''}${d.source_url ? ` (URL: ${d.source_url})` : ''}`;
            }).join('\n');
            contexto.push((catFiltro
              ? `DADOS SECUNDÁRIOS DA CATEGORIA "${catFiltro}" (${amostraDados.length} indicadores cacheados para ${municipio || ibgeCode}):`
              : `DADOS SECUNDÁRIOS CACHEADOS (${amostraDados.length} amostrados para ${municipio || ibgeCode}):`) + `\n${indicadoresTxt}`);
            const vistos = new Set();
            amostraDados.forEach(d => {
              if (d.source_url && !vistos.has(d.source_url)) {
                vistos.add(d.source_url);
                fontesPublicas.push({ fonte: d.source_name || d.orgao || 'Fonte pública', url: d.source_url, referencia: d.reference_period || '' });
              }
            });
            fontesConsultadas.push('DadoSecundario (cache)');
            amostraDados.forEach(d => indicadoresEncontrados.push({
              fonte: d.source_name || 'Cache DadoSecundario',
              indicador: d.indicator,
              referencia: d.reference_period,
              url: d.source_url
            }));
          } else {
            contexto.push(ctxResumo);
          }
        }
      } catch (e) { /* ignore */ }
    }

    // === FASE 10 (NOVA): Health check + pesquisa externa (GPT em fontes oficiais) ===
    let fonteDoente = false;
    let categoriaPesquisada = null;
    if (categoriaDetectada && municipio && uf) {
      if (!ibgeCode) {
        try { ibgeCode = await resolveIbgeCode(base44, municipio, uf, ibge); } catch (_) {}
      }
      // Health check — FonteDados por category
      try {
        const fontes = await base44.entities.FonteDados.list('-updated_date', 100);
        const visiveis = (fontes || []).filter(f => f.visible !== false && !f.deactivated && (f.category === categoriaDetectada || (f.source_name || '').toLowerCase().includes(categoriaDetectada.toLowerCase())));
        if (visiveis.length) {
          const indisponiveis = visiveis.filter(f => f.status === 'INDISPONIVEL' || (f.consecutive_failures || 0) >= 3);
          if (indisponiveis.length === visiveis.length) fonteDoente = true;
          fontesConsultadas.push(`FonteDados (health check: ${visiveis.length} visíveis, ${indisponiveis.length} indisponíveis)`);
        }
      } catch (_) {}

      // Dispara pesquisarDadosTerritoriai se:
      // - Não há cache fresco para esta categoria/MUNICIPIO, OU
      // - Há cache mas não fresco; e
      // - Fontes não estão todas indisponíveis
      let temCacheFresco = false;
      try {
        const dadosCat = await base44.entities.DadoSecundario.filter({ municipality_ibge_code: ibgeCode, category: categoriaDetectada }, '-updated_date', 1);
        temCacheFresco = (dadosCat.length > 0) && cacheFresh(dadosCat[0].updated_at || dadosCat[0].collected_at);
      } catch (e) {}

      if (!fonteDoente && !temCacheFresco && ibgeCode) {
        // Pesquisa externa assistida por GPT em fontes oficiais
        try {
          diagnostico.pesquisa_externa_realizada = true;
          categoriaPesquisada = categoriaDetectada;
          const res = await base44.functions.invoke('pesquisarDadosTerritoriais', {
            ibge_code: ibgeCode, municipio, uf, categoria: categoriaDetectada, pergunta, force_refresh: false
          });
          const dataR = res?.data || res;
          if (dataR && !dataR.error) {
            diagnostico.fonte_externa_status = 'ok';
            const novos = (dataR.items || []).filter(it => it && (it.indicator || it.value_text));
            if (novos.length) {
              const vistos = new Set();
              novos.forEach(it => {
                if (it.source_url && !vistos.has(it.source_url)) {
                  vistos.add(it.source_url);
                  fontesPublicas.push({ fonte: it.source_name || it.orgao || 'Fonte oficial', url: it.source_url, referencia: it.reference_period || '' });
                  diagnostico.fontes_publicas_usadas.push(it.source_url);
                }
              });
              // Inclui os novos indicadores no contexto final
              const novosTxt = novos.slice(0, 15).map(it => {
                const v = (it.value_text || (it.value_number != null ? String(it.value_number) + (it.unit ? ' ' + it.unit : '') : ''));
                return `- ${it.indicator || 'Indicador'}: ${v}${it.reference_period ? ' (' + it.reference_period + ')' : ''}${it.source_name ? ' — ' + it.source_name : ''}${it.source_url ? ` (URL: ${it.source_url})` : ''}${it.geographic_level ? ' [' + it.geographic_level + ']' : ''}`;
              }).join('\n');
              contexto.push(`PESQUISA EXTERNA ASSISTIDA POR IA (categoria: ${categoriaDetectada}; ${novos.length} itens retornados). ATENÇÃO: o GPT apenas LOCALIZOU a fonte — NÃO o valor. Os itens abaixo já estão persistidos em DadoSecundario com geographic_level ${'MUNICIPAL'}.\n${novosTxt}`);
              novos.slice(0, 10).forEach(it => indicadoresEncontrados.push({
                fonte: it.source_name || it.orgao || 'Pesquisa IA',
                indicador: it.indicator, referencia: it.reference_period, url: it.source_url
              }));
              fontesConsultadas.push('Pesquisa externa (GPT em fontes oficiais — backend pesquisarDadosTerritoriais)');
            }
          } else {
            diagnostico.fonte_externa_status = 'sem_dados';
          }
        } catch (e) {
          diagnostico.fonte_externa_status = 'erro';
          // Silencioso no UI, mas manter cache se existir
        }
      } else if (temCacheFresco) {
        diagnostico.fonte_externa_status = 'cache_fresco_usado';
      } else if (fonteDoente) {
        diagnostico.fonte_externa_status = 'fonte_indisponivel_cache_usado';
      } else if (!ibgeCode) {
        diagnostico.fonte_externa_status = 'sem_ibge_code';
      }
    }

    // === FASE 11: Contexto agregado final + perguntas ===
    const terrTxt = municipio ? `${municipio}${uf ? '/' + uf : ''}${ibgeCode ? ' (IBGE ' + ibgeCode + ')' : ''}` : 'NÃO ESPECIFICADO — se "aqui", responda usando os TOTAIS visíveis no banco e pergunte o território apenas se a pergunta exigir detalhamento municipal';
    const contextualComunidade = comunidadeParam
      ? `\nCOMUNIDADE SELECIONADA PELO USUÁRIO: ${comunidadeParam}. Para dados municipais (população, PIB, hospitais, conselhos) diga explicitamente "Contexto municipal da comunidade ${comunidadeParam}" e deixe claro que o dado é do município, não da comunidade.`
      : '';
    const dicaContextual = perguntaHidrica
      ? '\n\nNOTA: o usuário perguntou sobre ÁGUA. Cruze registros internos (percepção/alegação) com Dados Secundários ANA/ANA, se disponíveis. Diferencie percepção comunitária (registro) de dado oficial (fonte pública).'
      : perguntaTelecom
        ? '\n\nNOTA: o usuário perguntou sobre TELECOMUNICAÇÕES. Cruze registros internos com Dados Secundários ANATEL. Diferencie PRESENÇA da operadora de COBERTURA geográfica e EXPERIÊNCIA relatada.'
        : '';
    const categoriasTxt = diagnostico.pesquisa_externa_realizada && categoriaPesquisada
      ? `\nPESQUISA EXTERNA EXECUTADA: categoria "${categoriaPesquisada}" (GPT localizou fontes oficiais no backend; não usar URLs como se fossem da sociedade).`
      : '';
    const contextoBloco = `CONTEXTO DO TERRITÓRIO: ${terrTxt}.
PÁGINA ATUAL NA PLATAFORMA: ${contextoPagina || 'não identificada'}.
${contextualComunidade}${dicaContextual}${categoriasTxt}

DADOS INTERNOS COLETADOS (use como fonte primária; nunca invente dados; se faltar, declare insuficiência):
${contexto.join('\n\n')}

PERGUNTA: ${pergunta}`;

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...historico.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
      { role: 'user', content: contextoBloco }
    ];

    const openai = new OpenAI({ apiKey: secrets.get('OPENAI_API_KEY') });
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.25
    });

    // === FASE 12 (NOVA): Auditoria — HistoricoAuditoria ===
    try {
      await base44.asServiceRole.entities.HistoricoAuditoria.create({
        entidade_tipo: 'AIChat',
        entidade_id: user.id,
        campo_alterado: 'consulta_chat_ia',
        valor_anterior: null,
        valor_novo: diagnostico.pesquisa_externa_realizada
          ? `pergunta respondida com pesquisa externa; ${diagnostico.fonte_externa_status || 'sem_status'}`
          : 'pergunta respondida com dados internos/cache',
        tipo_operacao: diagnostico.pesquisa_externa_realizada ? 'consulta_fonte_oficial' : 'consulta_ia',
        usuario_responsavel: user.email,
        justificativa: `Assistente IA: ${pergunta.slice(0, 120)}`,
        fonte_origem: 'Chat IA — societá.ai',
        aprovacao_necessaria: false,
        detalhes_ia: diagnostico
      });
    } catch (e) { /* auditoria é best-effort */ }

    return Response.json({
      resposta: completion.choices[0].message.content,
      fontesInternas: safeArr(fontesInternas, 10),
      fontesPublicas: safeArr(fontesPublicas, 10),
      territorio: municipio ? `${municipio}${uf ? '/' + uf : ''}` : null,
      categoria_detectada: categoriaDetectada,
      consultou_externo: !!diagnostico.pesquisa_externa_realizada,
      fonte_status: diagnostico.fonte_externa_status,
      fontes_consultadas: safeArr(fontesConsultadas, 8),
      indicadores_encontrados: safeArr(indicadoresEncontrados, 12),
      diagnostico
    });
  } catch (err) {
    return Response.json({ error: err.message || 'Erro no Chat IA' }, { status: 500 });
  }
}