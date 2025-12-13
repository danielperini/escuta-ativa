import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, Calendar, MapPin, Users, AlertTriangle, FileText, 
  CheckCircle, Clock, Target, Edit, Loader2, Sparkles, TrendingUp
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";

const statusConfig = {
  em_aberto: { label: 'Em Aberto', color: 'bg-blue-100 text-blue-700', icon: Clock },
  pendente: { label: 'Pendente', color: 'bg-amber-100 text-amber-700', icon: AlertTriangle },
  em_andamento: { label: 'Em Andamento', color: 'bg-purple-100 text-purple-700', icon: TrendingUp },
  concluido: { label: 'Concluído', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  cancelado: { label: 'Cancelado', color: 'bg-slate-100 text-slate-700', icon: Clock }
};

const prioridadeConfig = {
  baixa: { label: 'Baixa', color: 'bg-slate-100 text-slate-700' },
  media: { label: 'Média', color: 'bg-blue-100 text-blue-700' },
  alta: { label: 'Alta', color: 'bg-orange-100 text-orange-700' },
  urgente: { label: 'Urgente', color: 'bg-red-100 text-red-700' }
};

export default function VerCaso() {
  const urlParams = new URLSearchParams(window.location.search);
  const casoId = urlParams.get('id');
  const queryClient = useQueryClient();
  const [analise, setAnalise] = useState('');
  const [gerandoAnalise, setGerandoAnalise] = useState(false);

  const { data: caso, isLoading } = useQuery({
    queryKey: ['caso', casoId],
    queryFn: async () => {
      const casos = await base44.entities.Caso.filter({ id: casoId });
      return casos[0];
    },
    enabled: !!casoId
  });

  const { data: stakeholders = [] } = useQuery({
    queryKey: ['stakeholders-caso', caso?.stakeholders_envolvidos],
    queryFn: async () => {
      if (!caso?.stakeholders_envolvidos?.length) return [];
      const allStakeholders = await base44.entities.Stakeholder.list();
      return allStakeholders.filter(s => caso.stakeholders_envolvidos.includes(s.id));
    },
    enabled: !!caso?.stakeholders_envolvidos?.length
  });

  const { data: registros = [] } = useQuery({
    queryKey: ['registros-caso', caso?.registro_origem_id],
    queryFn: async () => {
      if (!caso?.registro_origem_id) return [];
      const allRegistros = await base44.entities.Registro.list();
      return allRegistros.filter(r => r.id === caso.registro_origem_id || r.casos_vinculados?.includes(casoId));
    },
    enabled: !!caso
  });

  const gerarAnaliseIA = async () => {
    if (!caso) return;
    setGerandoAnalise(true);

    const contexto = `
DADOS DO CASO:
Título: ${caso.titulo}
Tipo: ${caso.tipo}
Status: ${caso.status}
Prioridade: ${caso.prioridade}
Comunidade: ${caso.comunidade}
Município: ${caso.municipio}

DESCRIÇÃO:
${caso.descricao}

STAKEHOLDERS ENVOLVIDOS:
${stakeholders.map(s => `- ${s.nome} (${s.tipo})`).join('\n')}

REGISTROS RELACIONADOS:
${registros.map(r => `[${r.data_registro}] ${r.titulo}`).join('\n')}

HISTÓRICO:
${caso.historico_atualizacoes?.map(h => `${h.data}: ${h.acao}`).join('\n') || 'Sem histórico'}
    `;

    try {
      const resultado = await base44.integrations.Core.InvokeLLM({
        prompt: `Analise o seguinte caso de gestão comunitária e forneça insights estratégicos:

${contexto}

Forneça uma análise completa em 4 seções:

1. **Contexto e Situação Atual**: Resumo do caso, partes envolvidas, histórico
2. **Análise de Riscos**: Riscos identificados, impactos potenciais
3. **Oportunidades**: Possibilidades de melhorias, ganhos de relacionamento
4. **Recomendações Estratégicas**: Próximos passos, abordagens sugeridas

Seja objetivo, estratégico e prático. Máximo 400 palavras.`
      });
      setAnalise(resultado);
    } catch (error) {
      alert('Erro ao gerar análise: ' + error.message);
    } finally {
      setGerandoAnalise(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!caso) {
    return (
      <div className="text-center py-12">
        <Target className="w-12 h-12 mx-auto mb-4 text-slate-300" />
        <h3 className="text-lg font-medium text-slate-900">Caso não encontrado</h3>
        <Link to={createPageUrl('Casos')}>
          <Button className="mt-4" variant="outline">Voltar</Button>
        </Link>
      </div>
    );
  }

  const status = statusConfig[caso.status] || statusConfig.em_aberto;
  const prioridade = prioridadeConfig[caso.prioridade] || prioridadeConfig.media;
  const StatusIcon = status.icon;

  const isAtrasado = caso.prazo && new Date(caso.prazo) < new Date() && caso.status !== 'concluido';

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link to={createPageUrl('Casos')}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-[#2D6A4F] flex items-center justify-center text-white">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{caso.titulo}</h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant="secondary" className={cn(status.color)}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {status.label}
                </Badge>
                <Badge variant="secondary" className={cn(prioridade.color)}>
                  {prioridade.label}
                </Badge>
                {isAtrasado && (
                  <Badge className="bg-red-600 text-white">Atrasado</Badge>
                )}
              </div>
            </div>
          </div>
        </div>
        <Link to={createPageUrl('Casos') + `?editar=${casoId}`}>
          <Button size="sm" className="bg-[#2D6A4F] hover:bg-[#1B4332]">
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="detalhes">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
              <TabsTrigger value="registros">Registros ({registros.length})</TabsTrigger>
              <TabsTrigger value="historico">Histórico</TabsTrigger>
              <TabsTrigger value="analise">Análise IA</TabsTrigger>
            </TabsList>

            <TabsContent value="detalhes" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Descrição</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-700 whitespace-pre-wrap">{caso.descricao}</p>
                </CardContent>
              </Card>

              {caso.observacoes && (
                <Card>
                  <CardHeader>
                    <CardTitle>Observações</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-700 whitespace-pre-wrap">{caso.observacoes}</p>
                  </CardContent>
                </Card>
              )}

              {caso.evidencias?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Evidências</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {caso.evidencias.map((ev, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-lg">
                        <a href={ev.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                          {ev.descricao || `Evidência ${idx + 1}`}
                        </a>
                        {ev.data && (
                          <p className="text-xs text-slate-500 mt-1">
                            {new Date(ev.data).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="registros" className="space-y-3 mt-4">
              {registros.length === 0 ? (
                <Card className="p-12 text-center">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-500">Nenhum registro vinculado</p>
                </Card>
              ) : (
                registros.map(registro => (
                  <Card key={registro.id} className="hover:shadow-md transition-all">
                    <CardContent className="p-4">
                      <Link to={createPageUrl('VerRegistro') + `?id=${registro.id}`}>
                        <h4 className="font-semibold text-slate-900 hover:text-blue-600">
                          {registro.titulo}
                        </h4>
                      </Link>
                      <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                        {registro.descricao}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(registro.created_date).toLocaleDateString('pt-BR')}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {registro.comunidade}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="historico" className="space-y-3 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Linha do Tempo</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {/* Criação do caso */}
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900">Caso criado</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {caso.created_by} • {new Date(caso.created_date || caso.data_abertura).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Histórico de atualizações */}
                    {caso.historico_atualizacoes?.map((item, idx) => (
                      <div key={idx} className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full bg-[#2D6A4F] mt-2" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900">{item.acao}</p>
                            {item.observacao && (
                              <p className="text-sm text-slate-600 mt-1">{item.observacao}</p>
                            )}
                            <p className="text-xs text-slate-500 mt-1">
                              {item.usuario} • {new Date(item.data).toLocaleString('pt-BR')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Conclusão se aplicável */}
                    {caso.status === 'concluido' && caso.data_conclusao && (
                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900">Caso concluído</p>
                            <p className="text-xs text-slate-500 mt-1">
                              {new Date(caso.data_conclusao).toLocaleString('pt-BR')}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analise" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#2D6A4F]" />
                    Análise Estratégica
                  </CardTitle>
                  <Button
                    onClick={gerarAnaliseIA}
                    disabled={gerandoAnalise}
                    size="sm"
                    className="bg-[#2D6A4F] hover:bg-[#1B4332]"
                  >
                    {gerandoAnalise ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    {analise ? 'Atualizar' : 'Gerar'}
                  </Button>
                </CardHeader>
                <CardContent>
                  {analise ? (
                    <Textarea
                      value={analise}
                      onChange={(e) => setAnalise(e.target.value)}
                      rows={20}
                      className="font-serif text-sm leading-relaxed whitespace-pre-wrap"
                    />
                  ) : (
                    <div className="text-center py-12 text-slate-500">
                      <Sparkles className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                      <p>Clique em "Gerar" para criar uma análise completa</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-xs text-slate-500">Comunidade</div>
                <div className="text-sm font-medium flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {caso.comunidade}
                </div>
              </div>
              {caso.municipio && (
                <div>
                  <div className="text-xs text-slate-500">Município</div>
                  <div className="text-sm font-medium">{caso.municipio}</div>
                </div>
              )}
              {caso.tema && (
                <div>
                  <div className="text-xs text-slate-500">Tema</div>
                  <div className="text-sm font-medium">{caso.tema}</div>
                </div>
              )}
              {caso.prazo && (
                <div>
                  <div className="text-xs text-slate-500">Prazo</div>
                  <div className={cn("text-sm font-medium", isAtrasado && "text-red-600")}>
                    {new Date(caso.prazo).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              )}
              {caso.responsavel_empresa && (
                <div>
                  <div className="text-xs text-slate-500">Responsável</div>
                  <div className="text-sm font-medium">{caso.responsavel_empresa}</div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5" />
                Stakeholders ({stakeholders.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {stakeholders.length === 0 ? (
                <p className="text-sm text-slate-500">Nenhum stakeholder vinculado</p>
              ) : (
                stakeholders.map(s => (
                  <Link
                    key={s.id}
                    to={createPageUrl('PerfilStakeholder') + `?id=${s.id}`}
                  >
                    <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-[#2D6A4F] flex items-center justify-center text-white text-xs">
                        {s.nome[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{s.nome}</p>
                        <p className="text-xs text-slate-500 capitalize">{s.tipo}</p>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}