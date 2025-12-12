import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Bell, TrendingUp, AlertCircle, X } from "lucide-react";
import AutomacaoCompromissos from "./AutomacaoCompromissos";

export default function MonitorDemandasRecorrentes() {
    const [demandasRecorrentes, setDemandasRecorrentes] = useState([]);
    const [analisando, setAnalisando] = useState(false);
    const [demandaSelecionada, setDemandaSelecionada] = useState(null);
    const [alertasExibidos, setAlertasExibidos] = useState(() => {
        const saved = localStorage.getItem('alertas_demandas_exibidos');
        return saved ? JSON.parse(saved) : [];
    });

    // Auto-dismiss após 10 segundos
    useEffect(() => {
        if (demandasRecorrentes.length > 0) {
            const timer = setTimeout(() => {
                demandasRecorrentes.forEach(demanda => {
                    marcarComoVisto(demanda.tema);
                });
            }, 10000);
            return () => clearTimeout(timer);
        }
    }, [demandasRecorrentes]);

    const { data: atividades = [] } = useQuery({
        queryKey: ['atividades-monitor'],
        queryFn: () => base44.entities.Atividade.list('-created_date', 500)
    });

    const analisarDemandasRecorrentes = async () => {
        setAnalisando(true);
        try {
            // Últimos 30 dias
            const dataLimite = new Date();
            dataLimite.setDate(dataLimite.getDate() - 30);
            
            const atividadesRecentes = atividades.filter(a => 
                new Date(a.created_date) >= dataLimite
            );

            const todasDemandas = atividadesRecentes.flatMap(a => 
                (a.demandas || []).map(d => ({
                    demanda: d,
                    comunidade: a.local,
                    data: a.created_date,
                    registro_id: a.id
                }))
            );

            const prompt = `
Analise as seguintes demandas dos últimos 30 dias e identifique DEMANDAS RECORRENTES:

${JSON.stringify(todasDemandas, null, 2)}

Critérios:
- Mencionadas 3+ vezes
-Span de tempo superior a 7 dias
- Mesma comunidade ou múltiplas comunidades afetadas
- Gravidade crescente ou persistente

Para cada demanda recorrente, retorne:
- tema principal
- frequência
- comunidades afetadas
- última menção
- gravidade (baixa/media/alta/urgente)
- sugestão de compromisso (título, descrição, prazo, responsável)

Priorize demandas de ALTA URGÊNCIA.
`;

            const resultado = await base44.integrations.Core.InvokeLLM({
                prompt: prompt,
                response_json_schema: {
                    type: "object",
                    properties: {
                        demandas_recorrentes: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    tema: { type: "string" },
                                    frequencia: { type: "number" },
                                    comunidades_afetadas: {
                                        type: "array",
                                        items: { type: "string" }
                                    },
                                    ultima_mencao: { type: "string" },
                                    gravidade: {
                                        type: "string",
                                        enum: ["baixa", "media", "alta", "urgente"]
                                    },
                                    titulo_sugerido: { type: "string" },
                                    descricao: { type: "string" },
                                    prazo_sugerido: { type: "string" },
                                    responsavel_sugerido: { type: "string" },
                                    prioridade: { type: "string" }
                                }
                            }
                        }
                    }
                }
            });

            // Filtrar apenas demandas não vistas
            const novasDemandas = resultado.demandas_recorrentes.filter(d => 
                !alertasExibidos.includes(d.tema) && d.frequencia >= 3
            );

            setDemandasRecorrentes(novasDemandas);
        } catch (error) {
            console.error("Erro ao analisar:", error);
        } finally {
            setAnalisando(false);
        }
    };

    useEffect(() => {
        if (atividades.length > 0) {
            analisarDemandasRecorrentes();
        }
    }, [atividades.length]);

    const marcarComoVisto = (tema) => {
        const novosAlertas = [...alertasExibidos, tema];
        setAlertasExibidos(novosAlertas);
        localStorage.setItem('alertas_demandas_exibidos', JSON.stringify(novosAlertas));
        setDemandasRecorrentes(demandasRecorrentes.filter(d => d.tema !== tema));
    };

    const corGravidade = (gravidade) => {
        switch (gravidade) {
            case 'urgente': return 'bg-red-100 text-red-800 border-red-600';
            case 'alta': return 'bg-orange-100 text-orange-800 border-orange-600';
            case 'media': return 'bg-amber-100 text-amber-800 border-amber-600';
            case 'baixa': return 'bg-blue-100 text-blue-800 border-blue-600';
            default: return 'bg-gray-100 text-gray-800 border-gray-600';
        }
    };

    if (analisando) {
        return (
            <Card className="border-2 border-purple-600">
                <CardContent className="pt-6 text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Analisando demandas recorrentes...</p>
                </CardContent>
            </Card>
        );
    }

    if (demandasRecorrentes.length === 0) return null;

    return (
        <div className="space-y-4">
            {demandaSelecionada && (
                <AutomacaoCompromissos
                    demanda={demandaSelecionada}
                    onConfirmar={(compromisso) => {
                        marcarComoVisto(demandaSelecionada.tema);
                        setDemandaSelecionada(null);
                    }}
                    onCancelar={() => setDemandaSelecionada(null)}
                />
            )}

            {demandasRecorrentes.map((demanda, idx) => (
                <Card key={idx} className={`border-2 ${corGravidade(demanda.gravidade)}`}>
                    <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Bell className="w-5 h-5" />
                                    🚨 Demanda Recorrente Detectada
                                </CardTitle>
                                <p className="text-sm text-gray-600 mt-1">
                                    A IA identificou padrão de menções repetidas
                                </p>
                            </div>
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => marcarComoVisto(demanda.tema)}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="bg-white p-3 rounded-lg border">
                            <div className="flex items-center justify-between mb-2">
                                <p className="font-bold text-lg">{demanda.tema}</p>
                                <Badge className={`${
                                    demanda.gravidade === 'urgente' ? 'bg-red-600' :
                                    demanda.gravidade === 'alta' ? 'bg-orange-600' :
                                    'bg-amber-600'
                                }`}>
                                    {demanda.gravidade.toUpperCase()}
                                </Badge>
                            </div>
                            
                            <div className="grid md:grid-cols-3 gap-2 text-sm mb-2">
                                <div>
                                    <p className="text-xs text-gray-500">Frequência</p>
                                    <p className="font-semibold flex items-center gap-1">
                                        <TrendingUp className="w-3 h-3" />
                                        {demanda.frequencia}x mencionada
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Última Menção</p>
                                    <p className="font-semibold">{demanda.ultima_mencao}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Comunidades</p>
                                    <p className="font-semibold">{demanda.comunidades_afetadas.join(', ')}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                            <p className="text-xs font-semibold text-purple-900 mb-1">
                                💡 Sugestão de Ação
                            </p>
                            <p className="text-sm text-gray-700 mb-2">{demanda.descricao}</p>
                            <Button
                                size="sm"
                                className="w-full bg-green-600 hover:bg-green-700"
                                onClick={() => setDemandaSelecionada(demanda)}
                            >
                                <AlertCircle className="w-4 h-4 mr-2" />
                                Criar Compromisso Vinculado
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}