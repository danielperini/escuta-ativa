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

            // Dados adicionais para análise profunda
            const temasRecorrentes = atividadesRecentes.flatMap(a => a.temas_identificados || []);
            const temaFrequencia = temasRecorrentes.reduce((acc, t) => {
                acc[t] = (acc[t] || 0) + 1;
                return acc;
            }, {});

            const liderancasAtivas = liderancas.filter(l => {
                const ultimaInteracao = l.ultima_interacao ? new Date(l.ultima_interacao) : null;
                return ultimaInteracao && ultimaInteracao >= dataLimite;
            });

            const agendas = await base44.entities.Agenda.list();
            const agendasPeriodo = agendas.filter(ag => {
                const dataAgenda = ag.data ? new Date(ag.data) : null;
                return dataAgenda && dataAgenda >= dataLimite;
            });

            const prompt = `
Você é um analista sênior de relacionamento comunitário, governança territorial e comunicação estratégica.

MISSÃO: Gere um RELATÓRIO NARRATIVO ESTRATÉGICO PROFUNDO E ANALÍTICO que compile insights de múltiplos módulos do sistema Escuta Ativa, com foco em tendências-chave, riscos prioritários, oportunidades estratégicas e recomendações de comunicação comunitária.

PERÍODO ANALISADO: ${periodo} dias
DATA DE GERAÇÃO: ${new Date().toLocaleDateString('pt-BR')}

═══════════════════════════════════════════════════════════════

DADOS CONSOLIDADOS DE MÚLTIPLOS MÓDULOS:

📊 ANÁLISE TEMPORAL E TENDÊNCIAS:
${JSON.stringify({
    total_atividades: atividadesRecentes.length,
    distribuicao_temporal: "últimos " + periodo + " dias",
    temas_frequencia: Object.entries(temaFrequencia).sort((a, b) => b[1] - a[1]).slice(0, 10),
    padroes_emergentes: "identificar no texto"
}, null, 2)}

🗺️ MAPA E TERRITORIALIDADE:
${JSON.stringify({
    comunidades_mapeadas: comunidades.length,
    comunidades_criticas: comunidades.filter(c => c.termometro_social === "critico").map(c => ({
        nome: c.nome,
        termometro: c.termometro_social,
        populacao: c.populacao_estimada,
        temas_principais: c.principais_temas
    })),
    distribuicao_geografica: "analisar concentração territorial"
}, null, 2)}

⚠️ RISCOS SOCIAIS E TENSÃO:
${JSON.stringify({
    total_riscos_ativos: riscosAtivos.length,
    riscos_criticos: riscosAtivos.filter(r => r.nivel === "critico").map(r => ({
        titulo: r.titulo,
        nivel: r.nivel,
        tipo: r.tipo,
        comunidade: r.comunidade,
        causas: r.causas,
        previsao_agravamento: r.previsao_agravamento
    })),
    riscos_altos: riscosAtivos.filter(r => r.nivel === "alto").length,
    padroes_conflito: "identificar padrões recorrentes"
}, null, 2)}

💡 OPORTUNIDADES ESTRATÉGICAS:
${JSON.stringify({
    total_oportunidades: oportunidades.length,
    oportunidades_alta_relevancia: oportunidades.filter(o => o.relevancia === "alta").map(o => ({
        titulo: o.titulo,
        tipo: o.tipo,
        comunidade: o.comunidade,
        maturidade: o.maturidade
    })),
    distribuicao_tipo: oportunidades.reduce((acc, o) => {
        acc[o.tipo] = (acc[o.tipo] || 0) + 1;
        return acc;
    }, {})
}, null, 2)}

🎯 GOVERNANÇA E COMPROMISSOS:
${JSON.stringify({
    total_compromissos: compromissos.length,
    cumpridos: compromissos.filter(c => c.status === "concluido").length,
    atrasados: compromissos.filter(c => c.status === "atrasado").length,
    taxa_cumprimento: compromissos.length > 0 
        ? Math.round((compromissos.filter(c => c.status === "concluido").length / compromissos.length) * 100)
        : 0,
    compromissos_prioritarios: compromissos.filter(c => 
        c.prioridade === "alta" || c.prioridade === "urgente"
    ).slice(0, 5)
}, null, 2)}

👥 ATORES E LIDERANÇAS:
${JSON.stringify({
    total_liderancas: liderancas.length,
    liderancas_ativas: liderancasAtivas.length,
    perfil_interlocucao: liderancas.reduce((acc, l) => {
        acc[l.avaliacao_interlocucao || "neutro"] = (acc[l.avaliacao_interlocucao || "neutro"] || 0) + 1;
        return acc;
    }, {}),
    liderancas_influentes: liderancasAtivas.slice(0, 10).map(l => ({
        nome: l.nome,
        comunidade: l.comunidade,
        papel: l.papel_na_comunidade,
        interlocucao: l.avaliacao_interlocucao
    }))
}, null, 2)}

📅 AGENDA E ENGAJAMENTO:
${JSON.stringify({
    reunioes_realizadas: agendasPeriodo.filter(a => a.status === "realizada").length,
    reunioes_em_atraso: agendasPeriodo.filter(a => a.status === "em_atraso").length,
    taxa_realizacao: agendasPeriodo.length > 0
        ? Math.round((agendasPeriodo.filter(a => a.status === "realizada").length / agendasPeriodo.length) * 100)
        : 0
}, null, 2)}

═══════════════════════════════════════════════════════════════

ESTRUTURA DO RELATÓRIO NARRATIVO ESTRATÉGICO:

1. SÍNTESE EXECUTIVA (2-3 parágrafos)
   - Panorama geral do território no período
   - Principal descoberta ou tendência-chave
   - Alertas críticos imediatos

2. CONTEXTO E CENÁRIO ATUAL
   - Estado geral das relações comunitárias
   - Nível de engajamento e presença territorial
   - Dinâmica das interações e evolução temporal
   - Comparação com período anterior (se possível)

3. ANÁLISE INTEGRADA PROFUNDA POR DIMENSÃO

   3.1 DIÁLOGO E ENGAJAMENTO TERRITORIAL
   - Volume, frequência e qualidade das atividades
   - Diversidade de interlocutores e representatividade
   - Temas mais relevantes e recorrentes
   - Tendências de participação e mobilização
   - Gaps de escuta identificados

   3.2 RISCOS SOCIAIS E TENSÃO TERRITORIAL
   - Principais riscos sociais ativos (detalhamento crítico)
   - Comunidades críticas ou sob alta tensão
   - Padrões de conflito, divergência ou mal-estar
   - Indicadores de alerta precoce e sinais emergentes
   - Causas estruturais vs. causas pontuais
   - Previsão de agravamento

   3.3 OPORTUNIDADES E POTENCIALIDADES
   - Oportunidades estratégicas detectadas por tipo
   - Potencial de desenvolvimento local e territorial
   - Parcerias e colaborações emergentes
   - Iniciativas comunitárias promissoras
   - Recursos não explorados

   3.4 GOVERNANÇA, CONFIANÇA E CUMPRIMENTO
   - Desempenho em compromissos e entregas
   - Consistência e confiabilidade institucional
   - Trust Index territorial (se disponível)
   - Áreas críticas de melhoria
   - Risco de descredibilização

   3.5 ATORES, LIDERANÇAS E DINÂMICA DE PODER
   - Mapeamento de influência territorial
   - Lideranças emergentes, centrais e enfraquecidas
   - Qualidade da interlocução por ator
   - Dinâmica de poder e relações de força
   - Atores-chave para engajamento prioritário

4. TENDÊNCIAS-CHAVE E MOVIMENTOS EMERGENTES
   - Padrões temporais identificados (crescimento, declínio, estabilidade)
   - Mudanças estruturais em curso
   - Sinais fracos emergentes (atenção especial)
   - Projeções de curto e médio prazo
   - Janelas de oportunidade

5. RISCOS PRIORITÁRIOS (RANKING)
   - Top 3-5 riscos sociais mais críticos
   - Probabilidade e impacto
   - Comunidades afetadas
   - Ações mitigadoras urgentes

6. OPORTUNIDADES PRIORITÁRIAS (RANKING)
   - Top 3-5 oportunidades estratégicas
   - Potencial de impacto positivo
   - Viabilidade e maturidade
   - Ações de capitalização

7. COMUNICAÇÃO COMUNITÁRIA ESTRATÉGICA
   (Baseado no Código de Ética e CNV)
   
   7.1 Abordagens Recomendadas por Comunidade
   - Tom de comunicação sugerido
   - Estratégias de escuta ativa
   - Construção de confiança
   
   7.2 Manejo de Conflitos e Tensões
   - Comunicação Não Violenta aplicada
   - Frases a evitar / frases sugeridas
   - Mediação e diálogo construtivo
   
   7.3 Engajamento de Lideranças
   - Abordagem personalizada por perfil
   - Pontos de atenção cultural
   - Estratégias de fortalecimento de vínculos

8. RECOMENDAÇÕES PARA TOMADA DE DECISÃO
   - Ações URGENTES (próximos 7 dias)
   - Ações de CURTO prazo (próximo mês)
   - Estratégias de MÉDIO prazo (3-6 meses)
   - Investimentos e recursos necessários
   - Indicadores-chave para monitoramento contínuo

9. CONCLUSÃO E CHAMADO À AÇÃO
   - Síntese integradora
   - Mensagem estratégica central
   - Próximos passos críticos

CÓDIGO DE ÉTICA - PRINCÍPIOS PARA COMUNICAÇÃO:
1. Respeito à dignidade e diversidade
2. Transparência e honestidade nas relações
3. Escuta ativa, empática e não julgadora
4. Não discriminação e equidade
5. Confidencialidade quando necessário
6. Compromisso com a verdade
7. Responsabilidade social e territorial
8. Comunicação Não Violenta (CNV)

COMUNICAÇÃO NÃO VIOLENTA - PILARES:
- Observação (fatos sem julgamento)
- Sentimento (emoções genuínas)
- Necessidade (valores e motivações)
- Pedido (ações concretas e viáveis)

═══════════════════════════════════════════════════════════════

ESTILO DO RELATÓRIO:
- Narrativo, fluido e profundamente analítico
- Linguagem estratégica, executiva e acessível
- Insights acionáveis e práticos com base em dados
- Contextualizado ao território específico
- Integração clara entre módulos
- Destaque para TENDÊNCIAS, RISCOS e OPORTUNIDADES
- Recomendações de COMUNICAÇÃO contextualizadas

FORMATO DE SAÍDA: ${formato === 'pdf' ? 'Relatório PDF estruturado e profissional' : formato === 'docx' ? 'Documento DOCX editável' : 'Planilha XLSX com múltiplas abas'}

TAREFA FINAL:
Gere um relatório DENSO, ESTRATÉGICO, ANALÍTICO e PROFUNDO que seja realmente útil para tomada de decisão em governança territorial e relacionamento comunitário.
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