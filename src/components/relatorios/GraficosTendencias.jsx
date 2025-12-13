import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar, TrendingUp } from 'lucide-react';

const COLORS = ['#2D6A4F', '#40916C', '#52B788', '#74C69D', '#95D5B2', '#B7E4C7'];

export default function GraficosTendencias() {
  const [periodo, setPeriodo] = useState('6meses');

  const { data: registros = [], isLoading } = useQuery({
    queryKey: ['registros-tendencias'],
    queryFn: () => base44.entities.Registro.list('-created_date', 500)
  });

  const { data: temas = [] } = useQuery({
    queryKey: ['temas-tendencias'],
    queryFn: () => base44.entities.Tema.list()
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-96 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  // Filtrar por período
  const mesesAtras = periodo === '3meses' ? 3 : periodo === '6meses' ? 6 : 12;
  const dataLimite = new Date();
  dataLimite.setMonth(dataLimite.getMonth() - mesesAtras);

  const registrosFiltrados = registros.filter(r => 
    new Date(r.created_date) >= dataLimite
  );

  // 1. Evolução temporal de registros
  const registrosPorMes = {};
  registrosFiltrados.forEach(r => {
    const mes = new Date(r.created_date).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    registrosPorMes[mes] = (registrosPorMes[mes] || 0) + 1;
  });

  const dadosEvolucao = Object.entries(registrosPorMes).map(([mes, total]) => ({
    mes,
    total
  }));

  // 2. Registros por tipo
  const registrosPorTipo = registrosFiltrados.reduce((acc, r) => {
    acc[r.tipo] = (acc[r.tipo] || 0) + 1;
    return acc;
  }, {});

  const dadosTipo = Object.entries(registrosPorTipo).map(([tipo, valor]) => ({
    name: tipo?.replace('_', ' ').toUpperCase(),
    valor
  }));

  // 3. Temas mais mencionados
  const mencoesTemas = {};
  registrosFiltrados.forEach(r => {
    (r.temas_identificados || []).forEach(tema => {
      mencoesTemas[tema] = (mencoesTemas[tema] || 0) + 1;
    });
  });

  const top10Temas = Object.entries(mencoesTemas)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tema, mencoes]) => ({ tema, mencoes }));

  // 4. Evolução da matriz de materialidade
  const evolucaoMaterialidade = [];
  for (let i = mesesAtras - 1; i >= 0; i--) {
    const dataRef = new Date();
    dataRef.setMonth(dataRef.getMonth() - i);
    const mesAno = dataRef.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    
    const temasNoMes = temas.filter(t => {
      if (!t.ultima_mencao) return false;
      const dataUltimaMencao = new Date(t.ultima_mencao);
      return dataUltimaMencao <= dataRef;
    });

    const mediaRelComunidade = temasNoMes.length > 0 
      ? temasNoMes.reduce((sum, t) => sum + (t.relevancia_comunidade || 5), 0) / temasNoMes.length 
      : 0;
    
    const mediaRelEmpresa = temasNoMes.length > 0
      ? temasNoMes.reduce((sum, t) => sum + (t.relevancia_empresa || 5), 0) / temasNoMes.length
      : 0;

    evolucaoMaterialidade.push({
      mes: mesAno,
      comunidade: Math.round(mediaRelComunidade * 10) / 10,
      empresa: Math.round(mediaRelEmpresa * 10) / 10
    });
  }

  // 5. Distribuição de sentimento
  const sentimentos = registrosFiltrados.reduce((acc, r) => {
    if (r.sentimento) {
      acc[r.sentimento] = (acc[r.sentimento] || 0) + 1;
    }
    return acc;
  }, {});

  const dadosSentimento = Object.entries(sentimentos).map(([sentimento, valor]) => ({
    name: sentimento.charAt(0).toUpperCase() + sentimento.slice(1),
    value: valor
  }));

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Filtro de Período */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#2D6A4F]" />
          Tendências e Visualizações
        </h3>
        <Select value={periodo} onValueChange={setPeriodo}>
          <SelectTrigger className="w-full sm:w-40">
            <Calendar className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3meses">3 meses</SelectItem>
            <SelectItem value="6meses">6 meses</SelectItem>
            <SelectItem value="12meses">12 meses</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolução temporal */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Evolução de Registros</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dadosEvolucao}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#2D6A4F" 
                  strokeWidth={3}
                  name="Registros"
                  dot={{ fill: '#2D6A4F', r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Registros por tipo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribuição por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dadosTipo}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="valor"
                >
                  {dadosTipo.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top 10 temas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top 10 Temas</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={top10Temas} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="tema" type="category" tick={{ fontSize: 11 }} width={120} />
                <Tooltip />
                <Bar dataKey="mencoes" fill="#40916C" name="Menções" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Evolução Materialidade */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Evolução Materialidade</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={evolucaoMaterialidade}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} domain={[0, 10]} />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="comunidade" 
                  stroke="#2D6A4F" 
                  strokeWidth={2}
                  name="Rel. Comunidade"
                  dot={{ fill: '#2D6A4F' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="empresa" 
                  stroke="#74C69D" 
                  strokeWidth={2}
                  name="Rel. Empresa"
                  dot={{ fill: '#74C69D' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sentimentos */}
        {dadosSentimento.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Distribuição de Sentimento</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={dadosSentimento}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#2D6A4F" name="Registros">
                    {dadosSentimento.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={
                          entry.name === 'Positivo' ? '#52B788' :
                          entry.name === 'Negativo' ? '#EF4444' :
                          entry.name === 'Misto' ? '#F59E0B' : '#94A3B8'
                        } 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}