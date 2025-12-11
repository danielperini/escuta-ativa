import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Lightbulb, Loader2, Check, X, Brain } from "lucide-react";

export default function SugestoesIA() {
    const [analisando, setAnalisando] = useState(false);
    const [sugestoes, setSugestoes] = useState(null);
    const queryClient = useQueryClient();

    const { data: atividades = [] } = useQuery({
        queryKey: ['atividades-sugestoes'],
        queryFn: () => base44.entities.Atividade.list('-created_date', 20)
    });

    const { data: compromissos = [] } = useQuery({
        queryKey: ['compromissos-sugestoes'],
        queryFn: () => base44.entities.Compromisso.list()
    });

    const atualizarCompromissoMutation = useMutation({
        mutationFn: ({ id, data }) => base44.entities.Compromisso.update(id, data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['compromissos-sugestoes'] })
    });

    const analisarComIA = async () => {
        setAnalisando(true);

        try {
            // Análise de atividades recentes para sugestões de temas
            const ultimasAtividades = atividades.slice(0, 10);
            const textosAtividades = ultimasAtividades.map(a => 
                `${a.titulo || ''} ${a.descricao || ''} ${a.transcricao_ia || ''}`
            ).join('\n\n');

            const analisePrompt = `
Analise os seguintes registros de atividades comunitárias e forneça:

1. Temas emergentes não identificados anteriormente (novos padrões)
2. Demandas recorrentes que precisam atenção
3. Sugestões de ações preventivas baseadas nos padrões identificados
4. Alertas sobre temas que estão ganhando relevância

Registros:
${textosAtividades}

Forneça uma análise estruturada e acionável.
`;

            const resultadoAnalise = await base44.integrations.Core.InvokeLLM({
                prompt: analisePrompt,
                response_json_schema: {
                    type: "object",
                    properties: {
                        temas_emergentes: {
                            type: "array",
                            items: { 
                                type: "object",
                                properties: {
                                    tema: { type: "string" },
                                    relevancia: { type: "string" },
                                    descricao: { type: "string" }
                                }
                            }
                        },
                        demandas_recorrentes: {
                            type: "array",
                            items: { 
                                type: "object",
                                properties: {
                                    demanda: { type: "string" },
                                    frequencia: { type: "string" },
                                    comunidades_afetadas: { type: "array", items: { type: "string" } }
                                }
                            }
                        },
                        acoes_preventivas: {
                            type: "array",
                            items: { type: "string" }
                        },
                        alertas: {
                            type: "array",
                            items: { 
                                type: "object",
                                properties: {
                                    tipo: { type: "string" },
                                    mensagem: { type: "string" },
                                    prioridade: { type: "string" }
                                }
                            }
                        }
                    }
                }
            });

            // Análise de compromissos para classificação automática
            const compromissosNaoClassificados = compromissos.filter(c => 
                !c.status || c.status === "pendente"
            );

            const classificacoes = [];
            if (compromissosNaoClassificados.length > 0) {
                for (const comp of compromissosNaoClassificados.slice(0, 5)) {
                    const textoCompromisso = `
Título: ${comp.titulo}
Descrição: ${comp.descricao || ''}
Prazo: ${comp.prazo || 'Não especificado'}
Responsável: ${comp.responsavel || 'Não especificado'}
`;

                    const classificacao = await base44.integrations.Core.InvokeLLM({
                        prompt: `Analise o seguinte compromisso e sugira:
1. Status mais adequado: "em_andamento", "pendente", "atrasado", "concluido"
2. Prioridade: "baixa", "media", "alta", "urgente"
3. Justificativa da classificação

Compromisso:
${textoCompromisso}`,
                        response_json_schema: {
                            type: "object",
                            properties: {
                                status_sugerido: { type: "string" },
                                prioridade_sugerida: { type: "string" },
                                justificativa: { type: "string" }
                            }
                        }
                    });

                    classificacoes.push({
                        compromisso_id: comp.id,
                        compromisso_titulo: comp.titulo,
                        ...classificacao
                    });
                }
            }

            setSugestoes({
                ...resultadoAnalise,
                classificacao_compromissos: classificacoes
            });

        } catch (error) {
            console.error("Erro na análise IA:", error);
            alert("Erro ao gerar sugestões com IA: " + error.message);
        } finally {
            setAnalisando(false);
        }
    };

    const aplicarClassificacao = (compromissoId, status, prioridade) => {
        atualizarCompromissoMutation.mutate({
            id: compromissoId,
            data: { status, prioridade }
        });
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Brain className="w-5 h-5" />
                            Sugestões Inteligentes da IA
                        </CardTitle>
                        <Button 
                            onClick={analisarComIA}
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
                                    <Lightbulb className="w-4 h-4 mr-2" />
                                    Gerar Análise com IA
                                </>
                            )}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {!sugestoes && !analisando && (
                        <div className="text-center py-8 text-gray-500">
                            <Brain className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p>Clique no botão acima para gerar sugestões inteligentes baseadas em IA</p>
                            <p className="text-sm mt-2">A IA analisará as atividades recentes, identificará padrões e sugerirá ações</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {sugestoes && (
                <>
                    {sugestoes.temas_emergentes && sugestoes.temas_emergentes.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Temas Emergentes Identificados</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {sugestoes.temas_emergentes.map((tema, idx) => (
                                        <div key={idx} className="border-l-4 border-amber-500 pl-4 py-2">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <h4 className="font-semibold text-lg">{tema.tema}</h4>
                                                    <p className="text-sm text-gray-600 mt-1">{tema.descricao}</p>
                                                </div>
                                                <Badge className={
                                                    tema.relevancia === "alta" ? "bg-red-100 text-red-800" :
                                                    tema.relevancia === "média" ? "bg-yellow-100 text-yellow-800" :
                                                    "bg-blue-100 text-blue-800"
                                                }>
                                                    {tema.relevancia}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {sugestoes.demandas_recorrentes && sugestoes.demandas_recorrentes.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Demandas Recorrentes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {sugestoes.demandas_recorrentes.map((demanda, idx) => (
                                        <div key={idx} className="border rounded-lg p-3">
                                            <div className="flex items-start justify-between mb-2">
                                                <h4 className="font-medium">{demanda.demanda}</h4>
                                                <Badge variant="outline">{demanda.frequencia}</Badge>
                                            </div>
                                            {demanda.comunidades_afetadas && demanda.comunidades_afetadas.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {demanda.comunidades_afetadas.map((com, i) => (
                                                        <Badge key={i} className="bg-blue-100 text-blue-800 text-xs">
                                                            {com}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {sugestoes.acoes_preventivas && sugestoes.acoes_preventivas.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Ações Preventivas Sugeridas</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2">
                                    {sugestoes.acoes_preventivas.map((acao, idx) => (
                                        <li key={idx} className="flex items-start gap-2">
                                            <Check className="w-4 h-4 mt-1 text-green-600 flex-shrink-0" />
                                            <span className="text-sm">{acao}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    )}

                    {sugestoes.alertas && sugestoes.alertas.length > 0 && (
                        <Card className="border-l-4 border-red-500">
                            <CardHeader>
                                <CardTitle className="text-red-700">Alertas Importantes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {sugestoes.alertas.map((alerta, idx) => (
                                        <div key={idx} className="bg-red-50 p-3 rounded-lg">
                                            <div className="flex items-start gap-2">
                                                <Badge className={
                                                    alerta.prioridade === "alta" ? "bg-red-600" :
                                                    alerta.prioridade === "média" ? "bg-orange-500" :
                                                    "bg-yellow-500"
                                                }>
                                                    {alerta.tipo}
                                                </Badge>
                                                <p className="text-sm flex-1">{alerta.mensagem}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {sugestoes.classificacao_compromissos && sugestoes.classificacao_compromissos.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Classificação Automática de Compromissos</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {sugestoes.classificacao_compromissos.map((class_comp) => (
                                        <div key={class_comp.compromisso_id} className="border rounded-lg p-4">
                                            <h4 className="font-medium mb-2">{class_comp.compromisso_titulo}</h4>
                                            <p className="text-sm text-gray-600 mb-3">{class_comp.justificativa}</p>
                                            <div className="flex items-center gap-2">
                                                <Badge className="bg-blue-100 text-blue-800">
                                                    Status: {class_comp.status_sugerido}
                                                </Badge>
                                                <Badge className="bg-purple-100 text-purple-800">
                                                    Prioridade: {class_comp.prioridade_sugerida}
                                                </Badge>
                                                <Button
                                                    size="sm"
                                                    onClick={() => aplicarClassificacao(
                                                        class_comp.compromisso_id,
                                                        class_comp.status_sugerido,
                                                        class_comp.prioridade_sugerida
                                                    )}
                                                    style={{ backgroundColor: '#F2B632' }}
                                                >
                                                    <Check className="w-4 h-4 mr-1" />
                                                    Aplicar
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}
        </div>
    );
}