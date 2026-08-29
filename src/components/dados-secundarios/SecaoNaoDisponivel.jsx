import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Database, Sparkles, AlertTriangle, CalendarClock } from 'lucide-react';

/**
 * Estado vazio para conectores ainda não integrados via API estruturada.
 * Oferece ação "Coletar via IA web" que chama o backend pesquisarDadosTerritoriais.
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
        {erro ? <AlertTriangle className="w-6 h-6 text-amber-500" /> : <Database className="w-6 h-6 text-muted-foreground" />}
      </div>
      <div>
        <p className="font-medium text-foreground">
          {erro ? 'Falha na coleta' : 'Conector ainda não ativado via API estruturada'}
        </p>
        <p className="text-sm text-muted-foreground mt-1 max-w-md">
          {erro
            ? erro
            : 'Não existem dados públicos estruturados disponíveis para este território. Você pode acionar a coleta via IA (pesquisa em fontes oficiais na web).' }
        </p>
      </div>

      {ultimaAtualizacao && !erro && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <CalendarClock className="w-3.5 h-3.5" />
          Última atualização: {ultimaAtualizacao}
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