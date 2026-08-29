// ================================================================
//  publicTerritorialDataService.js
//  Camada de serviço central do módulo "Dados Secundários".
//  - Lista de fontes públicas suportadas (registry).
//  - Municípios iniciais (códigos IBGE resolvidos via API).
//  - Helpers de cache (entidade DadoSecundario).
//  - Conector IBGE (reaproveita demografiaApi.js — já validado).
//  - Pesquisa web via IA (função backend pesquisarDadosTerritoriais).
// ================================================================

import { base44 } from '@/api/base44Client';
import {
  obterPopulacao, obterAreaDensidade, obterPiramide, obterCorRaca
} from '@/lib/demografiaApi';

// ─── Fontes suportadas (registry) ────────────────────────────────
export const FONTES = [
  { id: 'ibge', nome: 'IBGE (estados/municípios)', categoria: 'demografia', ativo: true },
  { id: 'sidra', nome: 'SIDRA / IBGE (agregados)', categoria: 'demografia', ativo: true },
  { id: 'datasus', nome: 'DATASUS / DEMAS', categoria: 'saude', ativo: false },
  { id: 'cnes', nome: 'CNES (cadastro saúde)', categoria: 'saude', ativo: false },
  { id: 'siconfi', nome: 'SICONFI / Tesouro Nacional', categoria: 'fiscal', ativo: false },
  { id: 'inep', nome: 'INEP (Censo Escolar, IDEB)', categoria: 'educacao', ativo: false },
  { id: 'transparencia', nome: 'Portal da Transparência / CGU', categoria: 'social', ativo: false },
  { id: 'bolsa_familia', nome: 'Bolsa Família', categoria: 'social', ativo: false },
  { id: 'bpc', nome: 'BPC / Loas', categoria: 'social', ativo: false },
  { id: 'tse', nome: 'TSE (resultados eleitorais)', categoria: 'governo_municipal', ativo: false },
  { id: 'anm', nome: 'ANM (processos minerários)', categoria: 'mineracao', ativo: false },
  { id: 'ana', nome: 'ANA (recursos hídricos)', categoria: 'meio_ambiente', ativo: false },
  { id: 'snis', nome: 'SNIS / SINISA (saneamento)', categoria: 'saneamento', ativo: false },
  { id: 'mapbiomas', nome: 'MapBiomas (uso do solo)', categoria: 'meio_ambiente', ativo: false },
  { id: 'inpe', nome: 'INPE (queimadas/desmatamento)', categoria: 'meio_ambiente', ativo: false },
  { id: 'inmet', nome: 'INMET (meteorologia)', categoria: 'meio_ambiente', ativo: false },
  { id: 'ibama', nome: 'IBAMA', categoria: 'meio_ambiente', ativo: false },
  { id: 'icmbio', nome: 'ICMBio / CNUC', categoria: 'meio_ambiente', ativo: false },
  { id: 'transferegov', nome: 'Transferegov (convênios)', categoria: 'politicas_publicas', ativo: false },
  { id: 'camara_deputados', nome: 'Câmara dos Deputados', categoria: 'legislacao', ativo: false },
  { id: 'senado', nome: 'Senado Federal', categoria: 'legislacao', ativo: false },
  { id: 'dou_municipal', nome: 'Diário Oficial Municipal', categoria: 'legislacao', ativo: false },
  { id: 'prefeitura', nome: 'Prefeitura Municipal', categoria: 'governo_municipal', ativo: true },
  { id: 'camara_municipal', nome: 'Câmara Municipal', categoria: 'camara_municipal', ativo: true },
  { id: 'conselhos_municipais', nome: 'Conselhos Municipais', categoria: 'conselhos', ativo: true },
  { id: 'mapa_osc', nome: 'Mapa das OSCs / IPEA', categoria: 'osc', ativo: false },
  { id: 'osm', nome: 'OpenStreetMap / Overpass', categoria: 'outros', ativo: false },
  { id: 'outras', nome: 'Outras fontes públicas', categoria: 'outros', ativo: false }
];

// ─── Municípios iniciais (códigos IBGE resolvidos em runtime) ───
export const MUNICIPIOS_INICIAIS = [
  { nome: 'Matozinhos', uf: 'MG' },
  { nome: 'Sete Lagoas', uf: 'MG' },
  { nome: 'Arcos', uf: 'MG' },
  { nome: 'Cataguases', uf: 'MG' },
  { nome: 'Recife', uf: 'PE' },
  { nome: 'Belo Horizonte', uf: 'MG' },
  { nome: 'Colatina', uf: 'ES' },
  { nome: 'São Francisco do Sul', uf: 'SC' }
];

const IBGE_LOC = 'https://servicodados.ibge.gov.br/api/v1/localidades';

async function fetchJsonLocalidades(url, timeout = 12000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: { Accept: 'application/json' } });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

// Resolve UF (sigla) → ID IBGE numérico (N3)
async function obterEstadoIdPorSigla(sigla) {
  const ests = await fetchJsonLocalidades(`${IBGE_LOC}/estados/${sigla}`);
  return ests?.id || null;
}

// Resolve nome+municipio dentro de UF → código IBGE (N6)
export async function resolverCodigoIBGE(nome, ufSigla) {
  try {
    const muns = await fetchJsonLocalidades(`${IBGE_LOC}/estados/${ufSigla}/municipios`);
    const nomeNorm = nome.trim().toLowerCase();
    const m = (muns || []).find(x => x.nome.toLowerCase() === nomeNorm);
    return m ? { id: String(m.id), nome: m.nome, uf: ufSigla, lat: null, lng: null } : null;
  } catch (_) { return null; }
}

// Lista municípios cadastrados (Junta MUNICIPIOS_INICIAIS resolvidos + municípios da
// entidade Comunidade, sem duplicar). Returns [{nome, uf, ibge_code}].
export async function listarMunicipiosDisponiveis() {
  const iniciais = MUNICIPIOS_INICIAIS.slice();
  let cadastrados = [];
  try {
    const comuns = await base44.entities.Comunidade.list('-created_date', 200);
    const porNomeUf = {};
    for (const c of comuns || []) {
      if (!c.municipio) continue;
      const chave = `${c.municipio}/${c.estado || c.uf || ''}`.toUpperCase();
      if (!porNomeUf[chave]) porNomeUf[chave] = { nome: c.municipio, uf: c.estado || '' };
    }
    cadastrados = Object.values(porNomeUf);
  } catch (_) {}
  // Merge sem duplicar (por nome+uf)
  const merged = [...iniciais];
  const keys = new Set(iniciais.map(m => `${m.nome}|${m.uf}`));
  for (const c of cadastrados) {
    const k = `${c.nome}|${c.uf}`;
    if (!keys.has(k)) { keys.add(k); merged.push(c); }
  }
  return merged;
}

// Lista comunidades cadastradas (por nome) — para o autocomplete
export async function listarComunidadesCadastradas() {
  try {
    const lista = await base44.entities.Comunidade.list('-created_date', 200);
    return (lista || []).map(c => ({
      id: c.id,
      nome: c.nome,
      municipio: c.municipio,
      uf: c.estado || '',
      populacao_estimada: c.populacao_estimada,
      tipo: c.tipo
    }));
  } catch (_) { return []; }
}

// ─── Cache DadoSecundario ────────────────────────────────────────
export async function buscarDadosCache(ibgeCode, categoria) {
  try {
    return await base44.entities.DadoSecundario.filter({
      municipality_ibge_code: ibgeCode,
      category: categoria
    }, '-updated_date', 100);
  } catch (_) { return []; }
}

export async function buscarTodosCaches(ibgeCodes, categoria) {
  const out = {};
  await Promise.all((ibgeCodes || []).map(async (cod) => {
    out[cod] = await buscarDadosCache(cod, categoria);
  }));
  return out;
}

// ─── Pesquisa web via IA (backend) ────────────────────────────────
// Política: uma vez coletado, o cache DadoSecundario é reutilizado por 30 dias.
// Para forçar nova coleta (admin), passe { force_refresh: true }.
export async function pesquisarViaIA({ ibge_code, municipio, uf, categoria, fontes, pergunta, force_refresh }) {
  const res = await base44.functions.invoke('pesquisarDadosTerritoriais', {
    ibge_code,
    municipio,
    uf,
    categoria,
    fontes,
    pergunta,
    force_refresh: !!force_refresh
  });
  return res?.data ?? res;
}

// ─── Conector IBGE (reaproveita demografiaApi.js) ─────────────────
// demografiaApi usa ufId (N3) e munId (N6). Para o conector IBGE
// global, aceitamos apenas o código IBGE do MUNICÍPIO (N6) e a UF.
export async function coletarDemografiaIBGE(ibgeCode, ufSigla) {
  // ufId precisa ser o N3 (estado). Resolvemos via locais:
  let ufId = null;
  try {
    const ests = await fetchJsonLocalidades(`${IBGE_LOC}/estados`);
    const est = (ests || []).find(e => e.sigla === ufSigla);
    ufId = est ? String(est.id) : null;
  } catch (_) {}
  if (!ufId) return { error: 'Não foi possível resolver a UF do estado.' };
  const munId = String(ibgeCode); // N6
  // Coleta com demografiaApi
  const [pop, area, piramide, corRaca] = await Promise.allSettled([
    obterPopulacao(ufId, munId),
    obterAreaDensidade(ufId, munId),
    obterPiramide(ufId, munId),
    obterCorRaca(ufId, munId)
  ]);
  return {
    populacao: pop.status === 'fulfilled' ? pop.value : null,
    area_densidade: area.status === 'fulfilled' ? area.value : null,
    piramide: piramide.status === 'fulfilled' ? piramide.value : [],
    cor_raca: corRaca.status === 'fulfilled' ? corRaca.value : [],
    ufId, munId
  };
}

// Persiste items do conector IBGE no cache (DadoSecundario).
export async function registrarDemografiaEmCache(ibgeCode, municipio, uf, dadosDemografia) {
  const now = new Date().toISOString();
  const base = { municipality_ibge_code: ibgeCode, municipality: municipio, state: uf,
                 collected_at: now, updated_at: now, raw_metadata: {} };
  const registros = [];
  const push = (r) => registros.push({ ...base, ...r });
  if (dadosDemografia.populacao != null) {
    push({
      source_id: `IBGE_POP_4709_${ibgeCode}`,
      source_name: 'IBGE/SIDRA — Censo 2022 (agregado 4709)',
      category: 'demografia',
      indicator: 'População total',
      value_number: dadosDemografia.populacao,
      value_text: String(dadosDemografia.populacao),
      unit: 'hab',
      reference_period: '2022',
      source_url: 'https://sidra.ibge.gov.br/tabela/4709',
      orgao: 'IBGE',
      confidence: 'oficial'
    });
  }
  if (dadosDemografia.area_densidade?.densidade != null) {
    push({
      source_id: `IBGE_DENS_1301_${ibgeCode}`,
      source_name: 'IBGE/SIDRA — Censo 2010 (agregado 1301)',
      category: 'demografia',
      indicator: 'Densidade demográfica',
      value_number: dadosDemografia.area_densidade.densidade,
      value_text: String(dadosDemografia.area_densidade.densidade),
      unit: 'hab/km²',
      reference_period: '2010',
      source_url: 'https://sidra.ibge.gov.br/tabela/1301',
      orgao: 'IBGE',
      confidence: 'oficial'
    });
  }
  if (dadosDemografia.area_densidade?.area != null) {
    push({
      source_id: `IBGE_AREA_1301_${ibgeCode}`,
      source_name: 'IBGE/SIDRA — Censo 2010',
      category: 'demografia',
      indicator: 'Área total',
      value_number: dadosDemografia.area_densidade.area,
      value_text: String(dadosDemografia.area_densidade.area),
      unit: 'km²',
      reference_period: '2010',
      source_url: 'https://sidra.ibge.gov.br/tabela/1301',
      orgao: 'IBGE',
      confidence: 'oficial'
    });
  }
  if (!registros.length) return [];
  try {
    return await base44.entities.DadoSecundario.bulkCreate(registros);
  } catch (_) { return []; }
}