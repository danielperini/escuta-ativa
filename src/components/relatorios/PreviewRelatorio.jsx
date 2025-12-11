import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Download, FileText, Table } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function PreviewRelatorio({ dadosRelatorio, onFechar, onExportar, formato }) {
    if (!dadosRelatorio) return null;

    const renderGrafico = () => {
        if (!dadosRelatorio.kpis || Object.keys(dadosRelatorio.kpis).length === 0) return null;

        const chartData = Object.entries(dadosRelatorio.kpis).map(([key, value]) => ({
            name: key.replace(/_/g, ' ').substring(0, 20),
            valor: typeof value === 'number' ? value : parseInt(value) || 0
        })).filter(d => !isNaN(d.valor));

        if (chartData.length === 0) return null;

        return (
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="text-lg">Indicadores Principais</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={11} />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="valor" fill="#F2B632" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
                    <div>
                        <h2 className="text-2xl font-bold" style={{ color: '#0B1E33' }}>
                            Preview do Relatório
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">{dadosRelatorio.titulo}</p>
                    </div>
                    <Button variant="ghost" onClick={onFechar}>
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Metadados */}
                    <Card style={{ backgroundColor: '#f8f9fa', border: '2px solid #0B1E33' }}>
                        <CardContent className="pt-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-600">Data de Geração</p>
                                    <p className="font-semibold">{new Date().toLocaleDateString('pt-BR')}</p>
                                </div>
                                <div>
                                    <p className="text-gray-600">Formato</p>
                                    <Badge>{formato.toUpperCase()}</Badge>
                                </div>
                                <div>
                                    <p className="text-gray-600">Registros</p>
                                    <p className="font-semibold">{dadosRelatorio.tabela?.length || 0}</p>
                                </div>
                                <div>
                                    <p className="text-gray-600">Status</p>
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                                        Pronto
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Resumo Executivo */}
                    {dadosRelatorio.resumo && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <FileText className="w-5 h-5" style={{ color: '#F2B632' }} />
                                    Resumo Executivo
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                    {dadosRelatorio.resumo}
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Gráfico de KPIs */}
                    {renderGrafico()}

                    {/* KPIs em Cards */}
                    {dadosRelatorio.kpis && Object.keys(dadosRelatorio.kpis).length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {Object.entries(dadosRelatorio.kpis).map(([key, value]) => (
                                <Card key={key}>
                                    <CardContent className="pt-4">
                                        <p className="text-xs text-gray-600 mb-1">
                                            {key.replace(/_/g, ' ').toUpperCase()}
                                        </p>
                                        <p className="text-2xl font-bold" style={{ color: '#0B1E33' }}>
                                            {value}
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* Preview da Tabela */}
                    {dadosRelatorio.tabela && dadosRelatorio.tabela.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Table className="w-5 h-5" style={{ color: '#F2B632' }} />
                                    Dados Detalhados
                                    <Badge variant="outline" className="ml-2">
                                        {dadosRelatorio.tabela.length} registros
                                    </Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm border-collapse">
                                        <thead>
                                            <tr className="bg-gray-100">
                                                {Object.keys(dadosRelatorio.tabela[0]).map(header => (
                                                    <th key={header} className="border px-3 py-2 text-left font-semibold">
                                                        {header.replace(/_/g, ' ').toUpperCase()}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {dadosRelatorio.tabela.slice(0, 10).map((row, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50">
                                                    {Object.values(row).map((value, vIdx) => (
                                                        <td key={vIdx} className="border px-3 py-2">
                                                            {Array.isArray(value) 
                                                                ? value.slice(0, 2).join(', ') + (value.length > 2 ? '...' : '')
                                                                : typeof value === 'string' && value.length > 50
                                                                ? value.substring(0, 47) + '...'
                                                                : value || '-'
                                                            }
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {dadosRelatorio.tabela.length > 10 && (
                                    <p className="text-xs text-gray-500 mt-3 text-center">
                                        Mostrando 10 de {dadosRelatorio.tabela.length} registros. 
                                        O relatório completo será exportado.
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Insights */}
                    {dadosRelatorio.insights && dadosRelatorio.insights.length > 0 && (
                        <Card className="border-l-4" style={{ borderLeftColor: '#F2B632' }}>
                            <CardHeader>
                                <CardTitle className="text-lg">Insights e Recomendações</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-3">
                                    {dadosRelatorio.insights.map((insight, idx) => (
                                        <li key={idx} className="flex gap-3">
                                            <span className="font-bold" style={{ color: '#F2B632' }}>
                                                {idx + 1}.
                                            </span>
                                            <span className="text-gray-700">{insight}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    )}

                    {/* Análises Avançadas da IA */}
                    {dadosRelatorio.analises_avancadas && (
                        <>
                            {dadosRelatorio.analises_avancadas.conexoes_sugeridas && (
                                <Card className="border-l-4 border-purple-500">
                                    <CardHeader>
                                        <CardTitle className="text-lg">🔗 Conexões Sugeridas pela IA</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {dadosRelatorio.analises_avancadas.conexoes_sugeridas.map((conexao, idx) => (
                                                <div key={idx} className="bg-purple-50 p-3 rounded">
                                                    <p className="font-semibold text-purple-900">
                                                        {conexao.ator1} ↔ {conexao.ator2}
                                                    </p>
                                                    <p className="text-sm text-purple-700 mt-1">
                                                        {conexao.justificativa}
                                                    </p>
                                                    <Badge variant="outline" className="mt-2">
                                                        Potencial: {conexao.potencial}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {dadosRelatorio.analises_avancadas.correlacoes_tematicas && (
                                <Card className="border-l-4 border-blue-500">
                                    <CardHeader>
                                        <CardTitle className="text-lg">📊 Correlações Temáticas</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {dadosRelatorio.analises_avancadas.correlacoes_tematicas.map((corr, idx) => (
                                                <div key={idx} className="bg-blue-50 p-3 rounded">
                                                    <p className="font-semibold text-blue-900">
                                                        {corr.tema1} → {corr.tema2}
                                                    </p>
                                                    <p className="text-sm text-blue-700 mt-1">
                                                        {corr.relacao}
                                                    </p>
                                                    {corr.oportunidades && (
                                                        <p className="text-xs text-green-700 mt-2">
                                                            💡 {corr.oportunidades}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {dadosRelatorio.analises_avancadas.previsao_riscos && (
                                <Card className="border-l-4 border-red-500">
                                    <CardHeader>
                                        <CardTitle className="text-lg">⚠️ Previsão de Riscos</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            <div className="bg-red-50 p-4 rounded">
                                                <p className="font-semibold text-red-900 mb-2">
                                                    Panorama Geral
                                                </p>
                                                <p className="text-sm text-red-700">
                                                    {dadosRelatorio.analises_avancadas.previsao_riscos.panorama}
                                                </p>
                                            </div>
                                            {dadosRelatorio.analises_avancadas.previsao_riscos.riscos_emergentes && (
                                                <div>
                                                    <p className="font-semibold text-sm mb-2">Riscos Emergentes:</p>
                                                    <ul className="space-y-2">
                                                        {dadosRelatorio.analises_avancadas.previsao_riscos.riscos_emergentes.map((r, idx) => (
                                                            <li key={idx} className="bg-orange-50 p-2 rounded text-sm">
                                                                <span className="font-semibold">{r.titulo}</span> - {r.previsao}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </>
                    )}
                </div>

                <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                        Revise o relatório antes de exportar
                    </p>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={onFechar}>
                            Cancelar
                        </Button>
                        <Button 
                            onClick={onExportar}
                            className="text-white"
                            style={{ backgroundColor: '#F2B632' }}
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Exportar {formato.toUpperCase()}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}