import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Users, FileText, CheckCircle2, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const COLORS = ['#2D6A4F', '#E31E24', '#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899'];

export default function GraficosKPIAvancados({ registros = [], atores = [], riscos = [], compromissos = [] }) {
  // Dados: Demandas Abertas vs Resolvidas
  const demandasStats = registros.reduce((acc, r) => {
    r.demandas?.forEach(d => {
      if (d.status === 'pendente') acc.abertas++;
      else if (d.status === 'atendida') acc.resolvidas++;
    });
    return acc;
  }, { abertas: 0, resolvidas: 0 });

  const dadosDemandas = [
    { name: 'Abertas', value: demandasStats.abertas, color: '#F59E0B' },
    { name: 'Resolvidas', value: demandasStats.resolvidas, color: '#2D6A4F' }
  ];

  // Dados: Distribuição de Atores por Tipo
  const atoresPorTipo = atores.reduce((acc, a) => {
    const tipo = a.tipo || 'outro';
    acc[tipo] = (acc[tipo] || 0) + 1;
    return acc;
  }, {});

  const dadosAtores = Object.entries(atoresPorTipo).map(([tipo, count]) => ({
    name: tipo.charAt(0).toUpperCase() + tipo.slice(1),
    value: count
  }));

  // Dados: Tempo Médio de Resposta (últimos registros)
  const tempoResposta = registros
    .filter(r => r.demandas?.length > 0)
    .slice(0, 10)
    .map(r => {
      const tempoMedio = r.demandas
        .filter(d => d.devolutiva_realizada && d.prazo_devolutiva)
        .reduce((acc, d) => {
          const prazo = new Date(d.prazo_devolutiva);
          const devolutiva = new Date(d.data_devolutiva);
          const dias = Math.ceil((devolutiva - prazo) / (1000 * 60 * 60 * 24));
          return acc + Math.abs(dias);
        }, 0) / (r.demandas.filter(d => d.devolutiva_realizada).length || 1);
      
      return {
        titulo: r.titulo?.substring(0, 20) + '...',
        dias: Math.round(tempoMedio)
      };
    });

  // Dados: Distribuição de Riscos por Nível
  const riscosPorNivel = riscos
    .filter(r => r.status === 'ativo')
    .reduce((acc, r) => {
      acc[r.nivel] = (acc[r.nivel] || 0) + 1;
      return acc;
    }, {});

  const dadosRiscos = [
    { name: 'Baixo', value: riscosPorNivel.baixo || 0, color: '#3B82F6' },
    { name: 'Médio', value: riscosPorNivel.medio || 0, color: '#F59E0B' },
    { name: 'Alto', value: riscosPorNivel.alto || 0, color: '#E31E24' },
    { name: 'Crítico', value: riscosPorNivel.critico || 0, color: '#991B1B' }
  ];

  // Dados: Status de Compromissos
  const compromissosPorStatus = compromissos.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {});

  const dadosCompromissos = [
    { name: 'Pendente', value: compromissosPorStatus.pendente || 0 },
    { name: 'Em Andamento', value: compromissosPorStatus.em_andamento || 0 },
    { name: 'Concluído', value: compromissosPorStatus.concluido || 0 }
  ];

  // Taxa de resolução
  const taxaResolucao = demandasStats.abertas + demandasStats.resolvidas > 0
    ? ((demandasStats.resolvidas / (demandasStats.abertas + demandasStats.resolvidas)) * 100).toFixed(1)
    : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Demandas: Abertas vs Resolvidas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="text-base">Demandas: Status</span>
            <Badge variant="secondary" className="text-xs">
              Taxa de Resolução: {taxaResolucao}%
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={dadosDemandas}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {dadosDemandas.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#F59E0B]" />
              <span className="text-xs text-slate-600">Abertas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#2D6A4F]" />
              <span className="text-xs text-slate-600">Resolvidas</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Distribuição de Atores por Tipo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Distribuição de Atores por Tipo</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dadosAtores}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#2D6A4F" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Tempo Médio de Resposta */}
      {tempoResposta.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tempo Médio de Resposta (dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={tempoResposta}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="titulo" tick={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="dias" stroke="#3B82F6" strokeWidth={2} dot={{ fill: '#3B82F6' }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Riscos Ativos por Nível */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Riscos Ativos por Nível</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={dadosRiscos}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
              >
                {dadosRiscos.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Status de Compromissos */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Status dos Compromissos</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={dadosCompromissos}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2D6A4F" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#2D6A4F" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="value" stroke="#2D6A4F" fillOpacity={1} fill="url(#colorValue)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}