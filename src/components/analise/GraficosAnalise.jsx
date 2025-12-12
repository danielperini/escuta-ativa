import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, MapPin, MessageSquare, AlertTriangle, Calendar } from 'lucide-react';

const COLORS = ['#2D6A4F', '#40916C', '#52B788', '#74C69D', '#95D5B2', '#B7E4C7', '#D8F3DC'];

export default function GraficosAnalise() {
  const [filterComunidade, setFilterComunidade] = useState('todos');
  const [filterTema, setFilterTema] = useState('todos');
  const [filterSentimento, setFilterSentimento] = useState('todos');
  const [filterPeriodo, setFilterPeriodo] = useState('30');

  const { data: registros = [] } = useQuery({
    queryKey: ['registros-graficos'],
    queryFn: () => base44.entities.Registro.list('-created_date', 500)
  });

  const { data: stakeholders = [] } = useQuery({
    queryKey: ['stakeholders-graficos'],
    queryFn: () => base44.entities.Stakeholder.list()
  });

  // Extrair comunidades únicas dos registros
  const comunidadesRegistros = [...new Set(registros.map(r => r.comunidade).filter(Boolean))].sort();

  const { data: temas = [] } = useQuery({
    queryKey: ['temas'],
    queryFn: () => base44.entities.Tema.list()
  });

  // Filtrar registros
  const registrosFiltrados = registros.filter(r => {
    const dataRegistro = new Date(r.created_date || r.data_registro);
    const diasAtras = parseInt(filterPeriodo);
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - diasAtras);

    const dentroDataLimite = dataRegistro >= dataLimite;
    const matchComunidade = filterComunidade === 'todos' || r.comunidade === filterComunidade;
    const matchTema = filterTema === 'todos' || (r.temas_identificados && r.temas_identificados.includes(filterTema));
    const matchSentimento = filterSentimento === 'todos' || r.sentimento === filterSentimento;

    return dentroDataLimite && matchComunidade && matchTema && matchSentimento;
  });

  // Dados por comunidade
  const dadosPorComunidade = Object.entries(
    registrosFiltrados.reduce((acc, r) => {
      if (r.comunidade) {
        acc[r.comunidade] = (acc[r.comunidade] || 0) + 1;
      }
      return acc;
    }, {})
  ).map(([nome, total]) => ({ nome, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  // Dados por tema
  const dadosPorTema = Object.entries(
    registrosFiltrados.reduce((acc, r) => {
      (r.temas_identificados || []).forEach(tema => {
        acc[tema] = (acc[tema] || 0) + 1;
      });
      return acc;
    }, {})
  ).map(([nome, total]) => ({ nome, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  // Evolução temporal
  const evolucaoTemporal = registrosFiltrados.reduce((acc, r) => {
    const data = new Date(r.created_date || r.data_registro);
    const mes = `${data.getMonth() + 1}/${data.getFullYear()}`;
    acc[mes] = (acc[mes] || 0) + 1;
    return acc;
  }, {});

  const dadosEvolucao = Object.entries(evolucaoTemporal)
    .map(([mes, total]) => ({ mes, total }))
    .sort((a, b) => {
      const [ma, ya] = a.mes.split('/').map(Number);
      const [mb, yb] = b.mes.split('/').map(Number);
      return ya !== yb ? ya - yb : ma - mb;
    });

  // Sentimento
  const dadosSentimento = Object.entries(
    registrosFiltrados.reduce((acc, r) => {
      if (r.sentimento) {
        acc[r.sentimento] = (acc[r.sentimento] || 0) + 1;
      }
      return acc;
    }, {})
  ).map(([nome, value]) => ({ nome, value }));

  // Temperatura do território
  const dadosTemperatura = Object.entries(
    registrosFiltrados.reduce((acc, r) => {
      if (r.temperatura_territorio) {
        acc[r.temperatura_territorio] = (acc[r.temperatura_territorio] || 0) + 1;
      }
      return acc;
    }, {})
  ).map(([nome, value]) => ({ nome, value }));

  // Tipos de stakeholder
  const dadosTipoStakeholder = Object.entries(
    stakeholders.reduce((acc, s) => {
      if (s.tipo) {
        acc[s.tipo] = (acc[s.tipo] || 0) + 1;
      }
      return acc;
    }, {})
  ).map(([nome, value]) => ({ nome, value }));

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label>Comunidade</Label>
              <Select value={filterComunidade} onValueChange={setFilterComunidade}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  {comunidadesRegistros.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Tema</Label>
              <Select value={filterTema} onValueChange={setFilterTema}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {temas.map(t => (
                    <SelectItem key={t.id} value={t.nome}>{t.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Sentimento</Label>
              <Select value={filterSentimento} onValueChange={setFilterSentimento}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="positivo">Positivo</SelectItem>
                  <SelectItem value="neutro">Neutro</SelectItem>
                  <SelectItem value="negativo">Negativo</SelectItem>
                  <SelectItem value="misto">Misto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Período</Label>
              <Select value={filterPeriodo} onValueChange={setFilterPeriodo}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Últimos 7 dias</SelectItem>
                  <SelectItem value="30">Últimos 30 dias</SelectItem>
                  <SelectItem value="90">Últimos 90 dias</SelectItem>
                  <SelectItem value="180">Últimos 6 meses</SelectItem>
                  <SelectItem value="365">Último ano</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas resumidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-[#2D6A4F]" />
              <div>
                <p className="text-sm text-slate-500">Registros</p>
                <p className="text-2xl font-bold">{registrosFiltrados.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <MapPin className="w-8 h-8 text-[#40916C]" />
              <div>
                <p className="text-sm text-slate-500">Comunidades</p>
                <p className="text-2xl font-bold">{new Set(registrosFiltrados.map(r => r.comunidade).filter(Boolean)).size}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-[#52B788]" />
              <div>
                <p className="text-sm text-slate-500">Stakeholders</p>
                <p className="text-2xl font-bold">{stakeholders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-[#74C69D]" />
              <div>
                <p className="text-sm text-slate-500">Temas</p>
                <p className="text-2xl font-bold">{dadosPorTema.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Registros por Comunidade</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dadosPorComunidade}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nome" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" fill="#2D6A4F" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Temas Mais Discutidos</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dadosPorTema} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="nome" type="category" width={120} />
                <Tooltip />
                <Bar dataKey="total" fill="#40916C" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Evolução Temporal</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dadosEvolucao}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="#2D6A4F" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribuição de Sentimento</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={dadosSentimento} dataKey="value" nameKey="nome" cx="50%" cy="50%" outerRadius={100} label>
                  {dadosSentimento.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Temperatura do Território</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={dadosTemperatura} dataKey="value" nameKey="nome" cx="50%" cy="50%" outerRadius={100} label>
                  {dadosTemperatura.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tipos de Stakeholder</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={dadosTipoStakeholder} dataKey="value" nameKey="nome" cx="50%" cy="50%" outerRadius={100} label>
                  {dadosTipoStakeholder.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}