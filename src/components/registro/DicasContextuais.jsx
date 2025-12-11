import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { Lightbulb, X, Sparkles } from "lucide-react";

const DICAS_POR_CONTEXTO = {
    audio_inicio: [
        "Apresente-se e explique o propósito da conversa",
        "Peça consentimento para gravar (LGPD)",
        "Comece com perguntas abertas, não diretivas",
        "Escute sem pressa de responder imediatamente"
    ],
    reuniao_tensa: [
        "Reconheça as emoções presentes sem invalidá-las",
        "Seja transparente sobre seus limites institucionais",
        "Não prometa o que não pode cumprir",
        "Registre todas as demandas com atenção"
    ],
    demanda_complexa: [
        "Anote a demanda exatamente como foi colocada",
        "Esclareça o que você pode encaminhar",
        "Defina prazo realista para retorno",
        "Registre quem acompanhará a resposta"
    ],
    primeira_visita: [
        "Observe o território antes de falar",
        "Identifique equipamentos públicos e organizações locais",
        "Pergunte sobre a história do lugar",
        "Mapeie lideranças e suas diferentes perspectivas"
    ],
    devolutiva_negativa: [
        "Seja claro sobre os motivos da negativa",
        "Ofereça alternativas quando possível",
        "Mantenha o canal de diálogo aberto",
        "Documente a justificativa técnica"
    ]
};

export default function DicasContextuais({ contexto, atividade }) {
    const [dicasVisiveis, setDicasVisiveis] = useState(true);
    const [dicasIA, setDicasIA] = useState([]);
    const [carregando, setCarregando] = useState(false);

    useEffect(() => {
        if (atividade && contexto) {
            gerarDicasIA();
        }
    }, [atividade, contexto]);

    const gerarDicasIA = async () => {
        setCarregando(true);
        try {
            const prompt = `Baseado no livro "Relacionamento Comunitário: um Diálogo Social", 
forneça 3 dicas práticas específicas para esta situação:

CONTEXTO: ${contexto}
ATIVIDADE: ${JSON.stringify(atividade, null, 2)}

Considere:
- Capítulo 1: Presença e participação contínua
- Capítulo 4: Materialidade e legitimidade
- Capítulo 10: Ética e diálogo
- Capítulo 11: Gestão de riscos sociais

Retorne dicas aplicáveis AGORA, não genéricas.`;

            const resultado = await base44.integrations.Core.InvokeLLM({
                prompt: prompt,
                response_json_schema: {
                    type: "object",
                    properties: {
                        dicas: {
                            type: "array",
                            items: { type: "string" }
                        }
                    }
                }
            });

            setDicasIA(resultado.dicas || []);
        } catch (error) {
            console.error("Erro ao gerar dicas:", error);
        } finally {
            setCarregando(false);
        }
    };

    if (!dicasVisiveis) {
        return (
            <Button
                variant="outline"
                size="sm"
                onClick={() => setDicasVisiveis(true)}
                className="fixed bottom-6 right-6 shadow-lg"
            >
                <Lightbulb className="w-4 h-4 mr-2" />
                Ver Dicas
            </Button>
        );
    }

    const dicasPadrao = DICAS_POR_CONTEXTO[contexto] || [];

    return (
        <Card className="border-2 border-amber-500">
            <CardHeader className="bg-amber-50 pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-amber-900 text-sm">
                        <Lightbulb className="w-5 h-5" />
                        Dicas Contextuais
                    </CardTitle>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDicasVisiveis(false)}
                        className="h-6 w-6"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
                {dicasPadrao.length > 0 && (
                    <div>
                        <p className="text-xs font-semibold text-amber-900 mb-2">
                            📖 Boas Práticas:
                        </p>
                        <ul className="space-y-1">
                            {dicasPadrao.map((dica, idx) => (
                                <li key={idx} className="text-xs text-gray-700 flex items-start gap-2">
                                    <span className="text-amber-600">•</span>
                                    <span>{dica}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {carregando ? (
                    <div className="text-center py-2">
                        <Sparkles className="w-5 h-5 animate-spin mx-auto text-purple-600" />
                        <p className="text-xs text-gray-600 mt-1">Gerando dicas personalizadas...</p>
                    </div>
                ) : dicasIA.length > 0 && (
                    <div>
                        <p className="text-xs font-semibold text-purple-900 mb-2 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            IA — Dicas Específicas:
                        </p>
                        <ul className="space-y-1">
                            {dicasIA.map((dica, idx) => (
                                <li key={idx} className="text-xs text-gray-700 flex items-start gap-2">
                                    <span className="text-purple-600">✦</span>
                                    <span>{dica}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}