import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Droplets, ExternalLink, AlertTriangle, MapPinned } from 'lucide-react';

const SNIRH_URL = 'https://www.snirh.gov.br/hidroweb/seriehistorica';
const ANA_PAINEL_URL = 'https://www.snirh.gov.br/portal/iframe';

function findItem(items, regex) {
  return items.find((it) => regex.test(it.indicator || ''));
}

export function SecaoAguaRecursosHidricos({ mun, estado, onColetar }) {
  const items = estado.items || [];

  const bacia = useMemo(() => findItem(items, /bacia\s+hidrogr[áa]fica/i), [items]);
  const riosMon = useMemo(() => findItem(items, /rios\s+monitorados/i), [items]);
  const estacoes = useMemo(() => findItem(items, /estac[õo]es\s+hidrometeorol[óo]gicas|estac[õo]es\s+ana\s+pr[óo]ximas/i), [items]);
  const captacoes = useMemo(() => findItem(items, /capta[çc][õo]es\s+cadastradas/i), [items]);
  const outorgas = useMemo(() => findItem(items, /outorgas\s+identificadas/i), [items]);
  const situacao = useMemo(() => findItem(items, /situa[çc][ãa]o\s+h[íi]drica|[íi]ndice\s+de\s+disponibilidade\s+h[íi]drica|disponibilidade\s+h[íi]drica/i), [items]);
  const precipitacao = useMemo(() => findItem(items, /precipita[çc][ãa]o\s+m[ée]dia/i), [items]);
  const vazao = useMemo(() => findItem(items, /vaz[ãa]o\s+m[ée]dia/i), [items]);
  const poços = useMemo(() => findItem(items, /po[çc]os\s+cadastrados/i), [items]);
  const barragens = useMemo(() => findItem(items, /barragens/i), [items]);
  const reservatorios = useMemo(() => findItem(items, /reservat[óo]rios/i), [items]);
  const finalidadeUsos = useMemo(() => findItem(items, /finalidade\s+dos\s+usos/i), [items]);
  const qualidadeAgua = useMemo(() => findItem(items, /qualidade\s+da\s+[áa]gua/i), [items]);
  const serieHistorica = useMemo(() => findItem(items, /s[ée]rie\s+hist[óo]rica\s+vaz[ãa]o/i), [items]);
  const resumo = useMemo(() => findItem(items, /resumo\s+executivo\s+territorial/i), [items]);
  const insights = useMemo(() => items.filter((it) => (it.source_id || '').startsWith('IA_INSIGHT')), [items]);

  const indicators = useMemo(
    () =>
      items.filter((it) => {
        const ind = it.indicator || '';
        return (
          !/resumo\s+executivo\s+territorial/i.test(ind) &&
          !(it.source_id || '').startsWith('IA_INSIGHT') &&
          !/bacia\s+hidrogr[áa]fica|rios\s+monitorados|estac[õo]es\s+hidrometeorol[óo]gicas|estac[õo]es\s+ana\s+pr[óo]ximas|capta[çc][õo]es\s+cadastradas|outorgas\s+identificadas|situa[çc][ãa]o\s+h[íi]drica|disponibilidade\s+h[íi]drica/i.test(ind)
        );
      }),
    [items]
  );

  // KPIs do card
  const cardKPIs = [
    bacia && { label: 'Bacia hidrográfica', texto: bacia.value_text || '—' },
    riosMon && { label: 'Rios monitorados', numero: riosMon.value_number },
    estacoes && { label: 'Estações próximas', numero: estacoes.value_number },
    captacoes && { label: 'Captações cadastradas', numero: captacoes.value_number },
    outorgas && { label: 'Outorgas identificadas', numero: outorgas.value_number },
    situacao && { label: 'Situação hídrica', texto: situacao.value_text || String(situacao.value_number ?? '—') },
  ].filter(Boolean);

  // Estado vazio
  if (!items.length) {
    return (
      <Card key={`agua-${mun.ibge}`} className="p-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Droplets className="w-4 h-4 text-primary" /> 💧 {mun.label} — Água e Recursos Hídricos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {estado.erro ? (
            <p className="text-sm text-amber-700 py-2">{estado.erro}</p>
          ) : (
            <p className="text-sm text-muted-foreground py-2">
              Aguardando coleta — fontes principais: ANA, SNIRH, HidroWeb, Telemetria,
              CNARH, SINISA. Após a primeira coleta os indicadores ficam congelados
              por 30 dias (uma vez ao mês).
            </p>
          )}
          <Button onClick={onColetar} disabled={estado.carregando} size="sm">
            {estado.carregando ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> Coletando via IA (ANA/SNIRH)…
              </>
            ) : (
              <>
                <Droplets className="w-4 h-4 mr-2" /> Coletar via IA (ANA/SNIRH)
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card key={`agua-${mun.ibge}`} className="p-4 space-y-3">
      <CardHeader className="pb-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Droplets className="w-4 h-4 text-primary" /> 💧 {mun.label} — Água e Recursos Hídricos
          </CardTitle>
          {estado.ultimaAtual && (
            <Badge variant="outline" className="text-xs">Última coleta: {estado.ultimaAtual}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {resumo && <p className="text-sm text-foreground leading-relaxed">{resumo.value_text}</p>}

        {/* KPIs principais do card */}
        {cardKPIs.length > 0 && (
          <div className="border rounded-md p-3 bg-muted/20">
            <p className="text-xs font-semibold text-foreground mb-2">💧 ÁGUA E RECURSOS HÍDRICOS</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {cardKPIs.map((k, i) => (
                <div key={i} className="p-2 border rounded bg-card text-xs">
                  <p className="text-muted-foreground">{k.label}</p>
                  <p className="text-sm font-semibold text-primary">
                    {k.texto != null ? k.texto : k.numero != null ? k.numero : '—'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Séries históricas (precipitação e vazão) */}
        {(precipitacao || vazao) && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {precipitacao && (
              <div className="p-2 border rounded bg-card text-xs">
                <p className="text-muted-foreground">Precipitação média anual</p>
                <p className="text-sm font-semibold text-primary">
                  {precipitacao.value_number != null
                    ? `${precipitacao.value_number} ${precipitacao.unit || 'mm'}`
                    : precipitacao.value_text || '—'}
                </p>
              </div>
            )}
            {vazao && (
              <div className="p-2 border rounded bg-card text-xs">
                <p className="text-muted-foreground">Vazão média</p>
                <p className="text-sm font-semibold text-primary">
                  {vazao.value_number != null
                    ? `${vazao.value_number} ${vazao.unit || 'm³/s'}`
                    : vazao.value_text || '—'}
                </p>
              </div>
            )}
            {poços && (
              <div className="p-2 border rounded bg-card text-xs">
                <p className="text-muted-foreground">Poços cadastrados</p>
                <p className="text-sm font-semibold text-primary">{poços.value_number ?? '—'}</p>
              </div>
            )}
            {barragens && (
              <div className="p-2 border rounded bg-card text-xs">
                <p className="text-muted-foreground">Barragens</p>
                <p className="text-sm font-semibold text-primary">{barragens.value_number ?? '—'}</p>
              </div>
            )}
            {reservatorios && (
              <div className="p-2 border rounded bg-card text-xs">
                <p className="text-muted-foreground">Reservatórios</p>
                <p className="text-sm font-semibold text-primary">{reservatorios.value_number ?? '—'}</p>
              </div>
            )}
            {qualidadeAgua && (
              <div className="p-2 border rounded bg-card text-xs">
                <p className="text-muted-foreground">Qualidade da água</p>
                <p className="text-sm font-semibold text-primary">
                  {qualidadeAgua.value_number != null
                    ? qualidadeAgua.value_number
                    : qualidadeAgua.value_text || '—'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Finalidade dos usos */}
        {finalidadeUsos && (
          <div className="p-2 border rounded bg-card text-xs">
            <p className="text-muted-foreground">Finalidade dos usos cadastrados</p>
            <p className="text-sm text-foreground">{finalidadeUsos.value_text || '—'}</p>
          </div>
        )}

        {/* Série histórica (JSON serializado) */}
        {serieHistorica?.value_text && (
          <details className="text-xs">
            <summary className="cursor-pointer text-primary font-medium">
              Ver série histórica de vazão (JSON)
            </summary>
            <pre className="mt-2 p-2 bg-muted/30 border rounded overflow-x-auto whitespace-pre-wrap max-h-48 overflow-auto text-[10px]">
              {serieHistorica.value_text}
            </pre>
          </details>
        )}

        {/* Link para explorar território no SNIRH */}
        <Button variant="outline" size="sm" asChild>
          <a href={SNIRH_URL} target="_blank" rel="noreferrer">
            <MapPinned className="w-4 h-4 mr-2" />
            Explorar água no território (SNIRH)
            <ExternalLink className="w-3 h-3 ml-1" />
          </a>
        </Button>

        {/* Alerta — regra crítica */}
        <div className="p-3 rounded-md border border-amber-200 bg-amber-50 text-amber-800 text-xs flex gap-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <p>
            <strong>Regra crítica:</strong> DADO HIDROLÓGICO OFICIAL ≠ USO/OUTORGA CADASTRADA
            ≠ PERCEPÇÃO COMUNITÁRIA ≠ PROXIMIDADE GEOGRÁFICA ≠ CORRELAÇÃO TEMPORAL
            ≠ HIPÓTESE PARA INVESTIGAÇÃO. Proximidade ou coincidência temporal não
            demonstram relação causal — justificam apenas aprofundamento da análise.
          </p>
        </div>

        {/* Indicadores detalhados */}
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

        {/* Inferências IA */}
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

        {/* Atualizar coleta */}
        <div className="flex justify-end pt-2">
          <Button variant="ghost" size="sm" onClick={onColetar} disabled={estado.carregando}>
            {estado.carregando ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Droplets className="w-4 h-4 mr-2" />
            )}
            Atualizar coleta (IA ANA/SNIRH)
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}