import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare, Loader2, Brain, Heart, Users, AlertCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function SugestoesComunicacao() {
    const [gerando, setGerando] = useState(false);
    const [sugestoes, setSugestoes] = useState(null);
    const [comunidadeSelecionada, setComunidadeSelecionada] = useState("todas");
    const [contexto, setContexto] = useState("geral");

    const { data: atividades = [] } = useQuery({
        queryKey: ['atividades-comunicacao'],
        queryFn: () => base44.entities.Atividade.list('-created_date', 50)
    });

    const { data: liderancas = [] } = useQuery({
        queryKey: ['liderancas-comunicacao'],
        queryFn: () => base44.entities.LiderancaComunitaria.list()
    });

    const { data: riscos = [] } = useQuery({
        queryKey: ['riscos-comunicacao'],
        queryFn: () => base44.entities.RiscoSocial.list()
    });

    const { data: comunidades = [] } = useQuery({
        queryKey: ['comunidades-comunicacao'],
        queryFn: () => base44.entities.Comunidade.list()
    });

    const gerarSugestoes = async () => {
        setGerando(true);

        try {
            const atividadesFiltradas = comunidadeSelecionada === "todas" 
                ? atividades 
                : atividades.filter(a => a.local === comunidadeSelecionada);

            const liderancasCom = comunidadeSelecionada === "todas"
                ? liderancas
                : liderancas.filter(l => l.comunidade === comunidadeSelecionada);

            const riscosCom = comunidadeSelecionada === "todas"
                ? riscos
                : riscos.filter(r => r.comunidade === comunidadeSelecionada);

            const prompt = `
Você é um especialista em Comunicação Não Violenta (CNV), relacionamento comunitário e gestão de conflitos.

CONTEXTO: ${contexto === "conflito" ? "Situação de tensão ou conflito" : 
             contexto === "demanda" ? "Resposta a demandas comunitárias" :
             contexto === "parceria" ? "Construção de parceria" : "Comunicação geral"}

COMUNIDADE: ${comunidadeSelecionada === "todas" ? "Todas as comunidades" : comunidadeSelecionada}

CÓDIGO DE ÉTICA - PRINCÍPIOS:
1. Respeito à dignidade e diversidade
2. Transparência e honestidade
3. Escuta ativa e empática
4. Não discriminação
5. Confidencialidade quando necessário
6. Compromisso com a verdade
7. Responsabilidade social
8. Equidade nas relações

HISTÓRICO RECENTE (últimas interações):
${atividadesFiltradas.slice(0, 10).map(a => `
- Tipo: ${a.tipo}
- Local: ${a.local}
- Descrição: ${a.descricao?.substring(0, 200)}
- Temas: ${a.temas_identificados?.join(', ') || 'N/A'}
- Alertas: ${a.alertas_eticos?.join(', ') || 'Nenhum'}
`).join('\n')}

LIDERANÇAS IDENTIFICADAS:
${liderancasCom.slice(0, 10).map(l => `
- ${l.nome} (${l.comunidade}) - Papel: ${l.papel_na_comunidade || 'N/A'}
- Avaliação de Interlocução: ${l.avaliacao_interlocucao || 'neutro'}
`).join('\n')}

RISCOS SOCIAIS ATIVOS:
${riscosCom.map(r => `- ${r.titulo} (${r.nivel})`).join('\n') || 'Nenhum risco ativo'}

TAREFA:
Forneça sugestões contextuais de comunicação para essa comunidade, considerando:
1. Comunicação Não Violenta (CNV)
2. Construção de confiança
3. Manejo de conflitos
4. Especificidades culturais e territoriais
5. Histórico de interações
6. Perfil das lideranças

Seja prático, empático e acionável.
`;

            const resultado = await base44.integrations.Core.InvokeLLM({
                prompt: prompt,
                response_json_schema: {
                    type: "object",
                    properties: {
                        abordagem_recomendada: { type: "string" },
                        tom_comunicacao: { 
                            type: "string",
                            enum: ["empático", "assertivo", "conciliador", "transparente", "cuidadoso"]
                        },
                        pontos_atencao: { type: "array", items: { type: "string" } },
                        frases_evitar: { type: "array", items: { type: "string" } },
                        frases_sugeridas: { type: "array", items: { type: "string" } },
                        estrategia_escuta: { type: "string" },
                        manejo_conflito: { type: "string" },
                        construcao_confianca: { type: "array", items: { type: "string" } },
                        consideracoes_culturais: { type: "string" },
                        proximos_passos: { type: "array", items: { type: "string" } }
                    }
                }
            });

            setSugestoes(resultado);
        } catch (error) {
            console.error("Erro ao gerar sugestões:", error);
            alert("Erro ao gerar sugestões: " + error.message);
        } finally {
            setGerando(false);
        }
    };

    const getTomColor = (tom) => {
        const colors = {
            empático: "bg-blue-100 text-blue-800",
            assertivo: "bg-purple-100 text-purple-800",
            conciliador: "bg-green-100 text-green-800",
            transparente: "bg-amber-100 text-amber-800",
            cuidadoso: "bg-pink-100 text-pink-800"
        };
        return colors[tom] || "bg-gray-100 text-gray-800";
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5" />
                        Sugestões de Comunicação Comunitária (IA)
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600">
                        A IA analisará interações passadas, perfil das lideranças e princípios do Código de Ética 
                        para sugerir estratégias de comunicação não violenta e construção de confiança.
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Comunidade</Label>
                            <Select value={comunidadeSelecionada} onValueChange={setComunidadeSelecionada}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="todas">Todas</SelectItem>
                                    {comunidades.map(c => (
                                        <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Contexto</Label>
                            <Select value={contexto} onValueChange={setContexto}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="geral">Geral</SelectItem>
                                    <SelectItem value="conflito">Conflito/Tensão</SelectItem>
                                    <SelectItem value="demanda">Resposta a Demanda</SelectItem>
                                    <SelectItem value="parceria">Construção de Parceria</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <Button
                        onClick={gerarSugestoes}
                        disabled={gerando}
                        className="w-full"
                        style={{ backgroundColor: '#F2B632' }}
                    >
                        {gerando ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Gerando Sugestões...
                            </>
                        ) : (
                            <>
                                <Brain className="w-5 h-5 mr-2" />
                                Gerar Sugestões de Comunicação
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {sugestoes && (
                <>
                    <Card className="border-l-4 border-blue-500">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Abordagem Recomendada</CardTitle>
                                <Badge className={getTomColor(sugestoes.tom_comunicacao)}>
                                    Tom: {sugestoes.tom_comunicacao}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-700">{sugestoes.abordagem_recomendada}</p>
                        </CardContent>
                    </Card>

                    {sugestoes.pontos_atencao && sugestoes.pontos_atencao.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-orange-700">
                                    <AlertCircle className="w-5 h-5" />
                                    Pontos de Atenção
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2">
                                    {sugestoes.pontos_atencao.map((ponto, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-sm">
                                            <span className="text-orange-500 mt-1">⚠</span>
                                            <span>{ponto}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    )}

                    <div className="grid md:grid-cols-2 gap-4">
                        <Card className="bg-red-50">
                            <CardHeader>
                                <CardTitle className="text-sm text-red-800">❌ Evitar Dizer</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2 text-sm">
                                    {sugestoes.frases_evitar?.map((frase, idx) => (
                                        <li key={idx} className="text-red-700">• {frase}</li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>

                        <Card className="bg-green-50">
                            <CardHeader>
                                <CardTitle className="text-sm text-green-800">✓ Frases Sugeridas</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2 text-sm">
                                    {sugestoes.frases_sugeridas?.map((frase, idx) => (
                                        <li key={idx} className="text-green-700">• {frase}</li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Heart className="w-5 h-5 text-pink-600" />
                                Estratégia de Escuta Ativa
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-700">{sugestoes.estrategia_escuta}</p>
                        </CardContent>
                    </Card>

                    {sugestoes.manejo_conflito && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="w-5 h-5 text-purple-600" />
                                    Manejo de Conflito
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-700">{sugestoes.manejo_conflito}</p>
                            </CardContent>
                        </Card>
                    )}

                    {sugestoes.construcao_confianca && sugestoes.construcao_confianca.length > 0 && (
                        <Card className="bg-blue-50">
                            <CardHeader>
                                <CardTitle className="text-blue-800">Construção de Confiança</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2 text-sm">
                                    {sugestoes.construcao_confianca.map((item, idx) => (
                                        <li key={idx} className="text-blue-700">✓ {item}</li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    )}

                    {sugestoes.consideracoes_culturais && (
                        <Card className="bg-purple-50">
                            <CardHeader>
                                <CardTitle className="text-purple-800">Considerações Culturais</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-purple-700">{sugestoes.consideracoes_culturais}</p>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}
        </div>
    );
}