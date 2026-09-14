import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Book, Search, CheckSquare, Lightbulb, Download, Printer,
  ChevronRight, Sparkles, Rocket
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { TOUR_MODULES, TOUR_GROUPS } from '@/lib/tourModuleRegistry';

// Passo a passo por módulo (manual_section). Fonte complementar ao registry.
const HOWTO_BY_SECTION = {
  dashboard: [
    'Personalize os widgets em "Personalizar Widgets" para montar sua visão',
    'Monitore os KPIs do topo: registros, demandas urgentes, riscos e agendas',
    'Acompanhe o gráfico de tendências dos últimos 7 dias',
    'Leia as "Vozes do Território" — citações reais e anonimizadas',
    'Confira o Painel de Orientação Territorial (3 cards diários de IA)',
    'Actue sobre os insights do Motor Global de Decisões no widget Prioridades'
  ],
  registros: [
    'Clique em "+ Novo Registro"',
    'Escolha "Assistido por IA" ou "Manual"',
    'Grave áudio, faça upload de arquivo ou digite a descrição',
    'A IA transcreve e extrai participantes, temas, demandas e compromissos',
    'Revise e ajuste as sugestões da IA',
    'Defina classificação de relacionamento (Comunitário/Institucional) — manual tem prioridade',
    'Finalize para gerar código único (RE-UT-XXXXXX-AAAA) e vincular stakeholders'
  ],
  'voz-comunidade': [
    'Falas aparecem automaticamente de registros do tipo "conversa de campo" ou "visita"',
    'Os textos são exibidos exatamente como foram ditos, entre aspas',
    'Use filtros para segmentar por comunidade',
    'Clique numa fala para abrir o registro completo',
    'Temas recorrentes indicam prioridades comunitárias'
  ],
  'gestor-demandas': [
    'As demandas surgem automaticamente dos registros',
    'Arraste cards no Kanban: pendente → em andamento → atendida',
    'Atribua responsáveis pelo botão do card',
    'Filtre por urgência, comunidade e tema',
    'Acompanhe estatísticas de tempo de resposta'
  ],
  casos: [
    'Casos são criados automaticamente quando há demanda com devolutiva',
    'Ou crie manualmente com "+ Novo Caso"',
    'A IA sugere informações com base no contexto',
    'Acompanhe status e prazo (padrão 15 dias) na timeline',
    'Adicione evidências (fotos, documentos, atas)',
    'Conclua o caso registrando a devolutiva realizada'
  ],
  mapa: [
    'Selecione camadas no controle (registros, riscos, stakeholders, comunidades)',
    'Clique em marcadores para ver detalhes',
    'Cores indicam temperatura: verde (baixo), amarelo (médio), vermelho (crítico)',
    'Clique no mapa para criar um registro naquele local',
    'Use filtros por período, tipo e sentimento'
  ],
  comunidades: [
    'Cadastre comunidades manualmente (bairro, vila, distrito, quilombo…)',
    'A IA extrai comunidades mencionadas em registros',
    'O termômetro social atualiza automaticamente com os registros',
    'Cadastre grupos coletivos (culturais, artísticos, ambientais)',
    'Use as comunidades para segmentar comunicação por território'
  ],
  'analise-demografica': [
    'Selecione um município no filtro de localidade',
    'Veja a pirâmide etária e a distribuição por cor/raça',
    'Compare indicadores entre territórios',
    'Dados vêm do IBGE'
  ],
  'dados-secundarios': [
    'Selecione um município ou comunidade',
    'Navegue pelas categorias: demografia, economia, saúde, educação, etc.',
    'Cada indicador traz fonte, URL e período de referência rastreáveis',
    'Fontes oficiais: IBGE, ANATEL, etc.'
  ],
  stakeholders: [
    'A IA detecta e cria stakeholders automaticamente a partir dos registros',
    'Valide e complete as informações no perfil',
    'Use "Segmentação Avançada" para filtros complexos',
    'Acesse "Mapa de Stakeholders" para a visualização de rede',
    'Resolva duplicatas em "Resolver Conflitos"',
    'Exporte listas segmentadas para comunicação direcionada'
  ],
  agenda: [
    'A IA detecta datas futuras mencionadas em registros e sugere agendas',
    'Valide e confirme as agendas sugeridas',
    'Adicione participantes e responsáveis',
    'Receba alertas automáticos de atraso',
    'Marque como "Realizada" após executar',
    'Vincule o registro de devolutiva quando aplicável'
  ],
  materialidade: [
    'Vá em "Materialidade" → aba "Macrotemas"',
    'Clique em "+ Adicionar Macrotema"',
    'Preencha Nome, Categoria ESG e Níveis (1-5)',
    'Complete os Drives de Avaliação para refinar o risco social',
    'A IA calcula a classificação de cor e o Índice de Risco Social',
    'Visualize a matriz consolidada na aba "Matriz"'
  ],
  sustentabilidade: [
    'Configure os dados da organização em "Configurações ESG"',
    'Defina metas quantitativas em "ODS"',
    'Acesse "Gerador de Relatório"',
    'Selecione o escopo (plataforma, comunidade, território)',
    'A IA classifica automaticamente as ações em categorias ESG',
    'Revise o preview com vinculações GRI, ODS, Pacto Global e ESRS',
    'Inclua Dados Secundários do território',
    'Gere o relatório final em PDF ou DOCX'
  ],
  'saude-fontes': [
    'Acesse "Saúde das Fontes" no menu Sistema',
    'Veja o status de cada fonte de dados pública',
    'Confira tempo de resposta e disponibilidade',
    'Teste a conexão por município',
    'Diagnostique falhas e erros pelo histórico de validações'
  ],
  'permissoes': [
    'O admin cria equipes em "Equipes"',
    'Convide membros por email e atribua papéis',
    'Configure permissões granulares por entidade',
    'Usuários veem apenas dados de sua equipe',
    'O histórico registra todas as alterações'
  ],
  'temas-visuais': [
    'Acesse "Aparência" no menu Sistema',
    'Veja a paleta de cada tema',
    'Clique para aplicar — a mudança é imediata',
    'O tema é salvo no seu perfil e carregado no próximo acesso'
  ],
  'assistente-ia': [
    'Acesse pelo Chat IA no canto inferior direito (em qualquer página)',
    'Use as sugestões rápidas ou digite sua pergunta em linguagem natural',
    'Para perguntas sobre dados, cite comunidade/território quando possível',
    'O assistente consulta as entidades e responde com números reais',
    'Clique em "Nova conversa" para começar do zero',
    'Inicie o Tour Guiado pelo ícone de ônibus à esquerda do Chat IA'
  ],
  analise: [
    'A inteligência da Central de Análise foi migrada para o Motor Global de Decisões',
    'Acesse os insights pelo widget Prioridades no Dashboard',
    'Use o Chat IA para análises contextualizadas'
  ]
};

const QUICK_GUIDES = [
  {
    title: 'Primeiros passos',
    icon: Rocket,
    steps: [
      'Configure sua organização em "Configurações ESG" (nome, CNPJ, setores)',
      'Cadastre suas comunidades em "Comunidades e Grupos"',
      'Crie sua equipe em "Equipes" e convite os membros',
      'Escolha seu tema visual em "Aparência"',
      'Faça seu primeiro registro em "Registros"'
    ]
  },
  {
    title: 'Ciclo completo de uma demanda',
    icon: Sparkles,
    steps: [
      'Registre a interação no campo (Registros → IA assistida)',
      'A IA extrai a demanda automaticamente',
      'A demanda entra no Kanban (Gestão de Demandas)',
      'Se exigir devolutiva, um Caso é criado com prazo de 15 dias',
      'Agende a devolutiva na Agenda',
      'Registre a devolutiva realizada e conclua o caso',
      'Gere o relatório de sustentabilidade com a evidência'
    ]
  }
];

export default function Documentacao() {
  const [search, setSearch] = useState('');
  const [activeId, setActiveId] = useState('introducao');

  // Constrói a árvore: topo (Dashboard + Meu Perfil) + grupos com módulos
  const tree = useMemo(() => {
    const top = TOUR_MODULES.filter(m => !m.sidebar_group).sort((a, b) => a.tour_order - b.tour_order);
    const groups = TOUR_GROUPS.map(g => ({
      ...g,
      modules: TOUR_MODULES.filter(m => m.sidebar_group === g.key).sort((a, b) => a.tour_order - b.tour_order)
    }));
    return { top, groups };
  }, []);

  const activeModule = TOUR_MODULES.find(m => m.route === activeId);

  const matchesSearch = (m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return m.title.toLowerCase().includes(q) ||
      m.description.toLowerCase().includes(q) ||
      (m.features || []).some(f => f.toLowerCase().includes(q));
  };

  const filteredTop = tree.top.filter(matchesSearch);
  const filteredGroups = tree.groups.map(g => ({ ...g, modules: g.modules.filter(matchesSearch) })).filter(g => g.modules.length > 0);
  const hasResults = filteredTop.length > 0 || filteredGroups.length > 0;

  return (
    <div className="min-h-screen bg-background text-foreground p-3 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693acc814baf8083c262896b/8a81a6207_transparent-Photoroom12.png"
              alt="societa.ai"
              className="h-10 object-contain"
            />
            <h1 className="text-2xl md:text-3xl font-bold">Manual do Sistema</h1>
            <Badge variant="secondary">v2.1</Badge>
          </div>
          <p className="text-muted-foreground">Guia completo de todas as funcionalidades do societa.ai</p>
        </div>

        {/* Search + print */}
        <div className="mb-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Buscar funcionalidade..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-12 text-base"
            />
          </div>
          <Button variant="outline" className="h-12 px-6" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-2" />
            Imprimir / Salvar PDF
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar nav */}
          <div className="lg:col-span-1 print:hidden">
            <Card className="sticky top-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Book className="w-5 h-5" />
                  Navegação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 max-h-[70vh] overflow-y-auto">
                <button
                  onClick={() => setActiveId('introducao')}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                    activeId === 'introducao' ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground"
                  )}
                >
                  <Book className="w-4 h-4" />
                  Introdução & Guias
                </button>

                {filteredTop.length > 0 && (
                  <div className="pt-2">
                    {filteredTop.map(m => (
                      <button key={m.route} onClick={() => setActiveId(m.route)}
                        className={cn("w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all",
                          activeId === m.route ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground")}>
                        <m.icon className="w-4 h-4" />
                        {m.title}
                      </button>
                    ))}
                  </div>
                )}

                {filteredGroups.map(g => (
                  <div key={g.key} className="pt-2">
                    <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                      <g.icon className="w-3.5 h-3.5" />
                      {g.title}
                    </p>
                    {g.modules.map(m => (
                      <button key={m.route} onClick={() => setActiveId(m.route)}
                        className={cn("w-full flex items-center gap-2 pl-7 pr-3 py-2 rounded-lg text-sm transition-all",
                          activeId === m.route ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground")}>
                        <m.icon className="w-4 h-4" />
                        <span className="truncate">{m.title}</span>
                      </button>
                    ))}
                  </div>
                ))}

                {!hasResults && (
                  <p className="text-sm text-muted-foreground px-3 py-4">Nenhum resultado para "{search}".</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Content */}
          <div className="lg:col-span-3 space-y-6">
            {activeId === 'introducao' && <Introduction tree={tree} onNavigate={setActiveId} />}
            {activeModule && <ModuleDetail module={activeModule} />}
          </div>
        </div>
      </div>
    </div>
  );
}

function Introduction({ tree, onNavigate }) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-primary" />
            Bem-vindo ao societa.ai
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            O <strong className="text-foreground">societa.ai</strong> é uma plataforma de escuta social ativa
            para gestão de relacionamento comunitário, análise territorial e prevenção de riscos sociais.
            O menu lateral está organizado em grupos colapsáveis para reduzir a carga cognitiva.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {tree.groups.map(g => (
              <button key={g.key} onClick={() => onNavigate(g.modules[0]?.route)}
                className="text-left p-3 rounded-lg border border-border hover:border-primary hover:bg-muted transition-all">
                <div className="flex items-center gap-2 mb-1 font-medium text-foreground">
                  <g.icon className="w-4 h-4 text-primary" />
                  {g.title}
                </div>
                <p className="text-xs text-muted-foreground">{g.description}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Rocket className="w-5 h-5 text-primary" />
            Guias Rápidos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {QUICK_GUIDES.map((guide, idx) => (
            <div key={idx} className="p-4 rounded-lg bg-muted">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <guide.icon className="w-4 h-4 text-primary" />
                {guide.title}
              </h4>
              <ol className="space-y-2">
                {guide.steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                      {i + 1}
                    </span>
                    <span className="pt-0.5 text-foreground">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}

function ModuleDetail({ module }) {
  const Icon = module.icon;
  const howTo = HOWTO_BY_SECTION[module.manual_section] || [];
  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10 text-primary">
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-2xl">{module.title}</CardTitle>
              <p className="text-muted-foreground mt-1">{module.description}</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Funcionalidades</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid sm:grid-cols-2 gap-2">
            {(module.features || []).map((feature, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm">
                <CheckSquare className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {howTo.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              Como usar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {howTo.map((step, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                    {idx + 1}
                  </span>
                  <span className="text-sm pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="py-4 flex items-center gap-2 text-sm text-muted-foreground">
          <ChevronRight className="w-4 h-4" />
          Acesse este módulo pelo menu lateral, em
          {module.sidebar_group
            ? ` ${TOUR_GROUPS.find(g => g.key === module.sidebar_group)?.title || module.sidebar_group} → ${module.title}.`
            : ` ${module.title}.`}
        </CardContent>
      </Card>
    </>
  );
}