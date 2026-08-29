import React, { useState, useCallback, useEffect } from 'react';
import { BuscaTerritorio } from '@/components/dados-secundarios/BuscaTerritorio';
import { FontesDropdown } from '@/components/dados-secundarios/FontesDropdown';
import { IndicadorComFonte } from '@/components/dados-secundarios/IndicadorComFonte';
import { SecaoNaoDisponivel } from '@/components/dados-secundarios/SecaoNaoDisponivel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Loader2, Database, Sparkles, Info } from 'lucide-react';
import {
  coletarDemografiaIBGE, registrarDemografiaEmCache,
  buscarTodosCaches, pesquisarViaIA, FONTES
} from '@/lib/publicTerritorialDataService';

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
  { id: 'mineracao', label: 'Mineração', icon: Database, viaIA: true }
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
  const [dados, setDados] = useState({}); // { [ibge+categoria]: { items, carregando, erro, ultimaAtual } }
  const [cacheCarregado, setCacheCarregado] = useState(false);

  const municipiosSelecionados = selecao.filter(s => s.tipo === 'municipio');

  // Key por territorio+categoria
  const keyDados = useCallback((ibge, cat) => `${ibge || 'semIbge'}__${cat}`, []);

  // Carregar cache inicial (uma vez, e sempre que muda seleção/seção)
  useEffect(() => {
    if (municipiosSelecionados.length === 0) return;
    (async () => {
      const ibges = municipiosSelecionados.map(m => m.ibge).filter(Boolean);
      const caches = await buscarTodosCaches(ibges, secaoAtiva);
      const novo = { ...dados };
      for (const cod of ibges) {
        const key = keyDados(cod, secaoAtiva);
        if ((caches[cod] || []).length > 0) {
          novo[key] = {
            items: caches[cod],
            carregando: false,
            erro: null,
            ultimaAtual: formatarData(caches[cod][0]?.updated_at)
          };
        }
      }
      setDados(novo);
      setCacheCarregado(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selecao, secaoAtiva]);

  const coletarDemografia = useCallback(async (mun) => {
    const key = keyDados(mun.ibge, 'demografia');
    setDados(d => ({ ...d, [key]: { ...(d[key] || {}), carregando: true, erro: null } }));
    try {
      const demografia = await coletarDemografiaIBGE(mun.ibge, mun.uf);
      if (demografia?.error) throw new Error(demografia.error);
      await registrarDemografiaEmCache(mun.ibge, mun.nome, mun.uf, demografia);
      const cache = await buscarTodosCaches([mun.ibge], 'demografia');
      setDados(d => ({
        ...d,
        [key]: {
          items: cache[mun.ibge] || [],
          carregando: false,
          erro: null,
          ultimaAtual: formatarData(new Date().toISOString())
        }
      }));
    } catch (e) {
      setDados(d => ({ ...d, [key]: { ...(d[key] || { items: [] }), carregando: false, erro: e.message || 'Falha ao coletar' } }));
    }
  }, [keyDados]);

  const coletarViaIA = useCallback(async (mun, categoria) => {
    const key = keyDados(mun.ibge, categoria);
    setDados(d => ({ ...d, [key]: { ...(d[key] || {}), carregando: true, erro: null } }));
    try {
      const res = await pesquisarViaIA({
        ibge_code: mun.ibge,
        municipio: mun.nome,
        uf: mun.uf,
        categoria,
        fontes: FONTES.filter(f => fontesSel.includes(f.id)).map(f => f.nome)
      });
      if (res?.error) throw new Error(res.error);
      const cache = await buscarTodosCaches([mun.ibge], categoria);
      setDados(d => ({
        ...d,
        [key]: {
          items: cache[mun.ibge] || [],
          carregando: false,
          erro: null,
          ultimaAtual: formatarData(res?.ultima_atualizacao || new Date().toISOString())
        }
      }));
    } catch (e) {
      setDados(d => ({ ...d, [key]: { ...(d[key] || { items: [] }), carregando: false, erro: e.message || 'Falha na coleta via IA' } }));
    }
  }, [keyDados, fontesSel]);

  // Trigger automático: quando muda seleção/seção, decarrega cache; coleta demografia imediata se nada no cache
  useEffect(() => {
    if (secaoAtiva === 'demografia' && municipiosSelecionados.length > 0) {
      for (const mun of municipiosSelecionados) {
        const key = keyDados(mun.ibge, 'demografia');
        if (!dados[key] || (dados[key].items?.length === 0 && !dados[key].carregando && !dados[key].erro)) {
          coletarDemografia(mun);
        }
      }
    }
  }, [selecao, secaoAtiva, dados, coletarDemografia, municipiosSelecionados, keyDados]);

  // ============ Rendering por seção ============
  const renderSecao = (mun, catId) => {
    const key = keyDados(mun.ibge, catId);
    const estado = dados[key] || { items: [], carregando: false, erro: null };
    const secao = SECOES.find(s => s.id === catId) || { label: catId };

    if (estado.carregando) {
      return (
        <Card key={key} className="p-6">
          <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm py-6">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            Coletando dados de {secao.label.toLowerCase()} para {mun.label}…
          </div>
        </Card>
      );
    }

    // Demografia (via IBGE — conhecida)
    if (catId === 'demografia') {
      return (
        <Card key={key} className="p-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Database className="w-4 h-4 text-primary" /> {mun.label} — Demografia (IBGE)
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {estado.items?.map((it, i) => (
              <IndicadorComFonte
                key={it.id || i}
                rotulo={it.indicator}
                valor={(it.value_number != null ? Number(it.value_number).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) : it.value_text) || '—'}
                unit={it.unit || ''}
                fonte={{ nome: it.source_name, url: it.source_url }}
                confidence={it.confidence || 'oficial'}
                periodo={it.reference_period}
              />
            ))}
            {(!estado.items || estado.items.length === 0) && !estado.erro && (
              <div className="col-span-full text-center text-sm text-muted-foreground py-6">
                Aguardando coleta IBGE…
              </div>
            )}
            {estado.erro && (
              <div className="col-span-full text-center text-sm text-amber-700 py-4">
                {estado.erro}
              </div>
            )}
          </CardContent>
        </Card>
      );
    }

    // Seções via IA
    if (!estado.items || estado.items.length === 0) {
      return (
        <SecaoNaoDisponivel
          key={key}
          categoria={catId}
          onColetar={() => coletarViaIA(mun, catId)}
          carregando={estado.carregando}
          ultimaAtualizacao={estado.ultimaAtual}
          erro={estado.erro}
        />
      );
    }

    // Renderizar items coletados via IA
    const resumo = estado.items.find(i => i.indicator === 'Resumo Executivo Territorial');
    const insights = estado.items.filter(i => (i.source_id || '').startsWith('IA_INSIGHT'));
    const indicators = estado.items.filter(i => i.indicator !== 'Resumo Executivo Territorial' && !(i.source_id || '').startsWith('IA_INSIGHT'));

    return (
      <Card key={key} className="p-4 space-y-3">
        <CardHeader className="pb-1">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" /> {mun.label} — {secao.label}
            <span className="text-xs font-normal text-muted-foreground">via IA web</span>
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
        </CardContent>
      </Card>
    );
  };

  // ============ Modo comparar ============
  const renderComparacao = () => {
    if (municipiosSelecionados.length < 2) return null;
    const catId = secaoAtiva === 'resumo' ? 'demografia' : secaoAtiva;
    const muns = municipiosSelecionados;
    // Indicadores comuns: junta keys únicas
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
                  Nenhum dado comparável coletado ainda. Colete a seção "{SECOES.find(s => s.id === catId)?.label}" para cada território.
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

      {/* Busca + Fontes */}
      <Card className="p-4 space-y-3">
        <BuscaTerritorio
          selecao={selecao}
          onSelecaoChange={setSelecao}
          onComparar={() => setComparando(c => !c)}
          comparando={comparando}
        />
        <div className="flex items-center justify-between flex-wrap gap-2">
          <FontesDropdown selecionadas={fontesSel} onChange={setFontesSel} />
          <p className="text-xs text-muted-foreground">
            {selecao.length === 0
              ? 'Selecione um município ou comunidade para começar.'
              : `${selecao.length} território(s) selecionado(s).`}
          </p>
        </div>
      </Card>

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
                    Comparação territorial exige que cada município já tenha coletado a seção — clique em
                    “Coletar via IA” dentro de cada município se ainda não houver dados.
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
                  {selecao.some(s => s.tipo === 'comunidade') && (
                    <Card className="p-3 text-xs text-muted-foreground bg-muted/30">
                      <p className="flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5" />
                        Comunidades selecionadas serão tratadas no contexto do município ao qual pertencem.
                        Para esta versão, a coleta é feita no nível municipal — ajuste fino por comunidade em versões futuras.
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
          não são armazenados — apenas dados agregados territoriais. Quando a IA-Based inference é usada,
          fica rotulada como inferência, nunca afirmada como fato.
        </p>
      </Card>
    </div>
  );
}