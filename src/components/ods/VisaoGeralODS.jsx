import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Target, TrendingUp, CheckCircle2, AlertCircle } from 'lucide-react';

export default function VisaoGeralODS({ acoesPorODS, metas, odsInfo }) {
  const totalAcoes = Object.values(acoesPorODS).reduce((acc, val) => acc + val, 0);
  const odsComAcoes = Object.values(acoesPorODS).filter(val => val > 0).length;
  const metasAtingidas = metas.filter(m => m.status === 'atingida').length;
  const metasAtrasadas = metas.filter(m => m.status === 'atrasada').length;

  const top5ODS = Object.entries(acoesPorODS)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .filter(([_, count]) => count > 0);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total de Ações</p>
                <p className="text-3xl font-bold text-blue-600">{totalAcoes}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">ODS com Ações</p>
                <p className="text-3xl font-bold text-emerald-600">{odsComAcoes}/17</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <Target className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Metas Atingidas</p>
                <p className="text-3xl font-bold text-green-600">{metasAtingidas}/{metas.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Metas Atrasadas</p>
                <p className="text-3xl font-bold text-amber-600">{metasAtrasadas}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top 5 ODS */}
      <Card>
        <CardHeader>
          <CardTitle>Top 5 ODS com Mais Ações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {top5ODS.length > 0 ? top5ODS.map(([numero, count]) => {
            const info = odsInfo[numero];
            const percentual = totalAcoes > 0 ? (count / totalAcoes) * 100 : 0;
            
            return (
              <div key={numero} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg"
                      style={{ backgroundColor: info.cor }}
                    >
                      {info.icon}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">ODS {numero} - {info.nome}</p>
                      <p className="text-xs text-slate-500">{count} ações vinculadas</p>
                    </div>
                  </div>
                  <Badge style={{ backgroundColor: `${info.cor}20`, color: info.cor }}>
                    {Math.round(percentual)}%
                  </Badge>
                </div>
                <Progress value={percentual} style={{ backgroundColor: `${info.cor}20` }} />
              </div>
            );
          }) : (
            <p className="text-center text-slate-500 py-8">Nenhuma ação vinculada aos ODS ainda</p>
          )}
        </CardContent>
      </Card>

      {/* Metas em Destaque */}
      {metas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Metas em Destaque</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {metas.slice(0, 5).map(meta => {
              const info = odsInfo[meta.ods_numero];
              return (
                <div key={meta.id} className="p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0"
                      style={{ backgroundColor: info.cor }}
                    >
                      {info.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-sm text-slate-900">{meta.meta_descricao}</p>
                        <Badge 
                          variant={meta.status === 'atingida' ? 'default' : 'outline'}
                          className="flex-shrink-0"
                        >
                          {meta.percentual_conclusao}%
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {meta.valor_atual} de {meta.meta_quantitativa} {meta.unidade_medida}
                      </p>
                      <Progress value={meta.percentual_conclusao} className="mt-2" style={{ backgroundColor: `${info.cor}20` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}