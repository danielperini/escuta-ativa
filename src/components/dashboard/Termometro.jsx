import React from 'react';
import { cn } from "@/lib/utils";
import { AlertTriangle, AlertCircle, Activity, CheckCircle } from 'lucide-react';

const levels = {
  baixo: { 
    label: 'Baixo', 
    color: 'bg-emerald-500', 
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    icon: CheckCircle,
    percentage: 25 
  },
  medio: { 
    label: 'Médio', 
    color: 'bg-amber-400', 
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    icon: Activity,
    percentage: 50 
  },
  alto: { 
    label: 'Alto', 
    color: 'bg-orange-500', 
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
    icon: AlertCircle,
    percentage: 75 
  },
  critico: { 
    label: 'Crítico', 
    color: 'bg-red-500', 
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    icon: AlertTriangle,
    percentage: 100 
  }
};

export default function Termometro({ nivel = 'baixo', comunidade }) {
  const config = levels[nivel] || levels.baixo;
  const Icon = config.icon;

  return (
    <div className={cn("rounded-xl p-5 border", config.bgColor, `border-${config.color.replace('bg-', '')}/20`)}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-slate-500">Termômetro Social</p>
          {comunidade && <p className="text-xs text-slate-400 mt-0.5">{comunidade}</p>}
        </div>
        <div className={cn("p-2 rounded-lg", config.bgColor)}>
          <Icon className={cn("w-5 h-5", config.textColor)} />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="h-3 bg-white rounded-full overflow-hidden shadow-inner">
            <div 
              className={cn("h-full rounded-full transition-all duration-500", config.color)}
              style={{ width: `${config.percentage}%` }}
            />
          </div>
        </div>
        <span className={cn("text-sm font-semibold", config.textColor)}>
          {config.label}
        </span>
      </div>

      <div className="flex justify-between mt-3 text-xs text-slate-400">
        <span>Baixo</span>
        <span>Médio</span>
        <span>Alto</span>
        <span>Crítico</span>
      </div>
    </div>
  );
}