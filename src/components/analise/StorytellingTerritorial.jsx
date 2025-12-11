import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Loader2, BookOpen, MapPin, Users, Building2, Newspaper, RefreshCw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function StorytellingTerritorial() {
    const [comunidadeSelecionada, setComunidadeSelecionada] = useState("");
    const [gerando, setGerando] = useState(false);
    const [storytelling, setStorytelling] = useState(null);

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
                                fonte: { type: "string" }
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

        } catch (error) {
            console.error("Erro ao gerar storytelling:", error);
            alert("Erro ao gerar storytelling: " + error.message);
        } finally {
            setGerando(false);
        }
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

                    <Button
                        onClick={gerarStorytelling}
                        disabled={gerando || !comunidadeSelecionada}
                        className="w-full"
                        style={{ backgroundColor: '#0B1E33' }}
                    >
                        {gerando ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Gerando Storytelling...
                            </>
                        ) : (
                            <>
                                <RefreshCw className="w-5 h-5 mr-2" />
                                Gerar Storytelling Territorial
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {storytelling && (
                <Tabs defaultValue="narrativa" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="narrativa">
                            <BookOpen className="w-4 h-4 mr-2" />
                            História
                        </TabsTrigger>
                        <TabsTrigger value="dados">
                            <MapPin className="w-4 h-4 mr-2" />
                            Dados
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
            )}
        </div>
    );
}