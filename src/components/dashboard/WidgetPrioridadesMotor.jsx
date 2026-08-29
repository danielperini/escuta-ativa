import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  AlertTriangle, Clock, Users, TrendingUp, MessageSquare,
  CalendarDays, Eye, ChevronRight, Sparkles, Info
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TIPO_CONFIG = {
  DEVOLUTIVA_PENDENTE:     { icon: Clock,          color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200', label: 'Devolutiva pendente' },
  COMPROMISSO_EM_RISCO:    { icon: AlertTriangle,   color: 'text-red-600',    bg: 'bg-red-50 border-red-200',       label: 'Compromisso em risco' },
  NECESSIDADE_DE_ESCUTA:   { icon: MessageSquare,   color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-200',     label: 'Precisa de escuta' },
  TENDENCIA:               { icon: TrendingUp,      color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200', label: 'Tendência' },
  SINAL_FRACO:             { icon: Eye,             color: 'text-amber-600',  bg: 'bg-amber-50 border-amber-200',   label: 'Sinal fraco' },
  TEMA_EM_CRESCIMENTO:     { icon: TrendingUp,      color: 'text-emerald-600',bg: 'bg-emerald-50 border-emerald-200',label: 'Tema em crescimento'},
  TERRITORIO_COM_ATENCAO:  { icon: AlertTriangle,   color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200', label: 'Território em atenção'},
  AGENDA_RECOMENDADA:      { icon: CalendarDays,    color: 'text-teal-600',   bg: 'bg-teal-50 border-teal-200',     label: 'Agenda recomendada' },
  DEMANDA_PRIORITARIA:     { icon: AlertTriangle,   color: 'text-red-600',    bg: 'bg-red-50 border-red-200',       label: 'Demanda prioritária' },
  RISCO:                   { icon: AlertTriangle,   color: 'text-red-700',    bg: 'bg-red-100 border-red-300',      label: 'Risco' },
  OPORTUNIDADE:            { icon: Sparkles,        color: 'text-green-600',  bg: 'bg-green-50 border-green-200',   label: 'Oportunidade' },
  RECORRENCIA:             { icon: TrendingUp,      color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200', label: 'Recorrência' },
};

const PRIORIDADE_ORDER = { CRITICA: 0, ALTA: 1, MEDIA: 2, BAIXA: 3, MONITORAR: 4 };

const CONFIANCA_CONFIG = {
  ALTA:  { color: 'text-green-700 bg-green-100', label: 'Alta confiança' },
  MEDIA: { color: 'text-amber-700 bg-amber-100', label: 'Confiança média' },
  BAIXA: { color: 'text-red-700 bg-red-100',     label: 'Baixa confiança' },
};

export default function WidgetPrioridadesMotor({ maxItems = 6 }) {
  const [expandido, setExpandido] = useState(null);

  const { data: insights = [], isLoading } = useQuery({
    queryKey: ['decision-insights-dashboard'],
    queryFn: () => base44.entities.DecisionInsight.filter({ status: 'ativo' }, '-last_detected_at', 20),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000
  });

  const ordenados = [...insights]
    .sort((a, b) => (PRIORIDADE_ORDER[a.prioridade] ?? 99) - (PRIORIDADE_ORDER[b.prioridade] ?? 99))
    .slice(0, maxItems);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Prioridades para atenção
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1,2,3].map(i => (
              <div key={i} className="h-14 bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (ordenados.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Prioridades para atenção
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-slate-500 text-sm">
            <Sparkles className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p>Motor de inteligência analisando o território...</p>
            <p className="text-xs mt-1 text-slate-400">Insights aparecerão conforme novos registros forem criados</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Prioridades para atenção
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {insights.filter(i => i.status === 'ativo').length} ativo(s)
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {ordenados.map((insight) => {
          const config = TIPO_CONFIG[insight.tipo] || TIPO_CONFIG['SINAL_FRACO'];
          const Icon = config.icon;
          const confianca = CONFIANCA_CONFIG[insight.confianca] || CONFIANCA_CONFIG['MEDIA'];
          const isOpen = expandido === insight.id;

          return (
            <div
              key={insight.id}
              className={cn(
                'rounded-lg border p-3 cursor-pointer transition-all',
                config.bg,
                isOpen ? 'ring-1 ring-primary/30' : 'hover:shadow-sm'
              )}
              onClick={() => setExpandido(isOpen ? null : insight.id)}
            >
              <div className="flex items-start gap-2.5">
                <Icon className={cn('w-4 h-4 mt-0.5 flex-shrink-0', config.color)} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-slate-800 leading-snug">
                      {insight.titulo}
                    </p>
                    <ChevronRight className={cn(
                      'w-3.5 h-3.5 flex-shrink-0 text-slate-400 transition-transform mt-0.5',
                      isOpen && 'rotate-90'
                    )} />
                  </div>
                  
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span className="text-xs text-slate-500">
                      {config.label}
                    </span>
                    {insight.comunidade_nome && (
                      <>
                        <span className="text-slate-300">·</span>
                        <span className="text-xs text-slate-500 font-medium">
                          {insight.comunidade_nome}
                        </span>
                      </>
                    )}
                    <span className="text-slate-300">·</span>
                    <span className={cn('text-xs px-1.5 py-0.5 rounded-full font-medium', confianca.color)}>
                      {confianca.label}
                    </span>
                  </div>

                  {/* Expandido */}
                  {isOpen && (
                    <div className="mt-3 space-y-2 border-t pt-3 border-slate-200/60">
                      {insight.resumo && (
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {insight.resumo}
                        </p>
                      )}
                      
                      {insight.por_que_merece_atencao && (
                        <div className="flex gap-2">
                          <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-slate-500 italic">{insight.por_que_merece_atencao}</p>
                        </div>
                      )}

                      {Array.isArray(insight.possiveis_caminhos) && insight.possiveis_caminhos.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-slate-700 mb-1">Possíveis caminhos:</p>
                          <ul className="space-y-0.5">
                            {insight.possiveis_caminhos.slice(0, 3).map((c, i) => (
                              <li key={i} className="text-xs text-slate-600 flex gap-1.5">
                                <span className="text-primary">•</span>
                                {c}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="flex items-center gap-3 pt-1">
                        {insight.evidencia_count > 0 && (
                          <span className="text-xs text-slate-400">
                            {insight.evidencia_count} evidência(s)
                          </span>
                        )}
                        {insight.last_detected_at && (
                          <span className="text-xs text-slate-400">
                            Detectado {formatDistanceToNow(new Date(insight.last_detected_at), { addSuffix: true, locale: ptBR })}
                          </span>
                        )}
                        {insight.classificacao_evidencia && (
                          <Badge variant="outline" className="text-xs py-0">
                            {insight.classificacao_evidencia.replace(/_/g, ' ')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {insights.length > maxItems && (
          <p className="text-xs text-center text-slate-400 pt-1">
            + {insights.length - maxItems} outros insights ativos
          </p>
        )}
      </CardContent>
    </Card>
  );
}