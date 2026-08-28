import React, { useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  TrendingUp
} from 'lucide-react';
import { differenceInDays } from 'date-fns';

export default function EstatisticasDemandas({ demandas }) {
  const stats = useMemo(() => {
    const total = demandas.length;
    const pendentes = demandas.filter(d => (d.status || 'pendente') === 'pendente').length;
    const emAndamento = demandas.filter(d => d.status === 'em_andamento').length;
    const atendidas = demandas.filter(d => d.status === 'atendida').length;
    const naoAtendidas = demandas.filter(d => d.status === 'nao_atendida').length;
    
    const atrasadas = demandas.filter(d => {
      if (!d.prazo_devolutiva || d.devolutiva_realizada) return false;
      const prazoDate = new Date(d.prazo_devolutiva);
      if (isNaN(prazoDate.getTime())) return false;
      return differenceInDays(new Date(), prazoDate) > 0;
    }).length;

    const criticas = demandas.filter(d => d.urgencia === 'critica').length;

    const taxaConclusao = total > 0 ? ((atendidas / total) * 100).toFixed(1) : 0;

    return {
      total,
      pendentes,
      emAndamento,
      atendidas,
      naoAtendidas,
      atrasadas,
      criticas,
      taxaConclusao
    };
  }, [demandas]);

  const cards = [
    {
      titulo: 'Total de Demandas',
      valor: stats.total,
      icon: TrendingUp,
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    {
      titulo: 'Pendentes',
      valor: stats.pendentes,
      icon: Clock,
      color: 'text-slate-600',
      bg: 'bg-slate-50'
    },
    {
      titulo: 'Em Andamento',
      valor: stats.emAndamento,
      icon: AlertCircle,
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    {
      titulo: 'Atendidas',
      valor: stats.atendidas,
      icon: CheckCircle2,
      color: 'text-green-600',
      bg: 'bg-green-50',
      subtitle: `${stats.taxaConclusao}% taxa`
    },
    {
      titulo: 'Atrasadas',
      valor: stats.atrasadas,
      icon: AlertCircle,
      color: 'text-red-600',
      bg: 'bg-red-50'
    },
    {
      titulo: 'Críticas',
      valor: stats.criticas,
      icon: AlertCircle,
      color: 'text-red-600',
      bg: 'bg-red-50'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <Card key={idx}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${card.bg}`}>
                  <Icon className={`w-4 h-4 ${card.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900">{card.valor}</p>
              <p className="text-xs text-slate-600 mt-1">{card.titulo}</p>
              {card.subtitle && (
                <p className="text-xs text-slate-500 mt-1">{card.subtitle}</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}