import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  MessageCircle, 
  Search, 
  Filter, 
  TrendingUp,
  Clock,
  MapPin,
  Users,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  Loader2,
  ChevronRight
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { createPageUrl } from '@/utils';
import Pagination from '@/components/shared/Pagination';

const urgenciaConfig = {
  baixa: { label: 'Baixa', color: 'bg-slate-100 text-slate-700' },
  media: { label: 'Média', color: 'bg-blue-100 text-blue-700' },
  alta: { label: 'Alta', color: 'bg-orange-100 text-orange-700' },
  critica: { label: 'Crítica', color: 'bg-red-100 text-red-700' }
};

const sentimentoConfig = {
  positivo: { label: 'Positivo', color: 'text-emerald-600 bg-emerald-50' },
  neutro: { label: 'Neutro', color: 'text-slate-600 bg-slate-50' },
  negativo: { label: 'Negativo', color: 'text-red-600 bg-red-50' },
  misto: { label: 'Misto', color: 'text-amber-600 bg-amber-50' }
};

export default function VozComunidade() {
  const [search, setSearch] = useState('');
  const [filterComunidade, setFilterComunidade] = useState('todos');
  const [filterUrgencia, setFilterUrgencia] = useState('todos');
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [insights, setInsights] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageFalas, setCurrentPageFalas] = useState(1);
  const itemsPerPage = 10;

  const { data: registros = [], isLoading, refetch: refetchRegistros } = useQuery({
    queryKey: ['registros-voz'],
    queryFn: () => base44.entities.Registro.list('-created_date', 200),
    staleTime: 30000,
    refetchInterval: 60000
  });

  const { data: comunidades = [] } = useQuery({
    queryKey: ['comunidades'],
    queryFn: () => base44.entities.Comunidade.list(),
    staleTime: 300000
  });

  // Extract all demands from registros
  const todasDemandas = registros
    .filter(r => r.demandas && r.demandas.length > 0)
    .flatMap(r => 
      r.demandas.map(d => ({
        descricao: typeof d === 'string' ? d : d.descricao,
        urgencia: typeof d === 'object' ? (d.urgencia || 'media') : 'media',
        status: typeof d === 'object' ? d.status : 'pendente',
        registro: r,
        data: r.created_date || r.data_registro,
        comunidade: r.comunidade
      }))
    );

  // Extract all themes
  const todosTemas = registros.flatMap(r => r.temas_identificados || []);
  const temasCount = todosTemas.reduce((acc, tema) => {
    acc[tema] = (acc[tema] || 0) + 1;
    return acc;
  }, {});
  const temasOrdenados = Object.entries(temasCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // Filter demands
  const filteredDemandas = todasDemandas.filter(d => {
    const matchSearch = !search || 
      d.descricao?.toLowerCase().includes(search.toLowerCase());
    const matchComunidade = filterComunidade === 'todos' || d.comunidade === filterComunidade;
    const matchUrgencia = filterUrgencia === 'todos' || d.urgencia === filterUrgencia;
    return matchSearch && matchComunidade && matchUrgencia;
  });

  // Generate insights with AI
  const generateInsights = async () => {
    setIsGeneratingInsights(true);
    
    const demandasTexto = todasDemandas.slice(0, 30).map(d => 
      `- ${d.descricao} (${d.comunidade || 'Sem comunidade'}, ${d.urgencia})`
    ).join('\n');

    const temasTexto = temasOrdenados.map(([tema, count]) => 
      `- ${tema}: ${count} menções`
    ).join('\n');

    const prompt = `Analise as seguintes demandas e temas identificados em interações comunitárias e gere insights estratégicos:

DEMANDAS RECENTES:
${demandasTexto}

TEMAS MAIS FREQUENTES:
${temasTexto}

Gere uma análise contendo:
1. Principais padrões identificados (3-4 pontos)
2. Temas que precisam de atenção imediata
3. Recomendações de ação (3-4 recomendações práticas)
4. Tendências observadas

Seja conciso e objetivo.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          padroes: { type: "array", items: { type: "string" } },
          atencao_imediata: { type: "array", items: { type: "string" } },
          recomendacoes: { type: "array", items: { type: "string" } },
          tendencias: { type: "array", items: { type: "string" } }
        }
      }
    });

    setInsights(result);
    setIsGeneratingInsights(false);
  };

  // Group by date for timeline
  const groupedByDate = filteredDemandas.reduce((acc, demanda) => {
    const dateKey = format(new Date(demanda.data), 'yyyy-MM-dd');
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(demanda);
    return acc;
  }, {});

  // Get relevant speeches from last 30 days
  const falas30Dias = registros
    .filter(r => {
      const dataRegistro = r.created_date || r.data_registro;
      if (!dataRegistro) return false;
      const daysDiff = Math.floor((new Date() - new Date(dataRegistro)) / (1000 * 60 * 60 * 24));
      return daysDiff <= 30 && (r.transcricao || r.descricao);
    });

  const totalPagesFalas = Math.ceil(falas30Dias.length / itemsPerPage);
  const paginatedFalas = falas30Dias.slice(
    (currentPageFalas - 1) * itemsPerPage,
    currentPageFalas * itemsPerPage
  );

  // Paginate demands timeline
  const demandas30Dias = filteredDemandas.filter(d => {
    const daysDiff = Math.floor((new Date() - new Date(d.data)) / (1000 * 60 * 60 * 24));
    return daysDiff <= 30;
  });

  const totalPagesDemandas = Math.ceil(demandas30Dias.length / itemsPerPage);
  const paginatedDemandas = demandas30Dias.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, filterComunidade, filterUrgencia]);

  React.useEffect(() => {
    setCurrentPageFalas(1);
  }, [registros.length]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Voz da Comunidade</h2>
          <p className="text-slate-500 mt-1">Linha do tempo de demandas e insights comunitários</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => refetchRegistros()}
            disabled={isLoading}
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          </Button>
          <Button 
            className="bg-[#2D6A4F] hover:bg-[#1B4332] gap-2"
            onClick={generateInsights}
            disabled={isGeneratingInsights || todasDemandas.length === 0}
          >
            {isGeneratingInsights ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Gerar Insights
          </Button>
        </div>
      </div>

      {/* Falas Relevantes */}
      {falas30Dias.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-[#40916C]" />
              Falas Relevantes (últimos 30 dias)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {paginatedFalas.map(registro => (
              <div 
                key={registro.id}
                className="p-4 bg-slate-50 rounded-lg border-l-4 border-l-[#40916C] hover:bg-slate-100 transition-colors cursor-pointer"
                onClick={() => window.location.href = createPageUrl(`VerRegistro?id=${registro.id}`)}
              >
                <div className="flex items-start gap-3 mb-2">
                  <MessageCircle className="w-4 h-4 text-[#40916C] flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-700 italic flex-1">
                    "{(registro.transcricao || registro.descricao || registro.titulo)?.substring(0, 300)}..."
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                  {registro.comunidade && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {registro.comunidade}
                    </span>
                  )}
                  {registro.participantes?.[0] && (
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {registro.participantes[0]}
                    </span>
                  )}
                  {registro.sentimento && (
                    <Badge variant="outline" className={cn("text-xs", sentimentoConfig[registro.sentimento]?.color)}>
                      {sentimentoConfig[registro.sentimento]?.label}
                    </Badge>
                  )}
                  <span>
                    {format(new Date(registro.created_date || registro.data_registro), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                </div>
              </div>
            ))}
            {falas30Dias.length > itemsPerPage && (
              <div className="pt-4 border-t">
                <Pagination
                  currentPage={currentPageFalas}
                  totalPages={totalPagesFalas}
                  onPageChange={setCurrentPageFalas}
                  itemsPerPage={itemsPerPage}
                  totalItems={falas30Dias.length}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-slate-500">Total de Demandas</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{todasDemandas.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-slate-500">Urgentes/Críticas</div>
          <div className="text-2xl font-bold text-red-600 mt-1">
            {todasDemandas.filter(d => d.urgencia === 'alta' || d.urgencia === 'critica').length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-slate-500">Comunidades Ativas</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {new Set(registros.map(r => r.comunidade).filter(Boolean)).size}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-slate-500">Temas Identificados</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{Object.keys(temasCount).length}</div>
        </Card>
      </div>

      {/* Insights Panel */}
      {insights && (
        <Card className="border-[#40916C] bg-[#40916C]/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-[#2D6A4F]">
              <Sparkles className="w-5 h-5" />
              Insights Gerados por IA
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={generateInsights}
              disabled={isGeneratingInsights}
            >
              <RefreshCw className={cn("w-4 h-4", isGeneratingInsights && "animate-spin")} />
            </Button>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">Padrões Identificados</h4>
              <ul className="space-y-2">
                {insights.padroes?.map((p, idx) => (
                  <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#40916C] mt-2 flex-shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">Atenção Imediata</h4>
              <ul className="space-y-2">
                {insights.atencao_imediata?.map((a, idx) => (
                  <li key={idx} className="text-sm text-red-700 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    {a}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">Recomendações</h4>
              <ul className="space-y-2">
                {insights.recomendacoes?.map((r, idx) => (
                  <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#40916C]/20 text-[#2D6A4F] flex items-center justify-center text-xs font-medium flex-shrink-0">
                      {idx + 1}
                    </span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">Tendências</h4>
              <ul className="space-y-2">
                {insights.tendencias?.map((t, idx) => (
                  <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                    <TrendingUp className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-500" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filters */}
          <Card className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Buscar demanda..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterComunidade} onValueChange={setFilterComunidade}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Comunidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  {comunidades.map(c => (
                    <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterUrgencia} onValueChange={setFilterUrgencia}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Urgência" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  {Object.entries(urgenciaConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Timeline */}
          <div className="space-y-6">
            {isLoading ? (
              Array(3).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))
            ) : paginatedDemandas.length === 0 ? (
              <Card className="p-12 text-center">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhuma demanda encontrada</h3>
                <p className="text-slate-500">
                  Registre interações comunitárias para ver as demandas aqui
                </p>
              </Card>
            ) : (
              <>
                {paginatedDemandas.map((demanda, idx) => {
                  const urgencia = urgenciaConfig[demanda.urgencia] || urgenciaConfig.media;
                  
                  return (
                    <Card 
                      key={idx}
                      className={cn(
                        "p-4 border-l-4 cursor-pointer hover:shadow-md transition-all",
                        demanda.urgencia === 'critica' ? 'border-l-red-500' :
                        demanda.urgencia === 'alta' ? 'border-l-orange-500' :
                        demanda.urgencia === 'media' ? 'border-l-amber-500' :
                        'border-l-slate-300'
                      )}
                      onClick={() => window.location.href = createPageUrl(`VerRegistro?id=${demanda.registro.id}`)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="text-slate-900">{demanda.descricao}</p>
                          <div className="flex items-center gap-3 mt-2 flex-wrap">
                            <Badge variant="secondary" className={cn("text-xs", urgencia.color)}>
                              {urgencia.label}
                            </Badge>
                            {demanda.comunidade && (
                              <span className="flex items-center gap-1 text-xs text-slate-500">
                                <MapPin className="w-3.5 h-3.5" />
                                {demanda.comunidade}
                              </span>
                            )}
                            <span className="flex items-center gap-1 text-xs text-slate-500">
                              <Clock className="w-3.5 h-3.5" />
                              {formatDistanceToNow(new Date(demanda.data), { addSuffix: true, locale: ptBR })}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-300" />
                      </div>
                    </Card>
                  );
                })}

                {demandas30Dias.length > itemsPerPage && (
                  <Card className="p-4">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPagesDemandas}
                      onPageChange={setCurrentPage}
                      itemsPerPage={itemsPerPage}
                      totalItems={demandas30Dias.length}
                    />
                  </Card>
                )}
              </>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Top Themes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#40916C]" />
                Temas Recorrentes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {temasOrdenados.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">
                  Nenhum tema identificado ainda
                </p>
              ) : (
                temasOrdenados.map(([tema, count], idx) => (
                  <div 
                    key={tema}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                        idx < 3 ? "bg-[#40916C] text-white" : "bg-slate-200 text-slate-600"
                      )}>
                        {idx + 1}
                      </span>
                      <span className="text-sm font-medium text-slate-700">{tema}</span>
                    </div>
                    <Badge variant="secondary" className="bg-slate-200">
                      {count}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Sentiment Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sentimento Geral</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(sentimentoConfig).map(([key, config]) => {
                const count = registros.filter(r => r.sentimento === key).length;
                const percentage = registros.length > 0 ? Math.round((count / registros.length) * 100) : 0;
                
                return (
                  <div key={key} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">{config.label}</span>
                      <span className="font-medium">{percentage}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={cn("h-full rounded-full transition-all", config.color)}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}