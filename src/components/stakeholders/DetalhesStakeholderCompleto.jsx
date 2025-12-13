import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  User,
  Building2,
  MapPin,
  Phone,
  Mail,
  Calendar,
  FileText,
  Briefcase,
  TrendingUp,
  Activity,
  X,
  ExternalLink,
  Tag,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TimelineInteracoes from '@/components/stakeholders/TimelineInteracoes';
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const tipoConfig = {
  pessoa: { label: 'Pessoa', icon: User, color: 'bg-blue-100 text-blue-700' },
  entidade: { label: 'Entidade', icon: Building2, color: 'bg-purple-100 text-purple-700' }
};

const subtipoConfig = {
  lideranca: 'Liderança',
  representante: 'Representante',
  morador: 'Morador',
  associacao: 'Associação',
  ong: 'ONG',
  governo: 'Governo',
  outro: 'Outro'
};

const statusCadastroConfig = {
  provisorio: { label: 'Provisório', color: 'bg-amber-100 text-amber-700' },
  parcial: { label: 'Parcial', color: 'bg-blue-100 text-blue-700' },
  completo: { label: 'Completo', color: 'bg-emerald-100 text-emerald-700' }
};

const nivelInfluenciaConfig = {
  baixo: { label: 'Baixo', color: 'bg-slate-100 text-slate-600' },
  medio: { label: 'Médio', color: 'bg-blue-100 text-blue-600' },
  alto: { label: 'Alto', color: 'bg-orange-100 text-orange-600' },
  muito_alto: { label: 'Muito Alto', color: 'bg-red-100 text-red-600' }
};

export default function DetalhesStakeholderCompleto({ stakeholder, open, onOpenChange }) {
  const [activeTab, setActiveTab] = useState('overview');

  // Buscar registros relacionados
  const { data: registros = [], isLoading: loadingRegistros } = useQuery({
    queryKey: ['registros-stakeholder', stakeholder?.id],
    queryFn: async () => {
      if (!stakeholder?.id) return [];
      const todos = await base44.entities.Registro.list('-created_date', 100);
      return todos.filter(r => 
        r.stakeholders_vinculados?.includes(stakeholder.id) ||
        r.liderancas_vinculadas?.includes(stakeholder.id)
      );
    },
    enabled: !!stakeholder?.id
  });

  // Buscar casos relacionados
  const { data: casos = [], isLoading: loadingCasos } = useQuery({
    queryKey: ['casos-stakeholder', stakeholder?.id],
    queryFn: async () => {
      if (!stakeholder?.id) return [];
      const todos = await base44.entities.Caso.list('-created_date');
      return todos.filter(c => c.stakeholders_envolvidos?.includes(stakeholder.id));
    },
    enabled: !!stakeholder?.id
  });

  if (!stakeholder) return null;

  const config = tipoConfig[stakeholder.tipo] || tipoConfig.pessoa;
  const IconeTipo = config.icon;

  // Construir timeline de interações
  const timeline = [
    ...registros.map(r => ({
      tipo: 'registro',
      data: r.created_date,
      titulo: r.titulo,
      descricao: r.descricao?.substring(0, 150),
      id: r.id,
      comunidade: r.comunidade
    })),
    ...casos.map(c => ({
      tipo: 'caso',
      data: c.created_date,
      titulo: c.titulo,
      descricao: c.descricao?.substring(0, 150),
      id: c.id,
      status: c.status
    }))
  ].sort((a, b) => new Date(b.data) - new Date(a.data));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className={cn("p-3 rounded-lg", config.color)}>
                <IconeTipo className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="text-2xl">{stakeholder.nome}</DialogTitle>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <Badge variant="secondary" className={config.color}>
                    {config.label}
                  </Badge>
                  {stakeholder.subtipo && (
                    <Badge variant="outline">
                      {subtipoConfig[stakeholder.subtipo]}
                    </Badge>
                  )}
                  {stakeholder.status_cadastro && (
                    <Badge variant="secondary" className={statusCadastroConfig[stakeholder.status_cadastro]?.color}>
                      {statusCadastroConfig[stakeholder.status_cadastro]?.label}
                    </Badge>
                  )}
                  {stakeholder.nivel_influencia && (
                    <Badge variant="secondary" className={nivelInfluenciaConfig[stakeholder.nivel_influencia]?.color}>
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Influência: {nivelInfluenciaConfig[stakeholder.nivel_influencia]?.label}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="interacoes">Interações</TabsTrigger>
            <TabsTrigger value="timeline">Timeline ({timeline.length})</TabsTrigger>
            <TabsTrigger value="casos">Casos ({casos.length})</TabsTrigger>
            <TabsTrigger value="registros">Registros ({registros.length})</TabsTrigger>
            <TabsTrigger value="analise">Análise</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-4">
            {/* Visão Geral */}
            <TabsContent value="overview" className="space-y-4 mt-0">
              <div className="grid md:grid-cols-2 gap-4">
                {/* Informações Básicas */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Informações Básicas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    {stakeholder.comunidade && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-slate-500 mt-0.5" />
                        <div>
                          <div className="font-medium">Comunidade</div>
                          <div className="text-slate-600">{stakeholder.comunidade}</div>
                        </div>
                      </div>
                    )}
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-slate-500 mt-0.5" />
                      <div>
                        <div className="font-medium">Município</div>
                        <div className="text-slate-600">{stakeholder.municipio || 'Desconhecido'}</div>
                      </div>
                    </div>
                    {stakeholder.papel_social && (
                      <div className="flex items-start gap-2">
                        <User className="w-4 h-4 text-slate-500 mt-0.5" />
                        <div>
                          <div className="font-medium">Papel Social</div>
                          <div className="text-slate-600">{stakeholder.papel_social}</div>
                        </div>
                      </div>
                    )}
                    {stakeholder.organizacao && (
                      <div className="flex items-start gap-2">
                        <Building2 className="w-4 h-4 text-slate-500 mt-0.5" />
                        <div>
                          <div className="font-medium">Organização</div>
                          <div className="text-slate-600">{stakeholder.organizacao}</div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Contato */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Contato</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    {stakeholder.contato?.telefone && (
                      <div className="flex items-start gap-2">
                        <Phone className="w-4 h-4 text-slate-500 mt-0.5" />
                        <div>
                          <div className="font-medium">Telefone</div>
                          <div className="text-slate-600">{stakeholder.contato.telefone}</div>
                        </div>
                      </div>
                    )}
                    {stakeholder.contato?.email && (
                      <div className="flex items-start gap-2">
                        <Mail className="w-4 h-4 text-slate-500 mt-0.5" />
                        <div>
                          <div className="font-medium">E-mail</div>
                          <div className="text-slate-600">{stakeholder.contato.email}</div>
                        </div>
                      </div>
                    )}
                    {stakeholder.contato?.whatsapp && (
                      <div className="flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 text-slate-500 mt-0.5" />
                        <div>
                          <div className="font-medium">WhatsApp</div>
                          <div className="text-slate-600">{stakeholder.contato.whatsapp}</div>
                        </div>
                      </div>
                    )}
                    {stakeholder.endereco && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-slate-500 mt-0.5" />
                        <div>
                          <div className="font-medium">Endereço</div>
                          <div className="text-slate-600">{stakeholder.endereco}</div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Estatísticas */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Estatísticas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Total de Interações</span>
                      <span className="font-semibold">{stakeholder.historico_interacoes || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Registros</span>
                      <span className="font-semibold">{registros.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Casos</span>
                      <span className="font-semibold">{casos.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Última Interação</span>
                      <span className="font-semibold">
                        {stakeholder.ultima_interacao 
                          ? format(new Date(stakeholder.ultima_interacao), 'dd/MM/yyyy', { locale: ptBR })
                          : 'N/A'}
                      </span>
                    </div>
                    {stakeholder.score_influencia && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Score de Influência</span>
                        <span className="font-semibold">{stakeholder.score_influencia}/100</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Tags e Áreas de Interesse */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Tags e Interesses</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {stakeholder.segmentos?.length > 0 && (
                      <div>
                        <div className="text-xs font-medium text-slate-700 mb-2">Tags</div>
                        <div className="flex flex-wrap gap-1">
                          {stakeholder.segmentos.map((tag, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              <Tag className="w-3 h-3 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {stakeholder.areas_interesse?.length > 0 && (
                      <div>
                        <div className="text-xs font-medium text-slate-700 mb-2">Áreas de Interesse</div>
                        <div className="flex flex-wrap gap-1">
                          {stakeholder.areas_interesse.map((area, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {area}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {stakeholder.temas_recorrentes?.length > 0 && (
                      <div>
                        <div className="text-xs font-medium text-slate-700 mb-2">Temas Recorrentes</div>
                        <div className="flex flex-wrap gap-1">
                          {stakeholder.temas_recorrentes.map((tema, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {tema}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {stakeholder.notas && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Notas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">{stakeholder.notas}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Interações Detalhadas - Nova */}
            <TabsContent value="interacoes" className="mt-0">
              <TimelineInteracoes 
                stakeholderId={stakeholder.id} 
                stakeholderNome={stakeholder.nome}
              />
            </TabsContent>

            {/* Timeline de Interações */}
            <TabsContent value="timeline" className="space-y-3 mt-0">
              {timeline.length === 0 ? (
                <Card className="p-8 text-center">
                  <Activity className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-slate-500">Nenhuma interação registrada ainda</p>
                </Card>
              ) : (
                timeline.map((item, idx) => (
                  <Card key={idx} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "p-2 rounded-lg mt-1",
                        item.tipo === 'registro' ? "bg-blue-100" : "bg-purple-100"
                      )}>
                        {item.tipo === 'registro' ? (
                          <FileText className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Briefcase className="w-4 h-4 text-purple-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <Link 
                              to={createPageUrl(item.tipo === 'registro' ? 'VerRegistro' : 'VerCaso') + `?id=${item.id}`}
                              className="font-medium text-slate-900 hover:text-blue-600"
                            >
                              {item.titulo}
                              <ExternalLink className="w-3 h-3 inline ml-1" />
                            </Link>
                            {item.descricao && (
                              <p className="text-sm text-slate-600 mt-1 line-clamp-2">{item.descricao}</p>
                            )}
                          </div>
                          <Badge variant="outline" className="text-xs capitalize ml-2">
                            {item.tipo}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(item.data), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                          {item.comunidade && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {item.comunidade}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Casos */}
            <TabsContent value="casos" className="space-y-3 mt-0">
              {loadingCasos ? (
                Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-24" />)
              ) : casos.length === 0 ? (
                <Card className="p-8 text-center">
                  <Briefcase className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-slate-500">Nenhum caso associado</p>
                </Card>
              ) : (
                casos.map(caso => (
                  <Card key={caso.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <Link 
                          to={createPageUrl('VerCaso') + `?id=${caso.id}`}
                          className="font-medium text-slate-900 hover:text-blue-600"
                        >
                          {caso.titulo}
                          <ExternalLink className="w-3 h-3 inline ml-1" />
                        </Link>
                        {caso.descricao && (
                          <p className="text-sm text-slate-600 mt-1 line-clamp-2">{caso.descricao}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {caso.status?.replace('_', ' ')}
                          </Badge>
                          {caso.comunidade && (
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {caso.comunidade}
                            </span>
                          )}
                          <span className="text-xs text-slate-500">
                            {format(new Date(caso.created_date), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Registros */}
            <TabsContent value="registros" className="space-y-3 mt-0">
              {loadingRegistros ? (
                Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-24" />)
              ) : registros.length === 0 ? (
                <Card className="p-8 text-center">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-slate-500">Nenhum registro associado</p>
                </Card>
              ) : (
                registros.map(registro => (
                  <Card key={registro.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <Link 
                          to={createPageUrl('VerRegistro') + `?id=${registro.id}`}
                          className="font-medium text-slate-900 hover:text-blue-600"
                        >
                          {registro.titulo}
                          <ExternalLink className="w-3 h-3 inline ml-1" />
                        </Link>
                        {registro.descricao && (
                          <p className="text-sm text-slate-600 mt-1 line-clamp-2">{registro.descricao}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <Badge variant="outline" className="text-xs capitalize">
                            {registro.tipo?.replace('_', ' ')}
                          </Badge>
                          {registro.comunidade && (
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {registro.comunidade}
                            </span>
                          )}
                          <span className="text-xs text-slate-500">
                            {format(new Date(registro.created_date), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Análise */}
            <TabsContent value="analise" className="space-y-4 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Análise de Engajamento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {stakeholder.demandas_associadas?.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-slate-700 mb-2">Demandas Históricas</div>
                      <div className="space-y-1">
                        {stakeholder.demandas_associadas.map((demanda, i) => (
                          <div key={i} className="text-sm text-slate-600 flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5" />
                            {demanda}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {stakeholder.nivel_atividade && (
                    <div>
                      <div className="text-xs font-medium text-slate-700 mb-2">Nível de Atividade</div>
                      <Badge variant="outline" className="capitalize">{stakeholder.nivel_atividade}</Badge>
                    </div>
                  )}

                  {stakeholder.engajamento_temas_criticos > 0 && (
                    <div>
                      <div className="text-xs font-medium text-slate-700 mb-2">Engajamento em Temas Críticos</div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-200 rounded-full h-2">
                          <div 
                            className="bg-emerald-600 h-2 rounded-full" 
                            style={{ width: `${Math.min(stakeholder.engajamento_temas_criticos, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{stakeholder.engajamento_temas_criticos}%</span>
                      </div>
                    </div>
                  )}

                  {stakeholder.alertas_ativos?.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-slate-700 mb-2">Alertas Ativos</div>
                      <div className="space-y-2">
                        {stakeholder.alertas_ativos.map((alerta, i) => (
                          <div key={i} className="p-2 bg-amber-50 border border-amber-200 rounded text-xs">
                            <div className="font-medium text-amber-800">{alerta.tipo}</div>
                            <div className="text-amber-700">{alerta.mensagem}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {stakeholder.rede_contatos?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Rede de Contatos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {stakeholder.rede_contatos.map((contato, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                          <div className="text-sm">
                            <span className="font-medium">Stakeholder #{i + 1}</span>
                            {contato.tipo_relacao && (
                              <Badge variant="outline" className="ml-2 text-xs capitalize">
                                {contato.tipo_relacao}
                              </Badge>
                            )}
                          </div>
                          {contato.forca_relacao && (
                            <Badge variant="secondary" className="text-xs capitalize">
                              {contato.forca_relacao}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}