import React, { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Loader2, Database, MapPin, RefreshCw, ExternalLink, Info } from 'lucide-react';

// Categorias do spec §17 — seleção para relatório
const CATEGORIAS_RELATORIO = [
  { id: 'resumo', label: 'Perfil territorial' },
  { id: 'demografia', label: 'Demografia' },
  { id: 'economia', label: 'Economia e Trabalho' },
  { id: 'saude', label: 'Saúde' },
  { id: 'educacao', label: 'Educação' },
  { id: 'assistencia_vulnerabilidade', label: 'Assistência/Vulnerabilidade' },
  { id: 'governo_municipal', label: 'Governo' },
  { id: 'camara_municipal', label: 'Câmara' },
  { id: 'conselhos', label: 'Conselhos' },
  { id: 'osc', label: 'OSCs' },
  { id: 'politicas_publicas', label: 'Políticas Públicas' },
  { id: 'saneamento', label: 'Saneamento' },
  { id: 'meio_ambiente', label: 'Meio Ambiente' },
  { id: 'mineracao', label: 'Mineração' },
  { id: 'telecomunicacoes', label: 'Telecom' },
  { id: 'agua_recursos_hidricos', label: 'Água' }
];

// Helper para period/uf/ibge a partir da configuração de escopo do relatório
function extrairContexto(configuracao, registrosFiltrados, comunidades) {
  let municipio = '';
  let uf = '';
  let ibge = '';
  if (configuracao.tipo_escopo === 'comunidade' && configuracao.comunidade) {
    const c = comunidades.find((x) => x.nome === configuracao.comunidade);
    if (c) {
      municipio = c.municipio || '';
      uf = c.estado || '';
      ibge = c.municipality_ibge_code || '';
    }
  } else if (configuracao.tipo_escopo === 'territorio' && configuracao.territorio) {
    municipio = configuracao.territorio;
    uf = configuracao.uf_territorio || '';
    ibge = configuracao.ibge_territorio || '';
  } else if (registrosFiltrados.length > 0) {
    // Plataforma completa ou múltiplos registros — tenta extrair do primeiro registro com localização
    const comLoc = registrosFiltrados.find((r) => r?.localizacao?.municipio);
    if (comLoc) {
      municipio = comLoc.localizacao.municipio || '';
      uf = comLoc.localizacao.estado || '';
    }
  }
  return { municipio, uf, ibge };
}

/**
 * PainelDadosSecundarios:
 *  - Seleção de categorias para incluir no relatório (spec §17).
 *  - Coleta começa automaticamente ao marcar uma categoria (usa cache DoSec).
 *  - Disponibiliza `indicadoresPorCategoria` ao preview do relatório (spec §18).
 *  - Renderiza indicadores com fonte/período e seção "Fontes e referências" (spec §18, §20).
 */
export default function PainelDadosSecundarios({ configuracao, registrosFiltrados, comunidades, onChange }) {
  const [selecionadas, setSelecionadas] = useState([]);
  const contexto = useMemo(
    () => extrairContexto(configuracao, registrosFiltrados, comunidades),
    [configuracao, registrosFiltrados, comunidades]
  );

  // Carrega cache existente por categoria do município (rápido)
  const { data: cachesPorCategoria = {}, isFetching, refetch } = useQuery({
    queryKey: ['dadosecundarios-relatorio', contexto.ibge, selecionadas.join('|')],
    queryFn: async () => {
      if (!contexto.ibge || selecionadas.length === 0) return {};
      const result = {};
      for (const cat of selecionadas) {
        try {
          const items = await base44.entities.DadoSecundario.filter(
            { municipality_ibge_code: contexto.ibge, category: cat },
            '-updated_date',
            60
          );
          result[cat] = items || [];
        } catch (_) {
          result[cat] = [];
        }
      }
      return result;
    },
    enabled: !!contexto.ibge && selecionadas.length > 0,
  });

  // Propaga dados e seleção para o parent (para o preview/PDF/JSON) (spec §21 rastreabilidade)
  useEffect(() => {
    if (onChange) {
      onChange({
        categorias: selecionadas,
        contexto,
        indicadoresPorCategoria: cachesPorCategoria,
      });
    }
  }, [selecionadas, cachesPorCategoria, contexto, onChange]);

  const toggle = (catId) => {
    setSelecionadas((prev) =>
      prev.includes(catId) ? prev.filter((c) => c !== catId) : [...prev, catId]
    );
  };

  const totalIndicadores = useMemo(() => {
    let n = 0;
    for (const cat of selecionadas) {
      const items = cachesPorCategoria[cat] || [];
      n += items.filter(
        (it) =>
          it.indicator !== 'Resumo Executivo Territorial' &&
          !String(it.source_id || '').startsWith('IA_INSIGHT')
      ).length;
    }
    return n;
  }, [cachesPorCategoria, selecionadas]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Database className="w-4 h-4 text-primary" />
          Dados Secundários do Território
          {totalIndicadores > 0 && (
            <span className="text-xs font-normal text-muted-foreground ml-2">
              {totalIndicadores} indicador{totalIndicadores > 1 ? 'es' : ''} rastreáveis
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Contexto territorial identificado */}
        <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          <span className="text-muted-foreground">Território:</span>
          <span className="font-medium">
            {contexto.municipio ? `${contexto.municipio}/${contexto.uf || '—'}` : 'não identificado no escopo atual'}
          </span>
        </div>

        {!contexto.ibge ? (
          <p className="text-xs text-muted-foreground flex items-start gap-1.5">
            <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            Para incluir Dados Secundários, defina o escopo por <strong className="mx-1">Comunidade</strong> ou{' '}
            <strong className="mx-1">Território</strong> (acima) — a coleta usa o código IBGE do município e
            nunca infere dados da comunidade a partir do agregado municipal.
          </p>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              Selecione as categorias de dados públicos a incluir no relatório. Cada indicador aparece com
              período de referência e fonte rastreável.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {CATEGORIAS_RELATORIO.map((c) => (
                <label
                  key={c.id}
                  className="flex items-center gap-2 cursor-pointer text-sm p-2 rounded-md border border-border hover:bg-muted/40 transition-colors"
                >
                  <Checkbox checked={selecionadas.includes(c.id)} onCheckedChange={() => toggle(c.id)} />
                  <span>{c.label}</span>
                </label>
              ))}
            </div>

            {selecionadas.length > 0 && (
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
                  {isFetching ? (
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  Atualizar cache
                </Button>
                <span className="text-xs text-muted-foreground">
                  Indicadores são exibidos no Preview com fonte/período. Dados municipais nunca aparecem
                  como estatística de uma comunidade específica.
                </span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * SecaoDadosSecundariosPreview — usado no PreviewRelatorioESG para exibir
 * os indicadores com fonte/período (spec §18) e a sessão "Fontes e
 * referências" (spec §20) separando: dados internos, fontes públicas,
 * documentos oficiais e fontes web complementares.
 */
export function SecaoDadosSecundariosPreview({ indicadoresPorCategoria = {}, contexto = {} }) {
  const categoriasComDados = Object.entries(indicadoresPorCategoria).filter(
    ([, items]) => Array.isArray(items) && items.length > 0
  );

  if (categoriasComDados.length === 0) return null;

  // Acumula fontes agrupadas por source_name para a sessão "Fontes e referências"
  const fontes = {}; // { source_name: { url, period, municipio, orgao } }
  for (const [, items] of categoriasComDados) {
    for (const it of items) {
      if (
        !it ||
        it.indicator === 'Resumo Executivo Territorial' ||
        String(it.source_id || '').startsWith('IA_INSIGHT')
      )
        continue;
      const key = it.source_name || it.orgao || 'Fonte pública';
      if (!fontes[key]) {
        fontes[key] = {
          url: it.source_url || '',
          period: it.reference_period || '',
          municipio: it.municipality || '',
          orgao: it.orgao || '',
        };
      }
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Database className="w-5 h-5 text-emerald-600" />
          Contexto Territorial — Dados Públicos Oficiais
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          Indicadores oficiais do município de{' '}
          <strong>
            {contexto.municipio}/{contexto.uf || '—'}
          </strong>
          . Período de referência (publicado pela fonte) distinto da data de coleta.
        </p>
      </div>

      {categoriasComDados.map(([cat, items]) => {
        const indicadores = items.filter(
          (it) =>
            it.indicator !== 'Resumo Executivo Territorial' &&
            !String(it.source_id || '').startsWith('IA_INSIGHT')
        );
        const insights = items.filter((it) => String(it.source_id || '').startsWith('IA_INSIGHT'));
        const label =
          CATEGORIAS_RELATORIO.find((c) => c.id === cat)?.label || cat;

        if (indicadores.length === 0 && insights.length === 0) return null;

        return (
          <div key={cat} className="space-y-2">
            <h4 className="text-sm font-semibold text-slate-700 border-b pb-1">{label}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {indicadores.map((it, i) => (
                <div key={it.id || i} className="border border-slate-200 rounded-md p-2 text-xs bg-slate-50/30">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-slate-700 font-medium">{it.indicator}</span>
                    <span
                      className={
                        it.geographic_level === 'MUNICIPAL'
                          ? 'text-[10px] bg-slate-200/60 text-slate-600 px-1.5 py-0.5 rounded'
                          : it.geographic_level === 'CONTEXTO_TERRITORIAL' || it.geographic_level === 'GEOESPACIAL'
                          ? 'text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded'
                          : 'text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded'
                      }
                    >
                      {it.geographic_level === 'MUNICIPAL'
                        ? 'Municipal'
                        : it.geographic_level === 'CONTEXTO_TERRITORIAL'
                        ? 'Contexto territorial'
                        : it.geographic_level || 'Municipal'}
                    </span>
                  </div>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">
                    {it.value_number != null
                      ? Number(it.value_number).toLocaleString('pt-BR', { maximumFractionDigits: 2 })
                      : it.value_text || '—'}
                    {it.unit ? ` ${it.unit}` : ''}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Referência: <span className="font-medium">{it.reference_period || 'não informado'}</span>
                    {it.municipality && ` · ${it.municipality}/${it.state || ''}`}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Fonte: <span className="font-medium">{it.source_name || it.orgao || '—'}</span>
                    {it.source_url && (
                      <>
                        {' · '}
                        <a
                          href={it.source_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 underline inline-flex items-center gap-0.5"
                        >
                          ver fonte <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </>
                    )}
                  </p>
                </div>
              ))}
            </div>
            {insights.length > 0 && (
              <div className="border-l-2 border-violet-300 bg-violet-50/50 p-2 text-xs text-violet-900">
                <p className="font-semibold mb-1">⚡ Leitura do território (inferência da IA — não fato):</p>
                <ul className="list-disc list-inside space-y-0.5">
                  {insights.map((it, i) => (
                    <li key={i}>{it.value_text}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      })}

      {/* Sessão Fontes e referências (spec §20) */}
      <div className="mt-6 border-t-2 border-slate-200 pt-4">
        <h3 className="text-base font-bold text-slate-900">Fontes e referências</h3>
        <div className="space-y-3 mt-2 text-xs">
          <div>
            <p className="font-semibold text-slate-700">Fontes públicas oficiais</p>
            <ul className="list-disc list-inside space-y-0.5 text-slate-600 mt-1">
              {Object.entries(fontes).map(([nome, f]) => (
                <li key={nome}>
                  <strong>{nome}</strong>
                  {f.orgao && ` — ${f.orgao}`}
                  {f.municipio && ` (${f.municipio})`}
                  {f.period && ` · referência: ${f.period}`}
                  {f.url && (
                    <>
                      {' · '}
                      <a href={f.url} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                        {f.url}
                      </a>
                    </>
                  )}
                </li>
              ))}
              {Object.keys(fontes).length === 0 && <li>Sem fontes públicas oficiais citadas neste relatório.</li>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}