import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { Loader2, TrendingUp, AlertTriangle, Lightbulb, CheckCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function ComparativoTerritorial() {
    const [comunidadesSelecionadas, setComunidadesSelecionadas] = useState([]);
    const [gerando, setGerando] = useState(false);
    const [resultado, setResultado] = useState(null);

    const { data: comunidades = [] } = useQuery({
        queryKey: ['comunidades-comparativo'],
        queryFn: () => base44.entities.Comunidade.list()
    });

    const { data: atividades = [] } = useQuery({
        queryKey: ['atividades-comparativo'],
        queryFn: () => base44.entities.Atividade.list('-created_date', 100)
    });

    const { data: riscos = [] } = useQuery({
        queryKey: ['riscos-comparativo'],
        queryFn: () => base44.entities.RiscoSocial.list()
    });

    const { data: oportunidades = [] } = useQuery({
        queryKey: ['oportunidades-comparativo'],
        queryFn: () => base44.entities.Oportunidade.list()
    });

    const { data: compromissos = [] } = useQuery({
        queryKey: ['compromissos-comparativo'],
        queryFn: () => base44.entities.Compromisso.list()
    });

    const toggleComunidade = (comunidadeNome) => {
        setComunidadesSelecionadas(prev => 
            prev.includes(comunidadeNome)
                ? prev.filter(c => c !== comunidadeNome)
                : [...prev, comunidadeNome]
        );
    };

    const gerarComparativo = async () => {
        if (comunidadesSelecionadas.length < 2) {
            alert("Selecione pelo menos 2 comunidades para comparar");
            return;
        }

        setGerando(true);

        try {
            const dadosComparativos = comunidadesSelecionadas.map(comunidade => {
                const comunidadeData = comunidades.find(c => c.nome === comunidade);
                const atividadesCom = atividades.filter(a => a.local === comunidade);
                const riscosCom = riscos.filter(r => r.comunidade === comunidade);
                const oportunidadesCom = oportunidades.filter(o => o.comunidade === comunidade);
                const compromissosCom = compromissos.filter(c => c.comunidade === comunidade);

                return {
                    nome: comunidade,
                    populacao: comunidadeData?.populacao_estimada || 0,
                    termometro_social: comunidadeData?.termometro_social || "medio",
                    total_atividades: atividadesCom.length,
                    temas_principais: comunidadeData?.principais_temas || [],
                    riscos: {
                        total: riscosCom.length,
                        criticos: riscosCom.filter(r => r.nivel === "critico").length,
                        altos: riscosCom.filter(r => r.nivel === "alto").length,
                        tipos: riscosCom.map(r => r.tipo)
                    },
                    oportunidades: {
                        total: oportunidadesCom.length,
                        alta_relevancia: oportunidadesCom.filter(o => o.relevancia === "alta").length,
                        tipos: oportunidadesCom.map(o => o.tipo)
                    },
                    governanca: {
                        total_compromissos: compromissosCom.length,
                        cumpridos: compromissosCom.filter(c => c.status === "concluido").length,
                        atrasados: compromissosCom.filter(c => c.status === "atrasado").length,
                        taxa_cumprimento: compromissosCom.length > 0 
                            ? Math.round((compromissosCom.filter(c => c.status === "concluido").length / compromissosCom.length) * 100)
                            : 0
                    }
                };
            });

            const prompt = `
Você é um analista territorial especializado em comparações socioeconômicas e de governança.

COMUNIDADES PARA COMPARAÇÃO:
${JSON.stringify(dadosComparativos, null, 2)}

TAREFA:
Realize uma análise comparativa profunda entre essas ${comunidadesSelecionadas.length} comunidades, identificando:

1. DINÂMICAS SOCIAIS
   - Semelhanças e diferenças no engajamento
   - Padrões de participação
   - Perfil de interação com a empresa

2. RISCOS TERRITORIAIS
   - Comunidade(s) mais vulnerável(eis)
   - Tipos de riscos predominantes em cada território
   - Comparação de tensão social

3. OPORTUNIDADES ESTRATÉGICAS
   - Potencial de desenvolvimento de cada comunidade
   - Áreas com maior maturidade para parcerias
   - Oportunidades únicas vs compartilhadas

4. EFETIVIDADE DA GOVERNANÇA
   - Performance em cumprimento de compromissos
   - Confiabilidade institucional comparada
   - Áreas que precisam de mais atenção

5. RECOMENDAÇÕES DIFERENCIADAS
   - Estratégias específicas para cada território
   - Onde investir recursos prioritariamente
   - Abordagens de comunicação adaptadas

Seja analítico, objetivo e baseado em dados.
`;

            const analiseIA = await base44.integrations.Core.InvokeLLM({
                prompt: prompt,
                response_json_schema: {
                    type: "object",
                    properties: {
                        sintese_executiva: { type: "string" },
                        dinamicas_sociais: {
                            type: "object",
                            properties: {
                                semelhancas: { type: "array", items: { type: "string" } },
                                diferencas: { type: "array", items: { type: "string" } },
                                ranking_engajamento: { type: "array", items: { type: "string" } }
                            }
                        },
                        analise_riscos: {
                            type: "object",
                            properties: {
                                comunidade_mais_vulneravel: { type: "string" },
                                padroes_identificados: { type: "array", items: { type: "string" } },
                                ranking_tensao: { type: "array", items: { type: "string" } }
                            }
                        },
                        analise_oportunidades: {
                            type: "object",
                            properties: {
                                comunidade_maior_potencial: { type: "string" },
                                oportunidades_compartilhadas: { type: "array", items: { type: "string" } },
                                oportunidades_unicas: { 
                                    type: "array",
                                    items: {
                                        type: "object",
                                        properties: {
                                            comunidade: { type: "string" },
                                            oportunidade: { type: "string" }
                                        }
                                    }
                                }
                            }
                        },
                        analise_governanca: {
                            type: "object",
                            properties: {
                                ranking_efetividade: { type: "array", items: { type: "string" } },
                                padroes_cumprimento: { type: "string" },
                                areas_criticas: { type: "array", items: { type: "string" } }
                            }
                        },
                        recomendacoes: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    comunidade: { type: "string" },
                                    estrategia: { type: "string" },
                                    prioridade: { 
                                        type: "string",
                                        enum: ["alta", "media", "baixa"]
                                    }
                                }
                            }
                        }
                    }
                }
            });

            setResultado({
                dados: dadosComparativos,
                analise: analiseIA
            });

        } catch (error) {
            console.error("Erro ao gerar comparativo:", error);
            alert("Erro ao gerar comparativo: " + error.message);
        } finally {
            setGerando(false);
        }
    };

    // Preparar dados para gráficos
    const dadosGrafico = resultado?.dados.map(d => ({
        nome: d.nome,
        "Atividades": d.total_atividades,
        "Riscos Totais": d.riscos.total,
        "Oportunidades": d.oportunidades.total,
        "Taxa Cumprimento (%)": d.governanca.taxa_cumprimento
    }));

    const dadosRadar = resultado?.dados.map(d => ({
        comunidade: d.nome,
        "Engajamento": d.total_atividades,
        "Riscos": d.riscos.total,
        "Oportunidades": d.oportunidades.total,
        "Governança": d.governanca.taxa_cumprimento
    }));

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        Comparativo Territorial
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label className="mb-3 block">Selecione as comunidades para comparar (mínimo 2):</Label>
                        <div className="flex flex-wrap gap-2">
                            {comunidades.map(comunidade => (
                                <Badge
                                    key={comunidade.id}
                                    variant={comunidadesSelecionadas.includes(comunidade.nome) ? "default" : "outline"}
                                    className="cursor-pointer px-4 py-2 text-sm"
                                    style={comunidadesSelecionadas.includes(comunidade.nome) ? { backgroundColor: '#F2B632', color: '#0B1E33' } : {}}
                                    onClick={() => toggleComunidade(comunidade.nome)}
                                >
                                    {comunidade.nome}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    {comunidadesSelecionadas.length > 0 && (
                        <div className="text-sm text-gray-600">
                            {comunidadesSelecionadas.length} comunidade(s) selecionada(s): {comunidadesSelecionadas.join(", ")}
                        </div>
                    )}

                    <Button
                        onClick={gerarComparativo}
                        disabled={gerando || comunidadesSelecionadas.length < 2}
                        className="w-full"
                        style={{ backgroundColor: '#0B1E33' }}
                    >
                        {gerando ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Gerando Análise Comparativa...
                            </>
                        ) : (
                            "Gerar Comparativo Territorial"
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
                            <p className="text-gray-700">{resultado.analise.sintese_executiva}</p>
                        </CardContent>
                    </Card>

                    <div className="grid md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Comparação por Indicadores</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={dadosGrafico}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="nome" angle={-45} textAnchor="end" height={80} />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="Atividades" fill="#3b82f6" />
                                        <Bar dataKey="Riscos Totais" fill="#ef4444" />
                                        <Bar dataKey="Oportunidades" fill="#22c55e" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Perfil Territorial Comparado</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <RadarChart data={dadosRadar}>
                                        <PolarGrid />
                                        <PolarAngleAxis dataKey="comunidade" />
                                        <PolarRadiusAxis />
                                        <Radar name="Indicadores" dataKey="Engajamento" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                Dinâmicas Sociais
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h4 className="font-semibold text-green-700 mb-2">Semelhanças:</h4>
                                <ul className="space-y-1">
                                    {resultado.analise.dinamicas_sociais.semelhancas.map((item, idx) => (
                                        <li key={idx} className="text-sm text-gray-700">• {item}</li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-semibold text-orange-700 mb-2">Diferenças:</h4>
                                <ul className="space-y-1">
                                    {resultado.analise.dinamicas_sociais.diferencas.map((item, idx) => (
                                        <li key={idx} className="text-sm text-gray-700">• {item}</li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-semibold text-blue-700 mb-2">Ranking de Engajamento:</h4>
                                <ol className="space-y-1">
                                    {resultado.analise.dinamicas_sociais.ranking_engajamento.map((item, idx) => (
                                        <li key={idx} className="text-sm text-gray-700">{idx + 1}. {item}</li>
                                    ))}
                                </ol>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-red-700">
                                <AlertTriangle className="w-5 h-5" />
                                Análise de Riscos
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="bg-red-50 p-4 rounded-lg">
                                <p className="font-semibold text-red-800 mb-1">Comunidade Mais Vulnerável:</p>
                                <p className="text-red-700">{resultado.analise.analise_riscos.comunidade_mais_vulneravel}</p>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-2">Padrões Identificados:</h4>
                                <ul className="space-y-1">
                                    {resultado.analise.analise_riscos.padroes_identificados.map((item, idx) => (
                                        <li key={idx} className="text-sm text-gray-700">• {item}</li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-2">Ranking de Tensão:</h4>
                                <ol className="space-y-1">
                                    {resultado.analise.analise_riscos.ranking_tensao.map((item, idx) => (
                                        <li key={idx} className="text-sm text-gray-700">{idx + 1}. {item}</li>
                                    ))}
                                </ol>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-green-700">
                                <Lightbulb className="w-5 h-5" />
                                Análise de Oportunidades
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="bg-green-50 p-4 rounded-lg">
                                <p className="font-semibold text-green-800 mb-1">Comunidade com Maior Potencial:</p>
                                <p className="text-green-700">{resultado.analise.analise_oportunidades.comunidade_maior_potencial}</p>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-2">Oportunidades Compartilhadas:</h4>
                                <ul className="space-y-1">
                                    {resultado.analise.analise_oportunidades.oportunidades_compartilhadas.map((item, idx) => (
                                        <li key={idx} className="text-sm text-gray-700">• {item}</li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-2">Oportunidades Únicas por Território:</h4>
                                <div className="space-y-2">
                                    {resultado.analise.analise_oportunidades.oportunidades_unicas.map((item, idx) => (
                                        <div key={idx} className="bg-amber-50 p-3 rounded">
                                            <p className="font-medium text-amber-900">{item.comunidade}</p>
                                            <p className="text-sm text-gray-700">{item.oportunidade}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-purple-700">
                                <CheckCircle className="w-5 h-5" />
                                Efetividade da Governança
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h4 className="font-semibold mb-2">Ranking de Efetividade:</h4>
                                <ol className="space-y-1">
                                    {resultado.analise.analise_governanca.ranking_efetividade.map((item, idx) => (
                                        <li key={idx} className="text-sm text-gray-700">{idx + 1}. {item}</li>
                                    ))}
                                </ol>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-2">Padrões de Cumprimento:</h4>
                                <p className="text-sm text-gray-700">{resultado.analise.analise_governanca.padroes_cumprimento}</p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-red-700 mb-2">Áreas Críticas:</h4>
                                <ul className="space-y-1">
                                    {resultado.analise.analise_governanca.areas_criticas.map((item, idx) => (
                                        <li key={idx} className="text-sm text-gray-700">• {item}</li>
                                    ))}
                                </ul>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-purple-50 border-l-4 border-purple-600">
                        <CardHeader>
                            <CardTitle>Recomendações Estratégicas Diferenciadas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {resultado.analise.recomendacoes.map((rec, idx) => (
                                    <div key={idx} className="bg-white p-4 rounded-lg shadow-sm">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-bold text-purple-900">{rec.comunidade}</h4>
                                            <Badge className={
                                                rec.prioridade === "alta" ? "bg-red-100 text-red-800" :
                                                rec.prioridade === "media" ? "bg-yellow-100 text-yellow-800" :
                                                "bg-green-100 text-green-800"
                                            }>
                                                Prioridade {rec.prioridade}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-gray-700">{rec.estrategia}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}