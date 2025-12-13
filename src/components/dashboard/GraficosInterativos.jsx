import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar, TrendingUp, Users, CheckSquare, Target } from 'lucide-react';
import { format, subDays, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const CORES_GRAFICOS = [
  '#2D6A4F', '#40916C', '#52B788', '#74C69D', '#95D5B2',
  '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#EF4444',
  '#10B981', '#06B6D4', '#6366F1', '#F97316', '#14B8A6'
];

export default function GraficosInterativos() {
  const [periodo, setPeriodo] = useState('30'); // dias
  const [comunidadeFiltro, setComunidadeFiltro] = useState('todas');

  const { data: registros = [] } = useQuery({
    queryKey: ['registros'],
    queryFn: () => base44.entities.Registro.list('-created_date', 500)
  });

  const { data: casos = [] } = useQuery({
    queryKey: ['casos'],
    queryFn: () => base44.entities.Caso.list('-created_date', 300)
  });

  const { data: comunidades = [] } = useQuery({
    queryKey: ['comunidades'],
    queryFn: () => base44.entities.Comunidade.list()
  });

  const { data: equipes = [] } = useQuery({
    queryKey: ['equipes'],
    queryFn: () => base44.entities.Equipe.list()
  });

  // Filtrar dados por período
  const dataLimite = subDays(new Date(), parseInt(periodo));
  const registrosFiltrados = registros.filter(r => {
    const dataReg = r.created_date ? new Date(r.created_date) : new Date();
    const dentroPerio = dataReg >= dataLimite;
    const dentroComunidade = comunidadeFiltro === 'todas' || r.comunidade === comunidadeFiltro;
    return dentroPerio && dentroComunidade;
  });

  const casosFiltrados = casos.filter(c => {
    const dataCase = c.created_date ? new Date(c.created_date) : new Date();
    const dentroPerio = dataCase >= dataLimite;
    const dentroComunidade = comunidadeFiltro === 'todas' || c.comunidade === comunidadeFiltro;
    return dentroPerio && dentroComunidade;
  });

  // Dados: Registros por Tipo
  const registrosPorTipo = registrosFiltrados.reduce((acc, r) => {
    const tipo = r.tipo || 'outros';
    acc[tipo] = (acc[tipo] || 0) + 1;
    return acc;
  }, {});

  const dadosRegistrosTipo = Object.entries(registrosPorTipo).map(([tipo, count]) => ({
    tipo: tipo.replace(/_/g, ' ').charAt(0).toUpperCase() + tipo.slice(1).replace(/_/g, ' '),
    quantidade: count
  }));

  // Dados: Registros por Comunidade (Top 10)
  const registrosPorComunidade = registrosFiltrados.reduce((acc, r) => {
    const com = r.comunidade || 'Não informado';
    acc[com] = (acc[com] || 0) + 1;
    return acc;
  }, {});

  const dadosRegistrosComunidade = Object.entries(registrosPorComunidade)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([comunidade, count]) => ({
      comunidade,
      quantidade: count
    }));

  // Dados: Status de Casos
  const casosPorStatus = casosFiltrados.reduce((acc, c) => {
    const status = c.status || 'em_aberto';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const dadosCasosStatus = Object.entries(casosPorStatus).map(([status, count]) => ({
    status: status.replace(/_/g, ' ').charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' '),
    quantidade: count
  }));

  // Dados: Tendência temporal (últimos 7 dias)
  const ultimos7Dias = Array.from({ length: 7 }, (_, i) => {
    const data = subDays(new Date(), 6 - i);
    return format(data, 'dd/MM', { locale: ptBR });
  });

  const registrosPorDia = registrosFiltrados.reduce((acc, r) => {
    const dataReg = r.created_date ? new Date(r.created_date) : new Date();
    const dia = format(dataReg, 'dd/MM', { locale: ptBR });
    acc[dia] = (acc[dia] || 0) + 1;
    return acc;
  }, {});

  const dadosTendencia = ultimos7Dias.map(dia => ({
    dia,
    registros: registrosPorDia[dia] || 0
  }));

  // Dados: Desempenho de Equipes
  const dadosEquipes = equipes.map((equipe, idx) => {
    const registrosEquipe = registrosFiltrados.filter(r => 
      equipe.comunidades_atendidas?.includes(r.comunidade)
    ).length;

    const metaRegistros = equipe.metas?.registros_mes || 0;
    const percentual = metaRegistros > 0 ? Math.round((registrosEquipe / metaRegistros) * 100) : 0;

    return {
      nome: equipe.nome,
      registros: registrosEquipe,
      meta: metaRegistros,
      percentual,
      cor: CORES_GRAFICOS[idx % CORES_GRAFICOS.length]
    };
  }).filter(e => e.meta > 0);

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              <Select value={periodo} onValueChange={setPeriodo}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Últimos 7 dias</SelectItem>
                  <SelectItem value="30">Últimos 30 dias</SelectItem>
                  <SelectItem value="90">Últimos 3 meses</SelectItem>
                  <SelectItem value="180">Últimos 6 meses</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-500" />
              <Select value={comunidadeFiltro} onValueChange={setComunidadeFiltro}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas Comunidades</SelectItem>
                  {comunidades.map(c => (
                    <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="registros" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="registros">Registros</TabsTrigger>
          <TabsTrigger value="casos">Casos</TabsTrigger>
          <TabsTrigger value="tendencias">Tendências</TabsTrigger>
          <TabsTrigger value="equipes">Equipes</TabsTrigger>
        </TabsList>

        {/* Registros por Tipo e Comunidade */}
        <TabsContent value="registros" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Registros por Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dadosRegistrosTipo}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="tipo" angle={-45} textAnchor="end" height={80} fontSize={12} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="quantidade" fill="#2D6A4F" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top 10 Comunidades</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dadosRegistrosComunidade} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="comunidade" type="category" width={100} fontSize={11} />
                    <Tooltip />
                    <Bar dataKey="quantidade" fill="#40916C" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Status de Casos */}
        <TabsContent value="casos" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Casos por Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={dadosCasosStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ status, quantidade }) => `${status}: ${quantidade}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="quantidade"
                    >
                      {dadosCasosStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CORES_GRAFICOS[index % CORES_GRAFICOS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Distribuição de Casos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dadosCasosStatus.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: CORES_GRAFICOS[idx % CORES_GRAFICOS.length] }}
                        />
                        <span className="text-sm">{item.status}</span>
                      </div>
                      <span className="font-semibold">{item.quantidade}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tendências */}
        <TabsContent value="tendencias" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Tendência de Registros (Últimos 7 Dias)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dadosTendencia}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dia" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="registros" 
                    stroke="#2D6A4F" 
                    strokeWidth={3}
                    name="Registros"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Desempenho de Equipes */}
        <TabsContent value="equipes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="w-5 h-5" />
                Desempenho vs. Metas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dadosEquipes.length === 0 ? (
                <p className="text-center text-slate-500 py-8">
                  Nenhuma equipe com metas definidas
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dadosEquipes}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="nome" angle={-45} textAnchor="end" height={80} fontSize={11} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="registros" fill="#2D6A4F" name="Registros Realizados" />
                    <Bar dataKey="meta" fill="#95D5B2" name="Meta" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dadosEquipes.map((equipe, idx) => (
              <Card key={idx}>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm">{equipe.nome}</h4>
                      <span className={`text-xs font-bold ${equipe.percentual >= 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {equipe.percentual}%
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Realizado: {equipe.registros}</span>
                        <span>Meta: {equipe.meta}</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full transition-all"
                          style={{ 
                            width: `${Math.min(equipe.percentual, 100)}%`,
                            backgroundColor: equipe.cor
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}