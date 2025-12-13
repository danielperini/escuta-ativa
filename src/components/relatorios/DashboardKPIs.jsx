import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  FileText, Briefcase, Users, AlertTriangle, 
  TrendingUp, TrendingDown, CheckCircle 
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardKPIs() {
  const { data: registros = [], isLoading: loadingRegistros } = useQuery({
    queryKey: ['registros-kpi'],
    queryFn: () => base44.entities.Registro.list()
  });

  const { data: casos = [], isLoading: loadingCasos } = useQuery({
    queryKey: ['casos-kpi'],
    queryFn: () => base44.entities.Caso.list()
  });

  const { data: stakeholders = [], isLoading: loadingStakeholders } = useQuery({
    queryKey: ['stakeholders-kpi'],
    queryFn: () => base44.entities.Stakeholder.list()
  });

  const { data: compromissos = [], isLoading: loadingCompromissos } = useQuery({
    queryKey: ['compromissos-kpi'],
    queryFn: () => base44.entities.Compromisso.list()
  });

  if (loadingRegistros || loadingCasos || loadingStakeholders || loadingCompromissos) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array(8).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    );
  }

  // Calcular métricas
  const registrosUltimos30Dias = registros.filter(r => {
    const dias = Math.floor((new Date() - new Date(r.created_date)) / (1000 * 60 * 60 * 24));
    return dias <= 30;
  }).length;

  const registros30A60Dias = registros.filter(r => {
    const dias = Math.floor((new Date() - new Date(r.created_date)) / (1000 * 60 * 60 * 24));
    return dias > 30 && dias <= 60;
  }).length;

  const tendenciaRegistros = registrosUltimos30Dias > registros30A60Dias ? 'up' : 
                              registrosUltimos30Dias < registros30A60Dias ? 'down' : 'stable';

  const casosAbertos = casos.filter(c => ['em_aberto', 'pendente', 'em_andamento'].includes(c.status)).length;
  const casosAtrasados = casos.filter(c => {
    if (!c.prazo || ['concluido', 'cancelado'].includes(c.status)) return false;
    return new Date(c.prazo) < new Date();
  }).length;

  const stakeholdersAtivos = stakeholders.filter(s => {
    if (!s.ultima_interacao) return false;
    const dias = Math.floor((new Date() - new Date(s.ultima_interacao)) / (1000 * 60 * 60 * 24));
    return dias <= 90;
  }).length;

  const compromissosPendentes = compromissos.filter(c => c.status === 'pendente').length;
  const compromissosAtrasados = compromissos.filter(c => {
    if (!c.prazo || c.status !== 'pendente') return false;
    return new Date(c.prazo) < new Date();
  }).length;

  const taxaCumprimento = compromissos.length > 0 
    ? Math.round((compromissos.filter(c => c.status === 'concluido').length / compromissos.length) * 100)
    : 0;

  const demandasPendentes = registros.reduce((acc, r) => 
    acc + (r.demandas?.filter(d => d.status === 'pendente').length || 0), 0
  );

  const kpis = [
    {
      titulo: 'Total de Registros',
      valor: registros.length,
      subtitulo: `${registrosUltimos30Dias} nos últimos 30 dias`,
      icone: FileText,
      color: 'blue',
      tendencia: tendenciaRegistros
    },
    {
      titulo: 'Casos Abertos',
      valor: casosAbertos,
      subtitulo: casosAtrasados > 0 ? `${casosAtrasados} atrasados` : 'Nenhum atrasado',
      icone: Briefcase,
      color: casosAtrasados > 0 ? 'red' : 'emerald',
      alerta: casosAtrasados > 0
    },
    {
      titulo: 'Stakeholders Ativos',
      valor: stakeholdersAtivos,
      subtitulo: `de ${stakeholders.length} total`,
      icone: Users,
      color: 'purple'
    },
    {
      titulo: 'Demandas Pendentes',
      valor: demandasPendentes,
      subtitulo: 'Aguardando devolutiva',
      icone: AlertTriangle,
      color: demandasPendentes > 10 ? 'amber' : 'slate',
      alerta: demandasPendentes > 10
    },
    {
      titulo: 'Compromissos Pendentes',
      valor: compromissosPendentes,
      subtitulo: compromissosAtrasados > 0 ? `${compromissosAtrasados} atrasados` : 'No prazo',
      icone: CheckCircle,
      color: compromissosAtrasados > 0 ? 'orange' : 'emerald',
      alerta: compromissosAtrasados > 0
    },
    {
      titulo: 'Taxa de Cumprimento',
      valor: `${taxaCumprimento}%`,
      subtitulo: 'Compromissos cumpridos',
      icone: CheckCircle,
      color: taxaCumprimento >= 80 ? 'emerald' : taxaCumprimento >= 60 ? 'amber' : 'red'
    }
  ];

  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600',
    amber: 'bg-amber-100 text-amber-600',
    orange: 'bg-orange-100 text-orange-600',
    slate: 'bg-slate-100 text-slate-600'
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {kpis.map((kpi, index) => {
        const Icon = kpi.icone;
        
        return (
          <Card 
            key={index} 
            className={cn(
              "hover:shadow-lg transition-all",
              kpi.alerta && "border-2 border-red-300 bg-red-50/30"
            )}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-slate-500 mb-1">{kpi.titulo}</p>
                  <div className="flex items-center gap-3">
                    <p className="text-3xl font-bold text-slate-900">{kpi.valor}</p>
                    {kpi.tendencia && (
                      <div className={cn(
                        "flex items-center gap-1 text-sm",
                        kpi.tendencia === 'up' ? "text-emerald-600" :
                        kpi.tendencia === 'down' ? "text-red-600" : "text-slate-400"
                      )}>
                        {kpi.tendencia === 'up' && <TrendingUp className="w-4 h-4" />}
                        {kpi.tendencia === 'down' && <TrendingDown className="w-4 h-4" />}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{kpi.subtitulo}</p>
                </div>
                <div className={cn(
                  "p-3 rounded-lg",
                  colorClasses[kpi.color]
                )}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}