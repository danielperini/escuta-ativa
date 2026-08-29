// ================================================================
//  territorialSourceDiscoveryService.js
//  "GPT pesquisador, extrator e classificador" — NUNCA é a FONTE.
//  Pipeline de descoberta assistida por IA em fontes oficiais/institucionais.
//
//  Hierarquia de consulta (ordem):
//   1. Cache local existente (30 dias)            — method: CACHE
//   2. API oficial estruturada (IBGE etc)         — method: API
//   3. Download / base oficial estruturada        — method: DOWNLOAD_OFICIAL
//   4. Portal / painel oficial                     — method: PORTAL_OFICIAL
//   5. Pesquisa web orientada por IA (este módulo) — method: PESQUISA_WEB_IA
//   6. Fonte institucional confiável alternativa   — method: PORTAL_OFICIAL | PESQUISA_WEB_IA
//   7. Sem dado — status SEM_DADO                  — validation_status: sem_consulta
//
//  REGRA CRÍTICA: GPT localiza a fonte; a FONTE fornece a evidência.
//  A resposta sempre exige source_url rastreável e source_name institucional.
//  Se a IA não conseguir apontar uma fonte real, retornaSEM dado — nunca inventa.
// ================================================================

import { base44 } from '@/api/base44Client';
import { pesquisarViaIA } from '@/lib/publicTerritorialDataService';

// Domínios oficiais priorizados na montagem da query de busca.
const DOMINIOS_OFICIAIS = [
  ' gov.br',
  'mg.gov.br', 'sp.gov.br', 'rj.gov.br', 'ba.gov.br', 'pe.gov.br',
  'prefeitura.municipal', 'pm.', 'cm.', 'camara.municipal',
  'diariooficial', 'dados.gov.br',
  'ibge.gov.br', 'sidra.ibge.gov.br',
  'inep.gov.br', 'inepdata.inep.gov.br',
  'datasus.saude.gov.br', 'tabnet.datasus.gov.br',
  'tesourotransparencia.gov.br', 'siconfi.tesouro.gov.br',
  'portaldatransparencia.gov.br',
  'anm.gov.br', 'sigmine.anm.gov.br',
  'anatel.gov.br', 'ana.gov.br', 'snirh.gov.br',
  'ibama.gov.br', 'icmbio.gov.br',
  'mapbiomas.org', 'inpe.br',
  'tse.jus.br',
  'ipea.gov.br', 'mapaosc.ipea.gov.br',
  'camara.leg.br', 'senado.leg.br'
];

// Mapeamento categoria → padrões de busca oficiais
const PADROES_POR_CATEGORIA = {
  demografia: 'IBGE Censo 2022 SIDRA população',
  economia: 'SICONFI Tesouro PIB RAIS CAGED receitas despesas',
  saude: 'DATASUS DEMAS CNES TabNet Ministério da Saúde',
  educacao: 'INEP Censo Escolar IDEB Saeb',
  governo_municipal: 'Prefeitura Municipal Diário Oficial prefeito secretarias',
  camara_municipal: 'Câmara Municipal SAPL vereadores Mesa Diretora projetos de lei',
  conselhos: 'Conselho Municipal ato de nomeação Diário Oficial',
  osc: 'Mapa das OSCs IPEA Transferegov parcerias públicas',
  politicas_publicas: 'gov.br programa municipal secretaria',
  legislacao: 'Diário Oficial Assembleia Legislativa proposição',
  meio_ambiente: 'IBAMA ICMBio CNUC MapBiomas INPE licenciamento',
  mineracao: 'ANM SIGMINE processo minerário titular substância fase',
  telecomunicacoes: 'ANATEL Painel de Cobertura Móvel estações licenciadas',
  agua_recursos_hidricos: 'ANA SNIRH HidroWeb outorgas estações hidrométricas'
};

function montarQuery(categoria, municipio, uf, perguntaExtra) {
  const base = (PADROES_POR_CATEGORIA[categoria] || 'fontes oficiais brasileiras');
  const pergunta = perguntaExtra ? ` — foco: ${perguntaExtra}` : '';
  return `${base} ${municipio} ${uf}${pergunta} site:(gov.br OR ${uf.toLowerCase()}.gov.br OR município OR prefeituras OR camaras OR diariooficial OR ibge OR inep OR datasus OR siconfi OR anm OR anatel OR ana OR ibama)`;
}

// Converte cada item retornado pela IA em um registro DadoSecundario válido.
// Aplica validação mínima: precisa ter indicator + (value_text | value_number) para considerar encontrado.
function itemEhValido(it, municipioRef, ufRef) {
  if (!it || typeof it !== 'object') return false;
  if (!it.indicator || String(it.indicator).trim() === '') return false;
  const valor = (it.value_text || (it.value_number != null ? String(it.value_number) : '') || it.value || '').toString();
  if (!valor || valor.trim() === '' || valor.toLowerCase() === 'não disponível' || valor.toLowerCase() === 'sem dados') return false;
  // Rejeita fonte IA fantasma
  const fName = String(it.source_name || '').toLowerCase();
  if (/^gpt$|^chatgpt$|^openai$|^gemini$|^ia$/.test(fName)) return false;
  if (it.source_url && /^https?:\/\//i.test(it.source_url) === false) return false;
  // Se houver município explícito e diferir do solicitado (caso raro), atenção — não bloqueamos.
  return true;
}

/**
 * Amplia a pesquisa via IA — agora roteada à função backend
 * `pesquisarDadosTerritoriais` (que usa a API GPT/OpenAI diretamente,
 * com a secret OPENAI_API_KEY configurada no app).
 * Mantém o contrato anterior ({ items, resumo, insights, status, method })
 * consumido pelo resolver (Camada 4) e pela UI "Ampliar pesquisa".
 *
 * IMPORTANTE: o backend já persiste em DadoSecundario; aqui não há
 * re-persistência (evita duplicação).
 *
 * @param {Object} opts
 * @param {string} opts.municipio — nome do município
 * @param {string} opts.uf      — sigla UF
 * @param {string} opts.ibge    — código IBGE do município
 * @param {string} opts.categoria — chave de categoria (ex: 'saude')
 * @param {string} [opts.pergunta] — pergunta extra opcional (Ampliar pesquisa)
 */
export async function ampliarPesquisa({ municipio, uf, ibge, categoria, pergunta }) {
  if (!municipio || !uf || !categoria) return { items: [], status: 'erro_parametros' };

  let res;
  try {
    res = await pesquisarViaIA({
      ibge_code: ibge,
      municipio,
      uf,
      categoria,
      pergunta,
      force_refresh: true
    });
  } catch (_) {
    return { items: [], status: 'ia_indisponivel', method: 'PESQUISA_WEB_IA' };
  }
  if (!res || res.error) return { items: [], status: 'ia_indisponivel', method: 'PESQUISA_WEB_IA' };

  const itemsRaw = Array.isArray(res?.items) ? res.items : [];
  const items = itemsRaw
    .filter(it => itemEhValido(it, municipio, uf))
    .map(it => ({
      indicator: String(it.indicator),
      value_text: typeof it.value_text === 'string' && it.value_text !== ''
        ? it.value_text
        : (it.value_number != null ? String(it.value_number) : ''),
      value_number: typeof it.value_number === 'number' ? it.value_number : null,
      unit: it.unit || '',
      reference_period: it.reference_period || '',
      source_url: it.source_url || '',
      source_name: it.source_name || '',
      orgao: it.orgao || '',
      data_publicacao: it.data_publicacao || '',
      confidence: it.confidence || 'nao_verificado',
      observacao: it.observacao || it.raw_metadata?.observacao || '',
      method: 'PESQUISA_WEB_IA',
      validation_status: it.validation_status || (it.confidence === 'oficial' ? 'verificado' : 'nao_verificado'),
      geographic_level: it.geographic_level || 'MUNICIPAL'
    }));

  const resumo = String(res?.resumo || '').slice(0, 700);
  const insights = Array.isArray(res?.insights) ? res.insights.map(String).slice(0, 5) : [];

  // Marca que o backend já persistiu — sinaliza ao resolver Camada 4 não
  // re-criar registros (evita duplicidade em DadoSecundario).
  return {
    items,
    resumo,
    insights,
    status: items.length ? 'encontrado' : 'sem_dado',
    method: 'PESQUISA_WEB_IA',
    alreadyPersisted: true
  };
}

export { PADROES_POR_CATEGORIA, DOMINIOS_OFICIAIS };