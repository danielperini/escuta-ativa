import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Loader2, AlertTriangle, CalendarClock, Search, ChevronDown, ChevronUp, FileQuestion
} from 'lucide-react';
import { STATUS_COR, STATUS_LABEL, STATUS_DADO } from '@/lib/secondaryDataResolver';

/**
 * Estado não-disponível de uma seção.
 * Mostra mensagens funcionais conforme status semântico.
 * Erros técnicos (HTTP 503, etc) NUNCA são exibidos ao usuário comum —
 * ficam em painel colapsável visível para admin.
 */
export function SecaoNaoDisponivel({
  categoria,
  onColetar,
  carregando,
  ultimaAtualizacao,
  status,
  aviso_validade,
  detalhes_admin,
  fonte_final
}) {
  const [mostrarDetalhes, setMostrarDetalhes] = useState(false);
  const s = status || STATUS_DADO.DADO_NAO_LOCALIZADO;
  const corClass = STATUS_COR[s] || '';
  const label = STATUS_LABEL[s] || 'Dado não localizado';

  const mensagem = {
    [STATUS_DADO.SOURCE_TEMPORARILY_UNAVAILABLE]: 'Fonte temporariamente indisponível. Buscando alternativa automática…',
    [STATUS_DADO.SEM_COBERTURA]: 'Sem cobertura municipal — nenhuma fonte confiável encontrada para este território nestas categorias.',
    [STATUS_DADO.DADO_NAO_LOCALIZADO]: 'Dado não disponível para este território. Não inventamos valores.',
    [STATUS_DADO.DADO_DISPONIVEL]: null
  }[s] || 'Dado não localizado para este território';

  const icone = s === STATUS_DADO.SOURCE_TEMPORARILY_UNAVAILABLE
    ? <AlertTriangle className="w-5 h-5 text-amber-500" />
    : (s === STATUS_DADO.SEM_COBERTURA ? <FileQuestion className="w-5 h-5 text-slate-500" /> : <Search className="w-5 h-5 text-slate-400" />);

  return (
    <div className={`bg-card border border-dashed rounded-lg p-6 flex flex-col items-center text-center gap-3 ${corClass}`}>
      <div className="p-3 rounded-full bg-muted/60">
        {icone}
      </div>
      <div className="space-y-1">
        <p className="font-medium text-foreground">{label}</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-md">{mensagem}</p>
      </div>

      {aviso_validade && (
        <p className="text-xs italic text-amber-700 max-w-md">{aviso_validade}</p>
      )}

      {ultimaAtualizacao && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <CalendarClock className="w-3.5 h-3.5" />
          Última coleta / referência: {ultimaAtualizacao}
        </div>
      )}

      {/* Ação secundária — Usuário pode forçar nova tentativa */}
      <Button
        onClick={onColetar}
        disabled={carregando}
        size="sm"
        variant="outline"
        className="mt-1"
      >
        {carregando
          ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Buscando fonte…</>
          : <><Search className="w-4 h-4 mr-2" /> Buscar fontes alternativas</>}
      </Button>

      {/* Detalhes técnicos — colapsável, para admin */}
      {(detalhes_admin || fonte_final) && (
        <div className="w-full mt-2 border-t border-border/60 pt-2">
          <button
            onClick={() => setMostrarDetalhes(v => !v)}
            className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 mx-auto"
          >
            {mostrarDetalhes ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            Detalhes técnicos (admin)
          </button>
          {mostrarDetalhes && (
            <div className="text-[11px] text-muted-foreground mt-2 space-y-0.5 text-left bg-muted/40 p-2 rounded">
              {fonte_final && <div><span className="font-medium">Fonte final:</span> {fonte_final}</div>}
              {detalhes_admin && <div><span className="font-medium">Estado técnico:</span> {detalhes_admin}</div>}
              <div><span className="font-medium">Categoria:</span> {categoria}</div>
              <div><span className="font-medium">Timestamp:</span> {new Date().toISOString()}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}