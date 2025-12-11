import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Quote, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

export default function VozComunidade() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [falasRelevantes, setFalasRelevantes] = useState([]);
    const [loading, setLoading] = useState(true);

    const { data: atividades = [] } = useQuery({
        queryKey: ['atividades-voz'],
        queryFn: () => base44.entities.Atividade.list('-created_date', 50)
    });

    useEffect(() => {
        const selecionarFalas = async () => {
            if (atividades.length === 0) {
                setLoading(false);
                return;
            }

            try {
                const ultimos30Dias = new Date();
                ultimos30Dias.setDate(ultimos30Dias.getDate() - 30);

                const atividadesRecentes = atividades.filter(a => 
                    new Date(a.created_date) >= ultimos30Dias
                );

                const textoAtividades = atividadesRecentes.slice(0, 20).map(a => ({
                    texto: a.descricao || a.transcricao_ia || "",
                    local: a.local || "Comunidade não especificada",
                    tipo: a.tipo,
                    data: a.data
                }));

                const prompt = `
Analise os seguintes registros de atividades comunitárias dos últimos 30 dias e extraia de 3 a 5 falas/citações mais relevantes.

Critérios de seleção:
- Relevância temática
- Representatividade territorial
- Emoção/preocupação significativa
- Indicação de risco ou oportunidade
- Recorrência de temas

Registros:
${JSON.stringify(textoAtividades, null, 2)}

Para cada fala selecionada, extraia:
- A citação exata (máximo 150 caracteres)
- Identificação mínima (ex: "Morador de [Comunidade]", "Liderança local", "Participante da reunião")
- Tipo de relevância (tema, risco, oportunidade, sentimento)

Retorne falas reais extraídas dos textos, não invente.
`;

                const resultado = await base44.integrations.Core.InvokeLLM({
                    prompt: prompt,
                    response_json_schema: {
                        type: "object",
                        properties: {
                            falas: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        citacao: { type: "string" },
                                        identificacao: { type: "string" },
                                        relevancia: { 
                                            type: "string",
                                            enum: ["tema", "risco", "oportunidade", "sentimento"]
                                        }
                                    }
                                }
                            }
                        }
                    }
                });

                setFalasRelevantes(resultado.falas || []);
            } catch (error) {
                console.error("Erro ao selecionar falas:", error);
            } finally {
                setLoading(false);
            }
        };

        selecionarFalas();
    }, [atividades]);

    const proximaFala = () => {
        setCurrentIndex((prev) => (prev + 1) % falasRelevantes.length);
    };

    const falaAnterior = () => {
        setCurrentIndex((prev) => (prev - 1 + falasRelevantes.length) % falasRelevantes.length);
    };

    const getRelevanciaColor = (relevancia) => {
        const colors = {
            tema: "text-blue-600",
            risco: "text-red-600",
            oportunidade: "text-green-600",
            sentimento: "text-purple-600"
        };
        return colors[relevancia] || "text-gray-600";
    };

    useEffect(() => {
        if (falasRelevantes.length > 0) {
            const interval = setInterval(proximaFala, 8000);
            return () => clearInterval(interval);
        }
    }, [falasRelevantes]);

    if (loading) {
        return (
            <Card style={{ backgroundColor: '#F2F7F9', borderColor: '#0B1E33' }}>
                <CardContent className="text-center py-8">
                    <Sparkles className="w-8 h-8 mx-auto mb-2 text-gray-400 animate-pulse" />
                    <p className="text-sm text-gray-500">Carregando vozes da comunidade...</p>
                </CardContent>
            </Card>
        );
    }

    if (falasRelevantes.length === 0) {
        return (
            <Card style={{ backgroundColor: '#F2F7F9', borderColor: '#0B1E33' }}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2" style={{ color: '#0B1E33' }}>
                        <Quote className="w-5 h-5" />
                        Voz da Comunidade
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-gray-600 italic">
                        Nenhuma fala relevante encontrada nos últimos 30 dias.
                    </p>
                </CardContent>
            </Card>
        );
    }

    const falaAtual = falasRelevantes[currentIndex];

    return (
        <Card style={{ backgroundColor: '#F2F7F9', borderColor: '#0B1E33' }} className="border-2">
            <CardHeader>
                <CardTitle className="flex items-center gap-2" style={{ color: '#0B1E33' }}>
                    <Quote className="w-5 h-5" />
                    Voz da Comunidade
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="relative">
                    <Quote className="absolute -top-2 -left-2 w-12 h-12 text-gray-200" />
                    <blockquote className="relative z-10 text-lg italic text-gray-700 pl-8">
                        "{falaAtual.citacao}"
                    </blockquote>
                    <p className="text-sm text-gray-500 mt-3 pl-8">
                        — {falaAtual.identificacao}
                    </p>
                    <div className="flex items-center gap-2 mt-2 pl-8">
                        <Sparkles className={`w-4 h-4 ${getRelevanciaColor(falaAtual.relevancia)}`} />
                        <span className={`text-xs font-medium ${getRelevanciaColor(falaAtual.relevancia)}`}>
                            {falaAtual.relevancia === "tema" ? "Tema Relevante" :
                             falaAtual.relevancia === "risco" ? "Sinal de Risco" :
                             falaAtual.relevancia === "oportunidade" ? "Oportunidade" : "Sentimento Comunitário"}
                        </span>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={falaAnterior}
                        disabled={falasRelevantes.length <= 1}
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-xs text-gray-500">
                        {currentIndex + 1} de {falasRelevantes.length}
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={proximaFala}
                        disabled={falasRelevantes.length <= 1}
                    >
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}