import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Users, AlertTriangle } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { FAIXAS_ETARIAS_LABELS } from '@/lib/demografiaApi';

/**
 * Pirâmide Etária: barras horizontais com "Homens" à esquerda
 * (valores negativos só para visual) e "Mulheres" à direita.
 */
export default function PiramideEtaria({ dados, carregando, erro }) {
  // Transforma rows em estrutura [ {faixa, Homens, Mulheres} ]
  const chartData = useMemo(() => {
    if (!dados?.length) return [];
    const porFaixa = {};
    for (const r of dados) {
      const idx = r.faixa_index;
      if (idx < 0) continue;
      if (!porFaixa[idx]) porFaixa[idx] = { faixa: FAIXAS_ETARIAS_LABELS[idx] || r.faixa };
      if (r.sexo === 'Homens') porFaixa[idx].Homens = -r.valor;
      else if (r.sexo === 'Mulheres') porFaixa[idx].Mulheres = r.valor;
    }
    return Object.keys(porFaixa).map(Number).sort((a, b) => a - b).map(k => porFaixa[k]);
  }, [dados]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="w-5 h-5 text-primary" />
          Pirâmide Etária (Censo 2022)
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Distribuição da população por faixa etária e sexo
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
          <div style={{ width: '100%', height: 380 }}>
            <ResponsiveContainer>
              <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20, top: 10, bottom: 10 }}>
                <XAxis type="number" tickFormatter={v => Math.abs(v).toLocaleString('pt-BR')} />
                <YAxis dataKey="faixa" type="category" width={60}
                  tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(v) => Math.abs(v).toLocaleString('pt-BR')}
                  labelFormatter={(l) => `Faixa: ${l}`}
                  contentStyle={{ borderRadius: 8, fontSize: 12 }}
                />
                <ReferenceLine x={0} stroke="#94a3b8" />
                <Bar dataKey="Homens" name="Homens" fill="#3B82F6" radius={[0, 0, 0, 4]} />
                <Bar dataKey="Mulheres" name="Mulheres" fill="#EC4899" radius={[0, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-2">
          Fonte: IBGE — Censo Demográfico 2022 (SIDRA • agregado 9514).
        </p>
      </CardContent>
    </Card>
  );
}