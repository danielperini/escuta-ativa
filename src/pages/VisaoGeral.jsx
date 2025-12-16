import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  FileText, 
  Users, 
  AlertTriangle, 
  Calendar, 
  CheckSquare, 
  MapPin,
  TrendingUp,
  Target,
  Clock,
  Activity
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import GraficosKPIAvancados from "@/components/dashboard/GraficosKPIAvancados";
import ExportadorDados from "@/components/shared/ExportadorDados";
import { Skeleton } from "@/components/ui/skeleton";

export default function VisaoGeral() {
  const { data: registros = [], isLoading: loadingRegistros } = useQuery({
    queryKey: ['registros-visao'],
    queryFn: () => base44.entities.Registro.list('-created_date', 500)
  });

  const { data: atores = [], isLoading: loadingAtores } = useQuery({
    queryKey: ['atores-visao'],
    queryFn: () => base44.entities.Ator.list()
  });

  const { data: riscos = [], isLoading: loadingRiscos } = useQuery({
    queryKey: ['riscos-visao'],
    queryFn: () => base44.entities.RiscoSocial.list()
  });

  const { data: compromissos = [], isLoading: loadingCompromissos } = useQuery({
    queryKey: ['compromissos-visao'],
    queryFn: () => base44.entities.Compromisso.list()
  });

  const { data: agendas = [], isLoading: loadingAgendas } = useQuery({
    queryKey: ['agendas-visao'],
    queryFn: () => base44.entities.Agenda.list()
  });

  const { data: comunidades = [], isLoading: loadingComunidades } = useQuery({
    queryKey: ['comunidades-visao'],
    queryFn: () => base44.entities.Comunidade.list()
  });

  const isLoading = loadingRegistros || loadingAtores || loadingRiscos || loadingCompromissos || loadingAgendas || loadingComunidades;

  // KPIs Consolidados
  const kpis = {
    totalRegistros: registros.length,
    demandasPendentes: registros.reduce((acc, r) => 
      acc + (r.demandas?.filter(d => d.status === 'pendente').length || 0), 0
    ),
    totalAtores: atores.length,
    riscosAtivos: riscos.filter(r => r.status === 'ativo').length,
    riscosCriticos: riscos.filter(r => r.status === 'ativo' && r.nivel === 'critico').length,
    compromissosPendentes: compromissos.filter(c => c.status === 'pendente').length,
    compromissosAtrasados: compromissos.filter(c => {
      if (c.status !== 'pendente' || !c.prazo) return false;
      return new Date(c.prazo) < new Date();
    }).length,
    agendasProximas: agendas.filter(a => {
      if (!['confirmada', 'prevista'].includes(a.status)) return false;
      const data = new Date(a.data);
      const hoje = new Date();
      const proximos7dias = new Date();
      proximos7dias.setDate(hoje.getDate() + 7);
      return data >= hoje && data <= proximos7dias;
    }).length,
    totalComunidades: comunidades.length,
    registrosRecentes: registros.filter(r => {
      const data = new Date(r.created_date);
      const dias30 = new Date();
      dias30.setDate(dias30.getDate() - 30);
      return data >= dias30;
    }).length
  };

  // Dados para exportação
  const dadosExportacao = [
    { indicador: 'Total de Registros', valor: kpis.totalRegistros },
    { indicador: 'Demandas Pendentes', valor: kpis.demandasPendentes },
    { indicador: 'Total de Atores', valor: kpis.totalAtores },
    { indicador: 'Riscos Ativos', valor: kpis.riscosAtivos },
    { indicador: 'Riscos Críticos', valor: kpis.riscosCriticos },
    { indicador: 'Compromissos Pendentes', valor: kpis.compromissosPendentes },
    { indicador: 'Compromissos Atrasados', valor: kpis.compromissosAtrasados },
    { indicador: 'Agendas Próximas (7 dias)', valor: kpis.agendasProximas },
    { indicador: 'Total de Comunidades', valor: kpis.totalComunidades },
    { indicador: 'Registros Últimos 30 dias', valor: kpis.registrosRecentes }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Visão Geral</h2>
          <p className="text-slate-500 mt-1">Dashboard consolidado do sistema</p>
        </div>
        <ExportadorDados
          dados={dadosExportacao}
          colunas={[
            { key: 'indicador', label: 'Indicador' },
            { key: 'valor', label: 'Valor' }
          ]}
          nomeArquivo="visao_geral"
          titulo="Visão Geral - Dashboard Consolidado"
        />
      </div>

      {/* KPIs Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array(8).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Total de Registros</p>
                  <p className="text-3xl font-bold text-slate-900">{kpis.totalRegistros}</p>
                  <Badge variant="secondary" className="mt-2 text-xs">
                    {kpis.registrosRecentes} nos últimos 30 dias
                  </Badge>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Demandas Pendentes</p>
                  <p className="text-3xl font-bold text-amber-600">{kpis.demandasPendentes}</p>
                  <Link to={createPageUrl('Registros')}>
                    <Button variant="link" className="p-0 h-auto mt-2 text-xs">
                      Ver detalhes →
                    </Button>
                  </Link>
                </div>
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Total de Atores</p>
                  <p className="text-3xl font-bold text-slate-900">{kpis.totalAtores}</p>
                  <Link to={createPageUrl('Atores')}>
                    <Button variant="link" className="p-0 h-auto mt-2 text-xs">
                      Ver mapa →
                    </Button>
                  </Link>
                </div>
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow border-red-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Riscos Ativos</p>
                  <p className="text-3xl font-bold text-red-600">{kpis.riscosAtivos}</p>
                  {kpis.riscosCriticos > 0 && (
                    <Badge className="mt-2 bg-red-600">
                      {kpis.riscosCriticos} críticos
                    </Badge>
                  )}
                </div>
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Compromissos Pendentes</p>
                  <p className="text-3xl font-bold text-slate-900">{kpis.compromissosPendentes}</p>
                  {kpis.compromissosAtrasados > 0 && (
                    <Badge variant="destructive" className="mt-2">
                      {kpis.compromissosAtrasados} atrasados
                    </Badge>
                  )}
                </div>
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckSquare className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Agendas Próximas</p>
                  <p className="text-3xl font-bold text-slate-900">{kpis.agendasProximas}</p>
                  <Link to={createPageUrl('Agenda')}>
                    <Button variant="link" className="p-0 h-auto mt-2 text-xs">
                      Ver agenda →
                    </Button>
                  </Link>
                </div>
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Comunidades</p>
                  <p className="text-3xl font-bold text-slate-900">{kpis.totalComunidades}</p>
                  <Link to={createPageUrl('ComunidadesGrupos')}>
                    <Button variant="link" className="p-0 h-auto mt-2 text-xs">
                      Ver todas →
                    </Button>
                  </Link>
                </div>
                <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-teal-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow bg-gradient-to-br from-[#2D6A4F] to-[#1B4332]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/80 mb-1">Taxa de Atividade</p>
                  <p className="text-3xl font-bold text-white">
                    {kpis.totalRegistros > 0 ? 
                      ((kpis.registrosRecentes / kpis.totalRegistros) * 100).toFixed(0) : 0}%
                  </p>
                  <p className="text-xs text-white/70 mt-2">Últimos 30 dias</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Gráficos Interativos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#2D6A4F]" />
            Análise Visual de KPIs
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Array(4).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-64" />
              ))}
            </div>
          ) : (
            <GraficosKPIAvancados
              registros={registros}
              atores={atores}
              riscos={riscos}
              compromissos={compromissos}
            />
          )}
        </CardContent>
      </Card>

      {/* Alertas Críticos */}
      {(kpis.riscosCriticos > 0 || kpis.compromissosAtrasados > 0) && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-900">
              <AlertTriangle className="w-5 h-5" />
              Alertas Críticos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {kpis.riscosCriticos > 0 && (
              <div className="bg-white p-4 rounded-lg border border-red-200">
                <p className="font-medium text-red-900">
                  {kpis.riscosCriticos} risco(s) crítico(s) requer(em) atenção imediata
                </p>
                <Link to={createPageUrl('Materialidade')}>
                  <Button variant="link" className="p-0 h-auto text-red-600 text-sm">
                    Ver detalhes dos riscos →
                  </Button>
                </Link>
              </div>
            )}
            {kpis.compromissosAtrasados > 0 && (
              <div className="bg-white p-4 rounded-lg border border-red-200">
                <p className="font-medium text-red-900">
                  {kpis.compromissosAtrasados} compromisso(s) atrasado(s)
                </p>
                <Link to={createPageUrl('Compromissos')}>
                  <Button variant="link" className="p-0 h-auto text-red-600 text-sm">
                    Ver compromissos atrasados →
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}