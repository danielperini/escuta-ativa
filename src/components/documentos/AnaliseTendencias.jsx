import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Loader2, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function AnaliseTendencias() {
    const [analisando, setAnalisando] = useState(false);
    const [resultado, setResultado] = useState(null);

    const { data: documentos = [] } = useQuery({
        queryKey: ['documentos-tendencias'],
        queryFn: () => base44.entities.DocumentoProcessado.list('-created_date')
    });

    const analisarTendencias = async () => {
        setAnalisando(true);

        try {
            const dadosAnalise = documentos.map(doc => ({
                titulo: doc.titulo,
                tipo: doc.tipo,
                data: doc.data_documento || doc.created_date,
                palavras_chave: doc.palavras_chave || [],
                temas: doc.entidades_mencionadas?.temas || [],
                informacoes_chave: doc.informacoes_chave || [],
                compromissos: doc.compromissos_identificados?.length || 0,
                demandas: doc.demandas_identificadas?.length || 0,
                riscos: doc.riscos_identificados?.length || 0
            }));

            const prompt = `
Você é um analista de tendências documentais e padrões organizacionais.

DOCUMENTOS PROCESSADOS: ${documentos.length}

DADOS AGREGADOS:
${JSON.stringify(dadosAnalise, null, 2)}

ANÁLISE SOLICITADA:

1. TENDÊNCIAS TEMPORAIS
   - Evolução dos temas ao longo do tempo
   - Padrões de recorrência
   - Tópicos emergentes vs. em declínio

2. ANÁLISE DE FREQUÊNCIA
   - Palavras-chave mais recorrentes
   - Temas dominantes
   - Comunidades mais mencionadas

3. PADRÕES DE COMPROMISSOS
   - Volume de compromissos por período
   - Tipos de compromissos mais comuns
   - Taxas de cumprimento (se identificável)

4. ANÁLISE DE RISCOS
   - Riscos recorrentes
   - Escalada de problemas
   - Áreas críticas de atenção

5. INSIGHTS ESTRATÉGICOS
   - Gaps de comunicação
   - Áreas negligenciadas
   - Oportunidades não exploradas

Forneça análise quantitativa e qualitativa.
`;

            const analiseIA = await base44.integrations.Core.InvokeLLM({
                prompt: prompt,
                response_json_schema: {
                    type: "object",
                    properties: {
                        sintese_executiva: { type: "string" },
                        tendencias_temporais: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    periodo: { type: "string" },
                                    tendencia: { type: "string" },
                                    impacto: { type: "string", enum: ["alto", "medio", "baixo"] }
                                }
                            }
                        },
                        palavras_chave_recorrentes: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    termo: { type: "string" },
                                    frequencia: { type: "number" }
                                }
                            }
                        },
                        temas_dominantes: { type: "array", items: { type: "string" } },
                        padroes_compromissos: { type: "string" },
                        riscos_recorrentes: { type: "array", items: { type: "string" } },
                        insights_estrategicos: { type: "array", items: { type: "string" } },
                        recomendacoes: { type: "array", items: { type: "string" } }
                    }
                }
            });

            setResultado(analiseIA);
        } catch (error) {
            console.error("Erro na análise:", error);
            alert("Erro ao analisar tendências: " + error.message);
        } finally {
            setAnalisando(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        Análise de Tendências nos Documentos
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600">
                        Análise inteligente de {documentos.length} documentos processados para identificar 
                        tendências recorrentes, padrões temáticos e insights estratégicos.
                    </p>

                    <Button
                        onClick={analisarTendencias}
                        disabled={analisando || documentos.length === 0}
                        className="w-full"
                        style={{ backgroundColor: '#0B1E33' }}
                    >
                        {analisando ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Analisando Tendências...
                            </>
                        ) : (
                            <>
                                <BarChart3 className="w-5 h-5 mr-2" />
                                Analisar Tendências
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {resultado && (
                <>
                    <Card className="bg-blue-50 border-l-4 border-blue-600">
                        <CardHeader>
                            <CardTitle>Síntese Executiva</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-700">{resultado.sintese_executiva}</p>
                        </CardContent>
                    </Card>

                    {resultado.palavras_chave_recorrentes && resultado.palavras_chave_recorrentes.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Termos Mais Recorrentes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={resultado.palavras_chave_recorrentes.slice(0, 10)}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="termo" angle={-45} textAnchor="end" height={100} />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="frequencia" fill="#F2B632" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle>Tendências Temporais</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {resultado.tendencias_temporais?.map((tend, idx) => (
                                    <div key={idx} className="border-l-4 border-blue-500 pl-4 py-2">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-semibold">{tend.periodo}</span>
                                            <span className={`text-xs px-2 py-1 rounded ${
                                                tend.impacto === "alto" ? "bg-red-100 text-red-800" :
                                                tend.impacto === "medio" ? "bg-yellow-100 text-yellow-800" :
                                                "bg-green-100 text-green-800"
                                            }`}>
                                                Impacto {tend.impacto}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-700">{tend.tendencia}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Temas Dominantes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2">
                                    {resultado.temas_dominantes?.map((tema, idx) => (
                                        <li key={idx} className="flex items-center gap-2 text-sm">
                                            <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                                            {tema}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>

                        <Card className="bg-red-50">
                            <CardHeader>
                                <CardTitle className="text-lg text-red-800">Riscos Recorrentes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2">
                                    {resultado.riscos_recorrentes?.map((risco, idx) => (
                                        <li key={idx} className="text-sm text-red-700">• {risco}</li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="bg-purple-50 border-l-4 border-purple-600">
                        <CardHeader>
                            <CardTitle>Insights Estratégicos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2">
                                {resultado.insights_estrategicos?.map((insight, idx) => (
                                    <li key={idx} className="text-sm text-gray-700">✦ {insight}</li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>

                    <Card className="bg-green-50 border-l-4 border-green-600">
                        <CardHeader>
                            <CardTitle>Recomendações</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2">
                                {resultado.recomendacoes?.map((rec, idx) => (
                                    <li key={idx} className="text-sm text-gray-700">→ {rec}</li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}