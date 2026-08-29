import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { BuscaTerritorio } from '@/components/dados-secundarios/BuscaTerritorio';
import { FontesDropdown } from '@/components/dados-secundarios/FontesDropdown';
import { IndicadorComFonte } from '@/components/dados-secundarios/IndicadorComFonte';
import { SecaoNaoDisponivel } from '@/components/dados-secundarios/SecaoNaoDisponivel';
import { SecaoTelecomunicacoes } from '@/components/dados-secundarios/SecaoTelecomunicacoes';
import { SecaoAguaRecursosHidricos } from '@/components/dados-secundarios/SecaoAguaRecursosHidricos';
import { CoberturaFontes } from '@/components/dados-secundarios/CoberturaFontes';
import { CardCobertura } from '@/components/dados-secundarios/CardCobertura';
import { SeletorComunidades } from '@/components/dados-secundarios/SeletorComunidades';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Loader2, Database, Sparkles, Info, Radio, Droplets, RefreshCw, AlertTriangle } from 'lucide-react';
import {
  buscarTodosCaches, FONTES
} from '@/lib/publicTerritorialDataService';
import {
  resolverSeccao, STATUS_DADO
} from '@/lib/secondaryDataResolver';

const SECOES = [
  { id: 'resumo', label: 'Resumo', icon: Sparkles },
  { id: 'demografia', label: 'Demografia', icon: Database, viaAPI: true },
  { id: 'economia', label: 'Economia', icon: Database, viaIA: true },
  { id: 'saude', label: 'Saúde', icon: Database, viaIA: true },
  { id: 'educacao', label: 'Educação', icon: Database, viaIA: true },
  { id: 'governo_municipal', label: 'Governo', icon: Database, viaIA: true },
  { id: 'camara_municipal', label: 'Câmara', icon: Database, viaIA: true },
  { id: 'conselhos', label: 'Conselhos', icon: Database, viaIA: true },
  { id: 'osc', label: 'OSCs', icon: Database, viaIA: true },
  { id: 'politicas_publicas', label: 'Políticas', icon: Database, viaIA: true },
  { id: 'legislacao', label: 'Regulatório', icon: Database, viaIA: true },
  { id: 'meio_ambiente', label: 'Meio Ambiente', icon: Database, viaIA: true },
  { id: 'mineracao', label: 'Mineração', icon: Database, viaIA: true },
  { id: 'telecomunicacoes', label: 'Telecom', icon: Radio, viaIA: true },
  { id: 'agua_recursos_hidricos', label: 'Água', icon: Droplets, viaIA: true }
];

function formatarData(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch (_) { return ''; }
}

export default function DadosSecundarios() {
  const [selecao, setSelecao] = useState([]);
  const [fontesSel, setFontesSel] = useState(['ibge', 'sidra', 'prefeitura', 'camara_municipal', 'conselhos_municipais']);
  const [comparando, setComparando] = useState(false);
  const [secaoAtiva, setSecaoAtiva] = useState('resumo');
  const [dados, setDados] = useState({}); // { [ibge+categoria]: { items, carregando, status, fonte_final, ultimaAtual, aviso_validade, erro_class } }
  const [comunidadesSel, setComunidadesSel] = useState([]);

  const municipiosSelecionados = selecao.filter(s => s.tipo === 'municipio');
  const keyDados = useCallback((ibge, cat) => `${ibge || 'semIbge'}__${cat}`, []);

  // Carrega comunidades cadastradas para os municípios selecionados
  const { data: comunidadesMunicipio = [] } = useQuery({
    queryKey: ['comunidades-por-municipio', municipiosSelecionados.map(m => m.nome).join('|')],
    queryFn: async () => {
      if (municipiosSelecionados.length === 0) return [];
      const result = await Promise.allSettled(
        municipiosSelecionados.map(m => base44.entities.Comunidade.filter({ municipio: m.nome }))
      );
      const lista = [];
      const seen = new Set();
      for (const r of result) {
        if (r.status === 'fulfilled') {
          for (const c of (r.value || [])) {
            if (!seen.has(c.id)) {
              seen.add(c.id);
              lista.push({ id: c.id, nome: c.nome, municipio: c.municipio, tipo: c.tipo });
            }
          }
        }
      }
      return lista;
    },
    enabled: municipiosSelecionados.length > 0
  });

  // Coletor único usando resolver centralizado — substitui coletarDemografia/coletarViaIA
  const coletarSeccaoParaMun = useCallback(async (mun, categoria, opts = {}) => {
    const ampliar = !!(opts && opts.ampliar);
    const ampliarExtra = ampliar ? (opts.pergunta || 'descritivo geral') : undefined;
    const key = keyDados(mun.ibge, categoria);
    setDados(d => ({
      ...d,
      [key]: { ...(d[key] || {}), carregando: true, erro: null, status: 'BUSCANDO' }
    }));
    try {
      const res = await resolverSeccao({
        mun,
        categoria,
        fontesSel,
        forceRefresh: !!opts.forceRefresh || ampliar,
        ampliarExtra
      });
      setDados(d => ({
        ...d,
        [key]: {
          items: res.items || [],
          carregando: false,
          erro: null,
          status: res.status,
          fonte_final: res.fonte_final,
          ultimaAtual: formatarData(res.ultimaAtual),
          aviso_validade: res.aviso_validade,
          erro_class: res.erro_class
        }
      }));
    } catch (e) {
      setDados(d => ({
        ...d,
        [key]: {
          ...(d[key] || { items: [] }),
          carregando: false,
          erro: null,
          status: STATUS_DADO.SOURCE_TEMPORARILY_UNAVAILABLE,
          erro_class: 'unknown'
        }
      }));
    }
  }, [keyDados, fontesSel]);

  // Carregar cache inicial (uma vez, e sempre que muda seleção/seção)
  useEffect(() => {
    if (municipiosSelecionados.length === 0) return;
    (async () => {
      const ibges = municipiosSelecionados.map(m => m.ibge).filter(Boolean);
      const caches = await buscarTodosCaches(ibges, secaoAtiva);
      const novo = { ...dados };
      for (const cod of ibges) {
        const key = keyDados(cod, secaoAtiva);
        const items = (caches[cod] && caches[cod].length > 0) ? caches[cod] : [];
        if (items.length > 0) {
          novo[key] = {
            items,
            carregando: false,
            erro: null,
            status: STATUS_DADO.DADO_DISPONIVEL,
            fonte_final: items[0]?.source_name,
            ultimaAtual: formatarData(items[0]?.updated_at)
          };
        } else if (!novo[key]) {
          novo[key] = { items: [], carregando: false, status: 'PRONTO_PARA_COLETA' };
        }
      }
      setDados(novo);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selecao, secaoAtiva]);

  // Trigger automático: para TODAS as seções dispara a coleta automaticamente
  // se o cache está pronto para coleta e ainda não há dados. Comparar não dispara.
  useEffect(() => {
    if (comparando) return;
    if (municipiosSelecionados.length === 0) return;
    if (secaoAtiva === 'resumo') return;
    for (const mun of municipiosSelecionados) {
      const key = keyDados(mun.ibge, secaoAtiva);
      const estado = dados[key];
      if (!estado) continue;
      if (estado.status === 'PRONTO_PARA_COLETA' && !estado.carregando && (estado.items || []).length === 0) {
        coletarSeccaoParaMun(mun, secaoAtiva);
      }
    }
  }, [selecao, secaoAtiva, dados, coletarSeccaoParaMun, municipiosSelecionados, keyDados, comparando]);

  // Cobertura dos Dados — resumo da seção ativa
  const cobertura = useMemo(() => {
    let encontrados = 0, indisponiveis = 0, semCobertura = 0;
    for (const mun of municipiosSelecionados) {
      const key = keyDados(mun.ibge, secaoAtiva);
      const e = dados[key];
      if (!e) continue;
      if (e.status === STATUS_DADO.DADO_DISPONIVEL && (e.items || []).length > 0) encontrados += 1;
      else if (e.status === STATUS_DADO.EMERGENCIA_CACHE) indisponiveis += 1;
      else if (e.status === STATUS_DADO.SEM_DADO) semCobertura += 1;
    }
    return { encontrados, indisponiveis, semCobertura };
  }, [dados, secaoAtiva, municipiosSelecionados, keyDados]);

  // ============ Rendering por seção ============
  const renderSecao = (mun, catId) => {
    const key = keyDados(mun.ibge, catId);
    const estado = dados[key] || { items: [], carregando: false, status: 'PRONTO_PARA_COLETA' };
    const secao = SECOES.find(s => s.id === catId) || { label: catId };

    if (estado.carregando) {
      const buscandoAlt = estado.status === 'SOURCE_TEMPORARILY_UNAVAILABLE' || (estado.erro_class && /SOURCE_TEMPORARILY/i.test(estado.erro_class));
      return (
        <Card key={key} className="p-6">
          <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm py-6">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            {buscandoAlt
              ? 'Fonte temporariamente indisponível. Buscando alternativa…'
              : `Coletando dados de ${secao.label.toLowerCase()} para ${mun.label}…`}
          </div>
        </Card>
      );
    }

    // Demografia (via IBGE — conhece campos diretos)
    if (catId === 'demografia') {
      const isDisponivel = (estado.status === STATUS_DADO.DADO_DISPONIVEL || estado.status === STATUS_DADO.EMERGENCIA_CACHE) && (estado.items || []).length > 0;
      return (
        <Card key={key} className="p-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Database className="w-4 h-4 text-primary" /> {mun.label} — Demografia (IBGE)
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {(estado.items || []).map((it, i) => (
              <IndicadorComFonte
                key={it.id || i}
                rotulo={it.indicator}
                valor={(it.value_number != null ? Number(it.value_number).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) : it.value_text) || '—'}
                unit={it.unit || ''}
                fonte={{ nome: it.source_name, url: it.source_url }}
                confidence={it.confidence || 'oficial'}
                method={it.method}
                geographic_level={it.geographic_level}
                periodo={it.reference_period}
                />
            ))}
            {!isDisponivel && (
              <div className="col-span-full">
                <SecaoNaoDisponivel
                  categoria={catId}
                  onColetar={() => coletarSeccaoParaMun(mun, 'demografia', { forceRefresh: true })}
                  status={estado.status}
                  aviso_validade={estado.aviso_validade}
                  ultimaAtualizacao={estado.ultimaAtual}
                  detalhes_admin={estado.erro_class}
                  fonte_final={estado.fonte_final}
                />
              </div>
            )}
            {estado.aviso_validade && isDisponivel && (
              <p className="col-span-full text-xs italic text-amber-700">{estado.aviso_validade}</p>
            )}
          </CardContent>
        </Card>
      );
    }

    // Telecomunicações
    if (catId === 'telecomunicacoes') {
      return (
        <SecaoTelecomunicacoes
          key={key}
          mun={mun}
          estado={estado}
          onColetar={() => coletarSeccaoParaMun(mun, catId, { forceRefresh: true })}
        />
      );
    }
    // Água
    if (catId === 'agua_recursos_hidricos') {
      return (
        <SecaoAguaRecursosHidricos
          key={key}
          mun={mun}
          estado={estado}
          onColetar={() => coletarSeccaoParaMun(mun, catId, { forceRefresh: true })}
        />
      );
    }

    // Outras seções via IA/web
    if ((estado.status !== STATUS_DADO.DADO_DISPONIVEL && estado.status !== STATUS_DADO.EMERGENCIA_CACHE) || (estado.items || []).length === 0) {
      return (
        <SecaoNaoDisponivel
          key={key}
          categoria={catId}
          onColetar={() => coletarSeccaoParaMun(mun, catId, { forceRefresh: true })}
          status={estado.status}
          aviso_validade={estado.aviso_validade}
          ultimaAtualizacao={estado.ultimaAtual}
          detalhes_admin={estado.erro_class}
          fonte_final={estado.fonte_final}
        />
      );
    }

    const resumo = estado.items.find(i => i.indicator === 'Resumo Executivo Territorial');
    const insights = estado.items.filter(i => (i.source_id || '').startsWith('IA_INSIGHT'));
    const indicators = estado.items.filter(i => i.indicator !== 'Resumo Executivo Territorial' && !(i.source_id || '').startsWith('IA_INSIGHT'));

    return (
      <Card key={key} className="p-4 space-y-3">
        <CardHeader className="pb-1">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" /> {mun.label} — {secao.label}
            <span className="text-xs font-normal text-muted-foreground">via {estado.fonte_final || 'IA / Web'}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {resumo && (
            <div className="p-2.5 rounded-md bg-muted/40 text-sm text-foreground leading-relaxed">
              {resumo.value_text}
            </div>
          )}
          {indicators.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {indicators.map((it, i) => (
                <IndicadorComFonte
                  key={it.id || i}
                  rotulo={it.indicator}
                  valor={(it.value_number != null ? Number(it.value_number).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) : it.value_text) || '—'}
                  unit={it.unit || ''}
                  fonte={{ nome: it.source_name, url: it.source_url, data_consulta: formatarData(it.updated_at) }}
                  confidence={it.confidence}
                  method={it.method}
                  geographic_level={it.geographic_level}
                  periodo={it.reference_period}
                />
              ))}
            </div>
          )}
          {insights.length > 0 && (
            <div className="border-t border-border pt-2">
              <p className="text-xs font-semibold text-violet-700 mb-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Leitura do território (inferência da IA)
              </p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                {insights.map((it, i) => <li key={i}>{it.value_text}</li>)}
              </ul>
            </div>
          )}
          {(estado.aviso_validade || estado.status === STATUS_DADO.EMERGENCIA_CACHE) && (
            <p className="text-xs italic text-amber-700 flex items-start gap-1">
              <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
              {estado.aviso_validade || 'Exibindo último dado disponível em cache — não foi possível atualizar a coleta agora.'}
            </p>
          )}
        </CardContent>
      </Card>
    );
  };

  // ============ Modo comparar ============
  const renderComparacao = () => {
    if (municipiosSelecionados.length < 2) return null;
    const catId = secaoAtiva === 'resumo' ? 'demografia' : secaoAtiva;
    const muns = municipiosSelecionados;
    const setInd = new Set();
    for (const m of muns) {
      const items = (dados[keyDados(m.ibge, catId)] || {}).items || [];
      items.forEach(i => {
        if (i.indicator !== 'Resumo Executivo Territorial' && !(i.source_id || '').startsWith('IA_INSIGHT')) {
          setInd.add(i.indicator);
        }
      });
    }
    const indicadores = [...setInd];

    return (
      <Card className="overflow-x-auto">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Database className="w-4 h-4 text-primary" /> Comparativo territorial — {SECOES.find(s => s.id === catId)?.label}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2 font-medium">Indicador</th>
                {muns.map(m => (
                  <th key={m.ibge} className="text-left p-2 font-medium">
                    {m.nome}/{m.uf}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {indicadores.map((ind) => (
                <tr key={ind} className="border-b border-border/40">
                  <td className="p-2 text-muted-foreground">{ind}</td>
                  {muns.map(m => {
                    const items = (dados[keyDados(m.ibge, catId)] || {}).items || [];
                    const it = items.find(i => i.indicator === ind);
                    const val = it?.value_number != null
                      ? Number(it.value_number).toLocaleString('pt-BR', { maximumFractionDigits: 2 })
                      : (it?.value_text || '—');
                    return <td key={m.ibge} className="p-2 font-medium">{val}{it?.unit ? ` ${it.unit}` : ''}</td>;
                  })}
                </tr>
              ))}
              {indicadores.length === 0 && (
                <tr><td colSpan={muns.length + 1} className="p-6 text-center text-muted-foreground text-xs">
                  Nenhum dado comparável coletado ainda. Espere as coletas automáticas finalizarem ou clique “Atualizar dados”.
                </td></tr>
              )}
            </tbody>
          </table>
          <p className="text-xs text-muted-foreground mt-3 italic">
            Comparação deliberadamente não gera ranking — apenas evidencia diferenças.
          </p>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Dados públicos</p>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mt-1 flex items-center gap-2">
          <Database className="w-6 h-6 text-primary" />
          Dados Secundários
        </h1>
        <p className="font-medium text-foreground mt-1">Inteligência pública, social, institucional e territorial</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
          Cruze dados oficiais, fontes públicas e contexto institucional com os registros de relacionamento comunitário.
        </p>
      </div>

      <CoberturaFontes />

      {/* Busca + Fontes + Atualizar */}
      <Card className="p-4 space-y-3">
        <BuscaTerritorio
          selecao={selecao}
          onSelecaoChange={setSelecao}
          onComparar={() => setComparando(c => !c)}
          comparando={comparando}
        />
        <div className="flex items-center justify-between flex-wrap gap-2">
          <FontesDropdown selecionadas={fontesSel} onChange={setFontesSel} />
          <div className="flex items-center gap-2">
            <Button
              onClick={() => {
                for (const mun of municipiosSelecionados) {
                  coletarSeccaoParaMun(mun, secaoAtiva, { forceRefresh: true });
                }
              }}
              variant="outline"
              size="sm"
              disabled={municipiosSelecionados.length === 0 || secaoAtiva === 'resumo'}
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Atualizar dados
            </Button>
            <p className="text-xs text-muted-foreground">
              {selecao.length === 0
                ? 'Selecione um município ou comunidade para começar.'
                : `${selecao.length} território(s) selecionado(s).`}
            </p>
          </div>
        </div>
      </Card>

      {/* Seletor de Comunidades */}
      {municipiosSelecionados.length > 0 && (
        <SeletorComunidades
          municipios={municipiosSelecionados}
          comunidades={comunidadesMunicipio}
          selecionadas={comunidadesSel}
          onChange={setComunidadesSel}
        />
      )}

      {/* Cobertura dos Dados — summary da seção ativa */}
      {municipiosSelecionados.length > 0 && secaoAtiva !== 'resumo' && (
        <CardCobertura
          encontrados={cobertura.encontrados}
          indisponiveis={cobertura.indisponiveis}
          semCobertura={cobertura.semCobertura}
          secaoLabel={SECOES.find(s => s.id === secaoAtiva)?.label}
        />
      )}

      {/* Conteúdo */}
      {selecao.length === 0 ? (
        <Card className="p-10 text-center">
          <Database className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="font-medium text-foreground">Selecione territórios para coletar dados secundários</p>
          <p className="text-sm text-muted-foreground mt-1">
            A coleta prioriza fontes oficiais brasileiras e respeita o código IBGE como identificador territorial.
          </p>
        </Card>
      ) : (
        <Tabs value={secaoAtiva} onValueChange={setSecaoAtiva} className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto py-1">
            {SECOES.map(s => (
              <TabsTrigger key={s.id} value={s.id} className="text-xs gap-1.5 py-1.5">
                <s.icon className="w-3.5 h-3.5" />
                {s.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {SECOES.map(s => (
            <TabsContent key={s.id} value={s.id} className="mt-4">
              {comparando && municipiosSelecionados.length >= 2 ? (
                <div className="space-y-4">
                  {renderComparacao()}
                  <div className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    Comparação territorial exige que cada município já tenha coletado a seção — espere as coletas
                    automáticas ou clique “Atualizar dados” para forçar.
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {municipiosSelecionados.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Selecione ao menos um município (comunidades não têm código IBGE próprio — use o
                      município correspondente).
                    </p>
                  )}
                  {municipiosSelecionados.map(mun => renderSecao(mun, s.id))}
                  {comunidadesSel.length > 0 && (
                    <Card className="p-3 bg-muted/30">
                      <p className="text-xs text-muted-foreground">
                        {comunidadesSel.length} comunidade(s) selecionada(s) — a coleta de dados públicos
                        continua no nível municipal; para indicadores da comunidade específica, use os dados
                        internos cadastrados no módulo Registros/Stakeholders/Demandas associados a essa comunidade.
                      </p>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}

      {/* Nota de privacidade */}
      <Card className="p-3 bg-muted/20">
        <p className="text-xs text-muted-foreground flex items-start gap-2">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          Toda informação pública possui fonte rastreável. Dados individuais (CPF, NIS, dados médicos)
          não são armazenados — apenas dados agregados territoriais. Quando a inferência via IA é usada,
          fica rotulada como inferência, nunca afirmada como fato. Erros técnicos (503, timeout) são
          interceptados e convertidos em mensagens funcionais.
        </p>
      </Card>
    </div>
  );
}