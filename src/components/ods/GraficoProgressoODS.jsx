import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

export default function GraficoProgressoODS({ acoesPorODS, metas, odsInfo }) {
  // Dados para gráfico de barras
  const dadosBarras = Object.entries(acoesPorODS)
    .filter(([_, count]) => count > 0)
    .map(([numero, count]) => ({
      ods: `ODS ${numero}`,
      acoes: count,
      cor: odsInfo[numero].cor
    }))
    .sort((a, b) => b.acoes - a.acoes);

  // Dados para gráfico de pizza (status das metas)
  const statusMetas = metas.reduce((acc, meta) => {
    acc[meta.status] = (acc[meta.status] || 0) + 1;
    return acc;
  }, {});

  const dadosPizza = [
    { name: 'Em Andamento', value: statusMetas.em_andamento || 0, color: '#3B82F6' },
    { name: 'Atingidas', value: statusMetas.atingida || 0, color: '#10B981' },
    { name: 'Atrasadas', value: statusMetas.atrasada || 0, color: '#F59E0B' },
    { name: 'Pausadas', value: statusMetas.pausada || 0, color: '#6B7280' }
  ].filter(item => item.value > 0);

  // Dados para gráfico radar (progresso por dimensão)
  const dimensoes = [
    { dimensao: 'Social', ods: [1, 2, 3, 4, 5, 10] },
    { dimensao: 'Econômico', ods: [8, 9, 12] },
    { dimensao: 'Ambiental', ods: [6, 7, 11, 13, 14, 15] },
    { dimensao: 'Institucional', ods: [16, 17] }
  ];

  const dadosRadar = dimensoes.map(dim => {
    const totalAcoes = dim.ods.reduce((acc, ods) => acc + (acoesPorODS[ods] || 0), 0);
    return {
      dimensao: dim.dimensao,
      acoes: totalAcoes,
      fullMark: Math.max(...Object.values(acoesPorODS)) || 100
    };
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Barras */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ações por ODS</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dadosBarras}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="ods" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="acoes" fill="#3B82F6">
                  {dadosBarras.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.cor} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Pizza */}
        {metas.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Status das Metas</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={dadosPizza}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {dadosPizza.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Gráfico Radar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Distribuição por Dimensão</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={dadosRadar}>
              <PolarGrid />
              <PolarAngleAxis dataKey="dimensao" />
              <PolarRadiusAxis />
              <Radar name="Ações" dataKey="acoes" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}