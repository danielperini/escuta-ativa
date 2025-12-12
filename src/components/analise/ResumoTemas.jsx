import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Tag, TrendingUp, TrendingDown, Minus, Sparkles, Loader2 } from 'lucide-react';

export default function ResumoTemas() {
  const [resumo, setResumo] = useState(null);
  const [analisando, setAnalisando] = useState(false);

  const { data: registros = [] } = useQuery({
    queryKey: ['registros-temas'],
    queryFn: () => base44.entities.Registro.list('-created_date', 100)
  });

  const { data: temas = [] } = useQuery({
    queryKey: ['temas'],
    queryFn: () => base44.entities.Tema.list()
  });

  useEffect(() => {
    if (registros.length > 0 && temas.length > 0) {
      analisarTemas();
    }
  }, [registros, temas]);

  const analisarTemas = async () => {
    setAnalisando(true);
    try {
      // Pegar últimos 60 dias
      const ultimos60Dias = new Date();
      ultimos60Dias.setDate(ultimos60Dias.getDate() - 60);

      const registrosRecentes = registros.filter(r => 
        new Date(r.created_date) >= ultimos60Dias
      );

      const temasComFrequencia = {};
      registrosRecentes.forEach(registro => {
        (registro.temas_identificados || []).forEach(tema => {
          if (!temasComFrequencia[tema]) {
            temasComFrequencia[tema] = {
              nome: tema,
              mencoes: 0,
              comunidades: new Set(),
              registros_ids: []
            };
          }
          temasComFrequencia[tema].mencoes++;
          if (registro.comunidade) {
            temasComFrequencia[tema].comunidades.add(registro.comunidade);
          }
          temasComFrequencia[tema].registros_ids.push(registro.id);
        });
      });

      const temasOrdenados = Object.values(temasComFrequencia)
        .map(t => ({
          ...t,
          comunidades: Array.from(t.comunidades)
        }))
        .sort((a, b) => b.mencoes - a.mencoes)
        .slice(0, 10);

      // Análise IA para contexto e tendências
      const prompt = `Analise os seguintes temas identificados em registros comunitários dos últimos 60 dias:

TEMAS COM FREQUÊNCIA:
${JSON.stringify(temasOrdenados, null, 2)}

DADOS DOS TEMAS NO SISTEMA:
${JSON.stringify(temas.slice(0, 20), null, 2)}

TAREFAS:

1. RESUMO EXECUTIVO:
   - Principais tendências territoriais
   - Temas emergentes (aparecendo com frequência crescente)
   - Temas em declínio
   - Temas críticos que requerem atenção imediata

2. ANÁLISE POR TEMA (top 10):
   - Contexto e relevância
   - Comunidades mais afetadas
   - Recomendações de ação
   - Prioridade (baixa, média, alta, crítica)

3. INSIGHTS ESTRATÉGICOS:
   - Padrões identificados
   - Gaps de comunicação/engajamento
   - Oportunidades de intervenção

Seja objetivo e prático.`;

      const resultado = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            resumo_executivo: {
              type: "object",
              properties: {
                principais_tendencias: { type: "array", items: { type: "string" } },
                temas_emergentes: { type: "array", items: { type: "string" } },
                temas_declinio: { type: "array", items: { type: "string" } },
                temas_criticos: { type: "array", items: { type: "string" } }
              }
            },
            analise_temas: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  tema: { type: "string" },
                  contexto: { type: "string" },
                  comunidades_principais: { type: "array", items: { type: "string" } },
                  recomendacoes: { type: "array", items: { type: "string" } },
                  prioridade: { type: "string", enum: ["baixa", "media", "alta", "critica"] },
                  tendencia: { type: "string", enum: ["subindo", "estavel", "caindo"] }
                }
              }
            },
            insights_estrategicos: {
              type: "object",
              properties: {
                padroes: { type: "array", items: { type: "string" } },
                gaps: { type: "array", items: { type: "string" } },
                oportunidades: { type: "array", items: { type: "string" } }
              }
            }
          }
        }
      });

      setResumo({
        ...resultado,
        temas_frequencia: temasOrdenados
      });
    } catch (error) {
      console.error('Erro ao analisar temas:', error);
    } finally {
      setAnalisando(false);
    }
  };

  const getTendenciaIcon = (tendencia) => {
    if (tendencia === 'subindo') return <TrendingUp className="w-4 h-4 text-emerald-600" />;
    if (tendencia === 'caindo') return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-slate-400" />;
  };

  const getPrioridadeCor = (prioridade) => {
    switch(prioridade) {
      case 'critica': return 'bg-red-100 text-red-800 border-red-300';
      case 'alta': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'media': return 'bg-amber-100 text-amber-800 border-amber-300';
      default: return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  if (analisando) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-[#40916C]" />
          <p className="text-slate-600">Analisando temas territoriais...</p>
        </CardContent>
      </Card>
    );
  }

  if (!resumo) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Tag className="w-8 h-8 mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500 mb-4">Nenhum resumo de temas disponível</p>
          <Button onClick={analisarTemas} variant="outline" className="gap-2">
            <Sparkles className="w-4 h-4" />
            Gerar Resumo
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumo Executivo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#40916C]" />
            Resumo Executivo - Temas Territoriais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {resumo.resumo_executivo?.temas_criticos?.length > 0 && (
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <h4 className="font-semibold text-red-900 mb-2">⚠️ Temas Críticos</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-red-800">
                {resumo.resumo_executivo.temas_criticos.map((tema, i) => (
                  <li key={i}>{tema}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            {resumo.resumo_executivo?.temas_emergentes?.length > 0 && (
              <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                <h4 className="font-semibold text-emerald-900 mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Temas Emergentes
                </h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-emerald-800">
                  {resumo.resumo_executivo.temas_emergentes.map((tema, i) => (
                    <li key={i}>{tema}</li>
                  ))}
                </ul>
              </div>
            )}

            {resumo.resumo_executivo?.principais_tendencias?.length > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">📊 Principais Tendências</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
                  {resumo.resumo_executivo.principais_tendencias.map((tend, i) => (
                    <li key={i}>{tend}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Análise Detalhada por Tema */}
      <Card>
        <CardHeader>
          <CardTitle>Análise Detalhada por Tema</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {resumo.analise_temas?.map((analise, idx) => {
            const freq = resumo.temas_frequencia.find(t => t.nome === analise.tema);
            return (
              <div key={idx} className={`p-4 rounded-lg border-2 ${getPrioridadeCor(analise.prioridade)}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-lg">{analise.tema}</h4>
                    {getTendenciaIcon(analise.tendencia)}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="gap-1">
                      <Tag className="w-3 h-3" />
                      {freq?.mencoes || 0} menções
                    </Badge>
                    <Badge className={getPrioridadeCor(analise.prioridade)}>
                      {analise.prioridade}
                    </Badge>
                  </div>
                </div>

                <p className="text-sm mb-3">{analise.contexto}</p>

                {analise.comunidades_principais?.length > 0 && (
                  <div className="mb-2">
                    <span className="text-xs font-semibold">Comunidades: </span>
                    <span className="text-xs">{analise.comunidades_principais.join(', ')}</span>
                  </div>
                )}

                {analise.recomendacoes?.length > 0 && (
                  <div className="bg-white/50 p-3 rounded mt-2">
                    <p className="text-xs font-semibold mb-1">💡 Recomendações:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      {analise.recomendacoes.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Insights Estratégicos */}
      {resumo.insights_estrategicos && (
        <Card>
          <CardHeader>
            <CardTitle>Insights Estratégicos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {resumo.insights_estrategicos.padroes?.length > 0 && (
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">🔍 Padrões Identificados</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-slate-700">
                  {resumo.insights_estrategicos.padroes.map((padrao, i) => (
                    <li key={i}>{padrao}</li>
                  ))}
                </ul>
              </div>
            )}

            {resumo.insights_estrategicos.oportunidades?.length > 0 && (
              <div>
                <h4 className="font-semibold text-emerald-900 mb-2">🎯 Oportunidades</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-emerald-800">
                  {resumo.insights_estrategicos.oportunidades.map((op, i) => (
                    <li key={i}>{op}</li>
                  ))}
                </ul>
              </div>
            )}

            {resumo.insights_estrategicos.gaps?.length > 0 && (
              <div>
                <h4 className="font-semibold text-amber-900 mb-2">⚡ Gaps Identificados</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-amber-800">
                  {resumo.insights_estrategicos.gaps.map((gap, i) => (
                    <li key={i}>{gap}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-center">
        <Button onClick={analisarTemas} variant="outline" className="gap-2">
          <Sparkles className="w-4 h-4" />
          Atualizar Análise
        </Button>
      </div>
    </div>
  );
}