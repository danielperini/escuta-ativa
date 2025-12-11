import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { Globe, Loader2, Database, Check, ExternalLink } from "lucide-react";

export default function EnriquecedorDadosExternos({ municipio, onDadosObtidos }) {
    const [buscando, setBuscando] = useState(false);
    const [dadosEnriquecidos, setDadosEnriquecidos] = useState(null);

    const buscarDadosExternos = async () => {
        setBuscando(true);
        try {
            const prompt = `
Busque dados atualizados de fontes governamentais e públicas para o município: ${municipio}

FONTES OBRIGATÓRIAS:
1. IBGE - População, PIB, IDH-M, dados demográficos
2. SNIS (Sistema Nacional de Informações sobre Saneamento) - Cobertura de água, esgoto, coleta de lixo
3. DATASUS (Ministério da Saúde) - Estabelecimentos de saúde, leitos, cobertura vacinal, mortalidade infantil
4. INEP (Educação) - Escolas, matrículas, IDEB, infraestrutura educacional
5. Portal da Transparência - Repasses federais, convênios, investimentos
6. Wikipedia - História, formação, contexto cultural

Para CADA dado, você DEVE citar:
- Fonte exata
- Ano de referência
- Link quando disponível

Retorne dados estruturados, precisos e com fontes verificáveis.

IMPORTANTE: Use add_context_from_internet=true para buscar dados reais e atualizados.
`;

            const resultado = await base44.integrations.Core.InvokeLLM({
                prompt: prompt,
                add_context_from_internet: true,
                response_json_schema: {
                    type: "object",
                    properties: {
                        ibge: {
                            type: "object",
                            properties: {
                                populacao: { type: "string" },
                                pib_per_capita: { type: "string" },
                                idhm: { type: "string" },
                                fonte: { type: "string" },
                                ano_referencia: { type: "string" }
                            }
                        },
                        saneamento: {
                            type: "object",
                            properties: {
                                cobertura_agua: { type: "string" },
                                cobertura_esgoto: { type: "string" },
                                coleta_lixo: { type: "string" },
                                fonte: { type: "string" },
                                ano_referencia: { type: "string" }
                            }
                        },
                        saude: {
                            type: "object",
                            properties: {
                                estabelecimentos_saude: { type: "string" },
                                leitos: { type: "string" },
                                cobertura_vacinal: { type: "string" },
                                mortalidade_infantil: { type: "string" },
                                fonte: { type: "string" },
                                ano_referencia: { type: "string" }
                            }
                        },
                        educacao: {
                            type: "object",
                            properties: {
                                escolas_municipais: { type: "string" },
                                matriculas: { type: "string" },
                                ideb: { type: "string" },
                                taxa_alfabetizacao: { type: "string" },
                                fonte: { type: "string" },
                                ano_referencia: { type: "string" }
                            }
                        },
                        transparencia: {
                            type: "object",
                            properties: {
                                repasses_federais_ano: { type: "string" },
                                convenios_ativos: { type: "string" },
                                principais_investimentos: {
                                    type: "array",
                                    items: { type: "string" }
                                },
                                fonte: { type: "string" },
                                ano_referencia: { type: "string" }
                            }
                        },
                        contexto_historico: {
                            type: "object",
                            properties: {
                                resumo_historia: { type: "string" },
                                formacao: { type: "string" },
                                aspectos_culturais: { type: "string" },
                                fonte: { type: "string" }
                            }
                        }
                    }
                }
            });

            setDadosEnriquecidos(resultado);
            if (onDadosObtidos) onDadosObtidos(resultado);
        } catch (error) {
            alert("Erro ao buscar dados: " + error.message);
        } finally {
            setBuscando(false);
        }
    };

    React.useEffect(() => {
        if (municipio) buscarDadosExternos();
    }, [municipio]);

    if (buscando) {
        return (
            <Card className="border-2 border-blue-600">
                <CardContent className="pt-6 text-center">
                    <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
                    <p className="font-semibold text-gray-900">Buscando Dados Externos...</p>
                    <p className="text-sm text-gray-600 mt-2">
                        Consultando IBGE, SNIS, DATASUS, INEP e Portal da Transparência
                    </p>
                </CardContent>
            </Card>
        );
    }

    if (!dadosEnriquecidos) return null;

    return (
        <div className="space-y-4">
            <Card className="border-2 border-green-600">
                <CardHeader className="bg-green-50">
                    <CardTitle className="flex items-center gap-2 text-green-900">
                        <Check className="w-6 h-6" />
                        Dados Externos Obtidos com Sucesso
                    </CardTitle>
                </CardHeader>
            </Card>

            {dadosEnriquecidos.ibge && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Database className="w-5 h-5" />
                            IBGE - Demografia e Indicadores
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="grid md:grid-cols-3 gap-3">
                            <div className="bg-gray-50 p-3 rounded">
                                <p className="text-xs text-gray-500">População</p>
                                <p className="font-bold text-lg">{dadosEnriquecidos.ibge.populacao}</p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded">
                                <p className="text-xs text-gray-500">PIB per capita</p>
                                <p className="font-bold text-lg">{dadosEnriquecidos.ibge.pib_per_capita}</p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded">
                                <p className="text-xs text-gray-500">IDH-M</p>
                                <p className="font-bold text-lg">{dadosEnriquecidos.ibge.idhm}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                            <ExternalLink className="w-3 h-3" />
                            Fonte: {dadosEnriquecidos.ibge.fonte} ({dadosEnriquecidos.ibge.ano_referencia})
                        </div>
                    </CardContent>
                </Card>
            )}

            {dadosEnriquecidos.saneamento && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">SNIS - Saneamento Básico</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="grid md:grid-cols-3 gap-3">
                            <div>
                                <p className="text-xs text-gray-500">Cobertura de Água</p>
                                <Badge className="bg-blue-600">{dadosEnriquecidos.saneamento.cobertura_agua}</Badge>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Cobertura de Esgoto</p>
                                <Badge className="bg-amber-600">{dadosEnriquecidos.saneamento.cobertura_esgoto}</Badge>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Coleta de Lixo</p>
                                <Badge className="bg-green-600">{dadosEnriquecidos.saneamento.coleta_lixo}</Badge>
                            </div>
                        </div>
                        <p className="text-xs text-gray-600">
                            📊 {dadosEnriquecidos.saneamento.fonte} ({dadosEnriquecidos.saneamento.ano_referencia})
                        </p>
                    </CardContent>
                </Card>
            )}

            {dadosEnriquecidos.saude && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">DATASUS - Saúde</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-2 gap-3 text-sm">
                            <div>
                                <p className="text-xs text-gray-500">Estabelecimentos de Saúde</p>
                                <p className="font-semibold">{dadosEnriquecidos.saude.estabelecimentos_saude}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Leitos</p>
                                <p className="font-semibold">{dadosEnriquecidos.saude.leitos}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Mortalidade Infantil</p>
                                <p className="font-semibold">{dadosEnriquecidos.saude.mortalidade_infantil}</p>
                            </div>
                        </div>
                        <p className="text-xs text-gray-600 mt-3">
                            🏥 {dadosEnriquecidos.saude.fonte} ({dadosEnriquecidos.saude.ano_referencia})
                        </p>
                    </CardContent>
                </Card>
            )}

            {dadosEnriquecidos.educacao && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">INEP - Educação</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-2 gap-3 text-sm">
                            <div>
                                <p className="text-xs text-gray-500">Escolas Municipais</p>
                                <p className="font-semibold">{dadosEnriquecidos.educacao.escolas_municipais}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">IDEB</p>
                                <p className="font-semibold">{dadosEnriquecidos.educacao.ideb}</p>
                            </div>
                        </div>
                        <p className="text-xs text-gray-600 mt-3">
                            🎓 {dadosEnriquecidos.educacao.fonte} ({dadosEnriquecidos.educacao.ano_referencia})
                        </p>
                    </CardContent>
                </Card>
            )}

            {dadosEnriquecidos.transparencia && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Portal da Transparência</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 text-sm">
                            <div>
                                <p className="text-xs text-gray-500">Repasses Federais</p>
                                <p className="font-semibold">{dadosEnriquecidos.transparencia.repasses_federais_ano}</p>
                            </div>
                            {dadosEnriquecidos.transparencia.principais_investimentos?.length > 0 && (
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Principais Investimentos:</p>
                                    <ul className="space-y-1">
                                        {dadosEnriquecidos.transparencia.principais_investimentos.map((inv, i) => (
                                            <li key={i} className="text-xs">• {inv}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-gray-600 mt-3">
                            💰 {dadosEnriquecidos.transparencia.fonte} ({dadosEnriquecidos.transparencia.ano_referencia})
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}