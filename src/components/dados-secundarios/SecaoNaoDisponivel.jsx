import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Loader2, Search, ChevronDown, ChevronUp, FileQuestion, Sparkles, AlertTriangle
} from 'lucide-react';
import { STATUS_COR, STATUS_LABEL, STATUS_DADO } from '@/lib/secondaryDataResolver';

/**
 * Estado não-disponível de uma seção de Dados Secundários.
 *
 * Comportamento:
 *  - BUSCANDO (intermediário): spinner + "Buscando fontes disponíveis..." — sem botão.
 *  - SEM_DADO (final): "Não localizamos informação confiável para este indicador neste território."
 *    com botão "Ampliar pesquisa" → dispara pesquisa web profunda assistida por IA em fontes oficiais.
 *
 * Erros técnicos (503, timeout, créditos esgotados) NUNCA aparecem para o usuário comum.
 * Detalhes técnicos ficam em painel colapsável visível para admin.
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
  const [ampliando, setAmpliando] = useState(false);

  const s = status || STATUS_DADO.SEM_DADO;
  const corClass = STATUS_COR[s] || '';
  const label = STATUS_LABEL[s] || 'Dado não localizado para este território';

  // Enquanto busca: spinner + mensagem de progresso. Sem botão — auto-progresso.
  if (s === STATUS_DADO.BUSCANDO || (carregando && !ampliando)) {
    return (
      <div className="bg-card border border-dashed rounded-lg p-6 flex flex-col items-center text-center gap-3 text-blue-700 bg-blue-50 border-blue-100">
        <div className="p-3 rounded-full bg-blue-100">
          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
        </div>
        <div className="space-y-1">
          <p className="font-medium">{label}</p>
          <p className="text-sm text-muted-foreground max-w-md">
            Tentando fontes oficiais e institucionais em sequência (API → cache → portal → pesquisa web assistida por IA).
          </p>
        </div>
        {ultimaAtualizacao && (
          <div className="text-xs text-muted-foreground">Último dado: {ultimaAtualizacao}</div>
        )}
      </div>
    );
  }

  // Emergência de cache antigo — avisa e mantém utilitário de detalhes.
  if (s === STATUS_DADO.EMERGENCIA_CACHE) {
    return (
      <div className={`bg-card border rounded-lg p-5 flex flex-col items-center text-center gap-3 ${corClass}`}>
        <div className="p-3 rounded-full bg-amber-100">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
        </div>
        <div className="space-y-1">
          <p className="font-medium">{label}</p>
          {aviso_validade && <p className="text-sm italic max-w-md">{aviso_validade}</p>}
        </div>
        {ultimaAtualizacao && <div className="text-xs text-muted-foreground">Último dado: {ultimaAtualizacao}</div>}
        <Button onClick={onColetar} disabled={carregando} size="sm" variant="outline">
          {carregando ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Ampliando…</> : <><Sparkles className="w-4 h-4 mr-2" /> Ampliar pesquisa</>}
        </Button>
        <PainelDetalhesAdmin mostrarDetalhes={mostrarDetalhes} setMostrarDetalhes={setMostrarDetalhes} fonte_final={fonte_final} detalhes_admin={detalhes_admin} categoria={categoria} />
      </div>
    );
  }

  // Final: SEM_DADO
  const handleAmpliar = () => {
    setAmpliando(true);
    onColetar({ ampliar: true });
  };

  return (
    <div className={`bg-card border border-dashed rounded-lg p-6 flex flex-col items-center text-center gap-3 ${corClass}`}>
      <div className="p-3 rounded-full bg-muted/60">
        <FileQuestion className="w-5 h-5 text-slate-500" />
      </div>
      <div className="space-y-1">
        <p className="font-medium text-foreground">{label}</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-md">
          Não inventamos valores. Tente ampliar a pesquisa usando fontes oficiais e institucionais assistidas por IA.
        </p>
      </div>

      {aviso_validade && (
        <p className="text-xs italic text-amber-700 max-w-md">{aviso_validade}</p>
      )}
      {ultimaAtualizacao && (
        <div className="text-xs text-muted-foreground">Último dado: {ultimaAtualizacao}</div>
      )}

      <Button onClick={handleAmpliar} disabled={carregando || ampliando} size="sm" variant="outline" className="mt-1">
        {ampliando
          ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Pesquisando fontes oficiais e institucionais…</>
          : <><Sparkles className="w-4 h-4 mr-2" /> Ampliar pesquisa</>}
      </Button>

      <PainelDetalhesAdmin mostrarDetalhes={mostrarDetalhes} setMostrarDetalhes={setMostrarDetalhes} fonte_final={fonte_final} detalhes_admin={detalhes_admin} categoria={categoria} />
    </div>
  );
}

function PainelDetalhesAdmin({ mostrarDetalhes, setMostrarDetalhes, fonte_final, detalhes_admin, categoria }) {
  if (!fonte_final && !detalhes_admin) return null;
  return (
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
  );
}