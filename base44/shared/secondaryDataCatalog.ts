// =====================================================================
//  secondaryDataCatalog.ts
//  CATALOGO DEFINITIVO DE FONTES PUBLICAS — societa.ai
//
//  Toda fonte publica usada pelo Motor de Dados Secundarios esta
//  registrada aqui. Nao ha catalogo paralelo em nenhum outro arquivo.
//
//  Fontes planejadas que NAO serao ativadas agora foram removidas.
//  Apenas fontes ativas e validadas permanecem neste catalogo.
//
//  Classificacao (spec §2):
//    API          — endpoint HTTP estruturado, consulta sob demanda.
//    DOWNLOAD     — base oficial baixada periodicamente, importada e
//                   consultada localmente (sinonimo de CACHE).
//    GEOSPATIAL   — dado geografico (pontos/poligonos) cruzado por
//                   coordenada da comunidade.
//    WEB_OFFICIAL_AI — GPT localiza fonte/documento oficial; a FONTE
//                   (nunca "GPT") fornece a evidencia.
//
//  Status (spec §4) — mapeado para FonteDados.status:
//      ATIVA, DEGRADED, AUTH_REQUIRED, NO_COVERAGE,
//      TEMP_UNAVAILABLE, INVALID_SCHEMA, DISCONTINUED.
// =====================================================================

// Municipio amostra — Belo Horizonte / MG (IBGE 3106200)
export const SAMPLE_MUN = { nome: 'Belo Horizonte', uf: 'MG', ibge: '3106200' };

export const CATALOG = [
  // ── Estruturadas (API / GEOSPATIAL) ──────────────────────────────
  {
    source_id: 'IBGE_LOCALIDADES',
    source_name: 'IBGE — Localidades / municipios',
    category: 'demografia',
    method: 'API',
    cadence_days: 30,
    requires_auth: false,
    endpoint: 'https://servicodados.ibge.gov.br/api/v1/localidades',
    test_url: `https://servicodados.ibge.gov.br/api/v1/localidades/municipios/${SAMPLE_MUN.ibge}`,
    active: true,
    descricao: 'Catalogo de municipios e divisao territorial IBGE.'
  },
  {
    source_id: 'ANATEL',
    source_name: 'ANATEL — Painel de Cobertura Mov',
    category: 'telecomunicacoes',
    method: 'API',
    cadence_days: 30,
    requires_auth: false,
    endpoint: 'https://www.anatel.gov.br/dados/',
    test_url: 'https://www.anatel.gov.br/dados/',
    active: true,
    descricao: 'Cobertura 2G/3G/4G/5G por operadora/municipio.'
  }
];

// Mapeamento metodo → status inicial presumido quando houver erro HTTP
export function statusFromHttp(http_status) {
  if (http_status == null) return 'TEMP_UNAVAILABLE';
  if (http_status === 401 || http_status === 403) return 'AUTH_REQUIRED';
  if (http_status === 404) return 'NO_COVERAGE';
  if (http_status >= 500) return 'TEMP_UNAVAILABLE';
  if (http_status >= 400) return 'INVALID_SCHEMA';
  return 'ATIVA';
}

// Todas as categorias suportadas pelo catalogo
export const CATEGORY_IDS = Array.from(new Set(CATALOG.map((s) => s.category)));

// Filtra fontes ativas por categoria (para o pipeline de coleta)
export function sourcesByCategory(cat) {
  return CATALOG.filter((s) => s.active && s.category === cat);
}

// Mapa source_id → source (para health check e lookup)
export const SOURCE_MAP = CATALOG.reduce((acc, s) => {
  acc[s.source_id] = s;
  return acc;
}, {});