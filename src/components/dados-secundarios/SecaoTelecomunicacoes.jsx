import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Radio, ExternalLink, AlertTriangle, MapPin } from 'lucide-react';

const TECHS = ['2G', '3G', '4G', '5G'];
const ANATEL_PAINEL_URL = 'https://www.anatel.gov.br/consumidor/index.php/incluir-conteudo?f=painel-cobertura-movel-e-instalada';

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function SecaoTelecomunicacoes({ mun, estado, onColetar }) {
  const items = estado.items || [];

  const operadorasItem = useMemo(
    () => items.find((it) => /operadoras\s+presentes/i.test(it.indicator || '')),
    [items]
  );
  const operadorasList = useMemo(() => {
    const list = (operadorasItem?.value_text || '').split(/[,;|]/).map((s) => s.trim()).filter(Boolean);
    return Array.from(new Set(list));
  }, [operadorasItem]);

  const findCobertura = (operadora, tech) => {
    const re = new RegExp(`cobertura\\s+${tech}\\s+${escapeRegex(operadora)}`, 'i');
    return items.find((it) => re.test(it.indicator || ''));
  };

  const coberturaPop = useMemo(
    () => items.find((it) => /cobertura\s+populaci/i.test(it.indicator || '')),
    [items]
  );
  const erbItem = useMemo(
    () => items.find((it) => /erbs?\s+identificadas|estações?\s+licenciadas|erbs?\s+contagem/i.test(it.indicator || '')),
    [items]
  );
  const resumo = useMemo(
    () => items.find((it) => /resumo\s+executivo\s+territorial/i.test(it.indicator || '')),
    [items]
  );
  const insights = useMemo(
    () => items.filter((it) => (it.source_id || '').startsWith('IA_INSIGHT')),
    [items]
  );
  const indicators = useMemo(
    () =>
      items.filter((it) => {
        const ind = it.indicator || '';
        return (
          !/resumo\s+executivo\s+territorial/i.test(ind) &&
          !(it.source_id || '').startsWith('IA_INSIGHT') &&
          !/operadoras\s+presentes/i.test(ind) &&
          !/erbs?\s+identificadas/i.test(ind) &&
          !/cobertura\s+populaci/i.test(ind)
        );
      }),
    [items]
  );

  // Estado vazio
  if (!items.length) {
    return (
      <Card key={`telecom-${mun.ibge}`} className="p-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Radio className="w-4 h-4 text-primary" /> 📡 {mun.label} — Telecomunicações e Conectividade
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {estado.erro ? (
            <p className="text-sm text-amber-700 py-2">{estado.erro}</p>
          ) : (
            <p className="text-sm text-muted-foreground py-2">
              Aguardando coleta — fonte principal: ANATEL. Após a primeira coleta os
              indicadores ficam congelados por 30 dias (uma vez ao mês).
            </p>
          )}
          <Button onClick={onColetar} disabled={estado.carregando} size="sm">
            {estado.carregando ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> Coletando via IA (ANATEL web)…
              </>
            ) : (
              <>
                <Radio className="w-4 h-4 mr-2" /> Coletar via IA (ANATEL web)
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card key={`telecom-${mun.ibge}`} className="p-4 space-y-3">
      <CardHeader className="pb-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Radio className="w-4 h-4 text-primary" /> 📡 {mun.label} — Telefonia Móvel
          </CardTitle>
          {estado.ultimaAtual && (
            <Badge variant="outline" className="text-xs">Última coleta: {estado.ultimaAtual}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {resumo && <p className="text-sm text-foreground leading-relaxed">{resumo.value_text}</p>}

        {/* Matriz 2G/3G/4G/5G por operadora */}
        {operadorasList.length > 0 && (
          <div className="border rounded-md p-3 bg-muted/20">
            <p className="text-xs font-semibold text-foreground mb-2">📡 TELEFONIA MÓVEL</p>
            {TECHS.map((tech) => (
              <div key={tech} className="flex flex-wrap items-center gap-3 py-1">
                <span className="text-xs font-medium text-muted-foreground w-8 shrink-0">{tech}</span>
                {operadorasList.map((op) => {
                  const c = findCobertura(op, tech);
                  const present = c?.value_number != null && c.value_number > 0;
                  const perc = c?.value_number != null ? `${c.value_number}%` : '';
                  return (
                    <span key={op} className="flex items-center gap-1 text-sm">
                      <span className="text-slate-700">{op}</span>
                      <span className={present ? 'text-emerald-600' : 'text-slate-400'}>
                        {present ? '✓' : '—'}
                      </span>
                      {present && perc && (
                        <span className="text-[10px] text-muted-foreground">({perc})</span>
                      )}
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {/* KPIs summary */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {coberturaPop && (
            <div className="p-2 border rounded bg-card">
              <p className="text-xs text-muted-foreground">Cobertura populacional</p>
              <p className="text-lg font-semibold text-primary">
                {coberturaPop.value_number != null
                  ? `${coberturaPop.value_number}${coberturaPop.unit === '%' ? '%' : ' ' + (coberturaPop.unit || '')}`.trim()
                  : coberturaPop.value_text || '—'}
              </p>
            </div>
          )}
          {erbItem && (
            <div className="p-2 border rounded bg-card">
              <p className="text-xs text-muted-foreground">ERBs identificadas</p>
              <p className="text-lg font-semibold text-primary">{erbItem.value_number ?? '—'}</p>
            </div>
          )}
        </div>

        {/* Link to ANATEL Painel (mapa externo) */}
        <Button variant="outline" size="sm" asChild>
          <a href={ANATEL_PAINEL_URL} target="_blank" rel="noreferrer">
            <MapPin className="w-4 h-4 mr-2" />
            Ver cobertura no mapa (Painel ANATEL)
            <ExternalLink className="w-3 h-3 ml-1" />
          </a>
        </Button>

        {/* Alerta: diferenciação obrigatória */}
        <div className="p-3 rounded-md border border-amber-200 bg-amber-50 text-amber-800 text-xs flex gap-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <p>
            <strong>Diferencie:</strong> presença da operadora no município ≠ cobertura
            geográfica estimada ≠ intensidade do sinal ≠ experiência relatada pela
            comunidade. Consulte a fonte para detalhes geográficos por operadora e tecnologia.
          </p>
        </div>

        {/* Indicadores detalhados por operadora/tecnologia */}
        {indicators.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-foreground">Indicadores detalhados</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {indicators.map((it, i) => (
                <div key={it.id || i} className="p-2 border rounded bg-card text-xs">
                  <p className="font-medium text-foreground">{it.indicator}</p>
                  <p className="text-sm font-semibold text-primary">
                    {it.value_number != null
                      ? Number(it.value_number).toLocaleString('pt-BR', { maximumFractionDigits: 2 })
                      : it.value_text || '—'}
                    {it.unit ? ` ${it.unit}` : ''}
                  </p>
                  {it.source_url && (
                    <a
                      href={it.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 text-[10px] underline truncate block"
                    >
                      {it.source_name || it.source_url}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Inferências da IA */}
        {insights.length > 0 && (
          <div className="border-t border-border pt-2">
            <p className="text-xs font-semibold text-violet-700 mb-1">
              Leitura do território (inferência da IA)
            </p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              {insights.map((it, i) => (
                <li key={i}>{it.value_text}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Atualizar coleta (uma vez ao mês) */}
        <div className="flex justify-end pt-2">
          <Button variant="ghost" size="sm" onClick={onColetar} disabled={estado.carregando}>
            {estado.carregando ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Radio className="w-4 h-4 mr-2" />
            )}
            Atualizar coleta (IA ANATEL)
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}