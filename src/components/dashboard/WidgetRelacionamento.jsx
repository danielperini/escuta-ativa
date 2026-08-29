import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Building2, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { relacionamentoLabel, relacionamentoBadgeClass } from '@/lib/relationshipClassification';

// Indicadores de Relacionamento (Comunitário / Institucional / Misto) para o Dashboard.
// Não substitui nenhum painel existente — apenas adiciona a dimensão.
export default function WidgetRelacionamento({ registros = [] }) {
  const stats = useMemo(() => {
    let comunitario = 0;
    let institucional = 0;
    let misto = 0;
    let naoClassificado = 0;
    const porTerritorio = {};
    for (const r of registros) {
      const c = r?.relationship_classification;
      const territorio = r?.localizacao?.municipio || r?.comunidade?.split(',')[0] || 'Sem território';
      if (!porTerritorio[territorio]) porTerritorio[territorio] = { comunitario: 0, institucional: 0, misto: 0 };
      if (!c) {
        naoClassificado++;
      } else if (c === 'COMUNITARIO') {
        comunitario++;
        porTerritorio[territorio].comunitario++;
      } else if (c === 'INSTITUCIONAL') {
        institucional++;
        porTerritorio[territorio].institucional++;
      } else if (c === 'COMUNITARIO_INSTITUCIONAL') {
        misto++;
        porTerritorio[territorio].misto++;
      }
    }
    const total = registros.length || 1;
    const topTerritorios = Object.entries(porTerritorio)
      .map(([nome, s]) => ({ nome, ...s, total: s.comunitario + s.institucional + s.misto }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
    return { comunitario, institucional, misto, naoClassificado, total, topTerritorios };
  }, [registros]);

  const cards = [
    { key: 'COMUNITARIO', valor: stats.comunitario, icon: Users, color: relacionamentoBadgeClass('COMUNITARIO') },
    { key: 'INSTITUCIONAL', valor: stats.institucional, icon: Building2, color: relacionamentoBadgeClass('INSTITUCIONAL') },
    { key: 'COMUNITARIO_INSTITUCIONAL', valor: stats.misto, icon: Layers, color: relacionamentoBadgeClass('COMUNITARIO_INSTITUCIONAL') },
  ];

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-slate-900">Relacionamento</h3>
          <p className="text-xs text-slate-500">Distribuição das atividades por tipo de relacionamento</p>
        </div>
        <Link to={createPageUrl('Registros')} className="text-xs text-blue-600 hover:underline">
          Ver registros
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {cards.map((c) => (
          <div key={c.key} className="rounded-lg border border-slate-200 p-3 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${c.color}`}>
              <c.icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-2xl font-bold text-slate-900 leading-none">{c.valor}</p>
              <p className="text-xs text-slate-500 truncate">{relacionamentoLabel(c.key)}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <Badge variant="outline" className="bg-slate-50">
          {stats.naoClassificado} não classificado(s)
        </Badge>
        <Badge variant="outline" className="bg-slate-50">
          {Math.round((stats.comunitario + stats.institucional + stats.misto) / stats.total * 100)}% classificado
        </Badge>
      </div>

      {stats.topTerritorios.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium text-slate-600 mb-2">Top territórios por relacionamento comunitário</p>
          <div className="space-y-1.5">
            {stats.topTerritorios.map((t) => (
              <div key={t.nome} className="flex items-center gap-2 text-xs">
                <span className="w-32 truncate text-slate-600">{t.nome}</span>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden flex">
                  <div className="bg-emerald-400" style={{ width: `${(t.comunitario / Math.max(t.total, 1)) * 100}%` }} />
                  <div className="bg-indigo-400" style={{ width: `${(t.institucional / Math.max(t.total, 1)) * 100}%` }} />
                  <div className="bg-teal-400" style={{ width: `${(t.misto / Math.max(t.total, 1)) * 100}%` }} />
                </div>
                <span className="w-10 text-right text-slate-500">{t.total}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}