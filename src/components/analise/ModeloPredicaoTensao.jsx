import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, TrendingUp, Loader2, Brain } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function ModeloPredicaoTensao() {
    const [analisando, setAnalisando] = useState(false);
    const [predicoes, setPredicoes] = useState(null);

    const { data: comunidades = [] } = useQuery({
        queryKey: ['comunidades-predicao'],
        queryFn: () => base44.entities.Comunidade.list()
    });

    const { data: atividades = [] } = useQuery({
        queryKey: ['atividades-predicao'],
        queryFn: () => base44.entities.Atividade.list('-created_date', 100)
    });

    const { data: compromissos = [] } = useQuery({
        queryKey: ['compromissos-predicao'],
        queryFn: () => base44.entities.Compromisso.list()
    });

    const { data: riscos = [] } = useQuery({
        queryKey: ['riscos-predicao'],
        queryFn: () => base44.entities.RiscoSocial.list()
    });

    const calcularTensao = async () => {
        setAnalisando(true);

        try {
            const predicoesComunidades = [];

            for (const comunidade of comunidades.slice(0, 10)) {
                const atividadesCom = atividades.filter(a => a.local === comunidade.nome);
                const compromissosCom = compromissos.filter(c => c.comunidade === comunidade.nome);
                const riscosCom = riscos.filter(r => r.comunidade === comunidade.nome && r.status === "ativo");

                const compromissosAtrasados = compromissosCom.filter(c => c.status === "atrasado").length;
                const demandasTotais = atividadesCom.flatMap(a => a.demandas || []).length;
                const alertasEticos = atividadesCom.flatMap(a => a.alertas_eticos || []).length;

                const contexto = `
Comunidade: ${comunidade.nome}
Termômetro Social Atual: ${comunidade.termometro_social || "baixo"}
População: ${comunidade.populacao_estimada || "N/A"}

Dados dos Últimos 90 dias:
- Total de Atividades: ${atividadesCom.length}
- Demandas Registradas: ${demandasTotais}
- Compromissos Assumidos: ${compromissosCom.length}
- Compromissos Atrasados: ${compromissosAtrasados}
- Alertas Éticos: ${alertasEticos}
- Riscos Sociais Ativos: ${riscosCom.length}
- Nível de Risco mais Alto: ${riscosCom.length > 0 ? riscosCom.sort((a, b) => 
    (b.nivel === "critico" ? 4 : b.nivel === "alto" ? 3 : b.nivel === "moderado" ? 2 : 1) -
    (a.nivel === "critico" ? 4 : a.nivel === "alto" ? 3 : a.nivel === "moderado" ? 2 : 1)
)[0].nivel : "nenhum"}

Últimas Atividades (resumo):
${atividadesCom.slice(0, 5).map(a => `- ${a.descricao?.substring(0, 150)}`).join('\n')}

TAREFA:
Baseado nesses dados, calcule a probabilidade de tensão social ou conflito nos próximos 14 dias.
Considere:
1. Volume de demandas não atendidas
2. Compromissos descumpridos
3. Presença de riscos sociais ativos
4. Tom das atividades recentes
5. Histórico de alertas éticos
6. Tendências temporais

Forneça uma análise preditiva estruturada.
`;

                const resultado = await base44.integrations.Core.InvokeLLM({
                    prompt: contexto,
                    response_json_schema: {
                        type: "object",
                        properties: {
                            probabilidade_tensao: { type: "number", minimum: 0, maximum: 100 },
                            nivel_risco: { type: "string", enum: ["baixo", "moderado", "alto", "critico"] },
                            principais_fatores: { type: "array", items: { type: "string" } },
                            sinais_alerta: { type: "array", items: { type: "string" } },
                            acoes_preventivas: { type: "array", items: { type: "string" } },
                            tendencia: { type: "string", enum: ["crescente", "estavel", "decrescente"] },
                            justificativa: { type: "string" }
                        }
                    }
                });

                predicoesComunidades.push({
                    comunidade: comunidade.nome,
                    ...resultado
                });
            }

            setPredicoes(predicoesComunidades.sort((a, b) => b.probabilidade_tensao - a.probabilidade_tensao));
        } catch (error) {
            console.error("Erro ao calcular tensão:", error);
            alert("Erro ao gerar previsão: " + error.message);
        } finally {
            setAnalisando(false);
        }
    };

    const getColorByProbabilidade = (prob) => {
        if (prob >= 70) return "text-red-700 bg-red-100";
        if (prob >= 50) return "text-orange-700 bg-orange-100";
        if (prob >= 30) return "text-yellow-700 bg-yellow-100";
        return "text-green-700 bg-green-100";
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5" />
                            Modelo Preditivo de Tensão Social
                        </CardTitle>
                        <Button 
                            onClick={calcularTensao}
                            disabled={analisando}
                            style={{ backgroundColor: '#F2B632' }}
                        >
                            {analisando ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Analisando...
                                </>
                            ) : (
                                <>
                                    <Brain className="w-4 h-4 mr-2" />
                                    Gerar Previsão
                                </>
                            )}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {!predicoes && !analisando && (
                        <div className="text-center py-8 text-gray-500">
                            <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p>Clique no botão acima para gerar previsão de tensão social</p>
                            <p className="text-sm mt-2">A IA analisará dados históricos e padrões para prever riscos</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {predicoes && predicoes.length > 0 && (
                <>
                    {predicoes.map((pred) => (
                        <Card key={pred.comunidade} className="border-l-4" style={{
                            borderLeftColor: pred.probabilidade_tensao >= 70 ? '#ef4444' :
                                           pred.probabilidade_tensao >= 50 ? '#f97316' :
                                           pred.probabilidade_tensao >= 30 ? '#f59e0b' : '#22c55e'
                        }}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle className="text-xl">{pred.comunidade}</CardTitle>
                                        <p className="text-sm text-gray-500 mt-1">Previsão para os próximos 14 dias</p>
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-3xl font-bold ${getColorByProbabilidade(pred.probabilidade_tensao)}`}>
                                            {Math.round(pred.probabilidade_tensao)}%
                                        </div>
                                        <Badge className="mt-2" variant={
                                            pred.nivel_risco === "critico" ? "destructive" :
                                            pred.nivel_risco === "alto" ? "destructive" : "secondary"
                                        }>
                                            {pred.nivel_risco}
                                        </Badge>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium">Probabilidade de Tensão</span>
                                        <span className="text-sm text-gray-500">
                                            Tendência: {pred.tendencia === "crescente" ? "📈" : pred.tendencia === "decrescente" ? "📉" : "➡️"} {pred.tendencia}
                                        </span>
                                    </div>
                                    <Progress value={pred.probabilidade_tensao} className="h-3" />
                                </div>

                                <div>
                                    <h4 className="font-semibold text-sm mb-2">Justificativa</h4>
                                    <p className="text-sm text-gray-600">{pred.justificativa}</p>
                                </div>

                                {pred.principais_fatores && pred.principais_fatores.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold text-sm mb-2">Principais Fatores</h4>
                                        <ul className="space-y-1">
                                            {pred.principais_fatores.map((fator, idx) => (
                                                <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                                                    <span className="text-orange-500">•</span>
                                                    {fator}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {pred.sinais_alerta && pred.sinais_alerta.length > 0 && (
                                    <div className="bg-red-50 p-3 rounded-lg">
                                        <h4 className="font-semibold text-sm mb-2 text-red-800 flex items-center gap-2">
                                            <AlertTriangle className="w-4 h-4" />
                                            Sinais de Alerta
                                        </h4>
                                        <ul className="space-y-1">
                                            {pred.sinais_alerta.map((sinal, idx) => (
                                                <li key={idx} className="text-sm text-red-700">⚠️ {sinal}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {pred.acoes_preventivas && pred.acoes_preventivas.length > 0 && (
                                    <div className="bg-blue-50 p-3 rounded-lg">
                                        <h4 className="font-semibold text-sm mb-2 text-blue-800">Ações Preventivas Recomendadas</h4>
                                        <ul className="space-y-1">
                                            {pred.acoes_preventivas.map((acao, idx) => (
                                                <li key={idx} className="text-sm text-blue-700">✓ {acao}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </>
            )}
        </div>
    );
}