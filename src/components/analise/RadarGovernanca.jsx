import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Shield, Loader2, Brain, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function RadarGovernanca() {
    const [analisando, setAnalisando] = useState(false);
    const [radar, setRadar] = useState(null);

    const { data: atividades = [] } = useQuery({
        queryKey: ['atividades-gov'],
        queryFn: () => base44.entities.Atividade.list('-created_date', 100)
    });

    const { data: compromissos = [] } = useQuery({
        queryKey: ['compromissos-gov'],
        queryFn: () => base44.entities.Compromisso.list()
    });

    const { data: agendas = [] } = useQuery({
        queryKey: ['agendas-gov'],
        queryFn: () => base44.entities.Agenda.list()
    });

    const calcularRadar = async () => {
        setAnalisando(true);

        try {
            const compromissosRealizados = compromissos.filter(c => c.status === "concluido").length;
            const compromissosTotal = compromissos.length;
            const taxaCumprimento = compromissosTotal > 0 ? (compromissosRealizados / compromissosTotal) * 100 : 0;

            const agendasRealizadas = agendas.filter(a => a.status === "realizada").length;
            const agendasTotal = agendas.filter(a => 
                ["realizada", "nao_realizada", "em_atraso"].includes(a.status)
            ).length;
            const taxaAgendas = agendasTotal > 0 ? (agendasRealizadas / agendasTotal) * 100 : 0;

            const contexto = `
ANÁLISE DE GOVERNANÇA TERRITORIAL

Dados Consolidados:
- Total de Atividades: ${atividades.length}
- Compromissos Totais: ${compromissosTotal}
- Compromissos Cumpridos: ${compromissosRealizados}
- Taxa de Cumprimento: ${taxaCumprimento.toFixed(1)}%
- Agendas Realizadas: ${agendasRealizadas}/${agendasTotal}
- Taxa de Realização de Agendas: ${taxaAgendas.toFixed(1)}%

Últimas Atividades (análise qualitativa):
${atividades.slice(0, 20).map(a => 
    `- Tipo: ${a.tipo}, Local: ${a.local}, Temas: ${a.temas_identificados?.join(', ') || 'N/A'}`
).join('\n')}

DIMENSÕES A AVALIAR (0-100):

1. Qualidade do Diálogo
   - Frequência de interações
   - Diversidade de participantes
   - Profundidade das conversas
   - Escuta ativa demonstrada

2. Consistência das Entregas
   - Cumprimento de compromissos
   - Pontualidade nas agendas
   - Qualidade das devolutivas

3. Presença Corporativa
   - Frequência de visitas
   - Abrangência territorial
   - Proatividade nas interações

4. Confiabilidade Percebida
   - Transparência
   - Resposta a demandas
   - Alinhamento ação-discurso

5. Gestão de Conflitos
   - Capacidade de mediação
   - Prevenção de tensões
   - Resolução proativa

CALCULE O ÍNDICE DE GOVERNANÇA TERRITORIAL (0-100) e forneça análise detalhada.
`;

            const resultado = await base44.integrations.Core.InvokeLLM({
                prompt: contexto,
                response_json_schema: {
                    type: "object",
                    properties: {
                        indice_global: { type: "number", minimum: 0, maximum: 100 },
                        qualidade_dialogo: { type: "number", minimum: 0, maximum: 100 },
                        consistencia_entregas: { type: "number", minimum: 0, maximum: 100 },
                        presenca_corporativa: { type: "number", minimum: 0, maximum: 100 },
                        confiabilidade: { type: "number", minimum: 0, maximum: 100 },
                        gestao_conflitos: { type: "number", minimum: 0, maximum: 100 },
                        classificacao: { 
                            type: "string", 
                            enum: ["excelente", "bom", "regular", "precisa_melhorar", "critico"] 
                        },
                        pontos_fortes: { type: "array", items: { type: "string" } },
                        pontos_fracos: { type: "array", items: { type: "string" } },
                        recomendacoes: { type: "array", items: { type: "string" } },
                        tendencia: { type: "string", enum: ["melhorando", "estavel", "piorando"] },
                        analise_narrativa: { type: "string" }
                    }
                }
            });

            setRadar(resultado);
        } catch (error) {
            console.error("Erro ao calcular radar:", error);
            alert("Erro ao gerar radar: " + error.message);
        } finally {
            setAnalisando(false);
        }
    };

    const getColorByIndice = (indice) => {
        if (indice >= 80) return { color: '#22c55e', label: 'Excelente' };
        if (indice >= 60) return { color: '#3b82f6', label: 'Bom' };
        if (indice >= 40) return { color: '#f59e0b', label: 'Regular' };
        if (indice >= 20) return { color: '#f97316', label: 'Precisa Melhorar' };
        return { color: '#ef4444', label: 'Crítico' };
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="w-5 h-5" />
                            Radar de Governança Territorial
                        </CardTitle>
                        <Button 
                            onClick={calcularRadar}
                            disabled={analisando}
                            style={{ backgroundColor: '#F2B632' }}
                        >
                            {analisando ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Calculando...
                                </>
                            ) : (
                                <>
                                    <Brain className="w-4 h-4 mr-2" />
                                    Calcular Índice
                                </>
                            )}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {!radar && !analisando && (
                        <div className="text-center py-8 text-gray-500">
                            <Shield className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p>Gere o radar para avaliar a qualidade da governança territorial</p>
                            <p className="text-sm mt-2">A IA medirá diálogo, entregas, presença e confiabilidade</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {radar && (
                <>
                    <Card className="border-2" style={{ borderColor: getColorByIndice(radar.indice_global).color }}>
                        <CardHeader>
                            <div className="text-center">
                                <div className="text-6xl font-bold mb-2" style={{ color: getColorByIndice(radar.indice_global).color }}>
                                    {Math.round(radar.indice_global)}
                                </div>
                                <div className="text-xl text-gray-600">Índice de Governança Territorial</div>
                                <Badge className="mt-2" style={{ backgroundColor: getColorByIndice(radar.indice_global).color }}>
                                    {getColorByIndice(radar.indice_global).label}
                                </Badge>
                                <div className="flex items-center justify-center gap-2 mt-2 text-sm text-gray-500">
                                    <TrendingUp className="w-4 h-4" />
                                    Tendência: {radar.tendencia === "melhorando" ? "📈 Melhorando" : 
                                               radar.tendencia === "piorando" ? "📉 Piorando" : "➡️ Estável"}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h4 className="font-semibold mb-3">Dimensões Avaliadas</h4>
                                <div className="space-y-3">
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span>Qualidade do Diálogo</span>
                                            <span className="font-semibold">{Math.round(radar.qualidade_dialogo)}</span>
                                        </div>
                                        <Progress value={radar.qualidade_dialogo} className="h-2" />
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span>Consistência das Entregas</span>
                                            <span className="font-semibold">{Math.round(radar.consistencia_entregas)}</span>
                                        </div>
                                        <Progress value={radar.consistencia_entregas} className="h-2" />
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span>Presença Corporativa</span>
                                            <span className="font-semibold">{Math.round(radar.presenca_corporativa)}</span>
                                        </div>
                                        <Progress value={radar.presenca_corporativa} className="h-2" />
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span>Confiabilidade Percebida</span>
                                            <span className="font-semibold">{Math.round(radar.confiabilidade)}</span>
                                        </div>
                                        <Progress value={radar.confiabilidade} className="h-2" />
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span>Gestão de Conflitos</span>
                                            <span className="font-semibold">{Math.round(radar.gestao_conflitos)}</span>
                                        </div>
                                        <Progress value={radar.gestao_conflitos} className="h-2" />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t">
                                <h4 className="font-semibold mb-2">Análise Narrativa</h4>
                                <p className="text-sm text-gray-600">{radar.analise_narrativa}</p>
                            </div>

                            {radar.pontos_fortes && radar.pontos_fortes.length > 0 && (
                                <div className="bg-green-50 p-3 rounded-lg">
                                    <h4 className="font-semibold text-sm mb-2 text-green-800">✓ Pontos Fortes</h4>
                                    <ul className="space-y-1">
                                        {radar.pontos_fortes.map((ponto, idx) => (
                                            <li key={idx} className="text-sm text-green-700">{ponto}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {radar.pontos_fracos && radar.pontos_fracos.length > 0 && (
                                <div className="bg-orange-50 p-3 rounded-lg">
                                    <h4 className="font-semibold text-sm mb-2 text-orange-800">⚠ Pontos de Atenção</h4>
                                    <ul className="space-y-1">
                                        {radar.pontos_fracos.map((ponto, idx) => (
                                            <li key={idx} className="text-sm text-orange-700">{ponto}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {radar.recomendacoes && radar.recomendacoes.length > 0 && (
                                <div className="bg-blue-50 p-3 rounded-lg">
                                    <h4 className="font-semibold text-sm mb-2 text-blue-800">💡 Recomendações</h4>
                                    <ul className="space-y-1">
                                        {radar.recomendacoes.map((rec, idx) => (
                                            <li key={idx} className="text-sm text-blue-700">{rec}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}