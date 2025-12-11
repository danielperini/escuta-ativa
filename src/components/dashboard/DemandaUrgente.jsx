import React from 'react';
import { cn } from "@/lib/utils";
import { AlertTriangle, MapPin, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const urgenciaConfig = {
  baixa: { color: 'border-l-slate-400', bg: 'bg-slate-50' },
  media: { color: 'border-l-blue-500', bg: 'bg-blue-50' },
  alta: { color: 'border-l-orange-500', bg: 'bg-orange-50' },
  critica: { color: 'border-l-red-500', bg: 'bg-red-50' }
};

export default function DemandaUrgente({ demanda, registro }) {
  const config = urgenciaConfig[demanda.urgencia] || urgenciaConfig.media;

  return (
    <div className={cn(
      "rounded-lg border-l-4 p-4 transition-all duration-200 hover:shadow-md",
      config.color,
      config.bg
    )}>
      <div className="flex items-start gap-3">
        {demanda.urgencia === 'critica' && (
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-slate-900">{demanda.descricao}</p>
          
          <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
            {registro?.comunidade && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {registro.comunidade}
              </span>
            )}
            {registro?.created_date && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {formatDistanceToNow(new Date(registro.created_date), { 
                  addSuffix: true, 
                  locale: ptBR 
                })}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}