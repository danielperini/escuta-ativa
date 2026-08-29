import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Clock, FileText, AlertCircle, CheckCircle2, Activity } from 'lucide-react';

export default function ContadorRegistrosRecentes({ registros = [] }) {
  const agora = new Date();
  const vinteCincoHorasAtras = new Date(agora.getTime() - (24.5 * 60 * 60 * 1000));

  const stats = React.useMemo(() => {
    const recentes = registros.filter(r => {
      const dataCriacao = r.created_date ? new Date(r.created_date) : null;
      const dataAtualizacao = r.updated_date ? new Date(r.updated_date) : null;
      return (dataCriacao && dataCriacao >= vinteCincoHorasAtras) ||
             (dataAtualizacao && dataAtualizacao >= vinteCincoHorasAtras);
    });

    const finalizados = registros.filter(r => r.status === 'finalizado').length;
    const rascunhos = registros.filter(r => r.status === 'rascunho').length;

    let devolutivasPendentes = 0;
    registros.forEach(r => {
      (r.demandas || []).forEach(d => {
        if (d.requer_devolutiva && !d.devolutiva_realizada) devolutivasPendentes++;
      });
    });

    return {
      total: registros.length,
      recentes: recentes.length,
      finalizados,
      rascunhos,
      devolutivasPendentes
    };
  }, [registros, vinteCincoHorasAtras]);

  const cards = [
    {
      label: 'Registros Atualizados',
      value: stats.recentes,
      sublabel: 'nas últimas 24h',
      icon: Clock,
      gradient: 'from-emerald-500 to-teal-600',
      ring: 'ring-emerald-200',
      text: 'text-emerald-600'
    },
    {
      label: 'Total de Registros',
      value: stats.total,
      sublabel: 'no sistema',
      icon: FileText,
      gradient: 'from-blue-500 to-indigo-600',
      ring: 'ring-blue-200',
      text: 'text-blue-600'
    },
    {
      label: 'Finalizados',
      value: stats.finalizados,
      sublabel: `${stats.total > 0 ? Math.round((stats.finalizados / stats.total) * 100) : 0}% do total`,
      icon: CheckCircle2,
      gradient: 'from-green-500 to-emerald-600',
      ring: 'ring-green-200',
      text: 'text-green-600'
    },
    {
      label: 'Devolutivas Pendentes',
      value: stats.devolutivasPendentes,
      sublabel: 'aguardando retorno',
      icon: AlertCircle,
      gradient: 'from-amber-500 to-orange-600',
      ring: 'ring-amber-200',
      text: 'text-amber-600'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <Card key={idx} className={`relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow`}>
            <CardContent className="p-4 md:p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs md:text-sm font-medium text-slate-500 truncate">
                    {card.label}
                  </p>
                  <p className={`text-2xl md:text-3xl font-bold mt-1 ${card.text}`}>
                    {card.value}
                  </p>
                  <p className="text-xs text-slate-400 mt-1 truncate">
                    {card.sublabel}
                  </p>
                </div>
                <div className={`shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-sm`}>
                  <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}