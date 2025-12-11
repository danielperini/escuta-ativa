import React from 'react';
import { cn } from "@/lib/utils";
import { Clock, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import { format, isPast, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from "@/components/ui/badge";

const statusConfig = {
  pendente: { label: 'Pendente', color: 'bg-slate-100 text-slate-700' },
  em_andamento: { label: 'Em andamento', color: 'bg-blue-100 text-blue-700' },
  concluido: { label: 'Concluído', color: 'bg-emerald-100 text-emerald-700' },
  atrasado: { label: 'Atrasado', color: 'bg-red-100 text-red-700' },
  cancelado: { label: 'Cancelado', color: 'bg-slate-100 text-slate-500' }
};

const prioridadeConfig = {
  baixa: { label: 'Baixa', color: 'bg-slate-100 text-slate-600' },
  media: { label: 'Média', color: 'bg-blue-100 text-blue-600' },
  alta: { label: 'Alta', color: 'bg-orange-100 text-orange-600' },
  urgente: { label: 'Urgente', color: 'bg-red-100 text-red-600' }
};

export default function CompromissoCard({ compromisso, onClick }) {
  const prazoDate = compromisso.prazo ? new Date(compromisso.prazo) : null;
  const isAtrasado = prazoDate && isPast(prazoDate) && compromisso.status !== 'concluido';
  const diasRestantes = prazoDate ? differenceInDays(prazoDate, new Date()) : null;

  const status = statusConfig[isAtrasado ? 'atrasado' : compromisso.status] || statusConfig.pendente;
  const prioridade = prioridadeConfig[compromisso.prioridade] || prioridadeConfig.media;

  return (
    <div 
      onClick={onClick}
      className={cn(
        "bg-white rounded-xl border p-4 transition-all duration-200 cursor-pointer hover:shadow-md hover:border-slate-300",
        isAtrasado && "border-red-200 bg-red-50/30"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-slate-900 truncate">{compromisso.titulo}</h4>
          <p className="text-sm text-slate-500 mt-1 line-clamp-2">{compromisso.descricao}</p>
        </div>
        <ArrowRight className="w-4 h-4 text-slate-400 flex-shrink-0 mt-1" />
      </div>

      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <Badge variant="secondary" className={cn("text-xs", status.color)}>
          {status.label}
        </Badge>
        <Badge variant="secondary" className={cn("text-xs", prioridade.color)}>
          {prioridade.label}
        </Badge>
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
        <span className="text-xs text-slate-500">{compromisso.comunidade}</span>
        {prazoDate && (
          <div className={cn(
            "flex items-center gap-1.5 text-xs",
            isAtrasado ? "text-red-600" : diasRestantes <= 7 ? "text-amber-600" : "text-slate-500"
          )}>
            {isAtrasado ? <AlertTriangle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
            <span>
              {isAtrasado 
                ? `Atrasado ${Math.abs(diasRestantes)} dias`
                : format(prazoDate, "dd MMM", { locale: ptBR })
              }
            </span>
          </div>
        )}
      </div>
    </div>
  );
}