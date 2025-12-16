import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Tag,
  FileText,
  Mic,
  Video,
  Camera,
  Download,
  Sparkles,
  Loader2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ExternalLink,
  Shield
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { BotoesExportacao } from "@/components/registro/ExportadorPDF";
import GeradorRelatorioCompleto from "@/components/registro/GeradorRelatorioCompleto";
import GoogleMapsViewer from "@/components/integracao/GoogleMapsViewer";
import { gerarCodigoUnico } from "@/components/codigos/GeradorCodigoUnico";

const tipoConfig = {
  reuniao: { label: 'Reunião', color: 'bg-purple-100 text-purple-700' },
  conversa_campo: { label: 'Conversa de Campo', color: 'bg-blue-100 text-blue-700' },
  ocorrencia: { label: 'Ocorrência', color: 'bg-red-100 text-red-700' },
  demanda: { label: 'Demanda', color: 'bg-amber-100 text-amber-700' },
  visita: { label: 'Visita', color: 'bg-emerald-100 text-emerald-700' }
};

const sentimentoConfig = {
  positivo: { label: 'Positivo', color: 'bg-emerald-100 text-emerald-700' },
  neutro: { label: 'Neutro', color: 'bg-slate-100 text-slate-700' },
  negativo: { label: 'Negativo', color: 'bg-red-100 text-red-700' },
  misto: { label: 'Misto', color: 'bg-amber-100 text-amber-700' }
};

const urgenciaConfig = {
  baixa: { color: 'bg-slate-100 text-slate-700' },
  media: { color: 'bg-blue-100 text-blue-700' },
  alta: { color: 'bg-orange-100 text-orange-700' },
  critica: { color: 'bg-red-100 text-red-700' }
};

export default function VerRegistro() {
  const urlParams = new URLSearchParams(window.location.search);
  const registroId = urlParams.get('id');
  const queryClient = useQueryClient();
  const [isGeneratingAta, setIsGeneratingAta] = useState(false);
  const [mostrarGerador, setMostrarGerador] = useState(false);

  const getNotaColor = (nota) => {
    if (nota >= 4) return 'bg-emerald-100 text-emerald-700 border-emerald-300';
    if (nota >= 3) return 'bg-blue-100 text-blue-700 border-blue-300';
    if (nota >= 2) return 'bg-amber-100 text-amber-700 border-amber-300';
    return 'bg-red-100 text-red-700 border-red-300';
  };

  const getNotaLabel = (nota) => {
    if (nota === 5) return 'Completo';
    if (nota >= 4) return 'Bom';
    if (nota >= 3) return 'Utilizável';
    if (nota >= 2) return 'Frágil';
    return 'Crítico';
  };

  const { data: registro, isLoading } = useQuery({
    queryKey: ['registro', registroId],
    queryFn: async () => {
      const registros = await base44.entities.Registro.filter({ id: registroId });
      const reg = registros[0];
      
      // Gerar código único se não existir
      if (reg && !reg.codigo_unico) {
        const codigo = await gerarCodigoUnico('RE', reg.comunidade);
        await base44.entities.Registro.update(reg.id, { codigo_unico: codigo });
        reg.codigo_unico = codigo;
      }
      
      return reg;
    },
    enabled: !!registroId
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Registro.update(registroId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registro', registroId] });
    }
  });

  const generateAta = async () => {
    if (!registro) return;
    setIsGeneratingAta(true);

    const prompt = `Gere uma ata formal de reunião/interação comunitária com base nas seguintes informações:

Título: ${registro.titulo}
Tipo: ${registro.tipo}
Data: ${registro.created_date ? format(new Date(registro.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'Não especificada'}
Comunidade: ${registro.comunidade || 'Não especificada'}
Participantes: ${registro.participantes?.join(', ') || 'Não especificados'}

Descrição:
${registro.descricao || 'Não fornecida'}

Temas Abordados:
${registro.temas_identificados?.join(', ') || 'Não identificados'}

Demandas da Comunidade:
${registro.demandas?.map(d => `- ${d.descricao} (Urgência: ${d.urgencia})`).join('\n') || 'Nenhuma'}

Compromissos Assumidos:
${registro.compromissos?.map(c => `- ${c.descricao} (Responsável: ${c.responsavel}, Prazo: ${c.prazo || 'A definir'})`).join('\n') || 'Nenhum'}

Próximos Passos:
${registro.proximos_passos?.join('\n- ') || 'Não definidos'}

Gere uma ata formal e profissional em português, formatada em Markdown, incluindo:
1. Cabeçalho com data, local e tipo de reunião
2. Lista de participantes
3. Pauta/Agenda
4. Pontos discutidos
5. Demandas apresentadas pela comunidade
6. Compromissos assumidos com prazos e responsáveis
7. Encaminhamentos e próximos passos
8. Encerramento`;

    const result = await base44.integrations.Core.InvokeLLM({ prompt });
    
    updateMutation.mutate({ ata_gerada: result });
    setIsGeneratingAta(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (!registro) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 mx-auto mb-4 text-slate-300" />
        <h3 className="text-lg font-medium text-slate-900">Registro não encontrado</h3>
        <Link to={createPageUrl('Registros')}>
          <Button className="mt-4" variant="outline">Voltar para Registros</Button>
        </Link>
      </div>
    );
  }

  const tipo = tipoConfig[registro.tipo] || tipoConfig.visita;
  const sentimento = sentimentoConfig[registro.sentimento];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1">
          <Link to={createPageUrl('Registros')}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-slate-900">{registro.titulo}</h2>
              {registro.codigo_unico && (
                <Badge variant="outline" className="text-sm font-mono bg-slate-100">
                  {registro.codigo_unico}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <Badge variant="secondary" className={cn(tipo.color)}>
                {tipo.label}
              </Badge>
              {sentimento && (
                <Badge variant="secondary" className={cn(sentimento.color)}>
                  {sentimento.label}
                </Badge>
              )}
              <span className="flex items-center gap-1 text-sm text-slate-500">
                <Calendar className="w-4 h-4" />
                {registro.created_date ? format(new Date(registro.created_date), "dd MMM yyyy 'às' HH:mm", { locale: ptBR }) : 'Data não disponível'}
              </span>
              {registro.comunidade && (
                <span className="flex items-center gap-1 text-sm text-slate-500">
                  <MapPin className="w-4 h-4" />
                  {registro.comunidade}
                </span>
              )}
            </div>

            {/* Metadados de Autoria */}
            <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t text-xs text-slate-500">
              {registro.created_by && (
                <span>Criado por: <span className="font-medium text-slate-700">{registro.created_by}</span></span>
              )}
              {registro.created_date && (
                <span>em {format(new Date(registro.created_date), "dd/MM/yyyy 'às' HH:mm")}</span>
              )}
              {registro.updated_date && registro.updated_date !== registro.created_date && (
                <>
                  <span>•</span>
                  <span>Última atualização: {format(new Date(registro.updated_date), "dd/MM/yyyy 'às' HH:mm")}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button 
            onClick={() => setMostrarGerador(true)}
            className="bg-[#2D6A4F] hover:bg-[#1B4332] gap-2"
            size="sm"
          >
            <FileText className="w-4 h-4" />
            Gerar Relatório
          </Button>
          <BotoesExportacao registro={registro} />
          <Link to={createPageUrl(`AuditoriaRegistro?id=${registro.id}`)}>
            <Button variant="outline" size="sm" className="gap-2">
              <Shield className="w-4 h-4" />
              Ver Auditoria
            </Button>
          </Link>
        </div>
      </div>

      {/* Nota de Qualidade */}
      {registro.nota_qualidade !== undefined && (
        <Card className={cn("border-2", getNotaColor(registro.nota_qualidade))}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium">Nota de Qualidade do Registro</p>
                {registro.observacao_validacao && (
                  <p className="text-xs mt-1 opacity-80">
                    {registro.observacao_validacao}
                  </p>
                )}
                {registro.validado_em && (
                  <p className="text-xs mt-1 opacity-70">
                    Validado em {format(new Date(registro.validado_em), "dd/MM/yyyy 'às' HH:mm")}
                  </p>
                )}
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{registro.nota_qualidade}/5</div>
                <div className="text-sm font-medium mt-1">{getNotaLabel(registro.nota_qualidade)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {registro.descricao && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Descrição</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700 whitespace-pre-wrap">{registro.descricao}</p>
              </CardContent>
            </Card>
          )}

          {/* Transcription */}
          {registro.transcricao && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Transcrição</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700 whitespace-pre-wrap">{registro.transcricao}</p>
              </CardContent>
            </Card>
          )}

          {/* Demandas */}
          {registro.demandas?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Demandas da Comunidade
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {registro.demandas.map((demanda, idx) => (
                  <div key={idx} className={cn(
                    "p-4 rounded-lg border-l-4",
                    demanda.urgencia === 'critica' ? 'border-l-red-500 bg-red-50' :
                    demanda.urgencia === 'alta' ? 'border-l-orange-500 bg-orange-50' :
                    demanda.urgencia === 'media' ? 'border-l-amber-500 bg-amber-50' :
                    'border-l-slate-400 bg-slate-50'
                  )}>
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-slate-700">{demanda.descricao}</p>
                      <Badge variant="secondary" className={cn("shrink-0", urgenciaConfig[demanda.urgencia]?.color)}>
                        {demanda.urgencia}
                      </Badge>
                    </div>
                    {demanda.status && (
                      <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
                        {demanda.status === 'concluida' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Clock className="w-4 h-4" />
                        )}
                        <span className="capitalize">{demanda.status.replace('_', ' ')}</span>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Compromissos */}
          {registro.compromissos?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  Compromissos Assumidos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {registro.compromissos.map((compromisso, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-lg">
                    <p className="font-medium text-slate-900">{compromisso.descricao}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {compromisso.responsavel}
                      </span>
                      {compromisso.prazo && new Date(compromisso.prazo).getTime() && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(compromisso.prazo), "dd/MM/yyyy")}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Generated Ata */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#40916C]" />
                Ata Gerada
              </CardTitle>
              <Button
                onClick={generateAta}
                disabled={isGeneratingAta}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                {isGeneratingAta ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {registro.ata_gerada ? 'Regenerar' : 'Gerar Ata'}
              </Button>
            </CardHeader>
            <CardContent>
              {registro.ata_gerada ? (
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-slate-700 bg-slate-50 p-4 rounded-lg">
                    {registro.ata_gerada}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <FileText className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p>Clique em "Gerar Ata" para criar uma ata automática</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Participantes */}
          {registro.participantes?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Participantes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {registro.participantes.map((p, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-[#2D6A4F] flex items-center justify-center text-white text-sm font-medium">
                        {p[0]?.toUpperCase()}
                      </div>
                      <span className="text-sm text-slate-700">{p}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Temas */}
          {registro.temas_identificados?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Tag className="w-5 h-5" />
                  Temas Identificados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {registro.temas_identificados.map((tema, idx) => (
                    <Badge key={idx} variant="secondary" className="bg-emerald-100 text-emerald-700">
                      {tema}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Próximos Passos */}
          {registro.proximos_passos?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Próximos Passos</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {registro.proximos_passos.map((passo, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      {passo}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Mapa de Localização */}
          {(registro.localizacao?.lat || registro.local) && (
            <GoogleMapsViewer
              endereco={registro.local}
              lat={registro.localizacao?.lat}
              lng={registro.localizacao?.lng}
              titulo="Local do Registro"
            />
          )}

          {/* Arquivos */}
          {registro.arquivos?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Anexos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {registro.arquivos.map((arquivo, idx) => (
                  <div key={idx}>
                    <a
                      href={arquivo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      {arquivo.tipo === 'audio' && <Mic className="w-5 h-5 text-emerald-500" />}
                      {arquivo.tipo === 'video' && <Video className="w-5 h-5 text-purple-500" />}
                      {arquivo.tipo === 'imagem' && <Camera className="w-5 h-5 text-blue-500" />}
                      {arquivo.tipo === 'documento' && <FileText className="w-5 h-5 text-amber-500" />}
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-slate-700 block truncate">{arquivo.nome}</span>
                        {arquivo.codigo_documento && (
                          <span className="text-xs font-mono text-slate-500">{arquivo.codigo_documento}</span>
                        )}
                      </div>
                      <ExternalLink className="w-4 h-4 text-slate-400" />
                    </a>
                    {arquivo.transcricao && (
                      <div className="mt-2 ml-8 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <p className="text-xs font-semibold text-emerald-900 mb-1">
                          <CheckCircle2 className="w-3 h-3 inline mr-1" />
                          Transcrição PT-BR:
                        </p>
                        <p className="text-xs text-slate-700 whitespace-pre-wrap">{arquivo.transcricao}</p>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Histórico de Atualizações */}
      {registro.auditoria?.historico_alteracoes && registro.auditoria.historico_alteracoes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              📜 Histórico de Atualizações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {registro.auditoria.historico_alteracoes.map((alteracao, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-900">
                        {alteracao.tipo_operacao || 'Atualização'}
                      </span>
                      {alteracao.data_alteracao && (
                        <span className="text-xs text-slate-500">
                          {format(new Date(alteracao.data_alteracao), "dd/MM/yyyy 'às' HH:mm")}
                        </span>
                      )}
                    </div>
                    {alteracao.campo_alterado && (
                      <p className="text-xs text-slate-600">
                        Campo: <span className="font-medium">{alteracao.campo_alterado}</span>
                      </p>
                    )}
                    {alteracao.valor_anterior && alteracao.valor_novo && (
                      <div className="text-xs text-slate-600 mt-1">
                        <span className="line-through text-red-500">{alteracao.valor_anterior}</span>
                        {' → '}
                        <span className="text-emerald-600 font-medium">{alteracao.valor_novo}</span>
                      </div>
                    )}
                    {alteracao.usuario_responsavel && (
                      <p className="text-xs text-slate-500 mt-1">
                        Por: {alteracao.usuario_responsavel}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gerador de Relatório */}
      <GeradorRelatorioCompleto 
        registro={registro}
        open={mostrarGerador}
        onOpenChange={setMostrarGerador}
      />
    </div>
  );
}