import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Palette, AlertTriangle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

/**
 * Distribuição da população por cor ou raça (Censo 2022 / 2010).
 * Rosca com rótulos e tabela numérica abaixo.
 */
export default function DistribuicaoCorRaca({ dados, carregando, erro }) {
  const chartData = useMemo(() => (dados || []).map(d => ({
    name: d.nome, value: d.valor, fill: d.cor
  })), [dados]);

  const total = chartData.reduce((s, d) => s + (d.value || 0), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Palette className="w-5 h-5 text-primary" />
          Distribuição por Cor/Raça (Censo 2022)
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Composição racial da população residente
        </p>
      </CardHeader>
      <CardContent>
        {carregando ? (
          <div className="flex items-center justify-center h-72">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : erro ? (
          <div className="flex flex-col items-center justify-center h-72 text-center">
            <AlertTriangle className="w-10 h-10 text-amber-500 mb-2" />
            <p className="text-sm text-muted-foreground">{erro}</p>
          </div>
        ) : chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-16">Sem dados para o filtro selecionado.</p>
        ) : (
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                  innerRadius={60} outerRadius={110} paddingAngle={2}>
                  {chartData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.fill} stroke="#fff" strokeWidth={1.5} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v, name) => [Number(v).toLocaleString('pt-BR'), name]}
                  contentStyle={{ borderRadius: 8, fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Tabela numérica */}
        {!carregando && dados?.length > 0 && (
          <div className="mt-4 space-y-1.5">
            {dados.map((d) => {
              const pct = total > 0 ? ((d.valor / total) * 100).toFixed(1) : '0';
              return (
                <div key={d.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: d.cor }} />
                    <span className="text-foreground">{d.nome}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium">{d.valor.toLocaleString('pt-BR')}</span>
                    <span className="text-muted-foreground ml-2">({pct}%)</span>
                  </div>
                </div>
              );
            })}
            <div className="flex items-center justify-between text-sm font-semibold pt-2 border-t mt-2">
              <span>Total</span>
              <span>{total.toLocaleString('pt-BR')}</span>
            </div>
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-3">
          Fonte: IBGE — Censo Demográfico 2022 (SIDRA • agregado 9605).
        </p>
      </CardContent>
    </Card>
  );
}