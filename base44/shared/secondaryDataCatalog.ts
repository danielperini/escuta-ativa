// =====================================================================
//  secondaryDataCatalog.ts
//  CATALOGO DEFINITIVO DE FONTES PUBLICAS — societa.ai
//
//  Toda fonte publica usada pelo Motor de Dados Secundarios esta
//  registrada aqui. Nao ha catalogo paralelo em nenhum outro arquivo.
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
//  Cadencia (spec §3) — TTL em dias para cache fresco:
//      1=diario (INPE queimadas), 7=semanal (SICONFI, TSE, IBAMA),
//      30=mensal (MDS, ANATEL), 365=nova publicacao (INEP, SINISA).
//
//  Status (spec §4) — mapeado para FonteDados.status:
//      ATIVA, DEGRADED, AUTH_REQUIRED, NO_COVERAGE,
//      TEMP_UNAVAILABLE, INVALID_SCHEMA, DISCONTINUED.
//  Para retrocompat, valores legados preservados no enum da entidade.
// =====================================================================

// Municipio amostra — Belo Horizonte / MG (IBGE 3106200)
export const SAMPLE_MUN = { nome: 'Belo Horizonte', uf: 'MG', ibge: '3106200' };

export const CATALOG = [
  // ── Estruturadas (API / DOWNLOAD) ────────────────────────────────
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
    source_id: 'IBGE_SIDRA',
    source_name: 'IBGE/SIDRA — Tabelas estatisticas',
    category: 'demografia',
    method: 'API',
    cadence_days: 30,
    requires_auth: false,
    endpoint: 'https://sidra.ibge.gov.br/api/values',
    test_url: 'https://sidra.ibge.gov.br/api/v1/pesquisas/1/periodos',
    active: true,
    descricao: 'Tabelas agregadas (Censo, estimativas populacionais).'
  },
  {
    source_id: 'DATASUS_DEMAS',
    source_name: 'DATASUS/DEMAS — Indicadores de saude',
    category: 'saude',
    method: 'API',
    cadence_days: 1,
    requires_auth: false,
    endpoint: 'http://tabnet.datasus.gov.br',
    test_url: 'http://tabnet.datasus.gov.br/cgi/datasus/tabcgi.exe?smu/M-municipio.def',
    active: true,
    descricao: 'TabNet DATASUS — mortalidade, morbidade, cobertura.'
  },
  {
    source_id: 'CNES',
    source_name: 'CNES — Cadastro Nacional de Estabelecimentos de Saude',
    category: 'saude',
    method: 'API',
    cadence_days: 7,
    requires_auth: false,
    endpoint: 'http://tabnet.datasus.gov.br/cgi/cnes',
    test_url: 'http://cnes2.datasus.gov.br/Mod_Ind_Unidade.asp?V_Cod_Municipio=310620',
    active: true,
    descricao: 'Estabelecimentos de saude por municipio.'
  },
  {
    source_id: 'INEP_CENSO_ESCOLAR',
    source_name: 'INEP — Censo Escolar / IDEB',
    category: 'educacao',
    method: 'DOWNLOAD',
    cadence_days: 365,
    requires_auth: false,
    endpoint: 'https://www.gov.br/inep/pt-br/areas-de-atuacao/pesquisas-educacionais',
    active: true,
    descricao: 'Microdados anuais — so reimportar em nova publicacao.'
  },
  {
    source_id: 'MDS',
    source_name: 'MDS — Bolsa Familia / BPC / CadUnico',
    category: 'assistencia_vulnerabilidade',
    method: 'API',
    cadence_days: 30,
    requires_auth: false,
    endpoint: 'https://aplicacoes.mds.gov.br/sagi',
    test_url: 'https://aplicacoes.mds.gov.br/sagi/sagi/dados/microdados_beneficios_cidadao.php',
    active: true,
    descricao: 'Indicadores socioassistenciais e transferencia de renda.'
  },
  {
    source_id: 'PORTAL_TRANSPARENCIA',
    source_name: 'Portal da Transparencia (CGU)',
    category: 'fiscal',
    method: 'API',
    cadence_days: 30,
    requires_auth: true,
    auth_secret: 'PORTAL_TRANSPARENCIA_CHAVE',
    endpoint: 'https://api.portaldatransparencia.gov.br/api-de-dados',
    test_url: 'https://api.portaldatransparencia.gov.br/api-de-dados/orgaos-siafi?codigoSiafi=72053&pagina=1',
    active: true,
    descricao: 'Despesas, convenios, servidores — exige chave-api-dados.'
  },
  {
    source_id: 'SICONFI',
    source_name: 'SICONFI — Tesouro Nacional (RGF/RREO/LOA)',
    category: 'fiscal',
    method: 'API',
    cadence_days: 7,
    requires_auth: false,
    endpoint: 'https://apidatalake.tesouro.gov.br/ords/siconfi',
    test_url: `https://apidatalake.tesouro.gov.br/ords/siconfi/api/rgf?an_exercicio=2023&id_ente=${SAMPLE_MUN.ibge}`,
    active: true,
    descricao: 'Contas municipais, receitas e despesas.'
  },
  {
    source_id: 'TSE',
    source_name: 'TSE — Resultados e candidaturas',
    category: 'camara_municipal',
    method: 'API',
    cadence_days: 7,
    requires_auth: false,
    endpoint: 'https://resultados.tse.jus.br',
    test_url: 'https://resultados.tse.jus.br/oficial/api/eleicao/2022/2022/federal/br',
    active: true,
    descricao: 'Aumentar cadencia em periodo eleitoral.'
  },
  {
    source_id: 'MAPA_OSC_IPEA',
    source_name: 'Mapa das OSCs (IPEA)',
    category: 'osc',
    method: 'API',
    cadence_days: 30,
    requires_auth: false,
    endpoint: 'https://mapaosc.ipea.gov.br/api',
    test_url: 'https://mapaosc.ipea.gov.br/api/v1/osc?uf=MG&pagina=1',
    active: true,
    descricao: 'OSCs e parcerias por municipio.'
  },
  {
    source_id: 'NOVO_CAGED',
    source_name: 'Novo CAGED — Ministerio do Trabalho',
    category: 'economia',
    method: 'API',
    cadence_days: 30,
    requires_auth: false,
    endpoint: 'https://portal.mte.gov.br/novo-caged',
    test_url: 'https://portal.mte.gov.br/novo-caged',
    active: true,
    descricao: 'Admissoes/demissoes por municipio — microdados mensais.'
  },
  {
    source_id: 'SINISA',
    source_name: 'SINISA — Sistema Nacional de Informacoes de Saneamento',
    category: 'saneamento',
    method: 'DOWNLOAD',
    cadence_days: 365,
    requires_auth: false,
    endpoint: 'https://www.gov.br/mdr/pt-br/assuntos/saneamento/snis/sinisa',
    active: true,
    descricao: 'Indicadores de agua/esgoto/drenagem por municipio.'
  },
  {
    source_id: 'ANM_SIGMINE',
    source_name: 'ANM — SIGMINE (processos minerarios)',
    category: 'mineracao',
    method: 'GEOSPATIAL',
    cadence_days: 7,
    requires_auth: false,
    endpoint: 'https://app.anm.gov.br/SIGMINE',
    test_url: 'https://app.anm.gov.br/SIGMINE/Mapa.aspx',
    active: true,
    descricao: 'Processos minerarios por coordenada ou poligono.'
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
  },
  {
    source_id: 'ANA_SNIRH',
    source_name: 'ANA — SNIRH / HidroWeb',
    category: 'agua_recursos_hidricos',
    method: 'GEOSPATIAL',
    cadence_days: 30,
    requires_auth: false,
    endpoint: 'https://www.snirh.gov.br/hidroweb',
    test_url: 'https://www.snirh.gov.br/hidroweb/rest/api/estacoes',
    active: true,
    descricao: 'Estacoes, vazoes, precipitacao — validadas por coordenada.'
  },
  {
    source_id: 'IBAMA',
    source_name: 'IBAMA — Autuacoes e licenciamento',
    category: 'meio_ambiente',
    method: 'API',
    cadence_days: 7,
    requires_auth: false,
    endpoint: 'https://servicos.ibama.gov.br/consultas',
    test_url: 'https://servicos.ibama.gov.br/consultas',
    active: true,
    descricao: 'Autuacoes ambientais por municipio.'
  },
  {
    source_id: 'ICMBIO_CNUC',
    source_name: 'ICMBio — CNUC (Unidades de Conservacao)',
    category: 'meio_ambiente',
    method: 'GEOSPATIAL',
    cadence_days: 30,
    requires_auth: false,
    endpoint: 'https://www.gov.br/icmbio/pt-br/assuntos/biodiversidade/unidade-de-conservacao',
    active: true,
    descricao: 'Poligonos de UC — cruzamento por coordenada da comunidade.'
  },
  {
    source_id: 'INPE_QUEIMADAS',
    source_name: 'INPE — Programa Queimadas',
    category: 'meio_ambiente',
    method: 'API',
    cadence_days: 1,
    requires_auth: false,
    endpoint: 'https://queimadas.dgi.inpe.br/queimadas',
    test_url: 'https://queimadas.dgi.inpe.br/queimadas/apidados/1.0/estados/historico_focos_mensal/2024',
    active: true,
    descricao: 'Focos de queimada por municipio — diario.'
  },
  {
    source_id: 'TRANSFEREGOV',
    source_name: 'Transferegov — Convenios e transferencias',
    category: 'politicas_publicas',
    method: 'API',
    cadence_days: 7,
    requires_auth: false,
    endpoint: 'https://www.transferegov.sistema.gov.br',
    test_url: 'https://www.transferegov.sistema.gov.br',
    active: true,
    descricao: 'Parcerias e convenios municipais.'
  },
  {
    source_id: 'FJP_IMRS',
    source_name: 'FJP — Indice Mineiro de Responsabilidade Social',
    category: 'resumo',
    method: 'API',
    cadence_days: 30,
    requires_auth: false,
    endpoint: 'https://imrs.fjp.mg.gov.br',
    test_url: 'https://imrs.fjp.mg.gov.br',
    active: true,
    descricao: 'Apenas municipios de Minas Gerais (31xxxx).'
  },

  // ── Pesquisa documental via WEB_OFFICIAL_AI (GPT localiza, fonte prova) ──
  {
    source_id: 'PREFEITURA',
    source_name: 'Prefeitura Municipal (site oficial)',
    category: 'governo_municipal',
    method: 'WEB_OFFICIAL_AI',
    cadence_days: 30,
    requires_auth: false,
    endpoint: 'prefeituras.municipal.gov.br',
    active: true,
    descricao: 'Prefeito, secretarias, programas, planos, diarios — IA localiza.'
  },
  {
    source_id: 'CAMARA_MUNICIPAL',
    source_name: 'Camara Municipal (site oficial)',
    category: 'camara_municipal',
    method: 'WEB_OFFICIAL_AI',
    cadence_days: 30,
    requires_auth: false,
    endpoint: 'camaras.municipal.gov.br / sapl',
    active: true,
    descricao: 'Vereadores, mesa diretora, proposicoes — IA localiza.'
  },
  {
    source_id: 'CONSELHOS_MUNICIPAIS',
    source_name: 'Conselhos municipais (atos de nomeacao)',
    category: 'conselhos',
    method: 'WEB_OFFICIAL_AI',
    cadence_days: 30,
    requires_auth: false,
    endpoint: 'diario oficial / prefeituras',
    active: true,
    descricao: 'Composicao e atas de conselhos municipais.'
  },
  {
    source_id: 'DIARIO_OFICIAL',
    source_name: 'Diario Oficial municipal / estadual',
    category: 'legislacao',
    method: 'WEB_OFFICIAL_AI',
    cadence_days: 30,
    requires_auth: false,
    endpoint: 'diario oficial eletronico',
    active: true,
    descricao: 'Atos normativos e publicacoes oficiais.'
  },
  {
    source_id: 'POLITICAS_PUBLICAS',
    source_name: 'Politicas publicas e planos municipais',
    category: 'politicas_publicas',
    method: 'WEB_OFFICIAL_AI',
    cadence_days: 30,
    requires_auth: false,
    endpoint: 'planos diretores / documentos oficiais',
    active: true,
    descricao: 'PMHIS, PMSB, plano diretor — IA localiza o documento.'
  },
  {
    source_id: 'AUDIENCIAS_PUBLICAS',
    source_name: 'Audiencias e consultas publicas',
    category: 'politicas_publicas',
    method: 'WEB_OFFICIAL_AI',
    cadence_days: 30,
    requires_auth: false,
    endpoint: 'audiencias publicas municipais',
    active: true,
    descricao: 'Editais e atas — transparencia passiva.'
  },
  {
    source_id: 'LEGISLACAO_MUNICIPAL',
    source_name: 'Legislacao municipal (leis complementares/ordinarias)',
    category: 'legislacao',
    method: 'WEB_OFFICIAL_AI',
    cadence_days: 30,
    requires_auth: false,
    endpoint: 'lei municipal',
    active: true,
    descricao: 'Leis especificas, planos, programas de governo.'
  },
  {
    source_id: 'ASSISTENCIA_VULNERABILIDADE',
    source_name: 'Assistencia Social e Vulnerabilidade (CRAS/CREAS)',
    category: 'assistencia_vulnerabilidade',
    method: 'WEB_OFFICIAL_AI',
    cadence_days: 30,
    requires_auth: false,
    endpoint: 'CRAS/CREAS / SUAS / Diario',
    active: true,
    descricao: 'Servicos socioassistenciais e Censo SUAS.'
  },

  // ── Fontes planejadas ativadas (spec §2) ─────────────────────────
  {
    source_id: 'MAPBIOMAS',
    source_name: 'MapBiomas — Uso e cobertura do solo',
    category: 'meio_ambiente',
    method: 'GEOSPATIAL',
    cadence_days: 30,
    requires_auth: false,
    endpoint: 'https://mapbiomas.org',
    test_url: 'https://api.mapbiomas.org/api/v1/coverage',
    active: true,
    descricao: 'Uso do solo e mudanças por município — cruzamento por coordenada.'
  },
  {
    source_id: 'INMET',
    source_name: 'INMET — Meteorologia (estações automáticas)',
    category: 'meio_ambiente',
    method: 'API',
    cadence_days: 1,
    requires_auth: false,
    endpoint: 'https://api.inmet.gov.br',
    test_url: 'https://api.inmet.gov.br/estacoes/T',
    active: true,
    descricao: 'Precipitação, temperatura e clima por estação.'
  },
  {
    source_id: 'CAMARA_DEPUTADOS',
    source_name: 'Câmara dos Deputados — Dados Abertos',
    category: 'legislacao',
    method: 'API',
    cadence_days: 7,
    requires_auth: false,
    endpoint: 'https://dadosabertos.camara.leg.br/api/v2',
    test_url: 'https://dadosabertos.camara.leg.br/api/v2/deputados',
    active: true,
    descricao: 'Proposições, parlamentares e tramitações federais.'
  },
  {
    source_id: 'SENADO_FEDERAL',
    source_name: 'Senado Federal — Dados Abertos',
    category: 'legislacao',
    method: 'API',
    cadence_days: 7,
    requires_auth: false,
    endpoint: 'https://legis.senado.leg.br/dadosabertos',
    test_url: 'https://legis.senado.leg.br/dadosabertos/senador/lista/atual',
    active: true,
    descricao: 'Matérias, senadores e comissões federais.'
  },
  {
    source_id: 'OSM_OVERPASS',
    source_name: 'OpenStreetMap / Overpass (equipamentos)',
    category: 'meio_ambiente',
    method: 'GEOSPATIAL',
    cadence_days: 30,
    requires_auth: false,
    endpoint: 'https://overpass-api.de/api/interpreter',
    test_url: 'https://overpass-api.de/api/interpreter',
    active: true,
    descricao: 'Equipamentos, infraestrutura e feições por coordenada da comunidade.'
  },
  {
    source_id: 'OUTRAS_FONTES_PUBLICAS',
    source_name: 'Outras fontes públicas (pesquisa assistida)',
    category: 'resumo',
    method: 'WEB_OFFICIAL_AI',
    cadence_days: 30,
    requires_auth: false,
    endpoint: ' fontes oficiais variadas',
    active: true,
    descricao: 'Catálogo de fallback — IA localiza fontes oficiais não listadas.'
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