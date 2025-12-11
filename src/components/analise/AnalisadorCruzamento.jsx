import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Loader2, TrendingUp, AlertTriangle, Target, Sparkles, Database, BarChart3 } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from "recharts";

export default function AnalisadorCruzamento() {
    const [analisando, setAnalisando] = useState(false);
    const [resultadoAnalise, setResultadoAnalise] = useState(null);
    const [municipioSelecionado, setMunicipioSelecionado] = useState("");

    const { data: atividades = [] } = useQuery({
        queryKey: ['atividades-cruzamento'],
        queryFn: () => base44.entities.Atividade.list('-created_date', 500)
    });

    const { data: comunidades = [] } = useQuery({
        queryKey: ['comunidades-cruzamento'],
        queryFn: () => base44.entities.Comunidade.list()
    });

    const { data: temas = [] } = useQuery({
        queryKey: ['temas-cruzamento'],
        queryFn: () => base44.entities.Tema.list()
    });

    const { data: riscos = [] } = useQuery({
        queryKey: ['riscos-cruzamento'],
        queryFn: () => base44.entities.RiscoSocial.list()
    });

    const municipiosUnicos = [...new Set(comunidades.map(c => c.municipio).filter(Boolean))];

    const realizarAnaliseCruzada = async () => {
        if (!municipioSelecionado) {
            alert("Selecione um município");
            return;
        }

        setAnalisando(true);

        try {
            // 1. Buscar dados do IBGE
            const dadosIBGE = await base44.integrations.Core.InvokeLLM({
                prompt: `Busque dados oficiais atualizados do IBGE para ${municipioSelecionado}:
                
1. População total e evolução (últimos 10 anos)
2. IDH-M e componentes (renda, longevidade, educação)
3. PIB per capita e setores econômicos
4. Taxa de alfabetização
5. Índice de Gini (desigualdade)
6. Percentual de extrema pobreza
7. Mortalidade infantil
8. Acesso a saneamento básico

Use fontes oficiais do IBGE. Retorne dados reais.`,
                add_context_from_internet: true,
                response_json_schema: {
                    type: "object",
                    properties: {
                        populacao_total: { type: "number" },
                        idhm: { type: "number" },
                        pib_per_capita: { type: "number" },
                        taxa_alfabetizacao: { type: "number" },
                        gini: { type: "number" },
                        extrema_pobreza_percentual: { type: "number" },
                        mortalidade_infantil: { type: "number" },
                        saneamento_percentual: { type: "number" },
                        evolucao_populacional: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    ano: { type: "number" },
                                    populacao: { type: "number" }
                                }
                            }
                        }
                    }
                }
            });

            // 2. Buscar dados de saúde (DATASUS)
            const dadosSaude = await base44.integrations.Core.InvokeLLM({
                prompt: `Busque dados de saúde do DATASUS para ${municipioSelecionado}:
                
1. Número de estabelecimentos de saúde
2. Leitos hospitalares por 1000 habitantes
3. Cobertura de saúde da família (%)
4. Principais causas de internação
5. Taxa de mortalidade geral
6. Casos de doenças endêmicas (dengue, tuberculose)

Use fontes oficiais do DATASUS/Ministério da Saúde.`,
                add_context_from_internet: true,
                response_json_schema: {
                    type: "object",
                    properties: {
                        estabelecimentos_saude: { type: "number" },
                        leitos_por_mil: { type: "number" },
                        cobertura_saude_familia: { type: "number" },
                        principais_causas_internacao: {
                            type: "array",
                            items: { type: "string" }
                        }
                    }
                }
            });

            // 3. Buscar dados de saneamento (SNIS)
            const dadosSaneamento = await base44.integrations.Core.InvokeLLM({
                prompt: `Busque dados do SNIS (Sistema Nacional de Informações sobre Saneamento) para ${municipioSelecionado}:
                
1. Índice de atendimento de água (%)
2. Índice de atendimento de esgoto (%)
3. Índice de tratamento de esgoto (%)
4. Índice de coleta de resíduos sólidos (%)
5. Qualidade da água distribuída

Use dados oficiais do SNIS.`,
                add_context_from_internet: true,
                response_json_schema: {
                    type: "object",
                    properties: {
                        atendimento_agua: { type: "number" },
                        atendimento_esgoto: { type: "number" },
                        tratamento_esgoto: { type: "number" },
                        coleta_residuos: { type: "number" }
                    }
                }
            });

            // 4. Buscar dados de educação (INEP)
            const dadosEducacao = await base44.integrations.Core.InvokeLLM({
                prompt: `Busque dados de educação do INEP/Censo Escolar para ${municipioSelecionado}:
                
1. Número de escolas (total, públicas, privadas)
2. Número de matrículas por nível
3. IDEB (anos iniciais e finais)
4. Taxa de aprovação
5. Taxa de abandono escolar

Use dados oficiais do INEP.`,
                add_context_from_internet: true,
                response_json_schema: {
                    type: "object",
                    properties: {
                        total_escolas: { type: "number" },
                        matriculas_total: { type: "number" },
                        ideb_anos_iniciais: { type: "number" },
                        ideb_anos_finais: { type: "number" },
                        taxa_aprovacao: { type: "number" }
                    }
                }
            });

            // 5. Consolidar dados internos
            const comunidadesMunicipio = comunidades.filter(c => c.municipio === municipioSelecionado);
            const atividadesMunicipio = atividades.filter(a => 
                comunidadesMunicipio.some(c => c.nome === a.local)
            );

            const demandasInternas = atividadesMunicipio.flatMap(a => a.demandas || []);
            const temasRecorrentes = [...new Set(atividadesMunicipio.flatMap(a => a.temas_identificados || []))];
            const riscosIdentificados = riscos.filter(r => 
                comunidadesMunicipio.some(c => c.nome === r.comunidade)
            );

            // 6. Análise cruzada com IA
            const analiseIA = await base44.integrations.Core.InvokeLLM({
                prompt: `Você é um analista especializado em desenvolvimento territorial e políticas públicas.

TAREFA: Realize uma análise cruzada profunda integrando dados oficiais com demandas locais.

DADOS OFICIAIS:
IBGE: ${JSON.stringify(dadosIBGE, null, 2)}
DATASUS: ${JSON.stringify(dadosSaude, null, 2)}
SNIS: ${JSON.stringify(dadosSaneamento, null, 2)}
INEP: ${JSON.stringify(dadosEducacao, null, 2)}

DADOS INTERNOS DO TERRITÓRIO:
Total de registros: ${atividadesMunicipio.length}
Comunidades mapeadas: ${comunidadesMunicipio.length}
Demandas coletadas: ${demandasInternas.length}
Temas recorrentes: ${temasRecorrentes.join(", ")}
Riscos identificados: ${riscosIdentificados.length}

Principais demandas da comunidade:
${demandasInternas.slice(0, 20).join("\n")}

ANÁLISE OBRIGATÓRIA:

1. CORRELAÇÕES IDENTIFICADAS:
   - Cruze dados oficiais (IBGE, saúde, saneamento, educação) com demandas locais
   - Identifique padrões: Ex: "Baixo saneamento (30%) correlaciona com demandas de saúde (45% dos registros)"
   - Liste correlações positivas e negativas

2. LACUNAS E DISCREPÂNCIAS:
   - Compare dados oficiais vs. demandas da comunidade
   - Ex: "INEP indica 95% de matrícula, mas comunidade relata falta de vagas"
   - Identifique indicadores ausentes nos dados oficiais mas presentes nas falas

3. ÁREAS PRIORITÁRIAS DE INTERVENÇÃO:
   - Com base nos dados cruzados, sugira 5 áreas prioritárias
   - Justifique cada uma com dados quantitativos e qualitativos
   - Ordene por urgência e impacto

4. TEMAS EMERGENTES:
   - Identifique temas não capturados pelos indicadores oficiais
   - Ex: "Comunidade menciona mobilidade urbana em 30% dos registros, mas não há dados oficiais"

5. TENDÊNCIAS E PROJEÇÕES:
   - Com base na evolução histórica (dados oficiais) e demandas recentes, projete cenários futuros
   - Identifique riscos crescentes e oportunidades

6. RECOMENDAÇÕES ESTRATÉGICAS:
   - Sugira ações concretas baseadas na análise cruzada
   - Priorize intervenções de alto impacto e viabilidade

IMPORTANTE: Seja preciso, cite números, percentuais e fontes. Identifique correlações causais quando possível.`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        correlacoes: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    indicador_oficial: { type: "string" },
                                    demanda_local: { type: "string" },
                                    forca_correlacao: { type: "string", enum: ["forte", "moderada", "fraca"] },
                                    descricao: { type: "string" }
                                }
                            }
                        },
                        lacunas: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    tipo: { type: "string" },
                                    descricao: { type: "string" },
                                    impacto: { type: "string", enum: ["alto", "medio", "baixo"] }
                                }
                            }
                        },
                        areas_prioritarias: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    area: { type: "string" },
                                    justificativa: { type: "string" },
                                    urgencia: { type: "string", enum: ["critica", "alta", "media"] },
                                    impacto_esperado: { type: "string" },
                                    dados_base: { type: "array", items: { type: "string" } }
                                }
                            }
                        },
                        temas_emergentes: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    tema: { type: "string" },
                                    frequencia_mencoes: { type: "number" },
                                    ausencia_dados_oficiais: { type: "boolean" },
                                    relevancia: { type: "string" }
                                }
                            }
                        },
                        tendencias: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    tendencia: { type: "string" },
                                    direcao: { type: "string", enum: ["crescente", "estavel", "decrescente"] },
                                    projecao: { type: "string" }
                                }
                            }
                        },
                        recomendacoes: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    acao: { type: "string" },
                                    prazo: { type: "string" },
                                    impacto: { type: "string" },
                                    viabilidade: { type: "string" }
                                }
                            }
                        },
                        insights_chave: {
                            type: "array",
                            items: { type: "string" }
                        },
                        score_territorial: {
                            type: "object",
                            properties: {
                                saude: { type: "number" },
                                educacao: { type: "number" },
                                saneamento: { type: "number" },
                                desenvolvimento_social: { type: "number" },
                                governanca_participativa: { type: "number" }
                            }
                        }
                    }
                }
            });

            setResultadoAnalise({
                dadosOficiais: {
                    ibge: dadosIBGE,
                    saude: dadosSaude,
                    saneamento: dadosSaneamento,
                    educacao: dadosEducacao
                },
                dadosInternos: {
                    totalRegistros: atividadesMunicipio.length,
                    comunidades: comunidadesMunicipio.length,
                    demandas: demandasInternas.length,
                    temas: temasRecorrentes,
                    riscos: riscosIdentificados.length
                },
                analise: analiseIA,
                municipio: municipioSelecionado,
                dataAnalise: new Date().toISOString()
            });

        } catch (error) {
            console.error("Erro na análise cruzada:", error);
            alert("Erro ao realizar análise: " + error.message);
        } finally {
            setAnalisando(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Database className="w-5 h-5" />
                        Análise Cruzada: Dados Oficiais + Demandas Locais
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600">
                        Cruze dados de fontes oficiais (IBGE, DATASUS, SNIS, INEP) com registros internos 
                        para identificar correlações, lacunas e áreas prioritárias de intervenção.
                    </p>

                    <div>
                        <label className="block text-sm font-medium mb-2">Selecione o Município:</label>
                        <select
                            value={municipioSelecionado}
                            onChange={(e) => setMunicipioSelecionado(e.target.value)}
                            className="w-full border rounded px-3 py-2"
                        >
                            <option value="">Escolha um município</option>
                            {municipiosUnicos.map(m => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>
                    </div>

                    <Button
                        onClick={realizarAnaliseCruzada}
                        disabled={analisando || !municipioSelecionado}
                        className="w-full bg-[#0B1E33] hover:bg-[#1a3a52]"
                    >
                        {analisando ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Analisando com IA...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-5 h-5 mr-2" />
                                Realizar Análise Cruzada
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {resultadoAnalise && (
                <>
                    <Card className="border-l-4 border-green-600">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Target className="w-5 h-5" />
                                Score Territorial - {resultadoAnalise.municipio}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                {Object.entries(resultadoAnalise.analise.score_territorial || {}).map(([area, score]) => (
                                    <div key={area} className="text-center p-4 bg-gray-50 rounded-lg">
                                        <p className="text-xs text-gray-600 mb-1 capitalize">
                                            {area.replace(/_/g, ' ')}
                                        </p>
                                        <p className="text-3xl font-bold" style={{
                                            color: score >= 7 ? '#22c55e' : score >= 5 ? '#f59e0b' : '#ef4444'
                                        }}>
                                            {score.toFixed(1)}
                                        </p>
                                        <p className="text-xs text-gray-500">/10</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-blue-600">
                        <CardHeader>
                            <CardTitle>📊 Correlações Identificadas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {resultadoAnalise.analise.correlacoes?.map((corr, idx) => (
                                    <div key={idx} className="p-4 bg-blue-50 rounded-lg">
                                        <div className="flex items-start justify-between mb-2">
                                            <p className="font-semibold text-sm text-blue-900">
                                                {corr.indicador_oficial} ↔ {corr.demanda_local}
                                            </p>
                                            <Badge className={
                                                corr.forca_correlacao === 'forte' ? 'bg-red-600' :
                                                corr.forca_correlacao === 'moderada' ? 'bg-amber-600' :
                                                'bg-blue-600'
                                            }>
                                                {corr.forca_correlacao}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-gray-700">{corr.descricao}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-red-600">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5" />
                                Áreas Prioritárias de Intervenção
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {resultadoAnalise.analise.areas_prioritarias?.map((area, idx) => (
                                    <div key={idx} className="border-2 border-red-200 rounded-lg p-4">
                                        <div className="flex items-start justify-between mb-2">
                                            <h4 className="font-bold text-gray-900">{idx + 1}. {area.area}</h4>
                                            <Badge className={
                                                area.urgencia === 'critica' ? 'bg-red-600' :
                                                area.urgencia === 'alta' ? 'bg-orange-600' :
                                                'bg-amber-600'
                                            }>
                                                {area.urgencia}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-gray-700 mb-3">{area.justificativa}</p>
                                        <div>
                                            <p className="text-xs font-semibold text-gray-600 mb-1">Impacto Esperado:</p>
                                            <p className="text-xs text-gray-700">{area.impacto_esperado}</p>
                                        </div>
                                        {area.dados_base && area.dados_base.length > 0 && (
                                            <div className="mt-2">
                                                <p className="text-xs font-semibold text-gray-600 mb-1">Dados Base:</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {area.dados_base.map((dado, i) => (
                                                        <Badge key={i} variant="outline" className="text-xs">
                                                            {dado}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-purple-600">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5" />
                                Temas Emergentes (Não Capturados)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {resultadoAnalise.analise.temas_emergentes?.map((tema, idx) => (
                                    <div key={idx} className="p-3 bg-purple-50 rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <p className="font-semibold text-sm text-purple-900">{tema.tema}</p>
                                                <p className="text-xs text-gray-600 mt-1">{tema.relevancia}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-purple-700">
                                                    {tema.frequencia_mencoes} menções
                                                </p>
                                                {tema.ausencia_dados_oficiais && (
                                                    <Badge variant="outline" className="text-xs mt-1">
                                                        Sem dados oficiais
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-amber-600">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="w-5 h-5" />
                                Tendências e Projeções
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {resultadoAnalise.analise.tendencias?.map((tend, idx) => (
                                    <div key={idx} className="p-3 bg-amber-50 rounded-lg">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Badge className={
                                                tend.direcao === 'crescente' ? 'bg-red-600' :
                                                tend.direcao === 'decrescente' ? 'bg-green-600' :
                                                'bg-gray-600'
                                            }>
                                                {tend.direcao}
                                            </Badge>
                                            <p className="font-semibold text-sm">{tend.tendencia}</p>
                                        </div>
                                        <p className="text-xs text-gray-700">{tend.projecao}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-green-600">
                        <CardHeader>
                            <CardTitle>✅ Recomendações Estratégicas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {resultadoAnalise.analise.recomendacoes?.map((rec, idx) => (
                                    <div key={idx} className="p-4 bg-green-50 rounded-lg border border-green-200">
                                        <p className="font-bold text-sm text-green-900 mb-2">{rec.acao}</p>
                                        <div className="grid grid-cols-3 gap-2 text-xs">
                                            <div>
                                                <span className="text-gray-600">Prazo:</span>
                                                <p className="font-semibold">{rec.prazo}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Impacto:</span>
                                                <p className="font-semibold">{rec.impacto}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Viabilidade:</span>
                                                <p className="font-semibold">{rec.viabilidade}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-blue-50 border-blue-200">
                        <CardHeader>
                            <CardTitle className="text-blue-900">💡 Insights-Chave</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2">
                                {resultadoAnalise.analise.insights_chave?.map((insight, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm text-blue-900">
                                        <span className="text-blue-600 font-bold">→</span>
                                        <span>{insight}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}