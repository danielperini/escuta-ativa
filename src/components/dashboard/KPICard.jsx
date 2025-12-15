import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function KPICard({ titulo, valor, icone: Icone, tendencia, percentual, cor, descricao, onClick }) {
  const getTrendIcon = () => {
    if (tendencia === 'up') return <TrendingUp className="w-4 h-4" />;
    if (tendencia === 'down') return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  const getTrendColor = () => {
    if (tendencia === 'up') return 'text-emerald-600';
    if (tendencia === 'down') return 'text-red-600';
    return 'text-slate-500';
  };

  return (
    <Card 
      className={cn(
        "relative overflow-hidden transition-all hover:shadow-lg cursor-pointer group",
        onClick && "active:scale-95"
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-600 mb-2">{titulo}</p>
            <p className="text-3xl font-bold text-slate-900 mb-1">{valor}</p>
            {percentual !== undefined && (
              <div className={cn("flex items-center gap-1 text-sm font-medium", getTrendColor())}>
                {getTrendIcon()}
                <span>{percentual}%</span>
                <span className="text-xs text-slate-500 ml-1">vs. mês anterior</span>
              </div>
            )}
            {descricao && (
              <p className="text-xs text-slate-500 mt-2">{descricao}</p>
            )}
          </div>
          <div 
            className={cn(
              "p-3 rounded-lg transition-transform group-hover:scale-110",
              cor || "bg-blue-100"
            )}
          >
            <Icone className="w-6 h-6" style={{ color: cor?.replace('bg-', '').replace('-100', '-600') || '#2563eb' }} />
          </div>
        </div>
      </CardContent>
      <div 
        className="absolute bottom-0 left-0 w-full h-1"
        style={{ 
          background: `linear-gradient(90deg, ${cor?.replace('bg-', '').replace('-100', '-500') || '#3b82f6'}, ${cor?.replace('bg-', '').replace('-100', '-300') || '#60a5fa'})` 
        }}
      />
    </Card>
  );
}