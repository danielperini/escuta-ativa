import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Loader2, BookOpen, MapPin, Users, Building2, Newspaper, RefreshCw, Download, FileText, TrendingUp, BarChart3, GitCompare } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { exportarParaPDF } from "../relatorios/ExportadorPDF";
import { exportarParaCSV } from "../relatorios/ExportadorCSV";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import "leaflet/dist/leaflet.css";
import "../analise/LeafletFix";

export default function StorytellingTerritorial() {
    const [comunidadeSelecionada, setComunidadeSelecionada] = useState("");
    const [gerando, setGerando] = useState(false);
    const [storytelling, setStorytelling] = useState(null);
    const [exportando, setExportando] = useState(false);
    const [modoComparacao, setModoComparacao] = useState(false);
    const [comunidadesComparacao, setComunidadesComparacao] = useState([]);
    const [storytellingsComparacao, setStorytellingsComparacao] = useState({});
    const [periodoSelecionado, setPeriodoSelecionado] = useState("12meses");
    const [dadosIBGE, setDadosIBGE] = useState(null);
    const [carregandoIBGE, setCarregandoIBGE] = useState(false);
    const [periodoComparacao, setPeriodoComparacao] = useState([]);

    const { data: comunidades = [] } = useQuery({
        queryKey: ['comunidades-storytelling'],
        queryFn: () => base44.entities.Comunidade.list()
    });

    const { data: atividades = [] } = useQuery({
        queryKey: ['atividades-storytelling'],
        queryFn: () => base44.entities.Atividade.list('-created_date', 100)
    });

    const { data: liderancas = [] } = useQuery({
        queryKey: ['liderancas-storytelling'],
        queryFn: () => base44.entities.LiderancaComunitaria.list()
    });

    const { data: temas = [] } = useQuery({
        queryKey: ['temas-storytelling'],
        queryFn: () => base44.entities.Tema.list()
    });

    const buscarDadosIBGE = async (municipio) => {
        setCarregandoIBGE(true);
        try {
            const prompt = `Busque dados atualizados do IBGE para o município: ${municipio}
            
Retorne:
1. Código IBGE do município
2. Séries históricas (últimos 10 anos quando disponível):
   - População total
   - PIB per capita
   - IDH-M
   - Índice de Gini
   - Taxa de alfabetização
   - Mortalidade infantil
   - Expectativa de vida
   - Percentual de pobreza
   
3. Dados setoriais do PIB:
   - Agropecuária
   - Indústria
   - Serviços
   
4. Infraestrutura:
   - Estabelecimentos de saúde
   - Escolas
   - Saneamento básico
   
Use fontes oficiais do IBGE. Retorne dados reais, não estimativas.`;

            const resultado = await base44.integrations.Core.InvokeLLM({
                prompt: prompt,
                add_context_from_internet: true,
                response_json_schema: {
                    type: "object",
                    properties: {
                        codigo_ibge: { type: "string" },
                        series_temporais: {
                            type: "object",
                            properties: {
                                populacao: {
                                    type: "array",
                                    items: {
                                        type: "object",
                                        properties: {
                                            ano: { type: "number" },
                                            valor: { type: "number" }
                                        }
                                    }
                                },
                                pib_per_capita: {
                                    type: "array",
                                    items: {
                                        type: "object",
                                        properties: {
                                            ano: { type: "number" },
                                            valor: { type: "number" }
                                        }
                                    }
                                },
                                idhm: {
                                    type: "array",
                                    items: {
                                        type: "object",
                                        properties: {
                                            ano: { type: "number" },
                                            valor: { type: "number" }
                                        }
                                    }
                                },
                                gini: {
                                    type: "array",
                                    items: {
                                        type: "object",
                                        properties: {
                                            ano: { type: "number" },
                                            valor: { type: "number" }
                                        }
                                    }
                                },
                                alfabetizacao: {
                                    type: "array",
                                    items: {
                                        type: "object",
                                        properties: {
                                            ano: { type: "number" },
                                            valor: { type: "number" }
                                        }
                                    }
                                }
                            }
                        },
                        pib_setorial: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    setor: { type: "string" },
                                    percentual: { type: "number" }
                                }
                            }
                        },
                        infraestrutura: {
                            type: "object",
                            properties: {
                                saude: { type: "number" },
                                educacao: { type: "number" },
                                saneamento_percentual: { type: "number" }
                            }
                        },
                        fonte: { type: "string" }
                    }
                }
            });

            setDadosIBGE(resultado);
        } catch (error) {
            console.error("Erro ao buscar dados IBGE:", error);
            alert("Erro ao buscar dados do IBGE: " + error.message);
        } finally {
            setCarregandoIBGE(false);
        }
    };

    const calcularSeriesTemporaisInternas = () => {
        if (!comunidadeSelecionada) return null;

        const atividadesCom = atividades.filter(a => a.local === comunidadeSelecionada);
        
        const mesesMap = {
            "3meses": 3,
            "6meses": 6,
            "12meses": 12,
            "24meses": 24
        };
        
        const meses = mesesMap[periodoSelecionado] || 12;
        const dataLimite = new Date();
        dataLimite.setMonth(dataLimite.getMonth() - meses);
        
        const atividadesFiltradas = atividadesCom.filter(a => 
            new Date(a.created_date) >= dataLimite
        );

        const dadosPorMes = {};
        atividadesFiltradas.forEach(a => {
            const data = new Date(a.created_date);
            const mesAno = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
            
            if (!dadosPorMes[mesAno]) {
                dadosPorMes[mesAno] = {
                    mes: mesAno,
                    atividades: 0,
                    demandas: 0,
                    riscos: 0,
                    compromissos: 0
                };
            }
            
            dadosPorMes[mesAno].atividades++;
            dadosPorMes[mesAno].demandas += (a.demandas || []).length;
        });

        return Object.values(dadosPorMes).sort((a, b) => a.mes.localeCompare(b.mes));
    };

    const gerarStorytelling = async () => {
        if (!comunidadeSelecionada) {
            alert("Selecione uma comunidade");
            return;
        }

        setGerando(true);

        try {
            const comunidade = comunidades.find(c => c.nome === comunidadeSelecionada);
            const atividadesCom = atividades.filter(a => a.local === comunidadeSelecionada);
            const liderancasCom = liderancas.filter(l => l.comunidade === comunidadeSelecionada);
            const temasMencionados = [...new Set(atividadesCom.flatMap(a => a.temas_identificados || []))];

            const prompt = `
Você é um analista territorial especializado em storytelling contextual.

TAREFA: Gerar narrativa territorial completa sobre:
Comunidade: ${comunidadeSelecionada}
Município: ${comunidade?.municipio || "A identificar"}

IMPORTANTE: Use fontes públicas confiáveis da internet (IBGE, Wikipedia, portais oficiais, notícias).

PARTE 1: HISTÓRIA DO TERRITÓRIO (NARRATIVA)

1. Busque e integre informações sobre:
   - História do município ${comunidade?.municipio}
   - Formação da comunidade ${comunidadeSelecionada}
   - Marcos históricos
   - Transformações econômicas e sociais
   - Características geográficas
   - Cultura local e tradições

2. Integre com dados internos do Escuta Ativa:
   - ${atividadesCom.length} atividades registradas
   - ${liderancasCom.length} lideranças ativas
   - Temas recorrentes: ${temasMencionados.slice(0, 5).join(", ")}
   - Demandas históricas identificadas

3. Gere narrativa coerente, fluida e factual com:
   - Introdução histórica
   - Linha do tempo resumida
   - Elementos identitários do território
   - Marcos econômicos, culturais e sociais
   - Formação da comunidade
   - Contexto municipal

4. CITE TODAS AS FONTES UTILIZADAS no formato:
   "Fonte: [Nome da fonte] — [detalhe], consulta em [data]"

PARTE 2: DADOS DO MUNICÍPIO E DA COMUNIDADE

1. DEMOGRAFIA (buscar IBGE):
   - População total do município
   - População estimada recente
   - Densidade demográfica
   - Extensão territorial
   - IDHM
   - Renda média
   - Escolaridade

2. INSTITUIÇÕES (buscar portais oficiais):
   - Nome do prefeito(a)
   - Partido
   - Mandato
   - Secretarias relevantes

3. ECONOMIA:
   - Principais atividades econômicas
   - Caracterização rural/urbana

4. NOTÍCIAS RECENTES:
   - Acontecimentos importantes
   - Obras recentes
   - Fatos relevantes

5. INTEGRAÇÃO COM DADOS INTERNOS:
   - Falas relevantes dos últimos 30 dias
   - Padrões de demandas históricas
   - Temas prevalentes
   - Oportunidades identificadas

CITE FONTES PARA CADA DADO. Exemplo:
"Fonte: IBGE Cidades — Censo 2022"
"Fonte: Portal Prefeitura — Notícias Oficiais"
"Fonte: Wikipedia — Município de [nome]"

NÃO INVENTE DADOS. Se não encontrar, declare "Informação não disponível em fontes públicas".
`;

            const resultado = await base44.integrations.Core.InvokeLLM({
                prompt: prompt,
                add_context_from_internet: true,
                response_json_schema: {
                    type: "object",
                    properties: {
                        narrativa_territorial: {
                            type: "object",
                            properties: {
                                introducao: { type: "string" },
                                linha_tempo: { type: "array", items: { type: "string" } },
                                formacao_comunidade: { type: "string" },
                                caracteristicas_culturais: { type: "string" },
                                contexto_municipal: { type: "string" },
                                integracao_registros: { type: "string" },
                                fontes_narrativa: { type: "array", items: { type: "string" } }
                            }
                        },
                        dados_demograficos: {
                            type: "object",
                            properties: {
                                populacao_total: { type: "string" },
                                populacao_estimada: { type: "string" },
                                densidade: { type: "string" },
                                extensao_territorial: { type: "string" },
                                idhm: { type: "string" },
                                renda_media: { type: "string" },
                                escolaridade: { type: "string" },
                                fonte: { type: "string" }
                            }
                        },
                        dados_institucionais: {
                            type: "object",
                            properties: {
                                prefeito: { type: "string" },
                                partido: { type: "string" },
                                mandato: { type: "string" },
                                secretarias: { type: "array", items: { type: "string" } },
                                fonte: { type: "string" }
                            }
                        },
                        economia: {
                            type: "object",
                            properties: {
                                principais_atividades: { type: "array", items: { type: "string" } },
                                caracterizacao: { type: "string" },
                                pib_per_capita: { type: "string" },
                                fonte: { type: "string" }
                            }
                        },
                        evolucao_demografica: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    ano: { type: "string" },
                                    populacao: { type: "number" }
                                }
                            }
                        },
                        evolucao_economica: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    ano: { type: "string" },
                                    pib: { type: "number" },
                                    setor: { type: "string" }
                                }
                            }
                        },
                        localizacao: {
                            type: "object",
                            properties: {
                                latitude: { type: "number" },
                                longitude: { type: "number" }
                            }
                        },
                        noticias_recentes: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    titulo: { type: "string" },
                                    resumo: { type: "string" },
                                    data: { type: "string" },
                                    fonte: { type: "string" }
                                }
                            }
                        },
                        integracao_interna: {
                            type: "object",
                            properties: {
                                falas_relevantes: { type: "array", items: { type: "string" } },
                                demandas_historicas: { type: "array", items: { type: "string" } },
                                temas_prevalentes: { type: "array", items: { type: "string" } },
                                oportunidades: { type: "array", items: { type: "string" } }
                            }
                        }
                    }
                }
            });

            setStorytelling(resultado);
            
            // Buscar dados IBGE automaticamente
            if (comunidade?.municipio) {
                await buscarDadosIBGE(comunidade.municipio);
            }

        } catch (error) {
            console.error("Erro ao gerar storytelling:", error);
            alert("Erro ao gerar storytelling: " + error.message);
        } finally {
            setGerando(false);
        }
    };

    const exportarStorytellingPDF = () => {
        if (!storytelling) return;

        setExportando(true);

        const dadosRelatorio = {
            titulo: `Storytelling Territorial - ${comunidadeSelecionada}`,
            resumo: storytelling.narrativa_territorial?.introducao || '',
            kpis: {
                'População': storytelling.dados_demograficos?.populacao_total || 'N/A',
                'IDHM': storytelling.dados_demograficos?.idhm || 'N/A',
                'Extensão': storytelling.dados_demograficos?.extensao_territorial || 'N/A'
            },
            tabela: [
                {
                    aspecto: 'Formação da Comunidade',
                    descricao: storytelling.narrativa_territorial?.formacao_comunidade || ''
                },
                {
                    aspecto: 'Características Culturais',
                    descricao: storytelling.narrativa_territorial?.caracteristicas_culturais || ''
                },
                {
                    aspecto: 'Contexto Municipal',
                    descricao: storytelling.narrativa_territorial?.contexto_municipal || ''
                },
                {
                    aspecto: 'Prefeito(a)',
                    descricao: storytelling.dados_institucionais?.prefeito || 'N/A'
                },
                {
                    aspecto: 'Partido',
                    descricao: storytelling.dados_institucionais?.partido || 'N/A'
                }
            ],
            insights: [
                ...(storytelling.narrativa_territorial?.linha_tempo || []),
                ...(storytelling.integracao_interna?.falas_relevantes || []).slice(0, 3)
            ]
        };

        exportarParaPDF(dadosRelatorio, 'storytelling', {
            periodo: 'Narrativa completa',
            comunidade: comunidadeSelecionada
        });

        setExportando(false);
    };

    const exportarStorytellingCSV = () => {
        if (!storytelling) return;

        setExportando(true);

        const dadosRelatorio = {
            titulo: `Storytelling Territorial - ${comunidadeSelecionada}`,
            tabela: [
                {
                    categoria: 'Demografia',
                    campo: 'População Total',
                    valor: storytelling.dados_demograficos?.populacao_total || 'N/A',
                    fonte: storytelling.dados_demograficos?.fonte || ''
                },
                {
                    categoria: 'Demografia',
                    campo: 'IDHM',
                    valor: storytelling.dados_demograficos?.idhm || 'N/A',
                    fonte: storytelling.dados_demograficos?.fonte || ''
                },
                {
                    categoria: 'Demografia',
                    campo: 'Extensão Territorial',
                    valor: storytelling.dados_demograficos?.extensao_territorial || 'N/A',
                    fonte: storytelling.dados_demograficos?.fonte || ''
                },
                {
                    categoria: 'Institucional',
                    campo: 'Prefeito(a)',
                    valor: storytelling.dados_institucionais?.prefeito || 'N/A',
                    fonte: storytelling.dados_institucionais?.fonte || ''
                },
                {
                    categoria: 'Institucional',
                    campo: 'Partido',
                    valor: storytelling.dados_institucionais?.partido || 'N/A',
                    fonte: storytelling.dados_institucionais?.fonte || ''
                },
                {
                    categoria: 'Economia',
                    campo: 'Caracterização',
                    valor: storytelling.economia?.caracterizacao || 'N/A',
                    fonte: storytelling.economia?.fonte || ''
                },
                ...(storytelling.economia?.principais_atividades || []).map(ativ => ({
                    categoria: 'Economia',
                    campo: 'Atividade Econômica',
                    valor: ativ,
                    fonte: storytelling.economia?.fonte || ''
                })),
                ...(storytelling.noticias_recentes || []).map(noticia => ({
                    categoria: 'Notícias',
                    campo: noticia.titulo,
                    valor: noticia.resumo,
                    fonte: noticia.fonte
                })),
                ...(storytelling.integracao_interna?.demandas_historicas || []).map(dem => ({
                    categoria: 'Demandas Históricas',
                    campo: 'Demanda',
                    valor: dem,
                    fonte: 'Dados internos Escuta Ativa'
                }))
            ]
        };

        exportarParaCSV(dadosRelatorio, 'storytelling');

        setExportando(false);
    };

    const adicionarComparacao = () => {
        if (!comunidadeSelecionada || comunidadesComparacao.includes(comunidadeSelecionada)) {
            alert("Selecione uma comunidade diferente para comparar");
            return;
        }

        setComunidadesComparacao([...comunidadesComparacao, comunidadeSelecionada]);
        
        if (storytelling) {
            setStorytellingsComparacao({
                ...storytellingsComparacao,
                [comunidadeSelecionada]: storytelling
            });
        }
    };

    const removerComparacao = (comunidade) => {
        setComunidadesComparacao(comunidadesComparacao.filter(c => c !== comunidade));
        const novo = { ...storytellingsComparacao };
        delete novo[comunidade];
        setStorytellingsComparacao(novo);
    };

    const compararComunidades = () => {
        if (comunidadesComparacao.length < 2) {
            alert("Selecione pelo menos 2 comunidades para comparar");
            return;
        }

        const dadosComparacao = comunidadesComparacao.map(c => {
            const st = storytellingsComparacao[c];
            return {
                nome: c,
                populacao: parseInt(st?.dados_demograficos?.populacao_total?.replace(/\D/g, '') || 0),
                idhm: parseFloat(st?.dados_demograficos?.idhm?.replace(',', '.') || 0),
                densidade: parseFloat(st?.dados_demograficos?.densidade?.replace(/\D/g, '') || 0),
                renda: parseFloat(st?.dados_demograficos?.renda_media?.replace(/\D/g, '') || 0)
            };
        });

        return dadosComparacao;
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5" />
                        Storytelling Territorial
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600">
                        Conte a história da comunidade e do município com dados confiáveis de fontes públicas,
                        integrados aos registros do Escuta Ativa.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Selecione a comunidade:</label>
                            <select
                                value={comunidadeSelecionada}
                                onChange={(e) => setComunidadeSelecionada(e.target.value)}
                                className="w-full border rounded px-3 py-2"
                            >
                                <option value="">Escolha uma comunidade</option>
                                {comunidades.map(c => (
                                    <option key={c.id} value={c.nome}>{c.nome}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Período de análise interna:</label>
                            <select
                                value={periodoSelecionado}
                                onChange={(e) => setPeriodoSelecionado(e.target.value)}
                                className="w-full border rounded px-3 py-2"
                            >
                                <option value="3meses">Últimos 3 meses</option>
                                <option value="6meses">Últimos 6 meses</option>
                                <option value="12meses">Último ano</option>
                                <option value="24meses">Últimos 2 anos</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            onClick={gerarStorytelling}
                            disabled={gerando || !comunidadeSelecionada}
                            className="flex-1"
                            style={{ backgroundColor: '#0B1E33' }}
                        >
                            {gerando ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Gerando...
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="w-5 h-5 mr-2" />
                                    Gerar
                                </>
                            )}
                        </Button>
                        <Button
                            onClick={adicionarComparacao}
                            disabled={!storytelling || !comunidadeSelecionada}
                            variant="outline"
                        >
                            <GitCompare className="w-5 h-5 mr-2" />
                            Adicionar à Comparação
                        </Button>
                    </div>

                    {comunidadesComparacao.length > 0 && (
                        <div className="bg-blue-50 p-3 rounded">
                            <p className="text-sm font-semibold mb-2">Comunidades para Comparação:</p>
                            <div className="flex flex-wrap gap-2">
                                {comunidadesComparacao.map(c => (
                                    <Badge
                                        key={c}
                                        className="cursor-pointer"
                                        style={{ backgroundColor: '#3b82f6' }}
                                        onClick={() => removerComparacao(c)}
                                    >
                                        {c} ✕
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {storytelling && (
                <>
                    <Card className="bg-green-50 border-green-200">
                        <CardContent className="pt-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-green-700" />
                                    <p className="text-sm font-semibold text-green-900">
                                        Storytelling gerado com sucesso!
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={exportarStorytellingPDF}
                                        disabled={exportando}
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        PDF
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={exportarStorytellingCSV}
                                        disabled={exportando}
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        CSV
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                <Tabs defaultValue="narrativa" className="w-full">
                    <TabsList className="grid w-full grid-cols-6">
                        <TabsTrigger value="narrativa">
                            <BookOpen className="w-4 h-4 mr-2" />
                            História
                        </TabsTrigger>
                        <TabsTrigger value="dados">
                            <MapPin className="w-4 h-4 mr-2" />
                            Dados
                        </TabsTrigger>
                        <TabsTrigger value="visualizacoes">
                            <TrendingUp className="w-4 h-4 mr-2" />
                            Visualizações
                        </TabsTrigger>
                        <TabsTrigger value="series-temporais">
                            <BarChart3 className="w-4 h-4 mr-2" />
                            Séries Temporais
                        </TabsTrigger>
                        <TabsTrigger value="comparacao" disabled={comunidadesComparacao.length < 2}>
                            <GitCompare className="w-4 h-4 mr-2" />
                            Comparação
                        </TabsTrigger>
                        <TabsTrigger value="integracao">
                            <Users className="w-4 h-4 mr-2" />
                            Integração
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="narrativa" className="space-y-6">
                        <Card className="border-l-4 border-blue-600">
                            <CardHeader>
                                <CardTitle>📖 Narrativa Territorial</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h4 className="font-bold text-lg mb-3">Introdução Histórica</h4>
                                    <p className="text-gray-700 leading-relaxed">
                                        {storytelling.narrativa_territorial?.introducao}
                                    </p>
                                </div>

                                {storytelling.narrativa_territorial?.linha_tempo && 
                                 storytelling.narrativa_territorial.linha_tempo.length > 0 && (
                                    <div>
                                        <h4 className="font-bold text-lg mb-3">Linha do Tempo</h4>
                                        <ul className="space-y-2">
                                            {storytelling.narrativa_territorial.linha_tempo.map((evento, idx) => (
                                                <li key={idx} className="flex gap-2 items-start">
                                                    <span className="text-blue-600 font-bold">•</span>
                                                    <span className="text-gray-700">{evento}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <div>
                                    <h4 className="font-bold text-lg mb-3">Formação da Comunidade</h4>
                                    <p className="text-gray-700 leading-relaxed">
                                        {storytelling.narrativa_territorial?.formacao_comunidade}
                                    </p>
                                </div>

                                <div>
                                    <h4 className="font-bold text-lg mb-3">Características Culturais</h4>
                                    <p className="text-gray-700 leading-relaxed">
                                        {storytelling.narrativa_territorial?.caracteristicas_culturais}
                                    </p>
                                </div>

                                <div>
                                    <h4 className="font-bold text-lg mb-3">Contexto Municipal</h4>
                                    <p className="text-gray-700 leading-relaxed">
                                        {storytelling.narrativa_territorial?.contexto_municipal}
                                    </p>
                                </div>

                                <div>
                                    <h4 className="font-bold text-lg mb-3">Integração com Registros Internos</h4>
                                    <p className="text-gray-700 leading-relaxed">
                                        {storytelling.narrativa_territorial?.integracao_registros}
                                    </p>
                                </div>

                                <div className="bg-blue-50 p-4 rounded">
                                    <h4 className="font-bold text-sm mb-2">📚 Fontes Utilizadas:</h4>
                                    <ul className="space-y-1 text-xs text-gray-700">
                                        {storytelling.narrativa_territorial?.fontes_narrativa?.map((fonte, idx) => (
                                            <li key={idx}>• {fonte}</li>
                                        ))}
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="dados" className="space-y-6">
                        <Card className="border-l-4 border-green-600">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="w-5 h-5" />
                                    Dados Demográficos
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="bg-gray-50 p-3 rounded">
                                        <p className="text-xs text-gray-500 mb-1">População Total</p>
                                        <p className="font-bold text-lg">{storytelling.dados_demograficos?.populacao_total}</p>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded">
                                        <p className="text-xs text-gray-500 mb-1">População Estimada</p>
                                        <p className="font-bold text-lg">{storytelling.dados_demograficos?.populacao_estimada}</p>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded">
                                        <p className="text-xs text-gray-500 mb-1">Densidade Demográfica</p>
                                        <p className="font-bold text-lg">{storytelling.dados_demograficos?.densidade}</p>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded">
                                        <p className="text-xs text-gray-500 mb-1">Extensão Territorial</p>
                                        <p className="font-bold text-lg">{storytelling.dados_demograficos?.extensao_territorial}</p>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded">
                                        <p className="text-xs text-gray-500 mb-1">IDHM</p>
                                        <p className="font-bold text-lg">{storytelling.dados_demograficos?.idhm}</p>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded">
                                        <p className="text-xs text-gray-500 mb-1">Renda Média</p>
                                        <p className="font-bold text-lg">{storytelling.dados_demograficos?.renda_media}</p>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 mt-3">
                                    📊 {storytelling.dados_demograficos?.fonte}
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-l-4 border-purple-600">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Building2 className="w-5 h-5" />
                                    Dados Institucionais
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <p className="text-sm font-semibold mb-1">Prefeito(a):</p>
                                    <p className="text-gray-700">{storytelling.dados_institucionais?.prefeito}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold mb-1">Partido:</p>
                                    <Badge>{storytelling.dados_institucionais?.partido}</Badge>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold mb-1">Mandato:</p>
                                    <p className="text-gray-700">{storytelling.dados_institucionais?.mandato}</p>
                                </div>
                                {storytelling.dados_institucionais?.secretarias && 
                                 storytelling.dados_institucionais.secretarias.length > 0 && (
                                    <div>
                                        <p className="text-sm font-semibold mb-2">Secretarias Relevantes:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {storytelling.dados_institucionais.secretarias.map((sec, idx) => (
                                                <Badge key={idx} variant="outline">{sec}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <p className="text-xs text-gray-500 mt-3">
                                    🏛️ {storytelling.dados_institucionais?.fonte}
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-l-4 border-amber-600">
                            <CardHeader>
                                <CardTitle>💼 Economia e Caracterização</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <p className="text-sm font-semibold mb-2">Principais Atividades Econômicas:</p>
                                    <ul className="space-y-1">
                                        {storytelling.economia?.principais_atividades?.map((ativ, idx) => (
                                            <li key={idx} className="text-sm text-gray-700">• {ativ}</li>
                                        ))}
                                    </ul>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold mb-1">Caracterização:</p>
                                    <p className="text-gray-700">{storytelling.economia?.caracterizacao}</p>
                                </div>
                                <p className="text-xs text-gray-500 mt-3">
                                    💰 {storytelling.economia?.fonte}
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-l-4 border-red-600">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Newspaper className="w-5 h-5" />
                                    Notícias Recentes
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {storytelling.noticias_recentes?.map((noticia, idx) => (
                                        <div key={idx} className="bg-gray-50 p-3 rounded">
                                            <h4 className="font-semibold text-sm mb-1">{noticia.titulo}</h4>
                                            <p className="text-xs text-gray-700 mb-2">{noticia.resumo}</p>
                                            <div className="flex items-center justify-between text-xs text-gray-500">
                                                <span>{noticia.data}</span>
                                                <span>📰 {noticia.fonte}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="visualizacoes" className="space-y-6">
                        {storytelling?.localizacao && (
                            <Card className="border-l-4 border-blue-600">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <MapPin className="w-5 h-5" />
                                        Mapa da Localização
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div style={{ height: '400px', borderRadius: '8px', overflow: 'hidden' }}>
                                        <MapContainer
                                            center={[storytelling.localizacao.latitude, storytelling.localizacao.longitude]}
                                            zoom={12}
                                            style={{ height: '100%', width: '100%' }}
                                        >
                                            <TileLayer
                                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                            />
                                            <Marker position={[storytelling.localizacao.latitude, storytelling.localizacao.longitude]}>
                                                <Popup>
                                                    <strong>{comunidadeSelecionada}</strong>
                                                    <br />
                                                    {storytelling.dados_demograficos?.populacao_total}
                                                </Popup>
                                            </Marker>
                                            <Circle
                                                center={[storytelling.localizacao.latitude, storytelling.localizacao.longitude]}
                                                radius={5000}
                                                pathOptions={{ color: '#0B1E33', fillColor: '#F2B632', fillOpacity: 0.2 }}
                                            />
                                        </MapContainer>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {storytelling?.evolucao_demografica && storytelling.evolucao_demografica.length > 0 && (
                            <Card className="border-l-4 border-green-600">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5" />
                                        Evolução Demográfica
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <LineChart data={storytelling.evolucao_demografica}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="ano" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Line 
                                                type="monotone" 
                                                dataKey="populacao" 
                                                stroke="#0B1E33" 
                                                strokeWidth={3}
                                                name="População"
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        )}

                        {storytelling?.evolucao_economica && storytelling.evolucao_economica.length > 0 && (
                            <Card className="border-l-4 border-amber-600">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <BarChart3 className="w-5 h-5" />
                                        Evolução Econômica (PIB)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={storytelling.evolucao_economica}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="ano" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="pib" fill="#F2B632" name="PIB" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        )}

                        {storytelling?.dados_demograficos && (
                            <Card className="border-l-4 border-purple-600">
                                <CardHeader>
                                    <CardTitle>Indicadores Sociais (Radar)</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={350}>
                                        <RadarChart data={[
                                            { indicador: 'IDHM', valor: parseFloat(storytelling.dados_demograficos?.idhm?.replace(',', '.') || 0) * 100 },
                                            { indicador: 'Renda', valor: Math.min(parseFloat(storytelling.dados_demograficos?.renda_media?.replace(/\D/g, '') || 0) / 50, 100) },
                                            { indicador: 'Densidade', valor: Math.min(parseFloat(storytelling.dados_demograficos?.densidade?.replace(/\D/g, '') || 0), 100) }
                                        ]}>
                                            <PolarGrid />
                                            <PolarAngleAxis dataKey="indicador" />
                                            <PolarRadiusAxis domain={[0, 100]} />
                                            <Radar name="Indicadores" dataKey="valor" stroke="#0B1E33" fill="#F2B632" fillOpacity={0.6} />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    <TabsContent value="series-temporais" className="space-y-6">
                        {carregandoIBGE && (
                            <Card>
                                <CardContent className="pt-6 text-center">
                                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
                                    <p className="text-sm text-gray-600">Buscando dados do IBGE...</p>
                                </CardContent>
                            </Card>
                        )}

                        {dadosIBGE?.series_temporais && (
                            <>
                                <Card className="border-l-4 border-blue-600">
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="flex items-center gap-2">
                                                <TrendingUp className="w-5 h-5" />
                                                Evolução Populacional (IBGE)
                                            </CardTitle>
                                            <Badge variant="outline" className="text-xs">
                                                {dadosIBGE.fonte}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <ResponsiveContainer width="100%" height={350}>
                                            <LineChart data={dadosIBGE.series_temporais.populacao}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="ano" />
                                                <YAxis />
                                                <Tooltip />
                                                <Legend />
                                                <Line 
                                                    type="monotone" 
                                                    dataKey="valor" 
                                                    stroke="#0B1E33" 
                                                    strokeWidth={3}
                                                    name="População"
                                                    dot={{ r: 4 }}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>

                                {dadosIBGE.series_temporais.pib_per_capita && dadosIBGE.series_temporais.pib_per_capita.length > 0 && (
                                    <Card className="border-l-4 border-green-600">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <BarChart3 className="w-5 h-5" />
                                                Evolução do PIB per Capita
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <ResponsiveContainer width="100%" height={350}>
                                                <BarChart data={dadosIBGE.series_temporais.pib_per_capita}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="ano" />
                                                    <YAxis />
                                                    <Tooltip />
                                                    <Legend />
                                                    <Bar dataKey="valor" fill="#22c55e" name="PIB per Capita (R$)" />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </CardContent>
                                    </Card>
                                )}

                                {dadosIBGE.series_temporais.idhm && dadosIBGE.series_temporais.idhm.length > 0 && (
                                    <Card className="border-l-4 border-purple-600">
                                        <CardHeader>
                                            <CardTitle>Evolução do IDH-M</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <ResponsiveContainer width="100%" height={300}>
                                                <LineChart data={dadosIBGE.series_temporais.idhm}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="ano" />
                                                    <YAxis domain={[0, 1]} />
                                                    <Tooltip />
                                                    <Legend />
                                                    <Line 
                                                        type="monotone" 
                                                        dataKey="valor" 
                                                        stroke="#a855f7" 
                                                        strokeWidth={3}
                                                        name="IDH-M"
                                                    />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </CardContent>
                                    </Card>
                                )}

                                {dadosIBGE.series_temporais.gini && dadosIBGE.series_temporais.gini.length > 0 && (
                                    <Card className="border-l-4 border-amber-600">
                                        <CardHeader>
                                            <CardTitle>Índice de Gini (Desigualdade)</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <ResponsiveContainer width="100%" height={300}>
                                                <LineChart data={dadosIBGE.series_temporais.gini}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="ano" />
                                                    <YAxis domain={[0, 1]} />
                                                    <Tooltip />
                                                    <Legend />
                                                    <Line 
                                                        type="monotone" 
                                                        dataKey="valor" 
                                                        stroke="#f59e0b" 
                                                        strokeWidth={3}
                                                        name="Índice de Gini"
                                                    />
                                                </LineChart>
                                            </ResponsiveContainer>
                                            <p className="text-xs text-gray-600 mt-2">
                                                * Quanto mais próximo de 1, maior a desigualdade
                                            </p>
                                        </CardContent>
                                    </Card>
                                )}

                                {dadosIBGE.pib_setorial && dadosIBGE.pib_setorial.length > 0 && (
                                    <Card className="border-l-4 border-indigo-600">
                                        <CardHeader>
                                            <CardTitle>Composição Setorial do PIB</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <ResponsiveContainer width="100%" height={300}>
                                                <BarChart data={dadosIBGE.pib_setorial}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="setor" />
                                                    <YAxis />
                                                    <Tooltip />
                                                    <Legend />
                                                    <Bar dataKey="percentual" fill="#6366f1" name="% do PIB" />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </CardContent>
                                    </Card>
                                )}
                            </>
                        )}

                        {calcularSeriesTemporaisInternas() && (
                            <Card className="border-l-4 border-cyan-600">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <BarChart3 className="w-5 h-5" />
                                        Séries Temporais Internas ({periodoSelecionado})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={350}>
                                        <LineChart data={calcularSeriesTemporaisInternas()}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="mes" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Line 
                                                type="monotone" 
                                                dataKey="atividades" 
                                                stroke="#0B1E33" 
                                                strokeWidth={2}
                                                name="Atividades"
                                            />
                                            <Line 
                                                type="monotone" 
                                                dataKey="demandas" 
                                                stroke="#F2B632" 
                                                strokeWidth={2}
                                                name="Demandas"
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        )}

                        {!dadosIBGE && !carregandoIBGE && storytelling && (
                            <Card>
                                <CardContent className="pt-6 text-center">
                                    <p className="text-gray-600 mb-4">
                                        Gere o storytelling para buscar dados temporais do IBGE
                                    </p>
                                    <Button 
                                        onClick={() => {
                                            const comunidade = comunidades.find(c => c.nome === comunidadeSelecionada);
                                            if (comunidade?.municipio) {
                                                buscarDadosIBGE(comunidade.municipio);
                                            }
                                        }}
                                        disabled={!comunidadeSelecionada}
                                    >
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                        Buscar Dados IBGE
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    <TabsContent value="comparacao" className="space-y-6">
                        {comunidadesComparacao.length >= 2 && (
                            <>
                                <Card className="border-l-4 border-indigo-600">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <GitCompare className="w-5 h-5" />
                                            Comparação Demográfica
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <BarChart data={compararComunidades()}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="nome" />
                                                <YAxis />
                                                <Tooltip />
                                                <Legend />
                                                <Bar dataKey="populacao" fill="#0B1E33" name="População" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>

                                <Card className="border-l-4 border-green-600">
                                    <CardHeader>
                                        <CardTitle>Comparação IDHM e Renda</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <BarChart data={compararComunidades()}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="nome" />
                                                <YAxis />
                                                <Tooltip />
                                                <Legend />
                                                <Bar dataKey="idhm" fill="#22c55e" name="IDHM" />
                                                <Bar dataKey="renda" fill="#F2B632" name="Renda Média" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>

                                <Card className="border-l-4 border-purple-600">
                                    <CardHeader>
                                        <CardTitle>Tabela Comparativa</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="overflow-x-auto">
                                            <table className="w-full border-collapse text-sm">
                                                <thead>
                                                    <tr className="bg-gray-100">
                                                        <th className="border px-3 py-2 text-left">Comunidade</th>
                                                        <th className="border px-3 py-2 text-left">População</th>
                                                        <th className="border px-3 py-2 text-left">IDHM</th>
                                                        <th className="border px-3 py-2 text-left">Renda Média</th>
                                                        <th className="border px-3 py-2 text-left">Densidade</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {comunidadesComparacao.map(c => {
                                                        const st = storytellingsComparacao[c];
                                                        return (
                                                            <tr key={c} className="hover:bg-gray-50">
                                                                <td className="border px-3 py-2 font-semibold">{c}</td>
                                                                <td className="border px-3 py-2">{st?.dados_demograficos?.populacao_total || 'N/A'}</td>
                                                                <td className="border px-3 py-2">{st?.dados_demograficos?.idhm || 'N/A'}</td>
                                                                <td className="border px-3 py-2">{st?.dados_demograficos?.renda_media || 'N/A'}</td>
                                                                <td className="border px-3 py-2">{st?.dados_demograficos?.densidade || 'N/A'}</td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </CardContent>
                                </Card>
                            </>
                        )}
                    </TabsContent>

                    <TabsContent value="integracao" className="space-y-6">
                        <Card className="border-l-4 border-indigo-600">
                            <CardHeader>
                                <CardTitle>🔗 Integração com Dados Internos</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {storytelling.integracao_interna?.falas_relevantes && 
                                 storytelling.integracao_interna.falas_relevantes.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold mb-2">Falas Relevantes (Últimos 30 dias):</h4>
                                        <ul className="space-y-2">
                                            {storytelling.integracao_interna.falas_relevantes.map((fala, idx) => (
                                                <li key={idx} className="bg-blue-50 p-3 rounded text-sm">
                                                    "{fala}"
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {storytelling.integracao_interna?.demandas_historicas && 
                                 storytelling.integracao_interna.demandas_historicas.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold mb-2">Demandas Históricas:</h4>
                                        <ul className="space-y-1">
                                            {storytelling.integracao_interna.demandas_historicas.map((dem, idx) => (
                                                <li key={idx} className="text-sm text-gray-700">• {dem}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {storytelling.integracao_interna?.temas_prevalentes && 
                                 storytelling.integracao_interna.temas_prevalentes.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold mb-2">Temas Prevalentes:</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {storytelling.integracao_interna.temas_prevalentes.map((tema, idx) => (
                                                <Badge key={idx} style={{ backgroundColor: '#F2B632', color: '#0B1E33' }}>
                                                    {tema}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {storytelling.integracao_interna?.oportunidades && 
                                 storytelling.integracao_interna.oportunidades.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold mb-2">Oportunidades Identificadas:</h4>
                                        <div className="space-y-2">
                                            {storytelling.integracao_interna.oportunidades.map((opo, idx) => (
                                                <div key={idx} className="bg-green-50 p-3 rounded text-sm">
                                                    {opo}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
                </>
            )}
        </div>
    );
}