import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Star, Loader2, Brain, Users } from "lucide-react";

export default function LiderancasEmergentes() {
    const [analisando, setAnalisando] = useState(false);
    const [emergentes, setEmergentes] = useState(null);

    const { data: atividades = [] } = useQuery({
        queryKey: ['atividades-liderancas'],
        queryFn: () => base44.entities.Atividade.list('-created_date', 100)
    });

    const { data: liderancas = [] } = useQuery({
        queryKey: ['liderancas-emergentes'],
        queryFn: () => base44.entities.LiderancaComunitaria.list()
    });

    const detectarEmergentes = async () => {
        setAnalisando(true);

        try {
            const contexto = `
DETECÇÃO DE LIDERANÇAS EMERGENTES

Análise das últimas ${atividades.length} atividades para identificar novas lideranças comunitárias.

Lideranças Cadastradas: ${liderancas.length}
Nomes Cadastrados: ${liderancas.map(l => l.nome).join(', ')}

Participantes Mencionados nas Atividades:
${atividades.flatMap(a => a.participantes || []).slice(0, 200).join(', ')}

Critérios para Identificar Liderança Emergente:
1. Frequência de menções em atividades recentes
2. Não estar cadastrada no sistema
3. Papéis de articulação ou representação mencionados
4. Presença em múltiplas comunidades ou eventos
5. Engajamento em questões importantes

TAREFA:
Identifique até 10 lideranças emergentes que ainda NÃO estão cadastradas.
Para cada uma, forneça:
- Nome
- Comunidade
- Papel inferido
- Frequência de menções
- Potencial de influência (1-10)
- Justificativa
`;

            const resultado = await base44.integrations.Core.InvokeLLM({
                prompt: contexto,
                response_json_schema: {
                    type: "object",
                    properties: {
                        liderancas_emergentes: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    nome: { type: "string" },
                                    comunidade: { type: "string" },
                                    papel_inferido: { type: "string" },
                                    frequencia_mencoes: { type: "number" },
                                    potencial_influencia: { type: "number", minimum: 1, maximum: 10 },
                                    justificativa: { type: "string" },
                                    temas_associados: { type: "array", items: { type: "string" } }
                                }
                            }
                        }
                    }
                }
            });

            setEmergentes(resultado.liderancas_emergentes || []);
        } catch (error) {
            console.error("Erro ao detectar emergentes:", error);
            alert("Erro ao detectar lideranças: " + error.message);
        } finally {
            setAnalisando(false);
        }
    };

    const cadastrarLideranca = async (lideranca) => {
        try {
            await base44.entities.LiderancaComunitaria.create({
                nome: lideranca.nome,
                comunidade: lideranca.comunidade,
                papel_na_comunidade: lideranca.papel_inferido,
                ultima_interacao: new Date().toISOString(),
                avaliacao_interlocucao: "neutro"
            });

            alert(`✓ Liderança "${lideranca.nome}" cadastrada com sucesso!`);
            setEmergentes(emergentes.filter(e => e.nome !== lideranca.nome));
        } catch (error) {
            alert("Erro ao cadastrar: " + error.message);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Star className="w-5 h-5" />
                            Detecção de Lideranças Emergentes
                        </CardTitle>
                        <Button 
                            onClick={detectarEmergentes}
                            disabled={analisando}
                            style={{ backgroundColor: '#F2B632' }}
                        >
                            {analisando ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Detectando...
                                </>
                            ) : (
                                <>
                                    <Brain className="w-4 h-4 mr-2" />
                                    Detectar Lideranças
                                </>
                            )}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {!emergentes && !analisando && (
                        <div className="text-center py-8 text-gray-500">
                            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p>A IA identificará novas lideranças não cadastradas</p>
                            <p className="text-sm mt-2">Análise baseada em menções, papéis e frequência</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {emergentes && emergentes.length > 0 && (
                <div className="grid gap-4">
                    {emergentes.map((lid, idx) => (
                        <Card key={idx} className="border-l-4 border-amber-500">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <CardTitle className="text-lg">{lid.nome}</CardTitle>
                                        <p className="text-sm text-gray-500 mt-1">{lid.comunidade}</p>
                                        <Badge className="mt-2 bg-purple-100 text-purple-800">
                                            {lid.papel_inferido}
                                        </Badge>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-amber-600">
                                            {lid.potencial_influencia}/10
                                        </div>
                                        <p className="text-xs text-gray-500">Potencial</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <p className="text-sm font-medium text-gray-700">Justificativa</p>
                                    <p className="text-sm text-gray-600 mt-1">{lid.justificativa}</p>
                                </div>

                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <span className="font-medium">Menções:</span>
                                    <Badge variant="outline">{lid.frequencia_mencoes}x</Badge>
                                </div>

                                {lid.temas_associados && lid.temas_associados.length > 0 && (
                                    <div>
                                        <p className="text-sm font-medium text-gray-700 mb-2">Temas Associados</p>
                                        <div className="flex flex-wrap gap-1">
                                            {lid.temas_associados.map((tema, i) => (
                                                <Badge key={i} variant="secondary" className="text-xs">
                                                    {tema}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <Button
                                    size="sm"
                                    onClick={() => cadastrarLideranca(lid)}
                                    className="w-full"
                                    style={{ backgroundColor: '#0B1E33', color: 'white' }}
                                >
                                    <Users className="w-4 h-4 mr-2" />
                                    Cadastrar como Liderança
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {emergentes && emergentes.length === 0 && (
                <Card>
                    <CardContent className="text-center py-8">
                        <p className="text-gray-500">Nenhuma liderança emergente identificada</p>
                        <p className="text-sm text-gray-400 mt-1">Todas as lideranças ativas já estão cadastradas</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}