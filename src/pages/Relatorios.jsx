import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FileText, Download, Loader2, Brain, TrendingUp } from "lucide-react";
import RelatorioNarrativoEstrategico from "../components/relatorios/RelatorioNarrativoEstrategico";
import { exportarParaPDF } from "../components/relatorios/ExportadorPDF";
import { exportarParaCSV, exportarParaExcel } from "../components/relatorios/ExportadorCSV";
import PreviewRelatorio from "../components/relatorios/PreviewRelatorio";
import FiltrosAvancados from "../components/relatorios/FiltrosAvancados";
import BarraProgresso from "../components/relatorios/BarraProgresso";
import PersonalizacaoCampos from "../components/relatorios/PersonalizacaoCampos";

export default function Relatorios() {
    const navigate = useNavigate();
    const [tipoRelatorio, setTipoRelatorio] = useState("");
    const [formato, setFormato] = useState("");
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState(null);
    const [etapaAtual, setEtapaAtual] = useState("");
    const [camposPersonalizados, setCamposPersonalizados] = useState([]);
    const [filtrosAvancados, setFiltrosAvancados] = useState({
        dataInicio: '',
        dataFim: '',
        comunidade: 'todas',
        tipoRegistro: 'todos',
        temasSelecionados: []
    });
    const [resumoExecutivo, setResumoExecutivo] = useState(null);
    const [gerandoResumo, setGerandoResumo] = useState(false);
    const [tendenciasAnomalias, setTendenciasAnomalias] = useState(null);
    const [analisandoTendencias, setAnalisandoTendencias] = useState(false);
    const [relatorioPersonalizado, setRelatorioPersonalizado] = useState(null);

    const { data: atividades = [] } = useQuery({
        queryKey: ['atividades'],
        queryFn: () => base44.entities.Atividade.list('-created_date'),
    });

    const { data: compromissos = [] } = useQuery({
        queryKey: ['compromissos-rel'],
        queryFn: () => base44.entities.Compromisso.list()
    });

    const { data: liderancas = [] } = useQuery({
        queryKey: ['liderancas-rel'],
        queryFn: () => base44.entities.LiderancaComunitaria.list()
    });

    const { data: organizacoes = [] } = useQuery({
        queryKey: ['organizacoes-rel'],
        queryFn: () => base44.entities.ProjetoOrganizacao.list()
    });

    const { data: oportunidades = [] } = useQuery({
        queryKey: ['oportunidades-rel'],
        queryFn: () => base44.entities.Oportunidade.list()
    });

    const { data: riscos = [] } = useQuery({
        queryKey: ['riscos-rel'],
        queryFn: () => base44.entities.RiscoSocial.list()
    });

    const { data: comunidades = [] } = useQuery({
        queryKey: ['comunidades-rel'],
        queryFn: () => base44.entities.Comunidade.list()
    });

    const { data: temas = [] } = useQuery({
        queryKey: ['temas-rel'],
        queryFn: () => base44.entities.Tema.list()
    });

    const tiposRelatorio = [
        { value: "atividades", label: "Relatório de Atividades" },
        { value: "demandas", label: "Relatório de Demandas" },
        { value: "compromissos", label: "Relatório de Compromissos" },
        { value: "atores", label: "Relatório de Atores (Lideranças e Organizações)" },
        { value: "oportunidades", label: "Relatório de Oportunidades" },
        { value: "riscos", label: "Relatório de Riscos Sociais" },
        { value: "tematico", label: "Relatório Temático" },
        { value: "executivo", label: "Painel Executivo Completo" }
    ];

    const formatos = [
        { value: "pdf", label: "PDF - Documento Profissional" },
        { value: "xlsx", label: "XLSX - Planilha Excel" },
        { value: "csv", label: "CSV - Dados Tabulares" }
    ];

    const tiposRegistro = [
        { value: "todos", label: "Todos os tipos" },
        { value: "reuniao", label: "Reunião" },
        { value: "conversa_de_campo", label: "Conversa de Campo" },
        { value: "visita", label: "Visita" },
        { value: "visita_institucional", label: "Visita Institucional" },
        { value: "dialogo_individualizado", label: "Diálogo Individualizado" }
    ];

    const aplicarFiltros = (dados, tipo) => {
        return dados.filter(item => {
            const dataItem = new Date(item.created_date || item.data);
            
            // Filtro de data
            let matchData = true;
            if (filtrosAvancados.dataInicio) {
                matchData = dataItem >= new Date(filtrosAvancados.dataInicio);
            }
            if (filtrosAvancados.dataFim) {
                matchData = matchData && dataItem <= new Date(filtrosAvancados.dataFim);
            }

            // Filtro de comunidade
            const matchComunidade = filtrosAvancados.comunidade === "todas" || 
                item.comunidade === filtrosAvancados.comunidade || 
                item.local === filtrosAvancados.comunidade;
            
            // Filtro de temas (múltiplos)
            const matchTemas = filtrosAvancados.temasSelecionados.length === 0 ||
                (item.temas_identificados && filtrosAvancados.temasSelecionados.some(t => 
                    item.temas_identificados.includes(t)
                ));
            
            // Filtro de tipo de registro
            const matchTipoRegistro = filtrosAvancados.tipoRegistro === "todos" || 
                item.tipo === filtrosAvancados.tipoRegistro;
            
            return matchData && matchComunidade && matchTemas && matchTipoRegistro;
        });
    };

    const gerarRelatorio = async () => {
        if (!tipoRelatorio || !formato) {
            alert("Por favor, selecione o tipo de relatório e formato");
            return;
        }

        setLoading(true);
        const etapas = [
            "Coletando dados...",
            "Aplicando filtros...",
            "Analisando padrões...",
            "Gerando insights com IA...",
            "Preparando visualizações...",
            "Finalizando relatório..."
        ];

        try {
            setEtapaAtual(etapas[0]);
            let dadosParaIA = {};
            let promptEspecifico = "";
            let promptsAvancados = "";

            setEtapaAtual(etapas[1]);
            const atividadesFiltradas = aplicarFiltros(atividades, 'atividade');

            if (tipoRelatorio === "atividades") {
                dadosParaIA = {
                    total: atividadesFiltradas.length,
                    por_tipo: atividadesFiltradas.reduce((acc, a) => {
                        acc[a.tipo] = (acc[a.tipo] || 0) + 1;
                        return acc;
                    }, {}),
                    atividades_resumo: atividadesFiltradas.slice(0, 50).map(a => ({
                        tipo: a.tipo,
                        titulo: a.titulo,
                        descricao: a.descricao?.substring(0, 200),
                        comunidade: a.local,
                        data: a.data,
                        temas: a.temas_identificados,
                        demandas: a.demandas?.slice(0, 3)
                    }))
                };
                promptEspecifico = "Gere um relatório detalhado de atividades com estatísticas, tendências temporais e principais insights.";
            } else if (tipoRelatorio === "demandas") {
                const todasDemandas = atividadesFiltradas.flatMap(a => 
                    (a.demandas || []).map(d => ({ demanda: d, comunidade: a.local, data: a.data }))
                );
                dadosParaIA = {
                    total: todasDemandas.length,
                    por_comunidade: todasDemandas.reduce((acc, d) => {
                        acc[d.comunidade] = (acc[d.comunidade] || 0) + 1;
                        return acc;
                    }, {}),
                    demandas_lista: todasDemandas.slice(0, 100)
                };
                promptEspecifico = "Analise as demandas, identifique padrões recorrentes, prioridades e sugira ações.";
            } else if (tipoRelatorio === "compromissos") {
                const compromissosFiltrados = aplicarFiltros(compromissos, 'compromisso');
                dadosParaIA = {
                    total: compromissosFiltrados.length,
                    cumpridos: compromissosFiltrados.filter(c => c.status === "concluido").length,
                    pendentes: compromissosFiltrados.filter(c => c.status === "pendente").length,
                    atrasados: compromissosFiltrados.filter(c => c.status === "atrasado").length,
                    por_comunidade: compromissosFiltrados.reduce((acc, c) => {
                        acc[c.comunidade] = (acc[c.comunidade] || 0) + 1;
                        return acc;
                    }, {}),
                    lista: compromissosFiltrados.slice(0, 50).map(c => ({
                        titulo: c.titulo,
                        comunidade: c.comunidade,
                        status: c.status,
                        prioridade: c.prioridade,
                        prazo: c.prazo,
                        responsavel: c.responsavel
                    }))
                };
                promptEspecifico = "Analise o cumprimento de compromissos, identifique gargalos e sugira melhorias.";
            } else if (tipoRelatorio === "atores") {
                dadosParaIA = {
                    liderancas: {
                        total: liderancas.length,
                        lista: liderancas.slice(0, 30).map(l => ({
                            nome: l.nome,
                            comunidade: l.comunidade,
                            papel: l.papel_na_comunidade,
                            avaliacao: l.avaliacao_interlocucao,
                            ultima_interacao: l.ultima_interacao
                        }))
                    },
                    organizacoes: {
                        total: organizacoes.length,
                        lista: organizacoes.slice(0, 30).map(o => ({
                            nome: o.nome_oficial,
                            natureza: o.natureza,
                            area: o.area_de_atuacao
                        }))
                    },
                    atividades_rede: atividadesFiltradas.map(a => ({
                        liderancas_relacionadas: a.liderancas_relacionadas || [],
                        organizacoes_relacionadas: a.organizacoes_relacionadas || [],
                        temas: a.temas_identificados || []
                    }))
                };
                promptEspecifico = "Mapeie os principais atores territoriais, suas relações e influência.";
                promptsAvancados = `
ANÁLISE AVANÇADA - CONEXÕES POTENCIAIS:

Com base nos dados de lideranças, organizações e atividades registradas, sugira:

1. CONEXÕES POTENCIAIS entre lideranças e organizações que ainda não interagem mas que:
   - Atuam em comunidades próximas
   - Trabalham com temas similares
   - Complementam perfis (ex: liderança cultural + organização de fomento)
   - Têm objetivos alinhados

2. Para cada conexão sugerida, forneça:
   - Nome dos atores a conectar
   - Justificativa (por que faria sentido conectá-los)
   - Potencial (alto/médio/baixo)
   - Ação sugerida (reunião, apresentação, parceria)

3. Identifique atores centrais (aqueles com mais conexões/interações)

4. Detecte lacunas na rede (atores isolados que precisam ser conectados)

Retorne as conexões sugeridas em formato estruturado.`;
            } else if (tipoRelatorio === "oportunidades") {
                const oportunidadesFiltradas = aplicarFiltros(oportunidades, 'oportunidade');
                dadosParaIA = {
                    total: oportunidadesFiltradas.length,
                    por_tipo: oportunidadesFiltradas.reduce((acc, o) => {
                        acc[o.tipo] = (acc[o.tipo] || 0) + 1;
                        return acc;
                    }, {}),
                    lista: oportunidadesFiltradas.map(o => ({
                        titulo: o.titulo,
                        tipo: o.tipo,
                        comunidade: o.comunidade,
                        relevancia: o.relevancia,
                        maturidade: o.maturidade
                    }))
                };
                promptEspecifico = "Identifique oportunidades estratégicas, potencial de desenvolvimento local e parcerias.";
            } else if (tipoRelatorio === "riscos") {
                const riscosFiltrados = aplicarFiltros(riscos, 'risco');
                dadosParaIA = {
                    total: riscosFiltrados.length,
                    criticos: riscosFiltrados.filter(r => r.nivel === "critico").length,
                    altos: riscosFiltrados.filter(r => r.nivel === "alto").length,
                    lista: riscosFiltrados.map(r => ({
                        titulo: r.titulo,
                        nivel: r.nivel,
                        tipo: r.tipo,
                        comunidade: r.comunidade,
                        causas: r.causas,
                        previsao_agravamento: r.previsao_agravamento
                    }))
                };
                promptEspecifico = "Avalie riscos sociais, urgência de ação e estratégias preventivas.";
            } else if (tipoRelatorio === "tematico") {
                const temasPorComunidade = {};
                const temasComDemandas = {};
                const temasComRiscos = {};
                
                atividadesFiltradas.forEach(a => {
                    if (a.temas_identificados) {
                        a.temas_identificados.forEach(tema => {
                            if (!temasPorComunidade[tema]) temasPorComunidade[tema] = {};
                            temasPorComunidade[tema][a.local] = (temasPorComunidade[tema][a.local] || 0) + 1;
                            
                            if (a.demandas && a.demandas.length > 0) {
                                temasComDemandas[tema] = (temasComDemandas[tema] || 0) + a.demandas.length;
                            }
                        });
                    }
                });

                riscos.forEach(r => {
                    if (r.tipo) {
                        temasComRiscos[r.tipo] = (temasComRiscos[r.tipo] || 0) + 1;
                    }
                });

                dadosParaIA = { 
                    temas: temasPorComunidade,
                    demandas_por_tema: temasComDemandas,
                    riscos_por_tema: temasComRiscos
                };
                promptEspecifico = "Analise temas por território, correlações e tendências emergentes.";
                promptsAvancados = `
ANÁLISE AVANÇADA - CORRELAÇÕES TEMÁTICAS:

Com base nos dados de temas, demandas e riscos:

1. CORRELAÇÕES entre temas:
   - Quais temas aparecem frequentemente juntos?
   - Que relações de causa-efeito existem?
   - Ex: "Poeira" correlaciona com "Saúde respiratória"

2. Para cada correlação identificada:
   - Tema 1 e Tema 2
   - Tipo de relação (causal, associativa, temporal)
   - Evidências nos dados
   - Possíveis causas subjacentes
   - Oportunidades de ação integrada

3. OPORTUNIDADES derivadas das correlações:
   - Ações preventivas possíveis
   - Parcerias estratégicas
   - Projetos integrados

4. CAUSAS RAIZ:
   - Identifique temas que podem ser causa de outros problemas
   - Sugira priorização

Retorne em formato estruturado.`;
            } else if (tipoRelatorio === "executivo") {
                const riscosAtivos = riscos.filter(r => r.status === "ativo");
                const compromissosAtrasados = compromissos.filter(c => c.status === "atrasado");
                
                dadosParaIA = {
                    atividades: atividadesFiltradas.length,
                    compromissos: compromissos.length,
                    compromissos_atrasados: compromissosAtrasados.length,
                    liderancas: liderancas.length,
                    organizacoes: organizacoes.length,
                    oportunidades: oportunidades.length,
                    riscos_ativos: riscosAtivos.length,
                    riscos_criticos: riscosAtivos.filter(r => r.nivel === "critico").length,
                    detalhes_riscos: riscosAtivos.map(r => ({
                        titulo: r.titulo,
                        nivel: r.nivel,
                        tipo: r.tipo,
                        comunidade: r.comunidade,
                        previsao_agravamento: r.previsao_agravamento,
                        causas: r.causas
                    })),
                    tendencias_demandas: atividadesFiltradas.reduce((acc, a) => {
                        (a.demandas || []).forEach(d => {
                            acc[d] = (acc[d] || 0) + 1;
                        });
                        return acc;
                    }, {})
                };
                promptEspecifico = "Crie um painel executivo com KPIs, tendências, alertas e recomendações estratégicas.";
                promptsAvancados = `
ANÁLISE AVANÇADA - PREVISÃO DE RISCOS:

Com base no histórico de riscos sociais, compromissos e atividades:

1. PANORAMA GERAL:
   - Avalie o clima social atual
   - Identifique sinais de alerta precoce
   - Determine nível geral de tensão (baixo/moderado/alto/crítico)

2. RISCOS EMERGENTES:
   - Baseado em padrões históricos, que novos riscos podem surgir?
   - Quais comunidades estão mais vulneráveis?
   - Que temas estão se agravando?

3. PREVISÃO DE AGRAVAMENTO:
   - Para cada risco ativo, preveja probabilidade de agravamento
   - Considere: compromissos atrasados, demandas recorrentes, histórico
   - Forneça timeline estimado (curto/médio/longo prazo)

4. AÇÕES PREVENTIVAS URGENTES:
   - Liste as 3-5 ações mais críticas
   - Priorize por urgência e impacto
   - Sugira responsáveis

5. PONTOS POSITIVOS:
   - Destaque oportunidades e aspectos bem gerenciados
   - Identifique práticas que devem ser mantidas/replicadas

Retorne em formato estruturado com panorama, riscos emergentes e ações.`;
            }

            setEtapaAtual(etapas[2]);

            const prompt = `
Você é um analista especializado em relacionamento comunitário territorial.

TIPO DE RELATÓRIO: ${tiposRelatorio.find(t => t.value === tipoRelatorio)?.label}
FORMATO DE SAÍDA: ${formato.toUpperCase()}
${filtrosAvancados.dataInicio ? `PERÍODO: ${new Date(filtrosAvancados.dataInicio).toLocaleDateString('pt-BR')} a ${new Date(filtrosAvancados.dataFim || new Date()).toLocaleDateString('pt-BR')}` : ''}
${filtrosAvancados.comunidade !== "todas" ? `COMUNIDADE: ${filtrosAvancados.comunidade}` : ""}
${filtrosAvancados.temasSelecionados.length > 0 ? `TEMAS: ${filtrosAvancados.temasSelecionados.join(', ')}` : ""}

${promptEspecifico}

${promptsAvancados}

DADOS PARA ANÁLISE:
${JSON.stringify(dadosParaIA, null, 2)}

ESTRUTURA DO RELATÓRIO:

1. CABEÇALHO
   - Título: Escuta Ativa - Inteligência Aplicada ao Território
   - Tipo: ${tiposRelatorio.find(t => t.value === tipoRelatorio)?.label}
   - Data de Geração: ${new Date().toLocaleDateString('pt-BR')}
   - Período Analisado: ${filtroPeriodo} dias

2. RESUMO EXECUTIVO
   - 3-5 insights principais
   - Números-chave (KPIs)

3. ANÁLISE DETALHADA
   - Visualizações sugeridas (gráficos, tabelas)
   - Tendências identificadas
   - Padrões e correlações

4. INSIGHTS E RECOMENDAÇÕES
   - Ações prioritárias
   - Alertas importantes
   - Oportunidades estratégicas

${formato === 'xlsx' ? 
'5. TABELAS ESTRUTURADAS\n   - Organize dados em planilhas separadas' : 
formato === 'docx' ? 
'5. FORMATAÇÃO DOCX\n   - Use títulos, listas e tabelas formatadas' :
'5. FORMATAÇÃO PDF\n   - Layout profissional com seções bem definidas'}

Gere o conteúdo completo do relatório de forma profissional e acionável.
`;

            setEtapaAtual(etapas[3]);

            const schemaBase = {
                type: "object",
                properties: {
                    titulo: { type: "string" },
                    resumo: { type: "string" },
                    kpis: { type: "object" },
                    insights: { type: "array", items: { type: "string" } }
                }
            };

            // Adicionar análises avançadas ao schema se necessário
            if (promptsAvancados) {
                schemaBase.properties.analises_avancadas = { type: "object" };
                
                if (tipoRelatorio === "atores") {
                    schemaBase.properties.analises_avancadas.properties = {
                        conexoes_sugeridas: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    ator1: { type: "string" },
                                    ator2: { type: "string" },
                                    justificativa: { type: "string" },
                                    potencial: { type: "string" }
                                }
                            }
                        }
                    };
                } else if (tipoRelatorio === "tematico") {
                    schemaBase.properties.analises_avancadas.properties = {
                        correlacoes_tematicas: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    tema1: { type: "string" },
                                    tema2: { type: "string" },
                                    relacao: { type: "string" },
                                    oportunidades: { type: "string" }
                                }
                            }
                        }
                    };
                } else if (tipoRelatorio === "executivo") {
                    schemaBase.properties.analises_avancadas.properties = {
                        previsao_riscos: {
                            type: "object",
                            properties: {
                                panorama: { type: "string" },
                                riscos_emergentes: {
                                    type: "array",
                                    items: {
                                        type: "object",
                                        properties: {
                                            titulo: { type: "string" },
                                            previsao: { type: "string" }
                                        }
                                    }
                                }
                            }
                        }
                    };
                }
            }

            const resultado = await base44.integrations.Core.InvokeLLM({
                prompt: prompt,
                response_json_schema: schemaBase
            });

            setEtapaAtual(etapas[4]);

            // Preparar dados estruturados para exportação
            const dadosRelatorio = {
                titulo: tiposRelatorio.find(t => t.value === tipoRelatorio)?.label,
                resumo: resultado.resumo,
                kpis: resultado.kpis || {},
                insights: resultado.insights || [],
                analises_avancadas: resultado.analises_avancadas || null,
                tabela: []
            };

            setEtapaAtual(etapas[5]);

            // Gerar resumo executivo automaticamente
            await gerarResumoExecutivo(resultado, tipoRelatorio, dadosParaIA);

            // Analisar tendências e anomalias
            await analisarTendenciasAnomalias(dadosParaIA, tipoRelatorio);

            // Montar tabela de dados conforme tipo
            if (tipoRelatorio === "atividades") {
                dadosRelatorio.tabela = atividadesFiltradas.map(a => ({
                    data: new Date(a.created_date).toLocaleDateString('pt-BR'),
                    tipo: a.tipo,
                    titulo: a.titulo,
                    comunidade: a.local,
                    temas: a.temas_identificados?.join(', ') || '-',
                    demandas: a.demandas?.length || 0,
                    status: a.status_etapa
                }));
            } else if (tipoRelatorio === "demandas") {
                const todasDemandas = atividadesFiltradas.flatMap(a => 
                    (a.demandas || []).map(d => ({
                        data: new Date(a.created_date).toLocaleDateString('pt-BR'),
                        demanda: d,
                        comunidade: a.local,
                        tipo_registro: a.tipo,
                        status: 'Identificada'
                    }))
                );
                dadosRelatorio.tabela = todasDemandas;
            } else if (tipoRelatorio === "compromissos") {
                const compromissosFiltrados = aplicarFiltros(compromissos, 'compromisso');
                dadosRelatorio.tabela = compromissosFiltrados.map(c => ({
                    titulo: c.titulo,
                    comunidade: c.comunidade,
                    responsavel: c.responsavel,
                    prazo: c.prazo,
                    status: c.status,
                    prioridade: c.prioridade
                }));
            } else if (tipoRelatorio === "atores") {
                dadosRelatorio.tabela = [
                    ...liderancas.map(l => ({
                        tipo: 'Liderança',
                        nome: l.nome,
                        comunidade: l.comunidade,
                        papel: l.papel_na_comunidade,
                        avaliacao: l.avaliacao_interlocucao,
                        contato: l.telefone || l.email || '-'
                    })),
                    ...organizacoes.map(o => ({
                        tipo: 'Organização',
                        nome: o.nome_oficial,
                        comunidade: '-',
                        papel: o.natureza,
                        avaliacao: o.avaliacao_interlocucao || '-',
                        contato: o.email || o.telefone || '-'
                    }))
                ];
            } else if (tipoRelatorio === "oportunidades") {
                const oportunidadesFiltradas = aplicarFiltros(oportunidades, 'oportunidade');
                dadosRelatorio.tabela = oportunidadesFiltradas.map(o => ({
                    titulo: o.titulo,
                    tipo: o.tipo,
                    comunidade: o.comunidade,
                    relevancia: o.relevancia,
                    maturidade: o.maturidade,
                    contato: o.contato_principal || '-'
                }));
            } else if (tipoRelatorio === "riscos") {
                const riscosFiltrados = aplicarFiltros(riscos, 'risco');
                dadosRelatorio.tabela = riscosFiltrados.map(r => ({
                    titulo: r.titulo,
                    nivel: r.nivel,
                    tipo: r.tipo,
                    comunidade: r.comunidade,
                    status: r.status,
                    previsao_agravamento: r.previsao_agravamento || '-'
                }));
            }

            // Filtrar campos personalizados se selecionados
            if (camposPersonalizados.length > 0 && dadosRelatorio.tabela.length > 0) {
                dadosRelatorio.tabela = dadosRelatorio.tabela.map(row => {
                    const filteredRow = {};
                    camposPersonalizados.forEach(campo => {
                        if (row.hasOwnProperty(campo)) {
                            filteredRow[campo] = row[campo];
                        }
                    });
                    return filteredRow;
                });
            }

            // Mostrar preview
            setLoading(false);
            setPreview({ dados: dadosRelatorio, formato });
        } catch (error) {
            setLoading(false);
            setEtapaAtual("");
            alert("Erro ao gerar relatório: " + error.message);
        }
    };

    const exportarRelatorio = async () => {
        if (!preview) return;

        try {
            const { dados, formato } = preview;
            
            // Exportar conforme formato
            let nomeArquivo = '';
            if (formato === 'pdf') {
                nomeArquivo = exportarParaPDF(dados, tipoRelatorio, {
                    periodo: filtrosAvancados.dataInicio ? 
                        `${new Date(filtrosAvancados.dataInicio).toLocaleDateString('pt-BR')} a ${new Date(filtrosAvancados.dataFim || new Date()).toLocaleDateString('pt-BR')}` : 
                        'Período completo',
                    comunidade: filtrosAvancados.comunidade,
                    tipoRegistro: filtrosAvancados.tipoRegistro,
                    tema: filtrosAvancados.temasSelecionados.join(', ') || 'Todos'
                });
            } else if (formato === 'xlsx') {
                nomeArquivo = exportarParaExcel(dados, tipoRelatorio);
            } else if (formato === 'csv') {
                nomeArquivo = exportarParaCSV(dados, tipoRelatorio);
            }

            // Salvar relatório gerado
            await base44.entities.RelatorioGerado.create({
                tipo_relatorio: tipoRelatorio,
                formato: formato.toUpperCase(),
                periodo: filtrosAvancados.dataInicio ? 
                    `${new Date(filtrosAvancados.dataInicio).toLocaleDateString('pt-BR')} a ${new Date(filtrosAvancados.dataFim || new Date()).toLocaleDateString('pt-BR')}` : 
                    'Período completo',
                filtros: { 
                    comunidade: filtrosAvancados.comunidade, 
                    temas: filtrosAvancados.temasSelecionados,
                    tipoRegistro: filtrosAvancados.tipoRegistro 
                },
                descricao: `${tiposRelatorio.find(t => t.value === tipoRelatorio)?.label} - ${new Date().toLocaleDateString('pt-BR')}`
            });

            setPreview(null);
            alert(`✅ Relatório exportado com sucesso!\n\nArquivo: ${nomeArquivo}\nRegistros: ${dados.tabela.length}\n\n📊 O download foi iniciado automaticamente.`);
        } catch (error) {
            alert("Erro ao exportar relatório: " + error.message);
        }
    };

    // Determinar campos disponíveis baseado no tipo de relatório
    React.useEffect(() => {
        if (tipoRelatorio === "atividades") {
            setCamposPersonalizados(['data', 'tipo', 'titulo', 'comunidade', 'temas', 'demandas', 'status']);
        } else if (tipoRelatorio === "compromissos") {
            setCamposPersonalizados(['titulo', 'comunidade', 'responsavel', 'prazo', 'status', 'prioridade']);
        } else if (tipoRelatorio === "atores") {
            setCamposPersonalizados(['tipo', 'nome', 'comunidade', 'papel', 'avaliacao', 'contato']);
        } else {
            setCamposPersonalizados([]);
        }
    }, [tipoRelatorio]);

    const camposDisponiveis = tipoRelatorio === "atividades" ? 
        ['data', 'tipo', 'titulo', 'comunidade', 'temas', 'demandas', 'status'] :
        tipoRelatorio === "compromissos" ?
        ['titulo', 'comunidade', 'responsavel', 'prazo', 'status', 'prioridade'] :
        tipoRelatorio === "atores" ?
        ['tipo', 'nome', 'comunidade', 'papel', 'avaliacao', 'contato'] :
        [];

    return (
        <div className="min-h-screen p-6" style={{ backgroundColor: '#f8f9fa' }}>
            {loading && etapaAtual && (
                <BarraProgresso 
                    etapaAtual={etapaAtual}
                    etapas={[
                        "Coletando dados...",
                        "Aplicando filtros...",
                        "Analisando padrões...",
                        "Gerando insights com IA...",
                        "Preparando visualizações...",
                        "Finalizando relatório..."
                    ]}
                />
            )}

            {preview && (
            <PreviewRelatorio
                dadosRelatorio={preview.dados}
                formato={preview.formato}
                onFechar={() => setPreview(null)}
                onExportar={exportarRelatorio}
            />
            )}

            {relatorioPersonalizado && (
            <Card className="border-2 border-blue-600">
                <CardHeader className="bg-blue-50">
                    <CardTitle className="flex items-center gap-2 text-blue-900">
                        <Brain className="w-6 h-6" />
                        {relatorioPersonalizado.titulo_personalizado}
                    </CardTitle>
                    <p className="text-sm text-blue-700 mt-2">
                        {relatorioPersonalizado.contexto_filtros}
                    </p>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border-l-4 border-blue-600">
                        <h3 className="font-bold text-lg mb-2 text-blue-900">📊 Resumo Executivo</h3>
                        <p className="text-gray-700 leading-relaxed">
                            {relatorioPersonalizado.resumo_executivo}
                        </p>
                    </div>

                    {relatorioPersonalizado.metricas_principais && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-xs text-gray-500 mb-1">Total de Registros</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {relatorioPersonalizado.metricas_principais.total_registros}
                                </p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-xs text-gray-500 mb-1">Média do Período</p>
                                <p className="text-lg font-semibold text-gray-900">
                                    {relatorioPersonalizado.metricas_principais.media_periodo}
                                </p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-xs text-gray-500 mb-1">Tendência</p>
                                <p className="text-lg font-semibold text-gray-900">
                                    {relatorioPersonalizado.metricas_principais.tendencia}
                                </p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-xs text-gray-500 mb-1">vs. Anterior</p>
                                <p className="text-lg font-semibold text-gray-900">
                                    {relatorioPersonalizado.metricas_principais.comparacao_anterior}
                                </p>
                            </div>
                        </div>
                    )}

                    {relatorioPersonalizado.analise_detalhada?.map((secao, idx) => (
                        <div key={idx} className="bg-white border rounded-lg p-4">
                            <h4 className="font-bold text-lg mb-3 text-gray-900">{secao.secao}</h4>
                            <p className="text-gray-700 mb-3 leading-relaxed">{secao.conteudo}</p>
                            {secao.dados_suporte && secao.dados_suporte.length > 0 && (
                                <ul className="space-y-1 text-sm text-gray-600">
                                    {secao.dados_suporte.map((dado, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                            <span className="text-blue-600">•</span>
                                            {dado}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ))}

                    {relatorioPersonalizado.padroes_identificados?.length > 0 && (
                        <div className="bg-amber-50 p-4 rounded-lg border-l-4 border-amber-600">
                            <h4 className="font-bold mb-3 text-amber-900">🔍 Padrões Identificados</h4>
                            <ul className="space-y-2">
                                {relatorioPersonalizado.padroes_identificados.map((padrao, idx) => (
                                    <li key={idx} className="text-sm text-gray-700">• {padrao}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {relatorioPersonalizado.recomendacoes_especificas?.length > 0 && (
                        <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-600">
                            <h4 className="font-bold mb-3 text-green-900">💡 Recomendações Específicas</h4>
                            <div className="space-y-3">
                                {relatorioPersonalizado.recomendacoes_especificas.map((rec, idx) => (
                                    <div key={idx} className="bg-white p-3 rounded">
                                        <p className="font-semibold text-sm text-gray-900 mb-1">
                                            {rec.recomendacao}
                                        </p>
                                        <p className="text-xs text-gray-600">
                                            Aplicabilidade: {rec.aplicabilidade}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <Button
                        onClick={() => setRelatorioPersonalizado(null)}
                        variant="outline"
                        className="w-full"
                    >
                        Fechar
                    </Button>
                </CardContent>
            </Card>
            )}

            {resumoExecutivo && (
            <Card className="border-2 border-purple-600">
                <CardHeader className="bg-purple-50">
                    <CardTitle className="flex items-center gap-2 text-purple-900">
                        <FileText className="w-6 h-6" />
                        Resumo Executivo Automático
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg">
                        <h3 className="font-bold mb-2 text-purple-900">📝 Síntese</h3>
                        <p className="text-gray-700 leading-relaxed">{resumoExecutivo.sintese}</p>
                    </div>

                    {resumoExecutivo.numeros_chave?.length > 0 && (
                        <div>
                            <h3 className="font-bold mb-3 text-gray-900">📊 Números-Chave</h3>
                            <div className="grid md:grid-cols-2 gap-3">
                                {resumoExecutivo.numeros_chave.map((num, idx) => (
                                    <div key={idx} className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-lg border border-blue-200">
                                        <p className="text-sm font-semibold text-blue-900">{num.metrica}</p>
                                        <p className="text-2xl font-bold text-blue-600 my-1">{num.valor}</p>
                                        <p className="text-xs text-gray-600">{num.interpretacao}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {resumoExecutivo.principais_descobertas?.length > 0 && (
                        <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-600">
                            <h3 className="font-bold mb-3 text-blue-900">🔎 Principais Descobertas</h3>
                            <ul className="space-y-2">
                                {resumoExecutivo.principais_descobertas.map((desc, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                                        <span className="text-blue-600 font-bold">•</span>
                                        {desc}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {resumoExecutivo.alertas_criticos?.length > 0 && (
                        <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-600">
                            <h3 className="font-bold mb-3 text-red-900">🚨 Alertas Críticos</h3>
                            <div className="space-y-3">
                                {resumoExecutivo.alertas_criticos.map((alerta, idx) => (
                                    <div key={idx} className="bg-white p-3 rounded border-l-2 border-red-400">
                                        <p className="font-semibold text-sm text-red-900 mb-1">{alerta.alerta}</p>
                                        <p className="text-xs text-gray-600 mb-1">
                                            Severidade: <span className="font-semibold">{alerta.severidade}</span>
                                        </p>
                                        <p className="text-xs text-red-700">
                                            ➜ {alerta.acao_imediata}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {resumoExecutivo.recomendacoes_prioritarias?.length > 0 && (
                        <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-600">
                            <h3 className="font-bold mb-3 text-green-900">✅ Recomendações Prioritárias</h3>
                            <div className="space-y-3">
                                {resumoExecutivo.recomendacoes_prioritarias.map((rec, idx) => (
                                    <div key={idx} className="bg-white p-3 rounded">
                                        <p className="font-semibold text-sm text-gray-900 mb-1">
                                            {idx + 1}. {rec.acao}
                                        </p>
                                        <div className="flex items-center gap-4 text-xs text-gray-600">
                                            <span>⏰ Prazo: {rec.prazo}</span>
                                            <span>📈 Impacto: {rec.impacto}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {resumoExecutivo.oportunidades_estrategicas?.length > 0 && (
                        <div className="bg-amber-50 p-4 rounded-lg border-l-4 border-amber-600">
                            <h3 className="font-bold mb-3 text-amber-900">💡 Oportunidades Estratégicas</h3>
                            <ul className="space-y-2">
                                {resumoExecutivo.oportunidades_estrategicas.map((opo, idx) => (
                                    <li key={idx} className="text-sm text-gray-700">• {opo}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </CardContent>
            </Card>
            )}

            {tendenciasAnomalias && (
            <Card className="border-2 border-indigo-600">
                <CardHeader className="bg-indigo-50">
                    <CardTitle className="flex items-center gap-2 text-indigo-900">
                        <TrendingUp className="w-6 h-6" />
                        Análise de Tendências e Anomalias
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                    {tendenciasAnomalias.tendencias_temporais?.length > 0 && (
                        <div>
                            <h3 className="font-bold mb-3 text-gray-900">📈 Tendências Temporais</h3>
                            <div className="space-y-3">
                                {tendenciasAnomalias.tendencias_temporais.map((tend, idx) => (
                                    <div key={idx} className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="font-semibold text-gray-900">{tend.tendencia}</p>
                                            <Badge className="bg-indigo-600">{tend.direcao}</Badge>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-1">
                                            Intensidade: <span className="font-semibold">{tend.intensidade}</span>
                                        </p>
                                        <p className="text-sm text-gray-600 mb-2">
                                            Período: {tend.periodo_observado}
                                        </p>
                                        <p className="text-sm text-gray-700">{tend.interpretacao}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {tendenciasAnomalias.anomalias_detectadas?.length > 0 && (
                        <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-600">
                            <h3 className="font-bold mb-3 text-orange-900">⚠️ Anomalias Detectadas</h3>
                            <div className="space-y-3">
                                {tendenciasAnomalias.anomalias_detectadas.map((anom, idx) => (
                                    <div key={idx} className={cn(
                                        "bg-white p-3 rounded border-l-2",
                                        anom.requer_atencao ? "border-red-500" : "border-gray-300"
                                    )}>
                                        <p className="font-semibold text-sm text-gray-900 mb-1">
                                            {anom.anomalia}
                                            {anom.requer_atencao && <span className="ml-2 text-red-600">⚠️</span>}
                                        </p>
                                        <p className="text-xs text-gray-600">
                                            Data: {anom.data_ocorrencia} | Desvio: {anom.desvio}
                                        </p>
                                        <p className="text-xs text-gray-700 mt-1">
                                            Causa provável: {anom.causa_provavel}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {tendenciasAnomalias.previsoes && (
                        <div className="bg-gradient-to-r from-cyan-50 to-teal-50 p-4 rounded-lg border-l-4 border-cyan-600">
                            <h3 className="font-bold mb-3 text-cyan-900">🔮 Previsões</h3>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm font-semibold text-gray-900 mb-1">Próximos 3 meses:</p>
                                    <p className="text-sm text-gray-700">{tendenciasAnomalias.previsoes.proximos_3_meses}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-900 mb-1">Próximos 6 meses:</p>
                                    <p className="text-sm text-gray-700">{tendenciasAnomalias.previsoes.proximos_6_meses}</p>
                                </div>
                                <div className="grid md:grid-cols-3 gap-2 mt-3">
                                    <div className="bg-green-100 p-2 rounded">
                                        <p className="text-xs font-semibold text-green-900 mb-1">Otimista</p>
                                        <p className="text-xs text-gray-700">{tendenciasAnomalias.previsoes.cenario_otimista}</p>
                                    </div>
                                    <div className="bg-blue-100 p-2 rounded">
                                        <p className="text-xs font-semibold text-blue-900 mb-1">Realista</p>
                                        <p className="text-xs text-gray-700">{tendenciasAnomalias.previsoes.cenario_realista}</p>
                                    </div>
                                    <div className="bg-red-100 p-2 rounded">
                                        <p className="text-xs font-semibold text-red-900 mb-1">Pessimista</p>
                                        <p className="text-xs text-gray-700">{tendenciasAnomalias.previsoes.cenario_pessimista}</p>
                                    </div>
                                </div>
                                {tendenciasAnomalias.previsoes.indicadores_alerta?.length > 0 && (
                                    <div className="mt-3">
                                        <p className="text-sm font-semibold text-red-900 mb-2">🚨 Indicadores de Alerta:</p>
                                        <ul className="space-y-1">
                                            {tendenciasAnomalias.previsoes.indicadores_alerta.map((ind, i) => (
                                                <li key={i} className="text-xs text-red-700">• {ind}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {tendenciasAnomalias.insights_proativos?.length > 0 && (
                        <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-600">
                            <h3 className="font-bold mb-3 text-purple-900">🎯 Insights Proativos</h3>
                            <div className="space-y-3">
                                {tendenciasAnomalias.insights_proativos.map((insight, idx) => (
                                    <div key={idx} className="bg-white p-3 rounded">
                                        <p className="text-sm font-semibold text-gray-900 mb-1">{insight.insight}</p>
                                        <p className="text-xs text-purple-700 mb-1">
                                            ➜ Ação: {insight.acao_sugerida}
                                        </p>
                                        <p className="text-xs text-gray-600">⏰ {insight.prazo}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
            )}

            <div className="max-w-5xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        onClick={() => navigate(createPageUrl("Dashboard"))}
                        style={{ borderColor: '#0B1E33', color: '#0B1E33' }}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Voltar
                    </Button>
                    <h1 className="text-3xl font-bold" style={{ color: '#0B1E33' }}>
                        Relatórios
                    </h1>
                </div>

                <Tabs defaultValue="padrao" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="padrao">Relatórios Padrão</TabsTrigger>
                        <TabsTrigger value="narrativo">Relatório Narrativo Estratégico</TabsTrigger>
                    </TabsList>

                    <TabsContent value="padrao" className="mt-6">
                        <div className="space-y-6">
                
                <FiltrosAvancados
                    filtros={filtrosAvancados}
                    onFiltrosChange={setFiltrosAvancados}
                    comunidades={comunidades}
                    temas={temas}
                    tiposRegistro={tiposRegistro}
                />

                <Card>
                    <CardHeader>
                        <CardTitle style={{ color: '#0B1E33' }}>
                            Gerar Relatório
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <Label className="block text-sm font-medium mb-2" style={{ color: '#0B1E33' }}>
                                Tipo de Relatório
                            </Label>
                            <Select value={tipoRelatorio} onValueChange={setTipoRelatorio}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione o tipo de relatório" />
                                </SelectTrigger>
                                <SelectContent>
                                    {tiposRelatorio.map(tipo => (
                                        <SelectItem key={tipo.value} value={tipo.value}>
                                            {tipo.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                                </Select>
                                </div>

                                <div>
                            <Label className="block text-sm font-medium mb-2" style={{ color: '#0B1E33' }}>
                                Formato
                            </Label>
                            <Select value={formato} onValueChange={setFormato}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione o formato" />
                                </SelectTrigger>
                                <SelectContent>
                                    {formatos.map(fmt => (
                                        <SelectItem key={fmt.value} value={fmt.value}>
                                            {fmt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {camposDisponiveis.length > 0 && (
                            <PersonalizacaoCampos
                                camposDisponiveis={camposDisponiveis}
                                camposSelecionados={camposPersonalizados}
                                onCamposChange={setCamposPersonalizados}
                            />
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            {resumoExecutivo && (
                                    <Card className="border-2 border-purple-600">
                                        <CardHeader className="bg-purple-50">
                                            <CardTitle className="flex items-center gap-2 text-purple-900">
                                                <FileText className="w-6 h-6" />
                                                Resumo Executivo Automático
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-6 pt-6">
                                            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg">
                                                <h3 className="font-bold mb-2 text-purple-900">📝 Síntese</h3>
                                                <p className="text-gray-700 leading-relaxed">{resumoExecutivo.sintese}</p>
                                            </div>

                                            {resumoExecutivo.numeros_chave?.length > 0 && (
                                                <div>
                                                    <h3 className="font-bold mb-3 text-gray-900">📊 Números-Chave</h3>
                                                    <div className="grid md:grid-cols-2 gap-3">
                                                        {resumoExecutivo.numeros_chave.map((num, idx) => (
                                                            <div key={idx} className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-lg border border-blue-200">
                                                                <p className="text-sm font-semibold text-blue-900">{num.metrica}</p>
                                                                <p className="text-2xl font-bold text-blue-600 my-1">{num.valor}</p>
                                                                <p className="text-xs text-gray-600">{num.interpretacao}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {resumoExecutivo.principais_descobertas?.length > 0 && (
                                                <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-600">
                                                    <h3 className="font-bold mb-3 text-blue-900">🔎 Principais Descobertas</h3>
                                                    <ul className="space-y-2">
                                                        {resumoExecutivo.principais_descobertas.map((desc, idx) => (
                                                            <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                                                                <span className="text-blue-600 font-bold">•</span>
                                                                {desc}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {resumoExecutivo.alertas_criticos?.length > 0 && (
                                                <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-600">
                                                    <h3 className="font-bold mb-3 text-red-900">🚨 Alertas Críticos</h3>
                                                    <div className="space-y-3">
                                                        {resumoExecutivo.alertas_criticos.map((alerta, idx) => (
                                                            <div key={idx} className="bg-white p-3 rounded border-l-2 border-red-400">
                                                                <p className="font-semibold text-sm text-red-900 mb-1">{alerta.alerta}</p>
                                                                <p className="text-xs text-gray-600 mb-1">
                                                                    Severidade: <span className="font-semibold">{alerta.severidade}</span>
                                                                </p>
                                                                <p className="text-xs text-red-700">
                                                                    ➜ {alerta.acao_imediata}
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {resumoExecutivo.recomendacoes_prioritarias?.length > 0 && (
                                                <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-600">
                                                    <h3 className="font-bold mb-3 text-green-900">✅ Recomendações Prioritárias</h3>
                                                    <div className="space-y-3">
                                                        {resumoExecutivo.recomendacoes_prioritarias.map((rec, idx) => (
                                                            <div key={idx} className="bg-white p-3 rounded">
                                                                <p className="font-semibold text-sm text-gray-900 mb-1">
                                                                    {idx + 1}. {rec.acao}
                                                                </p>
                                                                <div className="flex items-center gap-4 text-xs text-gray-600">
                                                                    <span>⏰ Prazo: {rec.prazo}</span>
                                                                    <span>📈 Impacto: {rec.impacto}</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {resumoExecutivo.oportunidades_estrategicas?.length > 0 && (
                                                <div className="bg-amber-50 p-4 rounded-lg border-l-4 border-amber-600">
                                                    <h3 className="font-bold mb-3 text-amber-900">💡 Oportunidades Estratégicas</h3>
                                                    <ul className="space-y-2">
                                                        {resumoExecutivo.oportunidades_estrategicas.map((opo, idx) => (
                                                            <li key={idx} className="text-sm text-gray-700">• {opo}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            <Button
                                                onClick={() => setResumoExecutivo(null)}
                                                variant="outline"
                                                className="w-full mt-4"
                                            >
                                                Fechar Resumo
                                            </Button>
                                        </CardContent>
                                    </Card>
                                )}

                                {tendenciasAnomalias && (
                                    <Card className="border-2 border-indigo-600">
                                        <CardHeader className="bg-indigo-50">
                                            <CardTitle className="flex items-center gap-2 text-indigo-900">
                                                <TrendingUp className="w-6 h-6" />
                                                Análise de Tendências e Anomalias
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-6 pt-6">
                                            {tendenciasAnomalias.tendencias_temporais?.length > 0 && (
                                                <div>
                                                    <h3 className="font-bold mb-3 text-gray-900">📈 Tendências Temporais</h3>
                                                    <div className="space-y-3">
                                                        {tendenciasAnomalias.tendencias_temporais.map((tend, idx) => (
                                                            <div key={idx} className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-lg">
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <p className="font-semibold text-gray-900">{tend.tendencia}</p>
                                                                    <Badge className="bg-indigo-600">{tend.direcao}</Badge>
                                                                </div>
                                                                <p className="text-sm text-gray-600 mb-1">
                                                                    Intensidade: <span className="font-semibold">{tend.intensidade}</span>
                                                                </p>
                                                                <p className="text-sm text-gray-600 mb-2">
                                                                    Período: {tend.periodo_observado}
                                                                </p>
                                                                <p className="text-sm text-gray-700">{tend.interpretacao}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {tendenciasAnomalias.anomalias_detectadas?.length > 0 && (
                                                <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-600">
                                                    <h3 className="font-bold mb-3 text-orange-900">⚠️ Anomalias Detectadas</h3>
                                                    <div className="space-y-3">
                                                        {tendenciasAnomalias.anomalias_detectadas.map((anom, idx) => (
                                                            <div key={idx} className={cn(
                                                                "bg-white p-3 rounded border-l-2",
                                                                anom.requer_atencao ? "border-red-500" : "border-gray-300"
                                                            )}>
                                                                <p className="font-semibold text-sm text-gray-900 mb-1">
                                                                    {anom.anomalia}
                                                                    {anom.requer_atencao && <span className="ml-2 text-red-600">⚠️</span>}
                                                                </p>
                                                                <p className="text-xs text-gray-600">
                                                                    Data: {anom.data_ocorrencia} | Desvio: {anom.desvio}
                                                                </p>
                                                                <p className="text-xs text-gray-700 mt-1">
                                                                    Causa provável: {anom.causa_provavel}
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {tendenciasAnomalias.correlacoes?.length > 0 && (
                                                <div className="bg-teal-50 p-4 rounded-lg border-l-4 border-teal-600">
                                                    <h3 className="font-bold mb-3 text-teal-900">🔗 Correlações Identificadas</h3>
                                                    <div className="space-y-2">
                                                        {tendenciasAnomalias.correlacoes.map((corr, idx) => (
                                                            <div key={idx} className="bg-white p-3 rounded text-sm">
                                                                <p className="text-gray-900">
                                                                    <span className="font-semibold">{corr.variavel_1}</span> ↔ <span className="font-semibold">{corr.variavel_2}</span>
                                                                </p>
                                                                <p className="text-xs text-gray-600 mt-1">
                                                                    Tipo: {corr.tipo_correlacao} | Força: {corr.forca}
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {tendenciasAnomalias.previsoes && (
                                                <div className="bg-gradient-to-r from-cyan-50 to-teal-50 p-4 rounded-lg border-l-4 border-cyan-600">
                                                    <h3 className="font-bold mb-3 text-cyan-900">🔮 Previsões</h3>
                                                    <div className="space-y-3">
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-900 mb-1">Próximos 3 meses:</p>
                                                            <p className="text-sm text-gray-700">{tendenciasAnomalias.previsoes.proximos_3_meses}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-900 mb-1">Próximos 6 meses:</p>
                                                            <p className="text-sm text-gray-700">{tendenciasAnomalias.previsoes.proximos_6_meses}</p>
                                                        </div>
                                                        <div className="grid md:grid-cols-3 gap-2 mt-3">
                                                            <div className="bg-green-100 p-2 rounded">
                                                                <p className="text-xs font-semibold text-green-900 mb-1">Otimista</p>
                                                                <p className="text-xs text-gray-700">{tendenciasAnomalias.previsoes.cenario_otimista}</p>
                                                            </div>
                                                            <div className="bg-blue-100 p-2 rounded">
                                                                <p className="text-xs font-semibold text-blue-900 mb-1">Realista</p>
                                                                <p className="text-xs text-gray-700">{tendenciasAnomalias.previsoes.cenario_realista}</p>
                                                            </div>
                                                            <div className="bg-red-100 p-2 rounded">
                                                                <p className="text-xs font-semibold text-red-900 mb-1">Pessimista</p>
                                                                <p className="text-xs text-gray-700">{tendenciasAnomalias.previsoes.cenario_pessimista}</p>
                                                            </div>
                                                        </div>
                                                        {tendenciasAnomalias.previsoes.indicadores_alerta?.length > 0 && (
                                                            <div className="mt-3">
                                                                <p className="text-sm font-semibold text-red-900 mb-2">🚨 Indicadores de Alerta:</p>
                                                                <ul className="space-y-1">
                                                                    {tendenciasAnomalias.previsoes.indicadores_alerta.map((ind, i) => (
                                                                        <li key={i} className="text-xs text-red-700">• {ind}</li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {tendenciasAnomalias.insights_proativos?.length > 0 && (
                                                <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-600">
                                                    <h3 className="font-bold mb-3 text-purple-900">🎯 Insights Proativos</h3>
                                                    <div className="space-y-3">
                                                        {tendenciasAnomalias.insights_proativos.map((insight, idx) => (
                                                            <div key={idx} className="bg-white p-3 rounded">
                                                                <p className="text-sm font-semibold text-gray-900 mb-1">{insight.insight}</p>
                                                                <p className="text-xs text-purple-700 mb-1">
                                                                    ➜ Ação: {insight.acao_sugerida}
                                                                </p>
                                                                <p className="text-xs text-gray-600">⏰ {insight.prazo}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <Button
                                                onClick={() => setTendenciasAnomalias(null)}
                                                variant="outline"
                                                className="w-full"
                                            >
                                                Fechar Análise
                                            </Button>
                                        </CardContent>
                                    </Card>
                                )}

                                {relatorioPersonalizado && (
                                    <Card className="border-2 border-blue-600">
                                        <CardHeader className="bg-blue-50">
                                            <CardTitle className="flex items-center gap-2 text-blue-900">
                                                <Brain className="w-6 h-6" />
                                                {relatorioPersonalizado.titulo_personalizado}
                                            </CardTitle>
                                            <p className="text-sm text-blue-700 mt-2">
                                                {relatorioPersonalizado.contexto_filtros}
                                            </p>
                                        </CardHeader>
                                        <CardContent className="space-y-6 pt-6">
                                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border-l-4 border-blue-600">
                                                <h3 className="font-bold text-lg mb-2 text-blue-900">📊 Resumo Executivo</h3>
                                                <p className="text-gray-700 leading-relaxed">
                                                    {relatorioPersonalizado.resumo_executivo}
                                                </p>
                                            </div>

                                            {relatorioPersonalizado.metricas_principais && (
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    <div className="bg-gray-50 p-4 rounded-lg">
                                                        <p className="text-xs text-gray-500 mb-1">Total de Registros</p>
                                                        <p className="text-2xl font-bold text-gray-900">
                                                            {relatorioPersonalizado.metricas_principais.total_registros}
                                                        </p>
                                                    </div>
                                                    <div className="bg-gray-50 p-4 rounded-lg">
                                                        <p className="text-xs text-gray-500 mb-1">Média do Período</p>
                                                        <p className="text-lg font-semibold text-gray-900">
                                                            {relatorioPersonalizado.metricas_principais.media_periodo}
                                                        </p>
                                                    </div>
                                                    <div className="bg-gray-50 p-4 rounded-lg">
                                                        <p className="text-xs text-gray-500 mb-1">Tendência</p>
                                                        <p className="text-lg font-semibold text-gray-900">
                                                            {relatorioPersonalizado.metricas_principais.tendencia}
                                                        </p>
                                                    </div>
                                                    <div className="bg-gray-50 p-4 rounded-lg">
                                                        <p className="text-xs text-gray-500 mb-1">vs. Anterior</p>
                                                        <p className="text-lg font-semibold text-gray-900">
                                                            {relatorioPersonalizado.metricas_principais.comparacao_anterior}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {relatorioPersonalizado.analise_detalhada?.map((secao, idx) => (
                                                <div key={idx} className="bg-white border rounded-lg p-4">
                                                    <h4 className="font-bold text-lg mb-3 text-gray-900">{secao.secao}</h4>
                                                    <p className="text-gray-700 mb-3 leading-relaxed">{secao.conteudo}</p>
                                                    {secao.dados_suporte && secao.dados_suporte.length > 0 && (
                                                        <ul className="space-y-1 text-sm text-gray-600">
                                                            {secao.dados_suporte.map((dado, i) => (
                                                                <li key={i} className="flex items-start gap-2">
                                                                    <span className="text-blue-600">•</span>
                                                                    {dado}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </div>
                                            ))}

                                            {relatorioPersonalizado.padroes_identificados?.length > 0 && (
                                                <div className="bg-amber-50 p-4 rounded-lg border-l-4 border-amber-600">
                                                    <h4 className="font-bold mb-3 text-amber-900">🔍 Padrões Identificados</h4>
                                                    <ul className="space-y-2">
                                                        {relatorioPersonalizado.padroes_identificados.map((padrao, idx) => (
                                                            <li key={idx} className="text-sm text-gray-700">• {padrao}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {relatorioPersonalizado.recomendacoes_especificas?.length > 0 && (
                                                <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-600">
                                                    <h4 className="font-bold mb-3 text-green-900">💡 Recomendações Específicas</h4>
                                                    <div className="space-y-3">
                                                        {relatorioPersonalizado.recomendacoes_especificas.map((rec, idx) => (
                                                            <div key={idx} className="bg-white p-3 rounded">
                                                                <p className="font-semibold text-sm text-gray-900 mb-1">
                                                                    {rec.recomendacao}
                                                                </p>
                                                                <p className="text-xs text-gray-600">
                                                                    Aplicabilidade: {rec.aplicabilidade}
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {relatorioPersonalizado.proximos_passos?.length > 0 && (
                                                <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-600">
                                                    <h4 className="font-bold mb-3 text-blue-900">🎯 Próximos Passos</h4>
                                                    <ol className="space-y-2">
                                                        {relatorioPersonalizado.proximos_passos.map((passo, idx) => (
                                                            <li key={idx} className="text-sm text-gray-700">
                                                                {idx + 1}. {passo}
                                                            </li>
                                                        ))}
                                                    </ol>
                                                </div>
                                            )}

                                            <Button
                                                onClick={() => setRelatorioPersonalizado(null)}
                                                variant="outline"
                                                className="w-full"
                                            >
                                                Fechar Relatório
                                            </Button>
                                        </CardContent>
                                    </Card>
                                )}

                            <Button
                                                onClick={gerarRelatorio}
                                disabled={loading || !tipoRelatorio || !formato}
                                size="lg"
                                className="text-white font-semibold"
                                style={{ backgroundColor: '#F2B632' }}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        Gerando...
                                    </>
                                ) : (
                                    <>
                                        <Brain className="w-5 h-5 mr-2" />
                                        Gerar Completo
                                    </>
                                )}
                            </Button>
                            <Button
                                onClick={gerarRelatorioPersonalizado}
                                disabled={loading || !tipoRelatorio}
                                size="lg"
                                variant="outline"
                                className="border-2"
                                style={{ borderColor: '#F2B632', color: '#F2B632' }}
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                ) : (
                                    <Brain className="w-5 h-5 mr-2" />
                                )}
                                Personalizado
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle style={{ color: '#0B1E33' }}>
                            Tipos de Relatórios Disponíveis
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-3">
                            <div className="p-3 border rounded-lg">
                                <h3 className="font-bold mb-1 text-sm" style={{ color: '#0B1E33' }}>📊 Atividades</h3>
                                <p className="text-xs text-gray-600">Análise completa de atividades com tendências</p>
                            </div>
                            <div className="p-3 border rounded-lg">
                                <h3 className="font-bold mb-1 text-sm" style={{ color: '#0B1E33' }}>📋 Demandas</h3>
                                <p className="text-xs text-gray-600">Demandas identificadas, padrões e prioridades</p>
                            </div>
                            <div className="p-3 border rounded-lg">
                                <h3 className="font-bold mb-1 text-sm" style={{ color: '#0B1E33' }}>✅ Compromissos</h3>
                                <p className="text-xs text-gray-600">Análise de cumprimento e gargalos</p>
                            </div>
                            <div className="p-3 border rounded-lg">
                                <h3 className="font-bold mb-1 text-sm" style={{ color: '#0B1E33' }}>👥 Atores</h3>
                                <p className="text-xs text-gray-600">Lideranças e organizações territoriais</p>
                            </div>
                            <div className="p-3 border rounded-lg">
                                <h3 className="font-bold mb-1 text-sm" style={{ color: '#0B1E33' }}>💡 Oportunidades</h3>
                                <p className="text-xs text-gray-600">Potenciais de desenvolvimento local</p>
                            </div>
                            <div className="p-3 border rounded-lg">
                                <h3 className="font-bold mb-1 text-sm" style={{ color: '#0B1E33' }}>⚠️ Riscos Sociais</h3>
                                <p className="text-xs text-gray-600">Análise de riscos e ações preventivas</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card style={{ backgroundColor: '#DBEAFE' }}>
                    <CardContent className="pt-6">
                        <div className="flex gap-3">
                            <FileText className="w-6 h-6 text-blue-600 flex-shrink-0" />
                            <div>
                                <h3 className="font-bold text-blue-900 mb-2">Formatos de Exportação</h3>
                                <ul className="text-sm text-blue-800 space-y-1">
                                    <li><strong>PDF:</strong> Documento profissional com gráficos e formatação completa</li>
                                    <li><strong>XLSX:</strong> Planilha Excel com múltiplas abas e dados estruturados</li>
                                    <li><strong>CSV:</strong> Dados tabulares simples para importação em outros sistemas</li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="narrativo" className="mt-6">
                        <RelatorioNarrativoEstrategico />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}