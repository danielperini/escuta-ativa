import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, MapPin, Phone, Mail, Building, Users, FileText,
  Calendar, Target, TrendingUp, Loader2, Sparkles, Download, AlertTriangle, Link as LinkIcon
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import HistoricoInteracoes from "@/components/stakeholders/HistoricoInteracoes";
import NotasCustomizadas from "@/components/stakeholders/NotasCustomizadas";
import ContatosCustomizados from "@/components/stakeholders/ContatosCustomizados";
import ScoreEngajamento from "@/components/stakeholders/ScoreEngajamento";

const tipoConfig = {
  pessoa: { label: 'Pessoa', color: 'bg-blue-100 text-blue-700' },
  entidade: { label: 'Entidade', color: 'bg-purple-100 text-purple-700' }
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

export default function PerfilStakeholder() {
  const urlParams = new URLSearchParams(window.location.search);
  const stakeholderId = urlParams.get('id');
  const [narrativa, setNarrativa] = useState('');
  const [gerandoNarrativa, setGerandoNarrativa] = useState(false);

  const { data: stakeholder, isLoading } = useQuery({
    queryKey: ['stakeholder', stakeholderId],
    queryFn: async () => {
      const stakeholders = await base44.entities.Stakeholder.filter({ id: stakeholderId });
      return stakeholders[0];
    },
    enabled: !!stakeholderId
  });

  const { data: registros = [] } = useQuery({
    queryKey: ['registros-stakeholder', stakeholder?.nome],
    queryFn: async () => {
      const allRegistros = await base44.entities.Registro.list('-created_date', 500);
      return allRegistros.filter(r => 
        r.participantes?.some(p => p.toLowerCase().includes(stakeholder.nome.toLowerCase()))
      );
    },
    enabled: !!stakeholder
  });

  const { data: casos = [] } = useQuery({
    queryKey: ['casos-stakeholder', stakeholderId],
    queryFn: async () => {
      const allCasos = await base44.entities.Caso.list();
      return allCasos.filter(c => c.stakeholders_envolvidos?.includes(stakeholderId));
    },
    enabled: !!stakeholderId
  });

  const { data: riscos = [] } = useQuery({
    queryKey: ['riscos-stakeholder', stakeholder?.nome],
    queryFn: async () => {
      const allRiscos = await base44.entities.RiscoSocial.list();
      return allRiscos.filter(r => 
        r.liderancas_envolvidas?.includes(stakeholderId) ||
        stakeholder?.riscos_vinculados?.includes(r.id)
      );
    },
    enabled: !!stakeholder
  });

  const gerarNarrativa = async () => {
    if (!stakeholder) return;
    setGerandoNarrativa(true);

    const contextoRegistros = registros.slice(0, 10).map(r => 
      `${r.data_registro}: ${r.titulo} - ${r.descricao?.substring(0, 200)}`
    ).join('\n\n');

    const temas = [...new Set(registros.flatMap(r => r.temas_identificados || []))];
    const demandas = registros.flatMap(r => r.demandas || []).slice(0, 5);

    const prompt = `Você é um analista de relações comunitárias. Crie um perfil narrativo completo sobre o seguinte stakeholder:

**DADOS DO STAKEHOLDER:**
Nome: ${stakeholder.nome}
Tipo: ${stakeholder.tipo}
${stakeholder.subtipo ? `Subtipo: ${stakeholder.subtipo}` : ''}
${stakeholder.papel_social ? `Papel Social: ${stakeholder.papel_social}` : ''}
Comunidade: ${stakeholder.comunidade}
${stakeholder.municipio ? `Município: ${stakeholder.municipio}` : ''}
${stakeholder.organizacao ? `Organização: ${stakeholder.organizacao}` : ''}
Nível de Influência: ${stakeholder.nivel_influencia || 'médio'}
Nível de Atividade: ${stakeholder.nivel_atividade || 'baixo'}
Total de Interações: ${registros.length}

**REGISTROS DE INTERAÇÃO (últimos 10):**
${contextoRegistros}

**TEMAS DE INTERESSE:**
${temas.join(', ')}

**DEMANDAS RECORRENTES:**
${demandas.map(d => `- ${d.descricao}`).join('\n')}

**CASOS VINCULADOS:**
${casos.length} caso(s) ativo(s)

**INSTRUÇÕES:**
Crie um perfil narrativo em português do Brasil, estruturado em 4 seções:

1. **Apresentação**: Quem é essa pessoa/entidade, qual seu papel na comunidade
2. **Histórico de Engajamento**: Como tem sido sua participação nas interações, principais temas de interesse
3. **Demandas e Preocupações**: Principais questões que levanta, padrões identificados
4. **Avaliação de Relacionamento**: Nível de influência, atividade, e recomendações para fortalecer o relacionamento

Mantenha tom profissional e objetivo. Máximo 500 palavras.`;

    try {
      const resultado = await base44.integrations.Core.InvokeLLM({ prompt });
      setNarrativa(resultado);
    } catch (error) {
      alert('Erro ao gerar narrativa: ' + error.message);
    } finally {
      setGerandoNarrativa(false);
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

  if (!stakeholder) {
    return (
      <div className="text-center py-12">
        <Users className="w-12 h-12 mx-auto mb-4 text-slate-300" />
        <h3 className="text-lg font-medium text-slate-900">Stakeholder não encontrado</h3>
        <Link to={createPageUrl('Stakeholders')}>
          <Button className="mt-4" variant="outline">Voltar</Button>
        </Link>
      </div>
    );
  }

  const tipo = tipoConfig[stakeholder.tipo] || tipoConfig.pessoa;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link to={createPageUrl('Stakeholders')}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-16 h-16 rounded-full bg-[#2D6A4F] flex items-center justify-center text-white text-3xl">
              {stakeholder.tipo === 'pessoa' ? '👤' : '🏢'}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{stakeholder.nome}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className={tipo.color}>
                  {tipo.label}
                </Badge>
                {stakeholder.subtipo && (
                  <Badge variant="outline">
                    {subtipoConfig[stakeholder.subtipo]}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="perfil">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="perfil">Perfil</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="notas">Notas</TabsTrigger>
              <TabsTrigger value="registros">Registros ({registros.length})</TabsTrigger>
              <TabsTrigger value="vinculos">Vínculos</TabsTrigger>
            </TabsList>

            <TabsContent value="perfil" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#2D6A4F]" />
                    Perfil Narrativo
                  </CardTitle>
                  <Button
                    onClick={gerarNarrativa}
                    disabled={gerandoNarrativa}
                    size="sm"
                    className="bg-[#2D6A4F] hover:bg-[#1B4332]"
                  >
                    {gerandoNarrativa ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    {narrativa ? 'Atualizar' : 'Gerar Perfil'}
                  </Button>
                </CardHeader>
                <CardContent>
                  {narrativa ? (
                    <div>
                      <Textarea
                        value={narrativa}
                        onChange={(e) => setNarrativa(e.target.value)}
                        rows={20}
                        className="font-serif text-sm leading-relaxed whitespace-pre-wrap"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={() => {
                          navigator.clipboard.writeText(narrativa);
                          alert('✓ Copiado!');
                        }}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Copiar Texto
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-500">
                      <FileText className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                      <p>Clique em "Gerar Perfil" para criar uma análise completa</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="registros" className="space-y-3">
              {registros.length === 0 ? (
                <Card className="p-12 text-center">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-500">Nenhum registro encontrado</p>
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

            <TabsContent value="timeline" className="space-y-4">
              <HistoricoInteracoes 
                timeline={stakeholder.timeline_interacoes || []}
                registros={registros}
                casos={casos}
              />
            </TabsContent>

            <TabsContent value="notas" className="space-y-4">
              <NotasCustomizadas stakeholder={stakeholder} />
            </TabsContent>

            <TabsContent value="vinculos" className="space-y-4">
              {/* Vínculos com Registros */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Registros Vinculados ({registros.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {registros.length === 0 ? (
                    <p className="text-center text-slate-500 py-8">Nenhum registro vinculado</p>
                  ) : (
                    <div className="space-y-2">
                      {registros.slice(0, 5).map(r => (
                        <Link key={r.id} to={createPageUrl('VerRegistro') + `?id=${r.id}`}>
                          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100">
                            <LinkIcon className="w-4 h-4 text-blue-600" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-900">{r.titulo}</p>
                              <p className="text-xs text-slate-500">
                                {new Date(r.created_date).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Vínculos com Casos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Casos Vinculados ({casos.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {casos.length === 0 ? (
                    <p className="text-center text-slate-500 py-8">Nenhum caso vinculado</p>
                  ) : (
                    <div className="space-y-2">
                      {casos.map(c => (
                        <Link key={c.id} to={createPageUrl('VerCaso') + `?id=${c.id}`}>
                          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100">
                            <LinkIcon className="w-4 h-4 text-purple-600" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-900">{c.titulo}</p>
                              <div className="flex gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">{c.status}</Badge>
                                <Badge variant="outline" className="text-xs">{c.prioridade}</Badge>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Vínculos com Riscos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Riscos Vinculados ({riscos.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {riscos.length === 0 ? (
                    <p className="text-center text-slate-500 py-8">Nenhum risco vinculado</p>
                  ) : (
                    <div className="space-y-2">
                      {riscos.map(r => (
                        <div key={r.id} className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900">{r.titulo}</p>
                            <div className="flex gap-2 mt-1">
                              <Badge className={cn(
                                "text-xs",
                                r.nivel === 'critico' ? 'bg-red-100 text-red-700' :
                                r.nivel === 'alto' ? 'bg-orange-100 text-orange-700' :
                                r.nivel === 'moderado' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-green-100 text-green-700'
                              )}>
                                {r.nivel}
                              </Badge>
                              <Badge variant="outline" className="text-xs">{r.status}</Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="casos" className="space-y-3">
              {casos.length === 0 ? (
                <Card className="p-12 text-center">
                  <Target className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-500">Nenhum caso vinculado</p>
                </Card>
              ) : (
                casos.map(caso => (
                  <Card key={caso.id} className="hover:shadow-md transition-all">
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-slate-900">{caso.titulo}</h4>
                      <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                        {caso.descricao}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline">{caso.status}</Badge>
                        <Badge variant="outline">{caso.prioridade}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Score de Engajamento */}
          <ScoreEngajamento 
            stakeholder={stakeholder}
            registros={registros}
            casos={casos}
            riscos={riscos}
          />

          {/* Contatos Customizados */}
          <ContatosCustomizados stakeholder={stakeholder} />

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stakeholder.papel_social && (
                <div>
                  <div className="text-xs text-slate-500">Papel Social</div>
                  <div className="text-sm font-medium">{stakeholder.papel_social}</div>
                </div>
              )}
              <div>
                <div className="text-xs text-slate-500">Comunidade</div>
                <div className="text-sm font-medium flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {stakeholder.comunidade}
                </div>
              </div>
              {stakeholder.municipio && (
                <div>
                  <div className="text-xs text-slate-500">Município</div>
                  <div className="text-sm font-medium">{stakeholder.municipio}</div>
                </div>
              )}
              {stakeholder.organizacao && (
                <div>
                  <div className="text-xs text-slate-500">Organização</div>
                  <div className="text-sm font-medium flex items-center gap-1">
                    <Building className="w-3 h-3" />
                    {stakeholder.organizacao}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {stakeholder.contato && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contato</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {stakeholder.contato.telefone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-500" />
                    {stakeholder.contato.telefone}
                  </div>
                )}
                {stakeholder.contato.whatsapp && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-500" />
                    {stakeholder.contato.whatsapp}
                  </div>
                )}
                {stakeholder.contato.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-500" />
                    {stakeholder.contato.email}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Estatísticas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-xs text-slate-500">Interações</div>
                <div className="text-2xl font-bold text-slate-900">
                  {registros.length}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Influência</div>
                <Badge variant="outline" className="capitalize">
                  {stakeholder.nivel_influencia || 'média'}
                </Badge>
              </div>
              <div>
                <div className="text-xs text-slate-500">Atividade</div>
                <Badge variant="outline" className="capitalize">
                  {stakeholder.nivel_atividade || 'baixa'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}