import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar, 
  TrendingUp, 
  Users, 
  MessageSquare,
  Tag,
  FileText,
  AlertCircle,
  Plus,
  X,
  Edit,
  Save
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import RedeRelacionamentosVisual from './RedeRelacionamentosVisual';

export default function PerfilDetalhadoStakeholder({ stakeholderId, onClose }) {
  const [editando, setEditando] = useState(false);
  const [formData, setFormData] = useState({});
  const [novoSegmento, setNovoSegmento] = useState('');
  const [novaAreaInteresse, setNovaAreaInteresse] = useState('');
  const queryClient = useQueryClient();

  const { data: stakeholder, isLoading } = useQuery({
    queryKey: ['stakeholder-perfil', stakeholderId],
    queryFn: () => base44.entities.Stakeholder.filter({ id: stakeholderId }).then(r => r[0]),
    enabled: !!stakeholderId
  });

  const { data: registros = [] } = useQuery({
    queryKey: ['registros-stakeholder', stakeholderId],
    queryFn: () => base44.entities.Registro.list('-created_date', 100),
    enabled: !!stakeholderId,
    select: (data) => data.filter(r => 
      r.participantes?.includes(stakeholder?.nome) ||
      r.stakeholders_vinculados?.includes(stakeholderId) ||
      r.liderancas_vinculadas?.includes(stakeholderId)
    )
  });

  const { data: casos = [] } = useQuery({
    queryKey: ['casos-stakeholder', stakeholderId],
    queryFn: () => base44.entities.Caso.list(),
    enabled: !!stakeholderId,
    select: (data) => data.filter(c => c.stakeholders_envolvidos?.includes(stakeholderId))
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Stakeholder.update(stakeholderId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stakeholder-perfil', stakeholderId] });
      setEditando(false);
    }
  });

  React.useEffect(() => {
    if (stakeholder) {
      setFormData(stakeholder);
    }
  }, [stakeholder]);

  const adicionarSegmento = () => {
    if (novoSegmento.trim()) {
      const segmentos = [...(formData.segmentos || []), novoSegmento.trim()];
      setFormData({ ...formData, segmentos });
      setNovoSegmento('');
      if (!editando) {
        updateMutation.mutate({ segmentos });
      }
    }
  };

  const removerSegmento = (segmento) => {
    const segmentos = formData.segmentos.filter(s => s !== segmento);
    setFormData({ ...formData, segmentos });
    if (!editando) {
      updateMutation.mutate({ segmentos });
    }
  };

  const adicionarAreaInteresse = () => {
    if (novaAreaInteresse.trim()) {
      const areas_interesse = [...(formData.areas_interesse || []), novaAreaInteresse.trim()];
      setFormData({ ...formData, areas_interesse });
      setNovaAreaInteresse('');
      if (!editando) {
        updateMutation.mutate({ areas_interesse });
      }
    }
  };

  const removerAreaInteresse = (area) => {
    const areas_interesse = formData.areas_interesse.filter(a => a !== area);
    setFormData({ ...formData, areas_interesse });
    if (!editando) {
      updateMutation.mutate({ areas_interesse });
    }
  };

  const salvarEdicao = () => {
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-12">Carregando...</div>;
  }

  if (!stakeholder) {
    return <div className="text-center p-12">Stakeholder não encontrado</div>;
  }

  const nivelInfluenciaColor = {
    baixo: 'bg-slate-100 text-slate-700',
    medio: 'bg-blue-100 text-blue-700',
    alto: 'bg-orange-100 text-orange-700',
    muito_alto: 'bg-red-100 text-red-700'
  };

  const nivelAtividadeColor = {
    inativo: 'bg-slate-100 text-slate-700',
    baixo: 'bg-yellow-100 text-yellow-700',
    moderado: 'bg-blue-100 text-blue-700',
    alto: 'bg-green-100 text-green-700'
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Perfil Detalhado</h2>
          <div className="flex items-center gap-2">
            {editando ? (
              <>
                <Button onClick={salvarEdicao} disabled={updateMutation.isPending}>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </Button>
                <Button variant="outline" onClick={() => { setEditando(false); setFormData(stakeholder); }}>
                  Cancelar
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setEditando(true)}>
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
            )}
            <Button variant="ghost" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Header Info */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-6">
                <div className="w-24 h-24 rounded-full bg-[#2D6A4F] flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
                  {stakeholder.nome?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-2">{stakeholder.nome}</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-500" />
                      <span>{stakeholder.tipo} • {stakeholder.subtipo}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-500" />
                      <span>{stakeholder.comunidade}, {stakeholder.municipio}</span>
                    </div>
                    {stakeholder.contato?.telefone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-500" />
                        <span>{stakeholder.contato.telefone}</span>
                      </div>
                    )}
                    {stakeholder.contato?.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-500" />
                        <span>{stakeholder.contato.email}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                    <Badge className={nivelInfluenciaColor[stakeholder.nivel_influencia] || nivelInfluenciaColor.baixo}>
                      Influência: {stakeholder.nivel_influencia}
                      {stakeholder.score_influencia && ` (${stakeholder.score_influencia})`}
                    </Badge>
                    <Badge className={nivelAtividadeColor[stakeholder.nivel_atividade] || nivelAtividadeColor.inativo}>
                      Atividade: {stakeholder.nivel_atividade}
                    </Badge>
                    <Badge variant="outline">
                      {stakeholder.historico_interacoes || 0} interações
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="visao-geral" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
              <TabsTrigger value="interacoes">Interações</TabsTrigger>
              <TabsTrigger value="rede">Rede</TabsTrigger>
              <TabsTrigger value="segmentacao">Segmentação</TabsTrigger>
              <TabsTrigger value="alertas">Alertas</TabsTrigger>
              <TabsTrigger value="casos">Casos</TabsTrigger>
            </TabsList>

            <TabsContent value="visao-geral" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Informações Gerais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {editando ? (
                    <>
                      <div>
                        <Label>Papel Social</Label>
                        <Input
                          value={formData.papel_social || ''}
                          onChange={(e) => setFormData({ ...formData, papel_social: e.target.value })}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label>Organização</Label>
                        <Input
                          value={formData.organizacao || ''}
                          onChange={(e) => setFormData({ ...formData, organizacao: e.target.value })}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label>Notas</Label>
                        <Textarea
                          value={formData.notas || ''}
                          onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                          rows={4}
                          className="mt-2"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      {stakeholder.papel_social && (
                        <div>
                          <p className="text-sm text-slate-500">Papel Social</p>
                          <p className="font-medium">{stakeholder.papel_social}</p>
                        </div>
                      )}
                      {stakeholder.organizacao && (
                        <div>
                          <p className="text-sm text-slate-500">Organização</p>
                          <p className="font-medium">{stakeholder.organizacao}</p>
                        </div>
                      )}
                      {stakeholder.notas && (
                        <div>
                          <p className="text-sm text-slate-500">Notas</p>
                          <p className="text-sm">{stakeholder.notas}</p>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="w-5 h-5" />
                    Áreas de Interesse
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {(formData.areas_interesse || []).map((area, idx) => (
                      <Badge key={idx} variant="outline" className="bg-blue-50 text-blue-700">
                        {area}
                        {editando && (
                          <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => removerAreaInteresse(area)} />
                        )}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Nova área de interesse"
                      value={novaAreaInteresse}
                      onChange={(e) => setNovaAreaInteresse(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && adicionarAreaInteresse()}
                    />
                    <Button onClick={adicionarAreaInteresse}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Temas Recorrentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {(stakeholder.temas_recorrentes || []).map((tema, idx) => (
                      <Badge key={idx} className="bg-[#D8F3DC] text-[#1B4332]">
                        {tema}
                      </Badge>
                    ))}
                    {(!stakeholder.temas_recorrentes || stakeholder.temas_recorrentes.length === 0) && (
                      <p className="text-sm text-slate-500">Nenhum tema identificado ainda</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="interacoes" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Linha do Tempo ({registros.length} registros)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {registros.slice(0, 10).map((registro) => (
                      <div key={registro.id} className="flex gap-4 pb-4 border-b last:border-0">
                        <div className="w-2 h-2 rounded-full bg-[#2D6A4F] mt-2 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="font-medium">{registro.titulo}</p>
                          <p className="text-sm text-slate-600 mt-1">{registro.descricao?.substring(0, 200)}</p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                            <Calendar className="w-3 h-3" />
                            <span>{format(new Date(registro.created_date || registro.data_registro), 'dd/MM/yyyy', { locale: ptBR })}</span>
                            <span>•</span>
                            <span>{registro.tipo}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {registros.length === 0 && (
                      <p className="text-center text-slate-500 py-8">Nenhuma interação registrada</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="rede" className="space-y-4">
              <RedeRelacionamentosVisual 
                stakeholder={stakeholder}
                onUpdateRede={(rede) => updateMutation.mutate({ rede_contatos: rede })}
              />
            </TabsContent>

            <TabsContent value="segmentacao" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="w-5 h-5" />
                    Segmentos para Comunicação Direcionada
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {(formData.segmentos || []).map((segmento, idx) => (
                      <Badge key={idx} className="bg-purple-100 text-purple-700">
                        {segmento}
                        <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => removerSegmento(segmento)} />
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Novo segmento (ex: Lideranças, Parceiros, Críticos)"
                      value={novoSegmento}
                      onChange={(e) => setNovoSegmento(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && adicionarSegmento()}
                    />
                    <Button onClick={adicionarSegmento}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500 mt-4">
                    Use segmentos para direcionar comunicações específicas a grupos de stakeholders
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="alertas" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Alertas Ativos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(stakeholder.alertas_ativos || []).map((alerta, idx) => (
                      <div key={idx} className="p-3 border rounded-lg bg-amber-50">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-sm">{alerta.tipo}</p>
                            <p className="text-sm text-slate-600 mt-1">{alerta.mensagem}</p>
                          </div>
                          <Badge variant={alerta.prioridade === 'alta' ? 'destructive' : 'secondary'}>
                            {alerta.prioridade}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                          {format(new Date(alerta.data), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </p>
                      </div>
                    ))}
                    {(!stakeholder.alertas_ativos || stakeholder.alertas_ativos.length === 0) && (
                      <p className="text-center text-slate-500 py-8">Nenhum alerta ativo</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="casos" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Casos Relacionados ({casos.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {casos.map((caso) => (
                      <div key={caso.id} className="p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{caso.titulo}</p>
                            <p className="text-sm text-slate-600 mt-1">{caso.descricao?.substring(0, 150)}</p>
                          </div>
                          <Badge variant={caso.status === 'concluido' ? 'success' : 'secondary'}>
                            {caso.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                          <span>{caso.tipo}</span>
                          <span>•</span>
                          <span>{caso.prioridade}</span>
                        </div>
                      </div>
                    ))}
                    {casos.length === 0 && (
                      <p className="text-center text-slate-500 py-8">Nenhum caso relacionado</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}