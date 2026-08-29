// =====================================================================
// TourModuleRegistry — fonte ÚNICA de verdade para descrições de módulos.
// Usado por: BotaoTour, TourGuiado, ManualModal, Layout (side panel).
// Nunca duplicar estas descrições em outros componentes.
//
// Estrutura reflete a sidebar reorganizada (Dashboard + 5 grupos colapsáveis):
//   escuta, territorio, relacionamento, esg, sistema
// Módulos fora da sidebar (in_sidebar=false) ainda aparecem no Manual.
// =====================================================================
import {
  LayoutDashboard, FileText, CheckCircle2, CalendarDays, MapPin, Target,
  MessageCircle, Users as UsersIcon, Users, CheckSquare, Home, BarChart3,
  Sparkles, UsersRound, Database, Activity, ShieldCheck, Globe, User, Plug,
  Book, Shield, Palette, Settings
} from 'lucide-react';

export const TOUR_VERSION = 2;

// Grupos colapsáveis da sidebar (ordem real do menu)
export const TOUR_GROUPS = [
  {
    key: 'escuta',
    title: 'Escuta & Registro',
    icon: FileText,
    description: 'Onde a escuta vira registro: interações comunitárias, falas diretas, demandas e casos que rastreiam a devolutiva.',
  },
  {
    key: 'territorio',
    title: 'Território',
    icon: MapPin,
    description: 'Mapas, comunidades e dados secundários que dão contexto geográfico e demográfico ao território.',
  },
  {
    key: 'relacionamento',
    title: 'Relacionamento',
    icon: UsersIcon,
    description: 'Stakeholders, agenda e materialidade — a rede de relacionamento e sua análise ESG.',
  },
  {
    key: 'esg',
    title: 'Relatórios & ESG',
    icon: BarChart3,
    description: 'Geração de relatórios, referenciais ESG, ODS e configuração da estratégia de sustentabilidade.',
  },
  {
    key: 'sistema',
    title: 'Sistema',
    icon: Settings,
    description: 'Administração: equipes, usuários, integrações, fontes de dados, aparência e documentação.',
  },
];

export const TOUR_MODULES = [
  // ===== Top-level =====
  {
    route: 'Dashboard',
    title: 'Dashboard',
    icon: LayoutDashboard,
    sidebar_group: null,
    in_sidebar: true,
    description: 'Visão executiva consolidada com KPIs, tendências, alertas e o Motor Global de Decisões em tempo real.',
    features: [
      'KPIs principais (registros, demandas urgentes, riscos ativos, agendas)',
      'Gráficos de tendências dos últimos 7 dias',
      'Demandas recorrentes por comunidade',
      'Monitor de devolutivas pendentes',
      'Vozes do Território (citações reais e anonimizadas)',
      'Dicas de Relacionamento contextualizadas',
      'Painel de Orientação Territorial com 3 cards diários de IA',
      'Widget Prioridades do Motor — insights automáticos com evidências',
    ],
    manual_section: 'dashboard',
    tour_order: 1,
    enabled: true,
    required_role: null,
  },

  // ===== Grupo: Escuta & Registro =====
  {
    route: 'Registros',
    title: 'Registros',
    icon: FileText,
    sidebar_group: 'escuta',
    in_sidebar: true,
    description: 'Sistema de registro de interações comunitárias com processamento inteligente de áudio, texto e imagens.',
    features: [
      'Registro manual ou com IA assistida',
      'Transcrição automática de áudio/vídeo',
      'Detecção automática de stakeholders, temas e demandas',
      'Geração de ATA com IA',
      'Análise de sentimento e temperatura territorial',
      'Classificação de relacionamento (Comunitário / Institucional)',
      'Vínculo automático com casos e compromissos',
      'Exportação em PDF, XLSX e DOCX',
      'Sistema de códigos únicos (RE-UT-XXXXXX-AAAA)',
    ],
    manual_section: 'registros',
    tour_order: 2,
    enabled: true,
    required_role: null,
  },
  {
    route: 'VozComunidade',
    title: 'Voz da Comunidade',
    icon: MessageCircle,
    sidebar_group: 'escuta',
    in_sidebar: true,
    description: 'Exibição de falas reais e autênticas da comunidade, sem filtros institucionais.',
    features: [
      'Apenas declarações diretas de pessoas (não atas)',
      'Filtro rigoroso: exclui documentos formais e resumos',
      'Exibição literal das transcrições',
      'Contexto: quem disse, localidade, tema, sentimento',
      'Timeline de demandas comunitárias',
      'Temas recorrentes com ranking',
      'Análise de sentimento geral',
    ],
    manual_section: 'voz-comunidade',
    tour_order: 3,
    enabled: true,
    required_role: null,
  },
  {
    route: 'GestorDemandas',
    title: 'Gestão de Demandas',
    icon: CheckCircle2,
    sidebar_group: 'escuta',
    in_sidebar: true,
    description: 'Quadro Kanban para acompanhar todas as demandas da comunidade registradas na plataforma.',
    features: [
      'Visualização em Kanban (pendente, em andamento, atendida, não atendida)',
      'Atribuição de responsáveis',
      'Filtros por urgência, comunidade e tema',
      'Histórico de cada demanda',
      'Estatísticas e indicadores de tempo de resposta',
      'Vínculo com registros e stakeholders',
    ],
    manual_section: 'gestor-demandas',
    tour_order: 4,
    enabled: true,
    required_role: null,
  },
  {
    route: 'Casos',
    title: 'Casos',
    icon: CheckSquare,
    sidebar_group: 'escuta',
    in_sidebar: true,
    description: 'Gestão de situações que exigem devolutiva, acompanhamento ou resolução formal.',
    features: [
      'Criação automática a partir de devolutivas',
      'Consolidação de casos similares (IA detecta duplicatas)',
      'Rastreamento de prazo (padrão 15 dias)',
      'Alertas de atraso automáticos',
      'Histórico de atualizações e evidências',
      'Vínculo com stakeholders e registros',
    ],
    manual_section: 'casos',
    tour_order: 5,
    enabled: true,
    required_role: null,
  },

  // ===== Grupo: Território =====
  {
    route: 'Mapa',
    title: 'Mapa',
    icon: MapPin,
    sidebar_group: 'territorio',
    in_sidebar: true,
    description: 'Visualização geográfica de registros, riscos, stakeholders e temperatura social por localidade.',
    features: [
      'Mapa interativo com Leaflet',
      'Camadas: registros, riscos, stakeholders, comunidades',
      'Heatmap de densidade de interações',
      'Temperatura territorial por comunidade',
      'Filtros por período, tipo, sentimento',
      'Criação de registro diretamente no mapa (clique no local)',
      'Clustering de pontos próximos',
    ],
    manual_section: 'mapa',
    tour_order: 6,
    enabled: true,
    required_role: null,
  },
  {
    route: 'ComunidadesGrupos',
    title: 'Comunidades e Grupos',
    icon: Home,
    sidebar_group: 'territorio',
    in_sidebar: true,
    description: 'Gestão de comunidades territoriais e grupos coletivos (culturais, artísticos, esportivos).',
    features: [
      'Cadastro de comunidades (bairros, vilas, distritos, quilombos, etc.)',
      'Cadastro de grupos coletivos (culturais, artísticos, ambientais)',
      'Termômetro social por comunidade',
      'Total de registros e última interação',
      'População estimada e geolocalização',
      'Vínculo com stakeholders e registros',
    ],
    manual_section: 'comunidades',
    tour_order: 7,
    enabled: true,
    required_role: null,
  },
  {
    route: 'AnaliseDemografica',
    title: 'Análise Demográfica',
    icon: UsersRound,
    sidebar_group: 'territorio',
    in_sidebar: true,
    description: 'Demografia detalhada por município com pirâmide etária e indicadores sociais.',
    features: [
      'Pirâmide etária por município',
      'Distribuição por cor/raça',
      'Indicadores demográficos do IBGE',
      'Comparação entre territórios',
    ],
    manual_section: 'analise-demografica',
    tour_order: 8,
    enabled: true,
    required_role: null,
  },
  {
    route: 'DadosSecundarios',
    title: 'Dados Secundários',
    icon: Database,
    sidebar_group: 'territorio',
    in_sidebar: true,
    description: 'Reúne dados públicos para contextualizar municípios e comunidades.',
    features: [
      'Demografia',
      'Economia',
      'Saúde e Educação',
      'Governo, ambiente, mineração, telecom e água',
      'Fontes oficiais brasileiras (IBGE, ANATEL, etc.)',
      'Respeita o código IBGE como identificador territorial',
    ],
    manual_section: 'dados-secundarios',
    tour_order: 9,
    enabled: true,
    required_role: null,
  },

  // ===== Grupo: Relacionamento =====
  {
    route: 'Stakeholders',
    title: 'Stakeholders',
    icon: UsersIcon,
    sidebar_group: 'relacionamento',
    in_sidebar: true,
    description: 'Gestão inteligente de stakeholders com detecção automática, histórico completo e análise de rede.',
    features: [
      'Cadastro automático a partir de registros',
      'Detecção de duplicatas e conflitos',
      'Perfil completo: contatos, influência, demandas, timeline',
      'Rede de relacionamentos visualizada',
      'Segmentação avançada por temas e localidade',
      'Histórico de auditoria completo (LGPD)',
      'Score de influência calculado automaticamente',
    ],
    manual_section: 'stakeholders',
    tour_order: 10,
    enabled: true,
    required_role: null,
  },
  {
    route: 'MapaStakeholders',
    title: 'Mapa de Stakeholders',
    icon: Users,
    sidebar_group: 'relacionamento',
    in_sidebar: true,
    description: 'Visualização geográfica da rede de stakeholders e suas conexões por localidade.',
    features: [
      'Mapa de stakeholders por localidade',
      'Visualização de conexões e relações',
      'Filtros por influência e engajamento',
      'Cores por nível de influência',
    ],
    manual_section: 'stakeholders',
    tour_order: 11,
    enabled: true,
    required_role: null,
  },
  {
    route: 'Agenda',
    title: 'Agenda',
    icon: CalendarDays,
    sidebar_group: 'relacionamento',
    in_sidebar: true,
    description: 'Gestão de compromissos, reuniões e devolutivas com alertas de atraso.',
    features: [
      'Criação automática de agendas a partir de registros',
      'Detecção de datas futuras mencionadas em conversas',
      'Alertas automáticos de atraso',
      'Vínculo com casos e stakeholders',
      'Status: confirmada, prevista, acordada, realizada',
      'Calendário visual mensal',
      'Exportação de agenda em PDF',
    ],
    manual_section: 'agenda',
    tour_order: 12,
    enabled: true,
    required_role: null,
  },
  {
    route: 'Materialidade',
    title: 'Materialidade',
    icon: Target,
    sidebar_group: 'relacionamento',
    in_sidebar: true,
    description: 'Matriz de macrotemas ESG com classificação visual e cálculo automático de risco social.',
    features: [
      'Matriz de Macrotemas (Ambiental, Social, Governança)',
      'Classificação por cores: vermelho (crítico), amarelo (médio), verde (positivo), branco (ausente)',
      'Drives de avaliação: impacto, diálogo, influência, presença, protestos, confiança',
      'Cálculo automático de Índice de Risco Social (0-100)',
      'Ações sugeridas por IA',
      'Vínculo com stakeholders e localidades',
    ],
    manual_section: 'materialidade',
    tour_order: 13,
    enabled: true,
    required_role: null,
  },

  // ===== Grupo: Relatórios & ESG =====
  {
    route: 'GeradorRelatorioSustentabilidade',
    title: 'Gerador de Relatório',
    icon: Sparkles,
    sidebar_group: 'esg',
    in_sidebar: true,
    description: 'Gera relatórios de sustentabilidade alinhados a GRI, ODS, Pacto Global e ESRS.',
    features: [
      'Seleção de escopo (plataforma, comunidade, território)',
      'Classificação automática de ações sociais',
      'Vinculação GRI, ODS, Pacto Global, ESRS',
      'Inclusão de Dados Secundários do território',
      'Preview com gráficos',
      'Exportação em PDF e DOCX',
    ],
    manual_section: 'sustentabilidade',
    tour_order: 14,
    enabled: true,
    required_role: null,
  },
  {
    route: 'RelatoriosGerados',
    title: 'Relatórios Gerados',
    icon: FileText,
    sidebar_group: 'esg',
    in_sidebar: true,
    description: 'Histórico de relatórios de sustentabilidade gerados pela plataforma.',
    features: [
      'Lista de relatórios anteriores',
      'Re-download de PDF/DOCX',
      'Status de geração',
      'Filtros por período e escopo',
    ],
    manual_section: 'sustentabilidade',
    tour_order: 15,
    enabled: true,
    required_role: null,
  },
  {
    route: 'ReferenciaisESG',
    title: 'Referenciais ESG',
    icon: ShieldCheck,
    sidebar_group: 'esg',
    in_sidebar: true,
    description: 'Vinculação de registros e ações a referenciais ESG (GRI, ODS, Pacto Global, ESRS).',
    features: [
      'Lista de referenciais adotados',
      'Vinculação de evidências',
      'Filtros por referencial e entidade',
      'Resumo por referencial',
    ],
    manual_section: 'sustentabilidade',
    tour_order: 16,
    enabled: true,
    required_role: null,
  },
  {
    route: 'ODS',
    title: 'ODS',
    icon: Globe,
    sidebar_group: 'esg',
    in_sidebar: true,
    description: 'Definição e acompanhamento de metas dos Objetivos de Desenvolvimento Sustentável.',
    features: [
      '17 ODS visualizados',
      'Definição de metas quantitativas',
      'Acompanhamento de progresso',
      'Vinculação com ações',
      'Gráficos de evolução',
    ],
    manual_section: 'sustentabilidade',
    tour_order: 17,
    enabled: true,
    required_role: null,
  },
  {
    route: 'ConfiguracoesESG',
    title: 'Configurações ESG',
    icon: Target,
    sidebar_group: 'esg',
    in_sidebar: true,
    description: 'Configuração da organização, unidades operacionais e estratégia ESG.',
    features: [
      'Dados do Grupo/Organização',
      'Unidades operacionais (plantas, minas, escritórios)',
      'Estratégia de relacionamento',
      'Referenciais prioritários',
      'Contato do responsável',
    ],
    manual_section: 'sustentabilidade',
    tour_order: 18,
    enabled: true,
    required_role: null,
  },

  // ===== Grupo: Sistema =====
  {
    route: 'GerenciarEquipes',
    title: 'Equipes',
    icon: Users,
    sidebar_group: 'sistema',
    in_sidebar: true,
    description: 'Criação e gestão de equipes territoriais e seus membros.',
    features: [
      'Criação de equipes (por município/comunidade)',
      'Convite de membros por email',
      'Atribuição de papéis (admin, editor, observador)',
      'Hierarquia de equipes',
      'Visibilidade pública/privada',
    ],
    manual_section: 'permissoes',
    tour_order: 19,
    enabled: true,
    required_role: null,
  },
  {
    route: 'GerenciarUsuarios',
    title: 'Usuários',
    icon: User,
    sidebar_group: 'sistema',
    in_sidebar: true,
    description: 'Gestão de usuários da plataforma (apenas administradores).',
    features: [
      'Lista de usuários cadastrados',
      'Atribuição de roles (admin/user)',
      'Atribuição de funções profissionais',
      'Histórico de alterações',
      'Convite de novos usuários',
    ],
    manual_section: 'permissoes',
    tour_order: 20,
    enabled: true,
    required_role: 'admin',
  },
  {
    route: 'Integracoes',
    title: 'Integrações',
    icon: Plug,
    sidebar_group: 'sistema',
    in_sidebar: true,
    description: 'Conexões com serviços externos (Google Drive, WhatsApp, etc.).',
    features: [
      'OAuth com Google Drive',
      'Webhooks e automações',
      'Configuração de credenciais',
    ],
    manual_section: 'permissoes',
    tour_order: 21,
    enabled: true,
    required_role: null,
  },
  {
    route: 'SaudeFontes',
    title: 'Saúde das Fontes',
    icon: Activity,
    sidebar_group: 'sistema',
    in_sidebar: true,
    description: 'Monitoramento técnico das integrações com fontes públicas de dados.',
    features: [
      'Status de cada fonte de dados',
      'Tempo de resposta e disponibilidade',
      'Teste de conexão por município',
      'Diagnóstico de falhas e erros',
      'Histórico de validações',
    ],
    manual_section: 'saude-fontes',
    tour_order: 22,
    enabled: true,
    required_role: null,
  },
  {
    route: 'LimpezaDados',
    title: 'Limpeza de Dados',
    icon: Shield,
    sidebar_group: 'sistema',
    in_sidebar: true,
    description: 'Ferramentas de auditoria e limpeza de dados duplicados ou inconsistentes.',
    features: [
      'Detecção de duplicatas',
      'Mesclagem de registros',
      'Auditoria de inconsistências',
      'Backup antes de alterações',
    ],
    manual_section: 'permissoes',
    tour_order: 23,
    enabled: true,
    required_role: null,
  },
  {
    route: 'Aparencia',
    title: 'Aparência',
    icon: Palette,
    sidebar_group: 'sistema',
    in_sidebar: true,
    description: 'Personalização visual do sistema com múltiplos temas prontos.',
    features: [
      'Tema Ponte Social (verde institucional - padrão)',
      'Tema ODS (acentos multicoloridos)',
      'Tema Água (azul profundo)',
      'Tema Perini (laranja, preto e branco)',
      'Tema Noite (escuro sofisticado)',
      'Tema Mato e Terra (paletas naturais)',
    ],
    manual_section: 'temas-visuais',
    tour_order: 24,
    enabled: true,
    required_role: null,
  },
  {
    route: 'Documentacao',
    title: 'Documentação',
    icon: Book,
    sidebar_group: 'sistema',
    in_sidebar: true,
    description: 'Manual completo do sistema com guias rápidos.',
    features: [
      'Manual completo por módulo',
      'Guias rápidos passo a passo',
      'Busca na documentação',
      'Exportação em PDF',
    ],
    manual_section: 'introducao',
    tour_order: 25,
    enabled: true,
    required_role: null,
  },

  // ===== Fora da sidebar (apenas no Manual / acesso indireto) =====
  {
    route: 'AssistenteIA',
    title: 'Assistente IA',
    icon: Sparkles,
    sidebar_group: null,
    in_sidebar: false,
    description: 'Chat inteligente que responde perguntas sobre o sistema e analisa os dados reais cadastrados. Acesso pelo Chat IA (canto inferior).',
    features: [
      'Responde perguntas sobre uso do app',
      'Acesso em tempo real a registros, stakeholders, casos e demandas',
      'Compreende linguagem natural',
      'Gera insights, prioridades e recomendações',
      'Inclui contexto do Motor Global de Decisões',
      'Mostra as consultas executadas (transparência)',
      'Aplica princípios éticos: distingue fato, percepção e alegação',
    ],
    manual_section: 'assistente-ia',
    tour_order: 26,
    enabled: true,
    required_role: null,
  },
  {
    route: 'Analise',
    title: 'Análise (legado)',
    icon: BarChart3,
    sidebar_group: null,
    in_sidebar: false,
    description: 'Central de análises: gráficos de tendências, comparativos e indicadores territoriais. Agora integrada ao Motor de Decisões no Dashboard.',
    features: [
      'Gráficos de tendências',
      'Comparativo entre períodos',
      'Indicadores de compromissos',
      'Resumo de temas',
      'Dashboard de temperatura e risco',
    ],
    manual_section: 'analise',
    tour_order: 27,
    enabled: true,
    required_role: null,
  },
  {
    route: 'CentralAnalise',
    title: 'Central de Análise (legado)',
    icon: Sparkles,
    sidebar_group: null,
    in_sidebar: false,
    description: 'Hub de análises avançadas com IA. A inteligência foi migrada para o Motor Global de Decisões, visível no Dashboard.',
    features: [
      'Análise automática de riscos sociais',
      'Detecção de lideranças emergentes',
      'Modelo preditivo de tensão territorial',
      'Grafo de rede de stakeholders',
      'Análise de sentimento agregado',
      'Comparativo entre períodos',
      'Resumo executivo por tema',
      'Dashboard de temperatura e risco',
    ],
    manual_section: 'analise',
    tour_order: 28,
    enabled: true,
    required_role: null,
  },

  // ===== Perfil (rodapé da sidebar) =====
  {
    route: 'PreferenciasUsuario',
    title: 'Meu Perfil',
    icon: User,
    sidebar_group: null,
    in_sidebar: true,
    description: 'Configurações pessoais do usuário: perfil, tema, notificações.',
    features: [
      'Dados do perfil',
      'Tema visual pessoal',
      'Preferências de notificação',
      'Configurações de dashboard',
    ],
    manual_section: 'permissoes',
    tour_order: 29,
    enabled: true,
    required_role: null,
  },
];

export function getModulosVisiveis(userRole) {
  return TOUR_MODULES
    .filter(m => m.enabled && (!m.required_role || m.required_role === userRole))
    .sort((a, b) => a.tour_order - b.tour_order);
}

// Apenas módulos que aparecem como link na sidebar (para o Tour da sidebar)
export function getSidebarModules(userRole) {
  return TOUR_MODULES
    .filter(m => m.enabled && m.in_sidebar !== false && (!m.required_role || m.required_role === userRole))
    .sort((a, b) => a.tour_order - b.tour_order);
}

export function getModuloByRoute(route) {
  return TOUR_MODULES.find(m => m.route === route) || null;
}

// Agrupa módulos por grupo da sidebar, preservando a ordem dos grupos
export function getModulosAgrupados(userRole) {
  const mods = getModulosVisiveis(userRole);
  const grupos = [];
  const byGroup = new Map();
  mods.forEach(m => {
    const key = m.sidebar_group || '__topo__';
    if (!byGroup.has(key)) {
      byGroup.set(key, []);
      if (key !== '__topo__') grupos.push(key);
    }
    byGroup.get(key).push(m);
  });
  return { top: byGroup.get('__topo__') || [], grupos, byGroup };
}

// Constrói seletor CSS que aponta para o link do sidebar de uma rota
export function buildSidebarSelector(route) {
  return `a[href="/${route}"]`;
}