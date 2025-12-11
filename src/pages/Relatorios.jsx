import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FileText, Download, Loader2, Brain } from "lucide-react";

export default function Relatorios() {
    const navigate = useNavigate();
    const [tipoRelatorio, setTipoRelatorio] = useState("");
    const [formato, setFormato] = useState("");
    const [filtroPeriodo, setFiltroPeriodo] = useState("30");
    const [filtroComunidade, setFiltroComunidade] = useState("todas");
    const [filtroTema, setFiltroTema] = useState("todos");
    const [filtroAtor, setFiltroAtor] = useState("todos");
    const [loading, setLoading] = useState(false);

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
        { value: "pdf", label: "PDF - Documento" },
        { value: "docx", label: "DOCX - Ata para Devolutiva" },
        { value: "xlsx", label: "XLSX - Planilha Excel" }
    ];

    const aplicarFiltros = (dados, tipo) => {
        const diasFiltro = parseInt(filtroPeriodo);
        const dataLimite = new Date();
        dataLimite.setDate(dataLimite.getDate() - diasFiltro);

        return dados.filter(item => {
            const dataItem = new Date(item.created_date || item.data);
            const matchPeriodo = dataItem >= dataLimite;
            const matchComunidade = filtroComunidade === "todas" || item.comunidade === filtroComunidade;
            const matchTema = filtroTema === "todos" || 
                (item.temas_identificados && item.temas_identificados.includes(filtroTema));
            return matchPeriodo && matchComunidade && matchTema;
        });
    };

    const gerarRelatorio = async () => {
        if (!tipoRelatorio || !formato) {
            alert("Por favor, selecione o tipo de relatório e formato");
            return;
        }

        setLoading(true);

        try {
            let dadosParaIA = {};
            let promptEspecifico = "";

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
                            avaliacao: l.avaliacao_interlocucao
                        }))
                    },
                    organizacoes: {
                        total: organizacoes.length,
                        lista: organizacoes.slice(0, 30).map(o => ({
                            nome: o.nome_oficial,
                            natureza: o.natureza,
                            area: o.area_de_atuacao
                        }))
                    }
                };
                promptEspecifico = "Mapeie os principais atores territoriais, suas relações e influência.";
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
                atividadesFiltradas.forEach(a => {
                    if (a.temas_identificados) {
                        a.temas_identificados.forEach(tema => {
                            if (!temasPorComunidade[tema]) temasPorComunidade[tema] = {};
                            temasPorComunidade[tema][a.local] = (temasPorComunidade[tema][a.local] || 0) + 1;
                        });
                    }
                });
                dadosParaIA = { temas: temasPorComunidade };
                promptEspecifico = "Analise temas por território, correlações e tendências emergentes.";
            } else if (tipoRelatorio === "executivo") {
                dadosParaIA = {
                    atividades: atividadesFiltradas.length,
                    compromissos: compromissos.length,
                    liderancas: liderancas.length,
                    organizacoes: organizacoes.length,
                    oportunidades: oportunidades.length,
                    riscos_ativos: riscos.filter(r => r.status === "ativo").length
                };
                promptEspecifico = "Crie um painel executivo com KPIs, tendências, alertas e recomendações estratégicas.";
            }

            const prompt = `
Você é um analista especializado em relacionamento comunitário territorial.

TIPO DE RELATÓRIO: ${tiposRelatorio.find(t => t.value === tipoRelatorio)?.label}
FORMATO DE SAÍDA: ${formato.toUpperCase()}
PERÍODO: Últimos ${filtroPeriodo} dias
${filtroComunidade !== "todas" ? `COMUNIDADE: ${filtroComunidade}` : ""}

${promptEspecifico}

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

            const resultado = await base44.integrations.Core.InvokeLLM({
                prompt: prompt
            });

            // Salvar relatório gerado
            await base44.entities.RelatorioGerado.create({
                tipo_relatorio: tipoRelatorio,
                formato: formato.toUpperCase(),
                periodo: `${filtroPeriodo} dias`,
                filtros: { comunidade: filtroComunidade, tema: filtroTema },
                descricao: `${tiposRelatorio.find(t => t.value === tipoRelatorio)?.label} - ${new Date().toLocaleDateString('pt-BR')}`
            });

            setLoading(false);
            alert(`✅ Relatório gerado com sucesso pela IA!\n\nTipo: ${tiposRelatorio.find(t => t.value === tipoRelatorio)?.label}\nFormato: ${formato.toUpperCase()}\nPeíodo: ${filtroPeriodo} dias\n\n📊 O relatório foi processado com insights automáticos da IA.\n\n(Em produção, o arquivo seria baixado automaticamente)`);
        } catch (error) {
            setLoading(false);
            alert("Erro ao gerar relatório: " + error.message);
        }
    };

    return (
        <div className="min-h-screen p-6" style={{ backgroundColor: '#f8f9fa' }}>
            <div className="max-w-4xl mx-auto space-y-6">
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label className="block text-sm font-medium mb-2">Período</Label>
                                <Select value={filtroPeriodo} onValueChange={setFiltroPeriodo}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="7">Últimos 7 dias</SelectItem>
                                        <SelectItem value="30">Últimos 30 dias</SelectItem>
                                        <SelectItem value="90">Últimos 90 dias</SelectItem>
                                        <SelectItem value="180">Últimos 6 meses</SelectItem>
                                        <SelectItem value="365">Último ano</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="block text-sm font-medium mb-2">Comunidade</Label>
                                <Select value={filtroComunidade} onValueChange={setFiltroComunidade}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="todas">Todas</SelectItem>
                                        {comunidades.map(c => (
                                            <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
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

                        <Button
                            onClick={gerarRelatorio}
                            disabled={loading || !tipoRelatorio || !formato}
                            size="lg"
                            className="w-full text-white font-semibold"
                            style={{ backgroundColor: '#F2B632' }}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    IA Gerando Relatório...
                                </>
                            ) : (
                                <>
                                    <Brain className="w-5 h-5 mr-2" />
                                    Gerar com IA
                                </>
                            )}
                        </Button>
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
                                    <li><strong>PDF:</strong> Documento profissional para apresentações e arquivamento</li>
                                    <li><strong>DOCX:</strong> Ata editável para devolutiva à comunidade</li>
                                    <li><strong>XLSX:</strong> Planilha com dados estruturados para análise e gestão</li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}