import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, AlertTriangle, CalendarClock } from 'lucide-react';

/**
 * Estado vazio para seções que ainda não têm coleta automática.
 * Oferece ação "Coletar via IA" que dispara o backend pesquisarDadosTerritoriais.
 * Política determinística: após a primeira coleta, o resultado fica em cache por
 * 30 dias (uma vez ao mês) e é tratado como referência revisada.
 */
export function SecaoNaoDisponivel({
  categoria,
  onColetar,
  carregando,
  ultimaAtualizacao,
  erro
}) {
  return (
    <div className="bg-card border border-dashed border-border rounded-lg p-8 flex flex-col items-center text-center gap-3">
      <div className="p-3 rounded-full bg-muted">
        {erro ? <AlertTriangle className="w-6 h-6 text-amber-500" /> : <Sparkles className="w-6 h-6 text-primary" />}
      </div>
      <div className="space-y-1">
        <p className="font-medium text-foreground">
          {erro ? 'Falha na coleta' : 'Coleta oficial via IA — uma vez ao mês'}
        </p>
        <p className="text-sm text-muted-foreground mt-1 max-w-md">
          {erro
            ? erro
            : 'Esta seção é coletada pela IA em fontes oficiais brasileiras (prefeitura, câmara, conselhos, IBGE, SICONFI, TSE…). Após a primeira coleta, os indicadores ficam congelados por 30 dias como uma referência revisada — sem novas chamadas de IA até o próximo mês.'}
        </p>
      </div>

      {ultimaAtualizacao && !erro && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <CalendarClock className="w-3.5 h-3.5" />
          Última coleta revisada: {ultimaAtualizacao}
        </div>
      )}

      <Button onClick={onColetar} disabled={carregando} size="sm" className="mt-1">
        {carregando
          ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Coletando via IA…</>
          : <><Sparkles className="w-4 h-4 mr-2" /> Coletar via IA (web)</>}
      </Button>
    </div>
  );
}