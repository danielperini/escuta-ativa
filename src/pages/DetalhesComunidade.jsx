import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, MapPin, Users, FileText, Target, TrendingUp,
  BarChart3, AlertTriangle, Calendar
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PainelConsolidadoComunidade from "@/components/comunidades/PainelConsolidadoComunidade";

export default function DetalhesComunidade() {
  const urlParams = new URLSearchParams(window.location.search);
  const comunidadeNome = urlParams.get('nome');

  const { data: registros = [], isLoading } = useQuery({
    queryKey: ['registros-comunidade', comunidadeNome],
    queryFn: async () => {
      const allRegistros = await base44.entities.Registro.list('-created_date', 500);
      return allRegistros.filter(r => r.comunidade === comunidadeNome);
    },
    enabled: !!comunidadeNome
  });

  const { data: stakeholders = [] } = useQuery({
    queryKey: ['stakeholders-comunidade', comunidadeNome],
    queryFn: async () => {
      const allStakeholders = await base44.entities.Stakeholder.list();
      return allStakeholders.filter(s => s.comunidade === comunidadeNome);
    },
    enabled: !!comunidadeNome
  });

  const { data: casos = [] } = useQuery({
    queryKey: ['casos-comunidade', comunidadeNome],
    queryFn: async () => {
      const allCasos = await base44.entities.Caso.list();
      return allCasos.filter(c => c.comunidade === comunidadeNome);
    },
    enabled: !!comunidadeNome
  });

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const temas = [...new Set(registros.flatMap(r => r.temas_identificados || []))];
  const demandas = registros.flatMap(r => r.demandas || []);
  const temperaturas = registros.map(r => r.temperatura_territorio).filter(Boolean);
  const temperaturaMedia = temperaturas.length > 0 
    ? Math.round((temperaturas.filter(t => t === 'alto' || t === 'critico').length / temperaturas.length) * 100)
    : 0;

  const casosAbertos = casos.filter(c => c.status !== 'concluido').length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link to={createPageUrl('Dashboard')}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-16 h-16 rounded-full bg-[#2D6A4F] flex items-center justify-center text-white text-2xl">
              <MapPin className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-slate-900">{comunidadeNome}</h2>
              <p className="text-slate-500 mt-1">Visão Consolidada da Comunidade</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Registros</p>
                <p className="text-2xl font-bold text-slate-900">{registros.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Stakeholders</p>
                <p className="text-2xl font-bold text-slate-900">{stakeholders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <Target className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Casos Abertos</p>
                <p className="text-2xl font-bold text-slate-900">{casosAbertos}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Temperatura</p>
                <p className="text-2xl font-bold text-slate-900">{temperaturaMedia}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabelas de Dados */}
      <Tabs defaultValue="painel">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5">
          <TabsTrigger value="painel">Painel Consolidado</TabsTrigger>
          <TabsTrigger value="registros">Registros</TabsTrigger>
          <TabsTrigger value="stakeholders">Stakeholders</TabsTrigger>
          <TabsTrigger value="casos">Casos</TabsTrigger>
          <TabsTrigger value="analise">Análise</TabsTrigger>
        </TabsList>
        <TabsContent value="painel" className="mt-4">
          <PainelConsolidadoComunidade comunidadeNome={comunidadeNome} />
        </TabsContent>

        <TabsContent value="registros" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Registros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 text-sm font-semibold">Data</th>
                      <th className="text-left p-3 text-sm font-semibold">Título</th>
                      <th className="text-left p-3 text-sm font-semibold">Tipo</th>
                      <th className="text-left p-3 text-sm font-semibold">Temperatura</th>
                      <th className="text-left p-3 text-sm font-semibold">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registros.map(r => (
                      <tr key={r.id} className="border-b hover:bg-slate-50">
                        <td className="p-3 text-sm">
                          {new Date(r.data_registro).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="p-3 text-sm font-medium">{r.titulo}</td>
                        <td className="p-3 text-sm capitalize">{r.tipo?.replace('_', ' ')}</td>
                        <td className="p-3 text-sm">
                          {r.temperatura_territorio && (
                            <Badge variant="outline" className="capitalize">
                              {r.temperatura_territorio}
                            </Badge>
                          )}
                        </td>
                        <td className="p-3">
                          <Link to={createPageUrl('VerRegistro') + `?id=${r.id}`}>
                            <Button size="sm" variant="ghost">Ver</Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stakeholders" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Stakeholders da Comunidade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 text-sm font-semibold">Nome</th>
                      <th className="text-left p-3 text-sm font-semibold">Tipo</th>
                      <th className="text-left p-3 text-sm font-semibold">Subtipo</th>
                      <th className="text-left p-3 text-sm font-semibold">Influência</th>
                      <th className="text-left p-3 text-sm font-semibold">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stakeholders.map(s => (
                      <tr key={s.id} className="border-b hover:bg-slate-50">
                        <td className="p-3 text-sm font-medium">{s.nome}</td>
                        <td className="p-3 text-sm capitalize">{s.tipo}</td>
                        <td className="p-3 text-sm capitalize">{s.subtipo?.replace('_', ' ')}</td>
                        <td className="p-3 text-sm">
                          <Badge variant="outline" className="capitalize">
                            {s.nivel_influencia || 'médio'}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Link to={createPageUrl('PerfilStakeholder') + `?id=${s.id}`}>
                            <Button size="sm" variant="ghost">Ver Perfil</Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="casos" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Casos da Comunidade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 text-sm font-semibold">Título</th>
                      <th className="text-left p-3 text-sm font-semibold">Tipo</th>
                      <th className="text-left p-3 text-sm font-semibold">Status</th>
                      <th className="text-left p-3 text-sm font-semibold">Prioridade</th>
                      <th className="text-left p-3 text-sm font-semibold">Prazo</th>
                      <th className="text-left p-3 text-sm font-semibold">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {casos.map(c => (
                      <tr key={c.id} className="border-b hover:bg-slate-50">
                        <td className="p-3 text-sm font-medium">{c.titulo}</td>
                        <td className="p-3 text-sm capitalize">{c.tipo?.replace('_', ' ')}</td>
                        <td className="p-3 text-sm">
                          <Badge variant="outline" className="capitalize">
                            {c.status?.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="p-3 text-sm">
                          <Badge variant="outline" className="capitalize">
                            {c.prioridade}
                          </Badge>
                        </td>
                        <td className="p-3 text-sm">
                          {c.prazo ? new Date(c.prazo).toLocaleDateString('pt-BR') : '-'}
                        </td>
                        <td className="p-3">
                          <Link to={createPageUrl('VerCaso') + `?id=${c.id}`}>
                            <Button size="sm" variant="ghost">Ver</Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analise" className="mt-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Temas Mais Frequentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {temas.slice(0, 15).map(tema => (
                    <Badge key={tema} variant="secondary" className="bg-emerald-100 text-emerald-700">
                      {tema}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Demandas Mais Recorrentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {demandas.slice(0, 10).map((d, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-sm font-medium">{d.descricao}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Urgência: <span className="capitalize">{d.urgencia}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}