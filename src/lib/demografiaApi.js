// ================================================================
//  demografiaApi.js
//  Helpers para consultas às APIs públicas brasileiras:
//   • IBGE Localidades (estados e municípios)
//   • IBGE SIDRA / Agregados v3 (população, pirâmide, cor/raça, área)
//   • Ipeadata (via função backend — CORS bloqueado no navegador)
//
//  Agregados confirmados (verificados em 29/08/2026):
//    4709 → População total (Censo 2022)            nivel N3, N6
//    1301 → Área total + Densidade (Censo 2010)     nivel N3, N6
//    9514 → População por sexo e idade (2022)       nivel N3, N6  classif. Sexo[2], Idade[287]
//    9605 → População por cor ou raça (2010 e 2022) nivel N3, N6  classif. Cor[86]
// ================================================================

import { base44 } from '@/api/base44Client';

const IBGE_LOC = 'https://servicodados.ibge.gov.br/api/v1/localidades';
const IBGE_AGR = 'https://servicodados.ibge.gov.br/api/v3/agregados';

// Faixas etárias nível 1 do agregado 9514 (id → label curto para o gráfico)
export const FAIXAS_ETARIAS_IDS = [
  '93070','93084','93085','93086','93087','93088','93089',
  '93090','93091','93092','93093','93094','93095','93096',
  '93097','93098','49108','49109','60040','60041','6653'
];
export const FAIXAS_ETARIAS_LABELS = [
  '0-4','5-9','10-14','15-19','20-24','25-29','30-34',
  '35-39','40-44','45-49','50-54','55-59','60-64','65-69',
  '70-74','75-79','80-84','85-89','90-94','95-99','100+'
];

// Mapeamento de categoria cor/raça → rótulo + cor da fatia
export const RACA_NOMES = {
  '2776': 'Branca', '2777': 'Preta', '2778': 'Amarela',
  '2779': 'Parda', '2780': 'Indígena'
};
export const RACA_CORES = {
  '2776': '#F5F5DC', '2777': '#3D3D3D', '2778': '#F4D03F',
  '2779': '#8B5A2B', '2780': '#2E8B57'
};

// ─── Utilitário de fetch com timeout ─────────────────────────────
async function fetchJson(url, timeout = 20000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

// ─── 1) Lista de Unidades da Federação ────────────────────────────
export async function listarEstados() {
  const data = await fetchJson(`${IBGE_LOC}/estados?orderBy=nome`);
  return (data || []).map(e => ({ id: e.id, sigla: e.sigla, nome: e.nome }));
}

// ─── 2) Municípios de um Estado (sigla) ──────────────────────────
export async function listarMunicipios(ufSigla) {
  const data = await fetchJson(`${IBGE_LOC}/estados/${ufSigla}/municipios?orderBy=nome`);
  return (data || []).map(m => ({ id: m.id, nome: m.nome }));
}

// N3 (estado) quando sem município, senão N6 (município)
function localidade(ufId, munId) {
  return munId ? `N6[${munId}]` : `N3[${ufId}]`;
}

// Pega o primeiro valor de `serie` (dicionário período → valor) — lida com
// períodos dinâmicos que variam entre agregados (ex.: 2022, 2010, etc.).
function pegarValor(series) {
  const s = series?.[0]?.serie || {};
  const chaves = Object.keys(s);
  return chaves.length ? Number(s[chaves[0]]) : 0;
}

// ─── 3) População total (Censo 2022) ─────────────────────────────
export async function obterPopulacao(ufId, munId) {
  const url = `${IBGE_AGR}/4709/periodos/last/variaveis?localidades=${localidade(ufId, munId)}`;
  const data = await fetchJson(url);
  return pegarValor(data?.[0]?.resultados?.[0]?.series);
}

// ─── 4) Área total + densidade demográfica (Censo 2010) ─────────
export async function obterAreaDensidade(ufId, munId) {
  const url = `${IBGE_AGR}/1301/periodos/last/variaveis?localidades=${localidade(ufId, munId)}`;
  const data = await fetchJson(url);
  let area = null;
  let densidade = null;
  for (const v of data || []) {
    const s = v?.resultados?.[0]?.series?.[0]?.serie || {};
    const ano = Object.keys(s)[0];
    if (!ano) continue;
    if (v.id === '615') area = Number(s[ano]);
    else if (v.id === '616') densidade = Number(s[ano]);
  }
  // Caso a densidade não venha da API, calculamos a partir da população
  if (densidade === null && area !== null && area > 0) {
    const pop = await obterPopulacao(ufId, munId);
    densidade = pop / area;
  }
  return { area, densidade };
}

// ─── 5) Pirâmide etária por sexo e faixa etária (Censo 2022) ──
export async function obterPiramide(ufId, munId) {
  const ids = FAIXAS_ETARIAS_IDS.join(',');
  const url = `${IBGE_AGR}/9514/periodos/last/variaveis?localidades=${localidade(ufId, munId)}` +
              `&classificacao=2[4,5]|287[${ids}]`;
  const data = await fetchJson(url, 25000);
  const resultados = data?.[0]?.resultados || [];
  const rows = [];
  for (const r of resultados) {
    const cats = r.classificacoes || [];
    const catSexo = cats.find(c => c.id === '2')?.categoria || {};
    const catIdade = cats.find(c => c.id === '287')?.categoria || {};
    const sexoKey = Object.keys(catSexo)[0];
    const idadeKey = Object.keys(catIdade)[0];
    const serie = r.series?.[0]?.serie || {};
    const ano = Object.keys(serie)[0];
    rows.push({
      sexo: catSexo[sexoKey],         // "Homens" | "Mulheres"
      faixa: catIdade[idadeKey],      // "0 a 4 anos", ...
      faixa_index: FAIXAS_ETARIAS_IDS.indexOf(idadeKey),
      valor: Number(serie[ano] || 0)
    });
  }
  // Ordena por faixa etária
  rows.sort((a, b) => a.faixa_index - b.faixa_index);
  return rows;
}

// ─── 6) Distribuição por cor ou raça (Censo 2010 / 2022) ─────
export async function obterCorRaca(ufId, munId, periodo = 'last') {
  const url = `${IBGE_AGR}/9605/periodos/${periodo}/variaveis?localidades=${localidade(ufId, munId)}` +
              `&classificacao=86[all]`;
  const data = await fetchJson(url);
  const out = [];
  for (const r of (data?.[0]?.resultados || [])) {
    const cat = r.classificacoes?.find(c => c.id === '86')?.categoria || {};
    const key = Object.keys(cat)[0];
    if (key === '95251') continue; // categoria "Total" — usamos só as cores
    const serie = r.series?.[0]?.serie || {};
    const ano = Object.keys(serie)[0];
    out.push({
      id: key,
      nome: RACA_NOMES[key] || cat[key],
      valor: Number(serie[ano] || 0),
      ano: ano,
      cor: RACA_CORES[key] || '#888'
    });
  }
  return out;
}

// ─── 7) Histórico Ipeadata (via função backend) ──────────────
// O site do Ipeadata só responde em HTTP e sem cabeçalho CORS,
// por isso chamamos a função backend consultarIpeadata.
export async function obterIpeadata(payload = {}) {
  const res = await base44.functions.invoke('consultarIpeadata', payload);
  return res?.data ?? res;
}