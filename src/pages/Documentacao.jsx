import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Book, 
  Search, 
  FileText, 
  Users, 
  MapPin, 
  Target, 
  MessageCircle,
  Calendar,
  CheckSquare,
  BarChart3,
  Shield,
  Download,
  Sparkles,
  Home,
  TrendingUp,
  AlertTriangle,
  Clock,
  Lightbulb
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const sections = [
  {
    id: 'introducao',
    title: 'Introdução',
    icon: Book,
    color: 'bg-blue-100 text-blue-600',
    content: {
      description: 'O societa.ai é uma plataforma de escuta social ativa desenvolvida para gestão de relacionamento comunitário, análise territorial e prevenção de riscos sociais.',
      features: [
        'Sistema de registro inteligente com IA',
        'Análise automática de riscos sociais',
        'Matriz de materialidade ESG',
        'Gestão de stakeholders e casos',
        'Visualização geográfica interativa',
        'Análises preditivas e insights estratégicos'
      ]
    }
  },
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: BarChart3,
    color: 'bg-emerald-100 text-emerald-600',
    content: {
      description: 'Visão executiva consolidada com KPIs, tendências e alertas em tempo real.',
      features: [
        'KPIs principais: registros, demandas urgentes, riscos ativos, agendas',
        'Gráficos de tendências dos últimos 7 dias',
        'Demandas recorrentes por comunidade',
        'Monitor de devolutivas pendentes',
        'Voz da Comunidade com falas reais',
        'Dicas de relacionamento contextualizadas',
        'Botão de pânico para situações críticas'
      ],
      howTo: [
        'Personalize os widgets clicando em "Personalizar Widgets"',
        'Navegue entre os cards para acessar detalhes',
        'Use o gráfico de tendências para identificar padrões',
        'Monitore alertas vermelhos de alta prioridade'
      ]
    }
  },
  {
    id: 'registros',
    title: 'Registros',
    icon: FileText,
    color: 'bg-purple-100 text-purple-600',
    content: {
      description: 'Sistema de registro de interações comunitárias com processamento inteligente de áudio, texto e imagens.',
      features: [
        'Registro manual ou com IA assistida',
        'Transcrição automática de áudio/vídeo',
        'Detecção automática de stakeholders, temas e demandas',
        'Geração de ATA com IA',
        'Análise de sentimento e temperatura territorial',
        'Vínculo automático com casos e compromissos',
        'Exportação em PDF, XLSX e DOCX',
        'Sistema de códigos únicos (RE-UT-XXXXXX-AAAA)'
      ],
      howTo: [
        'Clique em "+ Novo Registro" para iniciar',
        'Escolha entre "Assistido por IA" ou "Manual"',
        'Grave áudio, faça upload de arquivo ou digite',
        'IA extrai automaticamente: participantes, temas, demandas, compromissos',
        'Revise e ajuste as sugestões da IA',
        'Finalize para gerar código único e vincular stakeholders'
      ]
    }
  },
  {
    id: 'stakeholders',
    title: 'Stakeholders',
    icon: Users,
    color: 'bg-orange-100 text-orange-600',
    content: {
      description: 'Gestão inteligente de stakeholders com detecção automática, histórico completo e análise de rede.',
      features: [
        'Cadastro automático a partir de registros',
        'Detecção de duplicatas e conflitos',
        'Perfil completo: contatos, influência, demandas, timeline',
        'Rede de relacionamentos visualizada',
        'Segmentação avançada por temas e localidade',
        'Histórico de auditoria completo (LGPD)',
        'Score de influência calculado automaticamente',
        'Alertas de atualização necessária'
      ],
      howTo: [
        'IA detecta e cria stakeholders automaticamente dos registros',
        'Valide e complete informações no perfil',
        'Use "Segmentação Avançada" para filtros complexos',
        'Acesse "Mapa de Stakeholders" para visualização de rede',
        'Resolva conflitos em "Resolver Conflitos"',
        'Exporte listas segmentadas para comunicação direcionada'
      ]
    }
  },
  {
    id: 'casos',
    title: 'Casos',
    icon: CheckSquare,
    color: 'bg-red-100 text-red-600',
    content: {
      description: 'Gestão de situações que exigem devolutiva, acompanhamento ou resolução formal.',
      features: [
        'Criação automática a partir de devolutivas',
        'Consolidação de casos similares (IA detecta duplicatas)',
        'Rastreamento de prazo (padrão 15 dias)',
        'Alertas de atraso automáticos',
        'Histórico de atualizações e evidências',
        'Vínculo com stakeholders e registros',
        'Status: em aberto, em andamento, concluído, cancelado',
        'Análise estratégica por IA'
      ],
      howTo: [
        'Casos são criados automaticamente quando há demanda com devolutiva',
        'Ou crie manualmente com "+ Novo Caso"',
        'IA sugere informações com base no contexto',
        'Acompanhe status e prazos na timeline',
        'Adicione evidências (fotos, documentos, atas)',
        'Conclua o caso registrando a devolutiva realizada'
      ]
    }
  },
  {
    id: 'agenda',
    title: 'Agenda',
    icon: Calendar,
    color: 'bg-indigo-100 text-indigo-600',
    content: {
      description: 'Gestão de compromissos, reuniões e devolutivas com alertas de atraso.',
      features: [
        'Criação automática de agendas a partir de registros',
        'Detecção de datas futuras mencionadas em conversas',
        'Alertas automáticos de atraso',
        'Vínculo com casos e stakeholders',
        'Status: confirmada, prevista, acordada, realizada',
        'Justificativa obrigatória para não realização',
        'Calendário visual mensal',
        'Exportação de agenda em PDF'
      ],
      howTo: [
        'IA detecta datas futuras mencionadas em registros',
        'Valide e confirme agendas sugeridas',
        'Adicione participantes e responsáveis',
        'Receba alertas 24h antes e no dia',
        'Marque como "Realizada" após executar',
        'Vincule registro de devolutiva quando aplicável'
      ]
    }
  },
  {
    id: 'mapa',
    title: 'Mapa Territorial',
    icon: MapPin,
    color: 'bg-teal-100 text-teal-600',
    content: {
      description: 'Visualização geográfica de registros, riscos, stakeholders e temperatura social por localidade.',
      features: [
        'Mapa interativo com Leaflet',
        'Camadas: registros, riscos, stakeholders, comunidades',
        'Heatmap de densidade de interações',
        'Temperatura territorial por comunidade',
        'Filtros por período, tipo, sentimento',
        'Criação de registro diretamente no mapa (clique no local)',
        'Detecção automática de coordenadas',
        'Clustering de pontos próximos'
      ],
      howTo: [
        'Selecione camadas no controle superior direito',
        'Clique em marcadores para ver detalhes',
        'Use filtros para análise temporal',
        'Cores indicam temperatura: verde (baixo), amarelo (médio), vermelho (crítico)',
        'Clique no mapa para criar registro no local',
        'Exporte visualização como imagem'
      ]
    }
  },
  {
    id: 'materialidade',
    title: 'Materialidade ESG',
    icon: Target,
    color: 'bg-green-100 text-green-600',
    content: {
      description: 'Matriz de macrotemas ESG com classificação visual e cálculo automático de risco social.',
      features: [
        'Matriz de Macrotemas (Ambiental, Social, Governança)',
        'Classificação por cores: vermelho (crítico), amarelo (médio), verde (positivo), branco (ausente)',
        'Drives de avaliação: impacto cotidiano, clima de diálogo, influência stakeholders, presença equipes, protestos, confiança',
        'Cálculo automático de Índice de Risco Social (0-100)',
        'Classificação: Baixo, Médio, Alto',
        'Ações sugeridas por IA',
        'Vínculo com stakeholders e localidades',
        'Observações qualitativas contextuais'
      ],
      howTo: [
        'Adicione macrotemas em "Macrotemas"',
        'Avalie Nível de Impacto (1-5), Presença (1-5) e Percepção Comunidade (1-5)',
        'IA calcula automaticamente classificação de cor',
        'Preencha Drives de Avaliação para refinar risco social',
        'Matriz visual mostra panorama consolidado',
        'Exporte relatório de materialidade'
      ]
    }
  },
  {
    id: 'voz-comunidade',
    title: 'Voz da Comunidade',
    icon: MessageCircle,
    color: 'bg-pink-100 text-pink-600',
    content: {
      description: 'Exibição de falas reais e autênticas da comunidade, sem filtros institucionais.',
      features: [
        'Apenas declarações diretas de pessoas (não atas)',
        'Filtro rigoroso: exclui documentos formais e resumos',
        'Exibição literal das transcrições',
        'Contexto: quem disse, localidade, tema, sentimento',
        'Timeline de demandas comunitárias',
        'Temas recorrentes com ranking',
        'Análise de sentimento geral',
        'Filtros por comunidade e urgência'
      ],
      howTo: [
        'Falas aparecem automaticamente de registros tipo "conversa_campo" ou "visita"',
        'Textos são exibidos exatamente como foram ditos',
        'Use filtros para segmentar por comunidade',
        'Clique em uma fala para ver registro completo',
        'Temas recorrentes indicam prioridades comunitárias'
      ]
    }
  },
  {
    id: 'analise',
    title: 'Central de Análise',
    icon: Sparkles,
    color: 'bg-yellow-100 text-yellow-600',
    content: {
      description: 'Hub de análises avançadas com IA: riscos sociais, lideranças emergentes, predição de tensão.',
      features: [
        'Análise automática de riscos sociais',
        'Detecção de lideranças emergentes',
        'Modelo preditivo de tensão territorial',
        'Grafo de rede de stakeholders',
        'Análise de sentimento agregado',
        'Comparativo entre períodos',
        'Resumo executivo por tema',
        'Dashboard de temperatura e risco',
        'Feedback loop para melhorar IA'
      ],
      howTo: [
        'Acesse análises pré-processadas no dashboard',
        'Clique em "Gerar Nova Análise" para insights atualizados',
        'Valide ou corrija sugestões da IA (feedback)',
        'Use grafo de rede para identificar conexões críticas',
        'Exporte relatórios para tomada de decisão'
      ]
    }
  },
  {
    id: 'comunidades',
    title: 'Comunidades e Grupos',
    icon: Home,
    color: 'bg-cyan-100 text-cyan-600',
    content: {
      description: 'Gestão de comunidades territoriais e grupos coletivos (culturais, artísticos, esportivos).',
      features: [
        'Cadastro de comunidades (bairros, vilas, distritos, quilombos, etc.)',
        'Cadastro de grupos coletivos (culturais, artísticos, ambientais)',
        'Termômetro social por comunidade',
        'Total de registros e última interação',
        'Principais temas identificados',
        'População estimada e geolocalização',
        'Vínculo com stakeholders e registros',
        'Timeline de interações por localidade'
      ],
      howTo: [
        'Cadastre comunidades manualmente',
        'IA extrai comunidades mencionadas em registros',
        'Termômetro social atualiza automaticamente',
        'Grupos coletivos facilitam engajamento cultural',
        'Use para segmentar comunicação por território'
      ]
    }
  },
  {
    id: 'permissoes',
    title: 'Equipes e Permissões',
    icon: Shield,
    color: 'bg-slate-100 text-slate-600',
    content: {
      description: 'Gestão granular de usuários, equipes e permissões por entidade.',
      features: [
        'Papéis: Admin, Usuário',
        'Equipes territoriais (por município/comunidade)',
        'Permissões granulares por entidade (CRUD)',
        'Histórico de alterações de permissões',
        'Auditoria completa de acessos',
        'Convite de usuários por email',
        'Segurança LGPD para dados sensíveis',
        'Acesso via PWA (instalável no celular)'
      ],
      howTo: [
        'Admin cria equipes em "Gerenciar Equipes"',
        'Atribua usuários a equipes específicas',
        'Configure permissões por entidade',
        'Usuários veem apenas dados de sua equipe',
        'Histórico registra todas alterações'
      ]
    }
  }
];

const howToGuides = [
  {
    title: 'Como criar um registro com IA',
    steps: [
      'Acesse "Registros" → "+ Novo Registro"',
      'Escolha "Assistido por IA"',
      'Grave áudio ou faça upload de arquivo',
      'IA transcreve e extrai automaticamente participantes, temas, demandas',
      'Revise sugestões e ajuste se necessário',
      'Clique em "Finalizar Registro"'
    ]
  },
  {
    title: 'Como configurar um caso de devolutiva',
    steps: [
      'Registre interação com demanda que exige resposta',
      'Marque "Requer Devolutiva" na demanda',
      'IA cria caso automaticamente',
      'Prazo padrão: 15 dias',
      'Adicione evidências ao longo do processo',
      'Conclua caso registrando devolutiva realizada'
    ]
  },
  {
    title: 'Como usar a Matriz de Macrotemas',
    steps: [
      'Vá em "Materialidade" → "Macrotemas"',
      'Clique em "+ Adicionar Macrotema"',
      'Preencha: Nome, Categoria ESG, Níveis (1-5)',
      'Complete Drives de Avaliação',
      'IA calcula classificação de cor e risco social',
      'Visualize matriz consolidada na aba "Matriz"'
    ]
  },
  {
    title: 'Como exportar relatórios',
    steps: [
      'Acesse a página relevante (Registros, Casos, Stakeholders)',
      'Aplique filtros desejados',
      'Clique em "Exportar"',
      'Escolha formato: PDF (narrativo), XLSX (dados), DOCX (editável)',
      'Personalize campos a incluir',
      'Download automático ao finalizar'
    ]
  }
];

export default function Documentacao() {
  const [search, setSearch] = useState('');
  const [activeSection, setActiveSection] = useState('introducao');

  React.useEffect(() => {
    const hash = window.location.hash.substring(1);
    if (hash && sections.find(s => s.id === hash)) {
      setActiveSection(hash);
    }
  }, []);

  const handleSectionChange = (sectionId) => {
    setActiveSection(sectionId);
    window.location.hash = sectionId;
  };

  const filteredSections = sections.filter(s => {
    const matchTitle = s.title.toLowerCase().includes(search.toLowerCase());
    const matchDescription = s.content.description.toLowerCase().includes(search.toLowerCase());
    const matchFeatures = (s.content.features || []).some(f => f.toLowerCase().includes(search.toLowerCase()));
    const matchHowTo = (s.content.howTo || []).some(h => h.toLowerCase().includes(search.toLowerCase()));
    return matchTitle || matchDescription || matchFeatures || matchHowTo;
  });

  const currentSection = sections.find(s => s.id === activeSection);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693acc814baf8083c262896b/8a81a6207_transparent-Photoroom12.png"
              alt="societa.ai"
              className="h-10 object-contain"
            />
            <h1 className="text-3xl font-bold text-slate-900">societa.ai</h1>
            <Badge className="bg-[#E31E24]">v2.1</Badge>
          </div>
          <p className="text-slate-600">Documentação Completa do Sistema</p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Buscar na documentação..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-12 text-base"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="text-lg">Navegação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {filteredSections.map(section => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => handleSectionChange(section.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all",
                      activeSection === section.id
                        ? "bg-[#E31E24] text-white"
                        : "hover:bg-slate-100 text-slate-700"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {section.title}
                  </button>
                );
                })}
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  Exportar Manual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-3">
                  Gere um manual completo em PDF
                </p>
                <Button className="w-full bg-[#E31E24] hover:bg-[#B01419]">
                  <Download className="w-4 h-4 mr-2" />
                  Gerar PDF
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Content */}
          <div className="lg:col-span-3 space-y-6">
            {currentSection && (
              <>
                {/* Section Header */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className={cn("p-3 rounded-lg", currentSection.color)}>
                        <currentSection.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl">{currentSection.title}</CardTitle>
                        <p className="text-slate-600 mt-1">{currentSection.content.description}</p>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {/* Features */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Funcionalidades</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                        {(currentSection.content.features || []).map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <CheckSquare className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* How To */}
                {currentSection.content.howTo && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-amber-500" />
                        Como Usar
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ol className="space-y-3">
                        {(currentSection.content.howTo || []).map((step, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#E31E24] text-white flex items-center justify-center text-xs font-medium">
                              {idx + 1}
                            </span>
                            <span className="text-sm pt-0.5">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {/* Guides */}
            {activeSection === 'introducao' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Guias Rápidos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {howToGuides.map((guide, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 rounded-lg">
                      <h4 className="font-semibold text-slate-900 mb-3">{guide.title}</h4>
                      <ol className="space-y-2">
                        {guide.steps.map((step, stepIdx) => (
                          <li key={stepIdx} className="flex items-start gap-2 text-sm text-slate-700">
                            <span className="font-medium text-[#E31E24]">{stepIdx + 1}.</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}