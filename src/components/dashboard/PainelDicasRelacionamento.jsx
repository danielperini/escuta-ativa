import React, { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Lightbulb, ChevronDown, ChevronUp, EyeOff, CheckCircle2, XCircle,
  Sparkles, HelpCircle, Loader2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { TIPO_DICA_META, ODS_CORES } from '@/lib/odsCores';

export default function PainelDicasRelacionamento({ dicas = [], dicaDoDia = '', controle, onControleChange, loading }) {
  const ocultas = controle?.dicas_ocultas || [];
  const analisadas = controle?.dicas_analisadas || [];
  const naoPertinentes = controle?.dicas_nao_pertinentes || [];

  const visiveis = useMemo(
    () => dicas.filter(d => d && d.id && !ocultas.includes(d.id) && !naoPertinentes.includes(d.id)),
    [dicas, ocultas, naoPertinentes]
  );

  const handle = async (patch) => onControleChange(patch);

  return (
    <section className="space-y-3" aria-label="Dicas de Relacionamento">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
            <Lightbulb className="w-4 h-4 text-primary" />
          </span>
          <h2 className="text-xl font-semibold text-foreground">Dicas de Relacionamento</h2>
        </div>
        <p className="text-sm text-muted-foreground">Orientações para qualificar a atuação no território</p>
      </div>

      {/* Dica do Dia */}
      <Card className="overflow-hidden">
        <div className="h-1.5 w-full" style={{ backgroundColor: ODS_CORES[11] }} />
        <div className="p-5 md:p-6 flex items-start gap-4">
          <span className="inline-flex items-center justify-center w-11 h-11 rounded-xl shrink-0" style={{ backgroundColor: `${ODS_CORES[11]}1a` }}>
            <Sparkles className="w-5 h-5" style={{ color: ODS_CORES[11] }} />
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: ODS_CORES[11] }}>
                Dica do dia
              </span>
              <Badge className="text-[10px] py-0 px-1.5" variant="secondary">Síntese da IA</Badge>
            </div>
            <p className="text-base leading-relaxed text-foreground">
              {loading && !dicaDoDia ? '…' : (dicaDoDia || 'Uma escuta sistemática converte conversas dispersas em memória institucional do território.')}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Sugestão metodológica — não constitui citação e não substitui avaliação profissional.
            </p>
          </div>
        </div>
      </Card>

      {/* Lista de dicas (recomendações analíticas) */}
      {loading && visiveis.length === 0 ? (
        <Card className="p-8 flex items-center justify-center min-h-[140px]">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </Card>
      ) : visiveis.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-sm text-muted-foreground">Nenhuma recomendação ativa no momento.</p>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {visiveis.map((dica) => (
            <DicaCard
              key={dica.id}
              dica={dica}
              analisada={analisadas.includes(dica.id)}
              onOcultar={() => handle({ dicas_ocultas: Array.from(new Set([...ocultas, dica.id])) })}
              onAnalisada={() => handle({ dicas_analisadas: analisadas.includes(dica.id) ? analisadas.filter(x => x !== dica.id) : [...analisadas, dica.id] })}
              onNaoPertinente={() => handle({ dicas_nao_pertinentes: Array.from(new Set([...naoPertinentes, dica.id])) })}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function DicaCard({ dica, analisada, onOcultar, onAnalisada, onNaoPertinente }) {
  const [explicado, setExplicado] = useState(false);
  const meta = TIPO_DICA_META[dica.tipo] || { cor: ODS_CORES[16], label: dica.titulo };
  const prioridadeCor = dica.prioridade === 'alta' ? ODS_CORES[1] : (dica.prioridade === 'media' ? ODS_CORES[11] : ODS_CORES[16]);

  return (
    <Card className={`overflow-hidden relative ${analisada ? 'opacity-60' : ''}`}>
      <div className="h-1.5 w-full" style={{ backgroundColor: meta.cor }} />
      <div className="p-4 md:p-5">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg shrink-0" style={{ backgroundColor: `${meta.cor}1a` }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.cor }} />
            </span>
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground truncate">{dica.titulo}</h3>
              <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{meta.label}</span>
            </div>
          </div>
          <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${prioridadeCor}1a`, color: prioridadeCor }}>
            {dica.prioridade || 'baixa'}
          </span>
        </div>

        <p className="text-sm leading-relaxed text-foreground">{dica.mensagem}</p>

        {/* Explicabilidade */}
        <button
          onClick={() => setExplicado(v => !v)}
          className="mt-3 inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          Por que estou vendo isso?
          {explicado ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
        {explicado && dica.explicacao?.length > 0 && (
          <div className="mt-2 rounded-lg bg-muted/60 p-3 border border-border space-y-1.5">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
              Esta recomendação foi gerada porque:
            </p>
            <ul className="space-y-1">
              {dica.explicacao.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-foreground">
                  <span className="w-1 h-1 rounded-full bg-foreground/40 mt-1.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Controles humanos */}
        <div className="flex flex-wrap items-center gap-1 mt-3 pt-3 border-t border-border">
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground" onClick={onAnalisada}>
            <CheckCircle2 className={`w-3.5 h-3.5 mr-1 ${analisada ? 'text-success' : ''}`} />
            {analisada ? 'Analisada' : 'Marcar analisada'}
          </Button>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground" onClick={onNaoPertinente}>
            <XCircle className="w-3.5 h-3.5 mr-1" /> Não é pertinente
          </Button>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground" onClick={onOcultar}>
            <EyeOff className="w-3.5 h-3.5 mr-1" /> Ocultar
          </Button>
        </div>
      </div>
    </Card>
  );
}