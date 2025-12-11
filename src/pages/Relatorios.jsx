import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FileText, Download, Loader2 } from "lucide-react";

export default function Relatorios() {
    const navigate = useNavigate();
    const [tipoRelatorio, setTipoRelatorio] = useState("");
    const [formato, setFormato] = useState("");
    const [loading, setLoading] = useState(false);

    const { data: atividades } = useQuery({
        queryKey: ['atividades'],
        queryFn: () => base44.entities.Atividade.list('-created_date'),
        initialData: []
    });

    const tiposRelatorio = [
        { value: "atividades", label: "Relatório de Atividades" },
        { value: "categoria", label: "Relatório por Categoria" },
        { value: "origem", label: "Relatório por Origem" },
        { value: "alertas", label: "Relatório de Alertas Éticos" },
        { value: "completo", label: "Relatório Completo" }
    ];

    const formatos = [
        { value: "pdf", label: "PDF - Documento" },
        { value: "docx", label: "DOCX - Ata para Devolutiva" },
        { value: "xlsx", label: "XLSX - Planilha Excel" }
    ];

    const gerarRelatorio = async () => {
        if (!tipoRelatorio || !formato) {
            alert("Por favor, selecione o tipo de relatório e formato");
            return;
        }

        setLoading(true);

        // Preparar dados para o relatório
        let dadosRelatorio = "";
        
        if (tipoRelatorio === "atividades") {
            dadosRelatorio = `RELATÓRIO DE ATIVIDADES\n\n`;
            atividades.forEach((ativ, index) => {
                dadosRelatorio += `${index + 1}. ${ativ.categoria}\n`;
                dadosRelatorio += `   Descrição: ${ativ.descricao}\n`;
                dadosRelatorio += `   Origem: ${ativ.origem || "Não especificada"}\n`;
                dadosRelatorio += `   Data: ${new Date(ativ.created_date).toLocaleDateString()}\n\n`;
            });
        } else if (tipoRelatorio === "categoria") {
            const porCategoria = {};
            atividades.forEach(a => {
                if (!porCategoria[a.categoria]) porCategoria[a.categoria] = [];
                porCategoria[a.categoria].push(a);
            });
            
            dadosRelatorio = `RELATÓRIO POR CATEGORIA\n\n`;
            Object.keys(porCategoria).forEach(cat => {
                dadosRelatorio += `${cat}: ${porCategoria[cat].length} atividade(s)\n`;
            });
        } else if (tipoRelatorio === "alertas") {
            dadosRelatorio = `RELATÓRIO DE ALERTAS ÉTICOS\n\n`;
            const comAlertas = atividades.filter(a => a.alertas_eticos && a.alertas_eticos.length > 0);
            dadosRelatorio += `Total de registros com alertas: ${comAlertas.length}\n\n`;
            comAlertas.forEach((ativ, index) => {
                dadosRelatorio += `${index + 1}. ${ativ.descricao.substring(0, 100)}\n`;
                dadosRelatorio += `   Alertas: ${ativ.alertas_eticos.join(", ")}\n\n`;
            });
        }

        // Gerar documento com IA
        const prompt = `Crie um relatório profissional formatado em ${formato.toUpperCase()} com os seguintes dados:

${dadosRelatorio}

O relatório deve incluir:
- Cabeçalho com título "Escuta Ativa - Inteligência Aplicada ao Território"
- Data do relatório
- Resumo executivo
- Dados organizados de forma clara
- Gráficos e estatísticas relevantes (se aplicável)
- Conclusões e recomendações

Formato: ${formato === 'pdf' ? 'Documento PDF' : formato === 'docx' ? 'Ata formal para devolutiva à comunidade' : 'Planilha Excel com tabelas'}`;

        const resultado = await base44.integrations.Core.InvokeLLM({
            prompt: prompt
        });

        setLoading(false);
        
        // Simulação de download (em produção seria gerado o arquivo real)
        alert(`Relatório gerado com sucesso!\n\nTipo: ${tiposRelatorio.find(t => t.value === tipoRelatorio)?.label}\nFormato: ${formato.toUpperCase()}\n\nEm produção, o arquivo seria baixado automaticamente.`);
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
                            <label className="block text-sm font-medium mb-2" style={{ color: '#0B1E33' }}>
                                Tipo de Relatório
                            </label>
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
                            <label className="block text-sm font-medium mb-2" style={{ color: '#0B1E33' }}>
                                Formato
                            </label>
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
                                    Gerando Relatório...
                                </>
                            ) : (
                                <>
                                    <Download className="w-5 h-5 mr-2" />
                                    Gerar e Baixar
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
                        <div className="grid gap-4">
                            <div className="p-4 border rounded-lg">
                                <h3 className="font-bold mb-1" style={{ color: '#0B1E33' }}>📊 Relatório de Atividades</h3>
                                <p className="text-sm text-gray-600">Lista completa de todas as atividades registradas com detalhes</p>
                            </div>
                            <div className="p-4 border rounded-lg">
                                <h3 className="font-bold mb-1" style={{ color: '#0B1E33' }}>📁 Relatório por Categoria</h3>
                                <p className="text-sm text-gray-600">Atividades agrupadas por categoria (reuniões, diálogos, etc.)</p>
                            </div>
                            <div className="p-4 border rounded-lg">
                                <h3 className="font-bold mb-1" style={{ color: '#0B1E33' }}>🏢 Relatório por Origem</h3>
                                <p className="text-sm text-gray-600">Análise por origem: comunidade, poder público, OSC, empresa</p>
                            </div>
                            <div className="p-4 border rounded-lg">
                                <h3 className="font-bold mb-1" style={{ color: '#0B1E33' }}>⚠️ Relatório de Alertas Éticos</h3>
                                <p className="text-sm text-gray-600">Registros que receberam alertas éticos da IA</p>
                            </div>
                            <div className="p-4 border rounded-lg">
                                <h3 className="font-bold mb-1" style={{ color: '#0B1E33' }}>📑 Relatório Completo</h3>
                                <p className="text-sm text-gray-600">Compilação completa com todas as informações</p>
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