import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  FileText, 
  Users, 
  CheckSquare, 
  Target, 
  Plus,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  MapPin
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import StatCard from '@/components/dashboard/StatCard';
import Termometro from '@/components/dashboard/Termometro';
import CompromissoCard from '@/components/dashboard/CompromissoCard';
import DemandaUrgente from '@/components/dashboard/DemandaUrgente';
import AtorCard from '@/components/dashboard/AtorCard';

export default function Dashboard() {
  const { data: registros = [], isLoading: loadingRegistros } = useQuery({
    queryKey: ['registros'],
    queryFn: () => base44.entities.Registro.list('-created_date', 50)
  });

  const { data: compromissos = [], isLoading: loadingCompromissos } = useQuery({
    queryKey: ['compromissos'],
    queryFn: () => base44.entities.Compromisso.list('-created_date', 20)
  });

  const { data: atores = [], isLoading: loadingAtores } = useQuery({
    queryKey: ['atores'],
    queryFn: () => base44.entities.Ator.list('-created_date', 10)
  });

  const { data: comunidades = [] } = useQuery({
    queryKey: ['comunidades'],
    queryFn: () => base44.entities.Comunidade.list()
  });

  const { data: temas = [] } = useQuery({
    queryKey: ['temas'],
    queryFn: () => base44.entities.Tema.list('-mencoes_total', 10)
  });

  // Calculate stats
  const registrosUltimos30Dias = registros.filter(r => {
    const date = new Date(r.created_date);
    const now = new Date();
    const diff = (now - date) / (1000 * 60 * 60 * 24);
    return diff <= 30;
  });

  const compromissosPendentes = compromissos.filter(c => 
    c.status === 'pendente' || c.status === 'em_andamento'
  );

  const demandasUrgentes = registros.flatMap(r => 
    (r.demandas || [])
      .filter(d => (d.urgencia === 'alta' || d.urgencia === 'critica') && d.status !== 'concluida')
      .map(d => ({ ...d, registro: r }))
  );

  // Calculate overall social thermometer
  const calcularTermometro = () => {
    if (comunidades.length === 0) return 'baixo';
    const niveis = { baixo: 1, medio: 2, alto: 3, critico: 4 };
    const avg = comunidades.reduce((sum, c) => sum + (niveis[c.termometro_social] || 1), 0) / comunidades.length;
    if (avg >= 3.5) return 'critico';
    if (avg >= 2.5) return 'alto';
    if (avg >= 1.5) return 'medio';
    return 'baixo';
  };

  const atoresAtivos = atores.filter(a => a.nivel_atividade === 'alto' || a.nivel_atividade === 'moderado');

  const isLoading = loadingRegistros || loadingCompromissos || loadingAtores;

  return (
    <div className="space-y-8">
      {/* Header with quick action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Visão Geral</h2>
          <p className="text-slate-500 mt-1">Acompanhe as interações e demandas comunitárias</p>
        </div>
        <Link to={createPageUrl('NovoRegistro')}>
          <Button className="bg-[#2D6A4F] hover:bg-[#1B4332] gap-2">
            <Plus className="w-4 h-4" />
            Novo Registro
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))
        ) : (
          <>
            <StatCard
              title="Registros (30 dias)"
              value={registrosUltimos30Dias.length}
              icon={FileText}
              variant="info"
              trendValue={`${registros.length} total`}
            />
            <StatCard
              title="Compromissos Pendentes"
              value={compromissosPendentes.length}
              icon={CheckSquare}
              variant={compromissosPendentes.length > 10 ? 'warning' : 'default'}
            />
            <StatCard
              title="Demandas Urgentes"
              value={demandasUrgentes.length}
              icon={AlertTriangle}
              variant={demandasUrgentes.length > 0 ? 'danger' : 'success'}
            />
            <StatCard
              title="Atores Mapeados"
              value={atores.length}
              icon={Users}
              variant="default"
              trendValue={`${atoresAtivos.length} ativos`}
            />
          </>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Termômetro */}
          <Termometro nivel={calcularTermometro()} />

          {/* Demandas Urgentes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Demandas Urgentes
              </CardTitle>
              <Link to={createPageUrl('Registros')}>
                <Button variant="ghost" size="sm" className="gap-1 text-slate-500">
                  Ver todas <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                Array(3).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded-lg" />
                ))
              ) : demandasUrgentes.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <AlertTriangle className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p>Nenhuma demanda urgente no momento</p>
                </div>
              ) : (
                demandasUrgentes.slice(0, 5).map((demanda, idx) => (
                  <DemandaUrgente key={idx} demanda={demanda} registro={demanda.registro} />
                ))
              )}
            </CardContent>
          </Card>

          {/* Pautas Ativas (Temas) */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Target className="w-5 h-5 text-[#40916C]" />
                Pautas Ativas
              </CardTitle>
              <Link to={createPageUrl('Materialidade')}>
                <Button variant="ghost" size="sm" className="gap-1 text-slate-500">
                  Ver matriz <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {temas.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Target className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p>Nenhum tema identificado ainda</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {temas.slice(0, 6).map((tema) => (
                    <div 
                      key={tema.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          tema.tendencia === 'subindo' ? 'bg-red-500' :
                          tema.tendencia === 'caindo' ? 'bg-emerald-500' : 'bg-amber-500'
                        }`} />
                        <span className="font-medium text-slate-700">{tema.nome}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-slate-500">{tema.mencoes_total || 0} menções</span>
                        {tema.tendencia === 'subindo' && (
                          <TrendingUp className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Compromissos Pendentes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-lg font-semibold">Compromissos</CardTitle>
              <Link to={createPageUrl('Compromissos')}>
                <Button variant="ghost" size="sm" className="gap-1 text-slate-500">
                  Ver todos <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                Array(3).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-28 rounded-lg" />
                ))
              ) : compromissosPendentes.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <CheckSquare className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p>Nenhum compromisso pendente</p>
                </div>
              ) : (
                compromissosPendentes.slice(0, 4).map((compromisso) => (
                  <CompromissoCard 
                    key={compromisso.id} 
                    compromisso={compromisso}
                    onClick={() => window.location.href = createPageUrl(`Compromissos?id=${compromisso.id}`)}
                  />
                ))
              )}
            </CardContent>
          </Card>

          {/* Atores Ativos */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-lg font-semibold">Atores Ativos</CardTitle>
              <Link to={createPageUrl('Atores')}>
                <Button variant="ghost" size="sm" className="gap-1 text-slate-500">
                  Ver todos <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                Array(3).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-24 rounded-lg" />
                ))
              ) : atoresAtivos.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p>Nenhum ator com atividade recente</p>
                </div>
              ) : (
                atoresAtivos.slice(0, 3).map((ator) => (
                  <AtorCard 
                    key={ator.id} 
                    ator={ator}
                    onClick={() => window.location.href = createPageUrl(`Atores?id=${ator.id}`)}
                  />
                ))
              )}
            </CardContent>
          </Card>

          {/* Comunidades */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-lg font-semibold">Comunidades</CardTitle>
              <Link to={createPageUrl('Mapa')}>
                <Button variant="ghost" size="sm" className="gap-1 text-slate-500">
                  Ver mapa <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-2">
              {comunidades.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <MapPin className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p>Nenhuma comunidade cadastrada</p>
                </div>
              ) : (
                comunidades.slice(0, 5).map((comunidade) => (
                  <div 
                    key={comunidade.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50"
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span className="font-medium text-slate-700">{comunidade.nome}</span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      comunidade.termometro_social === 'critico' ? 'bg-red-100 text-red-700' :
                      comunidade.termometro_social === 'alto' ? 'bg-orange-100 text-orange-700' :
                      comunidade.termometro_social === 'medio' ? 'bg-amber-100 text-amber-700' :
                      'bg-emerald-100 text-emerald-700'
                    }`}>
                      {comunidade.termometro_social || 'baixo'}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}