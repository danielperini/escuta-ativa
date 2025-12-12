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

    const { data: registros = [] } = useQuery({
        queryKey: ['registros-voz'],
        queryFn: () => base44.entities.Registro.list('-created_date', 100)
    });

    useEffect(() => {
        const selecionarFalas = async () => {
            if (registros.length === 0) {
                setLoading(false);
                return;
            }

            try {
                const ultimos60Dias = new Date();
                ultimos60Dias.setDate(ultimos60Dias.getDate() - 60);

                const registrosRecentes = registros.filter(r => 
                    new Date(r.created_date) >= ultimos60Dias && 
                    (r.transcricao || r.descricao)
                );

                const textoRegistros = registrosRecentes.slice(0, 30).map(r => ({
                    texto: r.transcricao || r.descricao || "",
                    comunidade: r.comunidade,
                    local: r.local,
                    tipo: r.tipo,
                    data: r.data_registro,
                    temas: r.temas_identificados,
                    demandas: r.demandas,
                    temperatura: r.temperatura_territorio
                }));

                const prompt = `Você é um analista de comunicação comunitária especializado em extrair FALAS REAIS e identificar TEMAS RECORRENTES e DEMANDAS.

REGISTROS COMUNITÁRIOS DOS ÚLTIMOS 60 DIAS:
${JSON.stringify(textoRegistros, null, 2)}

TAREFAS:

1. EXTRAIR 5-8 FALAS/CITAÇÕES MAIS RELEVANTES:
   - Deve ser citação LITERAL do texto (não parafraseie)
   - Máximo 150 caracteres
   - Priorize falas com:
     * Emoção/sentimento forte
     * Demandas específicas
     * Sinais de risco
     * Oportunidades
     * Reivindicações
     * Elogios ou críticas

2. IDENTIFICAR TEMAS RECORRENTES:
   - Liste os 5 temas mais mencionados
   - Conte frequência de cada tema
   - Indique tendência (subindo/estavel/caindo)

3. DEMANDAS RECORRENTES:
   - Liste demandas que aparecem em múltiplos registros
   - Agrupe demandas similares
   - Indique urgência percebida

IMPORTANTE:
- Citações devem ser REAIS (copie do texto)
- Não invente ou parafraseie
- Se não houver citação direta, use resumo entre colchetes [Morador relatou...]`;

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
                                            enum: ["tema", "risco", "oportunidade", "sentimento", "demanda"]
                                        },
                                        comunidade: { type: "string" }
                                    }
                                }
                            },
                            temas_recorrentes: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        tema: { type: "string" },
                                        frequencia: { type: "number" },
                                        tendencia: { type: "string", enum: ["subindo", "estavel", "caindo"] }
                                    }
                                }
                            },
                            demandas_recorrentes: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        demanda: { type: "string" },
                                        urgencia: { type: "string" },
                                        comunidades: { type: "array", items: { type: "string" } }
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
    }, [registros]);

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