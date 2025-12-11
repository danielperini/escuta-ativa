import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { FileText, Loader2, Brain, Download, TrendingUp, AlertTriangle, Lightbulb, Users } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function RelatorioNarrativoEstrategico() {
    const [gerando, setGerando] = useState(false);
    const [relatorio, setRelatorio] = useState(null);
    const [periodo, setPeriodo] = useState("30");
    const [formato, setFormato] = useState("pdf");

    const { data: atividades = [] } = useQuery({
        queryKey: ['atividades-narrativo'],
        queryFn: () => base44.entities.Atividade.list('-created_date', 100)
    });

    const { data: compromissos = [] } = useQuery({
        queryKey: ['compromissos-narrativo'],
        queryFn: () => base44.entities.Compromisso.list()
    });

    const { data: riscos = [] } = useQuery({
        queryKey: ['riscos-narrativo'],
        queryFn: () => base44.entities.RiscoSocial.list()
    });

    const { data: oportunidades = [] } = useQuery({
        queryKey: ['oportunidades-narrativo'],
        queryFn: () => base44.entities.Oportunidade.list()
    });

    const { data: liderancas = [] } = useQuery({
        queryKey: ['liderancas-narrativo'],
        queryFn: () => base44.entities.LiderancaComunitaria.list()
    });

    const { data: comunidades = [] } = useQuery({
        queryKey: ['comunidades-narrativo'],
        queryFn: () => base44.entities.Comunidade.list()
    });

    const gerarRelatorioNarrativo = async () => {
        setGerando(true);

        try {
            const diasFiltro = parseInt(periodo);
            const dataLimite = new Date();
            dataLimite.setDate(dataLimite.getDate() - diasFiltro);

            const atividadesRecentes = atividades.filter(a => new Date(a.created_date) >= dataLimite);
            const riscosAtivos = riscos.filter(r => r.status === "ativo");
            const compromissosPendentes = compromissos.filter(c => 
                c.status === "pendente" || c.status === "atrasado"
            );

            // Dados consolidados de múltiplos módulos
            const dadosConsolidados = {
                periodo_analise: `${periodo} dias`,
                data_geracao: new Date().toISOString(),
                
                // Módulo Atividades
                atividades: {
                    total: atividadesRecentes.length,
                    por_tipo: atividadesRecentes.reduce((acc, a) => {
                        acc[a.tipo] = (acc[a.tipo] || 0) + 1;
                        return acc;
                    }, {}),
                    temas_principais: [...new Set(atividadesRecentes.flatMap(a => a.temas_identificados || []))].slice(0, 10),
                    demandas_recorrentes: atividadesRecentes.flatMap(a => a.demandas || []).slice(0, 20)
                },
                
                // Módulo Mapa e Comunidades
                comunidades: {
                    total: comunidades.length,
                    criticas: comunidades.filter(c => c.termometro_social === "critico").length,
                    principais: comunidades.slice(0, 10).map(c => ({
                        nome: c.nome,
                        termometro: c.termometro_social,
                        populacao: c.populacao_estimada
                    }))
                },
                
                // Módulo Riscos
                riscos_sociais: {
                    total_ativos: riscosAtivos.length,
                    criticos: riscosAtivos.filter(r => r.nivel === "critico").length,
                    altos: riscosAtivos.filter(r => r.nivel === "alto").length,
                    principais: riscosAtivos.slice(0, 5).map(r => ({
                        titulo: r.titulo,
                        nivel: r.nivel,
                        comunidade: r.comunidade,
                        tipo: r.tipo
                    }))
                },
                
                // Módulo Oportunidades
                oportunidades: {
                    total: oportunidades.length,
                    por_tipo: oportunidades.reduce((acc, o) => {
                        acc[o.tipo] = (acc[o.tipo] || 0) + 1;
                        return acc;
                    }, {}),
                    alta_relevancia: oportunidades.filter(o => o.relevancia === "alta").length
                },
                
                // Módulo Compromissos/Governança
                compromissos: {
                    total: compromissos.length,
                    cumpridos: compromissos.filter(c => c.status === "concluido").length,
                    pendentes: compromissosPendentes.length,
                    taxa_cumprimento: compromissos.length > 0 
                        ? Math.round((compromissos.filter(c => c.status === "concluido").length / compromissos.length) * 100)
                        : 0
                },
                
                // Módulo Atores
                atores: {
                    liderancas_cadastradas: liderancas.length,
                    liderancas_ativas: liderancas.filter(l => {
                        const ultimaInteracao = l.ultima_interacao ? new Date(l.ultima_interacao) : null;
                        return ultimaInteracao && ultimaInteracao >= dataLimite;
                    }).length
                }
            };

            const prompt = `
Você é um analista sênior de relacionamento comunitário e governança territorial.

MISSÃO: Gere um RELATÓRIO NARRATIVO ESTRATÉGICO abrangente e coeso que compile insights de múltiplos módulos do sistema Escuta Ativa.

PERÍODO ANALISADO: ${periodo} dias
DATA DE GERAÇÃO: ${new Date().toLocaleDateString('pt-BR')}

DADOS CONSOLIDADOS DE MÚLTIPLOS MÓDULOS:
${JSON.stringify(dadosConsolidados, null, 2)}

ESTRUTURA DO RELATÓRIO NARRATIVO:

1. SÍNTESE EXECUTIVA (1 parágrafo)
   - Panorama geral do território no período
   - Principal descoberta ou tendência

2. CONTEXTO E CENÁRIO ATUAL
   - Estado geral das relações comunitárias
   - Nível de engajamento e presença territorial
   - Dinâmica das interações

3. ANÁLISE INTEGRADA POR DIMENSÃO

   3.1 DIÁLOGO E ENGAJAMENTO
   - Volume e qualidade das atividades
   - Diversidade de interlocutores
   - Temas mais relevantes
   - Tendências de participação

   3.2 RISCOS E TENSÕES
   - Principais riscos sociais identificados
   - Áreas críticas ou sob tensão
   - Padrões de conflito ou divergência
   - Indicadores de alerta precoce

   3.3 OPORTUNIDADES E POTENCIALIDADES
   - Oportunidades estratégicas detectadas
   - Potencial de desenvolvimento local
   - Parcerias e colaborações emergentes
   - Iniciativas promissoras

   3.4 GOVERNANÇA E CUMPRIMENTO
   - Desempenho em compromissos
   - Consistência das entregas
   - Confiabilidade institucional
   - Áreas de melhoria

   3.5 ATORES E LIDERANÇAS
   - Mapeamento de influência
   - Lideranças emergentes ou centrais
   - Qualidade da interlocução
   - Dinâmica de poder territorial

4. TENDÊNCIAS E MOVIMENTOS
   - Padrões temporais identificados
   - Mudanças em curso
   - Sinais emergentes
   - Projeções de curto prazo

5. PRIORIDADES ESTRATÉGICAS
   (Identificar 3-5 prioridades com base na análise)
   - Ações urgentes
   - Iniciativas preventivas
   - Oportunidades a capitalizar
   - Investimentos necessários

6. RECOMENDAÇÕES PARA TOMADA DE DECISÃO
   - Ações imediatas (próximos 7 dias)
   - Ações de curto prazo (próximo mês)
   - Estratégias de médio prazo
   - Indicadores para monitoramento

7. CONCLUSÃO
   - Síntese integradora
   - Chamado à ação

ESTILO:
- Narrativo, fluido e coeso (não usar bullet points excessivos)
- Linguagem estratégica e executiva
- Insights acionáveis e práticos
- Baseado em dados mas interpretativo
- Contextualizado ao território específico

FORMATO DE SAÍDA: ${formato === 'pdf' ? 'Relatório PDF estruturado' : formato === 'docx' ? 'Documento DOCX editável' : 'Planilha XLSX com abas'}

Gere um relatório profissional, denso e estratégico que seja realmente útil para tomada de decisão.
`;

            const resultado = await base44.integrations.Core.InvokeLLM({
                prompt: prompt
            });

            const relatorioGerado = {
                conteudo: resultado,
                metadata: {
                    periodo,
                    formato,
                    data_geracao: new Date().toISOString(),
                    total_atividades: atividadesRecentes.length,
                    riscos_criticos: riscosAtivos.filter(r => r.nivel === "critico").length,
                    taxa_cumprimento: dadosConsolidados.compromissos.taxa_cumprimento
                }
            };

            setRelatorio(relatorioGerado);

            // Salvar no histórico
            await base44.entities.RelatorioGerado.create({
                tipo_relatorio: "executivo",
                formato: formato.toUpperCase(),
                periodo: `${periodo} dias`,
                descricao: `Relatório Narrativo Estratégico - ${new Date().toLocaleDateString('pt-BR')}`
            });

        } catch (error) {
            console.error("Erro ao gerar relatório:", error);
            alert("Erro ao gerar relatório: " + error.message);
        } finally {
            setGerando(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Brain className="w-5 h-5" />
                        Relatório Narrativo Estratégico
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600">
                        A IA compilará automaticamente insights de múltiplos módulos (Análise, Mapa, Governança, Riscos, Oportunidades) 
                        em uma narrativa estratégica coesa para tomada de decisão.
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Período de Análise</Label>
                            <Select value={periodo} onValueChange={setPeriodo}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="7">Últimos 7 dias</SelectItem>
                                    <SelectItem value="30">Últimos 30 dias</SelectItem>
                                    <SelectItem value="90">Últimos 90 dias</SelectItem>
                                    <SelectItem value="180">Últimos 6 meses</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Formato</Label>
                            <Select value={formato} onValueChange={setFormato}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pdf">PDF</SelectItem>
                                    <SelectItem value="docx">DOCX</SelectItem>
                                    <SelectItem value="xlsx">XLSX</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <Button
                        onClick={gerarRelatorioNarrativo}
                        disabled={gerando}
                        className="w-full"
                        size="lg"
                        style={{ backgroundColor: '#F2B632' }}
                    >
                        {gerando ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Gerando Relatório Estratégico...
                            </>
                        ) : (
                            <>
                                <Brain className="w-5 h-5 mr-2" />
                                Gerar Relatório Narrativo
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {relatorio && (
                <Card className="border-2 border-blue-500">
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div>
                                <CardTitle>Relatório Gerado</CardTitle>
                                <p className="text-sm text-gray-500 mt-1">
                                    {new Date(relatorio.metadata.data_geracao).toLocaleDateString('pt-BR')} - {relatorio.metadata.periodo}
                                </p>
                            </div>
                            <Button size="sm" style={{ backgroundColor: '#0B1E33' }}>
                                <Download className="w-4 h-4 mr-2" />
                                Baixar {formato.toUpperCase()}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-blue-50 p-3 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                    <FileText className="w-4 h-4 text-blue-600" />
                                    <span className="text-xs text-blue-600 font-medium">Atividades</span>
                                </div>
                                <p className="text-2xl font-bold text-blue-900">{relatorio.metadata.total_atividades}</p>
                            </div>
                            <div className="bg-red-50 p-3 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                    <AlertTriangle className="w-4 h-4 text-red-600" />
                                    <span className="text-xs text-red-600 font-medium">Riscos Críticos</span>
                                </div>
                                <p className="text-2xl font-bold text-red-900">{relatorio.metadata.riscos_criticos}</p>
                            </div>
                            <div className="bg-green-50 p-3 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                    <TrendingUp className="w-4 h-4 text-green-600" />
                                    <span className="text-xs text-green-600 font-medium">Cumprimento</span>
                                </div>
                                <p className="text-2xl font-bold text-green-900">{relatorio.metadata.taxa_cumprimento}%</p>
                            </div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                            <pre className="text-xs whitespace-pre-wrap font-mono">{relatorio.conteudo}</pre>
                        </div>

                        <div className="bg-amber-50 p-3 rounded-lg">
                            <p className="text-xs text-amber-800">
                                📊 Relatório compilado automaticamente pela IA integrando dados de: Atividades, Riscos Sociais, 
                                Oportunidades, Compromissos, Lideranças e Análise Territorial.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}