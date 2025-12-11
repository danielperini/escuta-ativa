import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ArrowLeft,
  Shield,
  FileText,
  Clock,
  User,
  MapPin,
  Sparkles,
  CheckCircle,
  History,
  Download,
  Eye
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export default function AuditoriaRegistro() {
  const urlParams = new URLSearchParams(window.location.search);
  const registroId = urlParams.get('id');

  const { data: registro, isLoading } = useQuery({
    queryKey: ['registro', registroId],
    queryFn: async () => {
      const registros = await base44.entities.Registro.filter({ id: registroId });
      return registros[0];
    },
    enabled: !!registroId
  });

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (!registro) {
    return (
      <div className="text-center py-12">
        <Shield className="w-12 h-12 mx-auto mb-4 text-slate-300" />
        <h3 className="text-lg font-medium text-slate-900">Registro não encontrado</h3>
        <Link to={createPageUrl('Registros')}>
          <Button className="mt-4" variant="outline">Voltar</Button>
        </Link>
      </div>
    );
  }

  const auditoria = registro.auditoria || {};
  const preenchimentoAuto = registro.preenchimento_automatico || {};

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={createPageUrl(`VerRegistro?id=${registroId}`)}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-[#40916C]" />
            Log de Auditoria
          </h2>
          <p className="text-slate-500 mt-1">{registro.titulo}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Metadata básica */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">ID do Registro</p>
                  <p className="font-mono text-sm mt-1">{registro.id}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Criado por</p>
                  <p className="text-sm mt-1">{registro.created_by}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Data de Criação</p>
                  <p className="text-sm mt-1">
                    {format(new Date(registro.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Última Atualização</p>
                  <p className="text-sm mt-1">
                    {format(new Date(registro.updated_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
                {registro.localizacao && (
                  <div className="col-span-2">
                    <p className="text-sm text-slate-500">Geolocalização</p>
                    <p className="text-sm mt-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {registro.localizacao.lat}, {registro.localizacao.lng}
                      {registro.localizacao.endereco && ` - ${registro.localizacao.endereco}`}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Preenchimento automático */}
          {preenchimentoAuto.campos_preenchidos && (
            <Card className="border-emerald-200 bg-emerald-50/30">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-600" />
                  Preenchimento Automático via IA
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">Origem</p>
                    <Badge variant="secondary" className="mt-1 capitalize">
                      {preenchimentoAuto.origem}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Confiança</p>
                    <p className="font-semibold mt-1 text-emerald-700">
                      {Math.round((preenchimentoAuto.confianca || 0) * 100)}%
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-slate-500 mb-2">
                      Campos Preenchidos ({preenchimentoAuto.campos_preenchidos.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {preenchimentoAuto.campos_preenchidos.map((campo, idx) => (
                        <Badge key={idx} variant="secondary" className="bg-white">
                          {campo.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  {preenchimentoAuto.timestamp && (
                    <div className="col-span-2">
                      <p className="text-sm text-slate-500">Processado em</p>
                      <p className="text-sm mt-1">
                        {format(new Date(preenchimentoAuto.timestamp), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Arquivos originais */}
          {registro.arquivos?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Arquivos Originais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {registro.arquivos.map((arquivo, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="text-sm font-medium">{arquivo.nome}</p>
                        <p className="text-xs text-slate-500 capitalize">{arquivo.tipo}</p>
                      </div>
                    </div>
                    <a href={arquivo.url} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="sm" className="gap-1">
                        <Eye className="w-4 h-4" />
                        Ver
                      </Button>
                    </a>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Transcrição */}
          {registro.transcricao && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Transcrição Completa</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">
                    {registro.transcricao}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Histórico de alterações */}
          {auditoria.historico_alteracoes?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Histórico de Alterações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {auditoria.historico_alteracoes.map((alteracao, idx) => (
                    <div key={idx} className="border-l-2 border-slate-200 pl-4 py-2">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium">{alteracao.usuario}</span>
                        <span className="text-slate-500">•</span>
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-slate-500">
                          {format(new Date(alteracao.data), "dd/MM/yyyy HH:mm")}
                        </span>
                      </div>
                      <p className="text-sm mt-1">
                        <span className="font-medium">{alteracao.campo}:</span>
                        <span className="text-slate-500 line-through ml-2">{alteracao.valor_anterior}</span>
                        <span className="mx-2">→</span>
                        <span className="text-slate-700">{alteracao.valor_novo}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Insights da IA */}
          {auditoria.insights_ia?.length > 0 && (
            <Card className="border-[#40916C]/30 bg-[#D8F3DC]/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#40916C]" />
                  Insights da IA
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {auditoria.insights_ia.map((insight, idx) => (
                    <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-[#40916C] mt-0.5 flex-shrink-0" />
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Materialidade detectada */}
          {auditoria.materialidade_detectada?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Materialidade Detectada</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {auditoria.materialidade_detectada.map((material, idx) => (
                    <Badge key={idx} variant="secondary" className="bg-purple-100 text-purple-700">
                      {material}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Indicadores de risco */}
          {registro.indicadores_risco?.length > 0 && (
            <Card className="border-amber-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5 text-amber-600" />
                  Indicadores de Risco
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {registro.indicadores_risco.map((risco, idx) => (
                    <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                      <span>{risco}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-slate-500">Registro</p>
                <Badge variant="secondary" className="mt-1 capitalize">
                  {registro.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-slate-500">Sincronização</p>
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "mt-1 capitalize",
                    registro.status_sincronizacao === 'concluido' && "bg-emerald-100 text-emerald-700",
                    registro.status_sincronizacao === 'erro' && "bg-red-100 text-red-700"
                  )}
                >
                  {registro.status_sincronizacao || 'concluído'}
                </Badge>
              </div>
              {registro.temperatura_territorio && (
                <div>
                  <p className="text-sm text-slate-500">Temperatura do Território</p>
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      "mt-1 capitalize",
                      registro.temperatura_territorio === 'critico' && "bg-red-100 text-red-700",
                      registro.temperatura_territorio === 'alto' && "bg-orange-100 text-orange-700",
                      registro.temperatura_territorio === 'medio' && "bg-amber-100 text-amber-700",
                      registro.temperatura_territorio === 'baixo' && "bg-emerald-100 text-emerald-700"
                    )}
                  >
                    {registro.temperatura_territorio}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}