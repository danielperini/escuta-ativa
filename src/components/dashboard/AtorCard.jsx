import React from 'react';
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { MapPin, Activity } from 'lucide-react';

const tipoConfig = {
  lideranca: { label: 'Liderança', color: 'bg-purple-100 text-purple-700' },
  representante: { label: 'Representante', color: 'bg-blue-100 text-blue-700' },
  morador: { label: 'Morador', color: 'bg-slate-100 text-slate-700' },
  associacao: { label: 'Associação', color: 'bg-emerald-100 text-emerald-700' },
  ong: { label: 'ONG', color: 'bg-amber-100 text-amber-700' },
  governo: { label: 'Governo', color: 'bg-red-100 text-red-700' },
  outro: { label: 'Outro', color: 'bg-slate-100 text-slate-600' }
};

const atividadeConfig = {
  inativo: { color: 'bg-slate-300', label: 'Inativo' },
  baixo: { color: 'bg-blue-400', label: 'Baixa' },
  moderado: { color: 'bg-amber-400', label: 'Moderada' },
  alto: { color: 'bg-emerald-500', label: 'Alta' }
};

export default function AtorCard({ ator, onClick }) {
  const tipo = tipoConfig[ator.tipo] || tipoConfig.outro;
  const atividade = atividadeConfig[ator.nivel_atividade] || atividadeConfig.baixo;

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-xl border border-slate-200 p-4 transition-all duration-200 cursor-pointer hover:shadow-md hover:border-slate-300"
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-full bg-[#2D6A4F] flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
          {ator.nome?.[0]?.toUpperCase() || 'A'}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-slate-900 truncate">{ator.nome}</h4>
          {ator.organizacao && (
            <p className="text-sm text-slate-500 truncate">{ator.organizacao}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary" className={cn("text-xs", tipo.color)}>
              {tipo.label}
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
        {ator.comunidade && (
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <MapPin className="w-3.5 h-3.5" />
            {ator.comunidade}
          </span>
        )}
        <span className="flex items-center gap-1.5 text-xs text-slate-500">
          <Activity className="w-3.5 h-3.5" />
          <span className={cn("w-2 h-2 rounded-full", atividade.color)} />
          {atividade.label}
        </span>
      </div>
    </div>
  );
}