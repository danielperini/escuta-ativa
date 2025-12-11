import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Search, FileText, Download, ExternalLink, Tag, Users, MapPin, Calendar, Eye } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PreviewDocumento from "./PreviewDocumento";

export default function BuscaDocumentos() {
    const [termoBusca, setTermoBusca] = useState("");
    const [filtroTipo, setFiltroTipo] = useState("todos");
    const [documentoSelecionado, setDocumentoSelecionado] = useState(null);
    const [documentoPreview, setDocumentoPreview] = useState(null);

    const { data: documentos = [] } = useQuery({
        queryKey: ['documentos'],
        queryFn: () => base44.entities.DocumentoProcessado.list('-created_date')
    });

    const documentosFiltrados = documentos.filter(doc => {
        const matchTipo = filtroTipo === "todos" || doc.tipo === filtroTipo;
        const matchBusca = !termoBusca || 
            doc.titulo?.toLowerCase().includes(termoBusca.toLowerCase()) ||
            doc.resumo?.toLowerCase().includes(termoBusca.toLowerCase()) ||
            doc.conteudo_extraido?.toLowerCase().includes(termoBusca.toLowerCase()) ||
            doc.palavras_chave?.some(p => p.toLowerCase().includes(termoBusca.toLowerCase()));
        
        return matchTipo && matchBusca;
    });

    const getTipoColor = (tipo) => {
        const colors = {
            relatorio: "bg-blue-100 text-blue-800",
            ata: "bg-green-100 text-green-800",
            politica: "bg-purple-100 text-purple-800",
            oficio: "bg-amber-100 text-amber-800",
            carta: "bg-pink-100 text-pink-800",
            apresentacao: "bg-indigo-100 text-indigo-800",
            outro: "bg-gray-100 text-gray-800"
        };
        return colors[tipo] || colors.outro;
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Search className="w-5 h-5" />
                        Busca Inteligente de Documentos
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <Input
                            placeholder="Buscar por título, conteúdo, palavras-chave..."
                            value={termoBusca}
                            onChange={(e) => setTermoBusca(e.target.value)}
                            className="flex-1"
                        />
                        <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                            <SelectTrigger className="w-40">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="todos">Todos os tipos</SelectItem>
                                <SelectItem value="relatorio">Relatório</SelectItem>
                                <SelectItem value="ata">Ata</SelectItem>
                                <SelectItem value="politica">Política</SelectItem>
                                <SelectItem value="oficio">Ofício</SelectItem>
                                <SelectItem value="carta">Carta</SelectItem>
                                <SelectItem value="apresentacao">Apresentação</SelectItem>
                                <SelectItem value="outro">Outro</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="text-sm text-gray-600">
                        {documentosFiltrados.length} documento(s) encontrado(s)
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-4">
                {documentosFiltrados.map(doc => (
                    <Card 
                        key={doc.id}
                        className="hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => setDocumentoSelecionado(documentoSelecionado?.id === doc.id ? null : doc)}
                    >
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Badge className={getTipoColor(doc.tipo)}>
                                            {doc.tipo}
                                        </Badge>
                                        {doc.data_documento && (
                                            <span className="text-xs text-gray-500">
                                                {new Date(doc.data_documento).toLocaleDateString('pt-BR')}
                                            </span>
                                        )}
                                    </div>
                                    <CardTitle className="text-lg">{doc.titulo}</CardTitle>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setDocumentoPreview(doc);
                                        }}
                                    >
                                        <Eye className="w-4 h-4 mr-1" />
                                        Preview
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            window.open(doc.arquivo_url, '_blank');
                                        }}
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {doc.resumo && (
                                <p className="text-sm text-gray-700 mb-3">{doc.resumo}</p>
                            )}

                            {doc.palavras_chave && doc.palavras_chave.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-3">
                                    {doc.palavras_chave.slice(0, 5).map((palavra, idx) => (
                                        <Badge key={idx} variant="outline" className="text-xs">
                                            <Tag className="w-3 h-3 mr-1" />
                                            {palavra}
                                        </Badge>
                                    ))}
                                </div>
                            )}

                            {documentoSelecionado?.id === doc.id && (
                                <div className="mt-4 pt-4 border-t space-y-4">
                                    {doc.informacoes_chave && doc.informacoes_chave.length > 0 && (
                                        <div>
                                            <h4 className="font-semibold text-sm mb-2">Informações-Chave:</h4>
                                            <ul className="space-y-1 text-sm text-gray-700">
                                                {doc.informacoes_chave.map((info, idx) => (
                                                    <li key={idx}>• {info}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {doc.entidades_mencionadas && (
                                        <div className="grid md:grid-cols-2 gap-4">
                                            {doc.entidades_mencionadas.liderancas && doc.entidades_mencionadas.liderancas.length > 0 && (
                                                <div className="bg-blue-50 p-3 rounded">
                                                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                                                        <Users className="w-4 h-4" />
                                                        Lideranças
                                                    </h4>
                                                    <div className="flex flex-wrap gap-1">
                                                        {doc.entidades_mencionadas.liderancas.map((lid, idx) => (
                                                            <Badge key={idx} variant="secondary" className="text-xs">
                                                                {lid}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {doc.entidades_mencionadas.comunidades && doc.entidades_mencionadas.comunidades.length > 0 && (
                                                <div className="bg-green-50 p-3 rounded">
                                                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                                                        <MapPin className="w-4 h-4" />
                                                        Comunidades
                                                    </h4>
                                                    <div className="flex flex-wrap gap-1">
                                                        {doc.entidades_mencionadas.comunidades.map((com, idx) => (
                                                            <Badge key={idx} variant="secondary" className="text-xs">
                                                                {com}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {doc.compromissos_identificados && doc.compromissos_identificados.length > 0 && (
                                        <div className="bg-amber-50 p-3 rounded">
                                            <h4 className="font-semibold text-sm mb-2">Compromissos:</h4>
                                            <ul className="space-y-1 text-sm">
                                                {doc.compromissos_identificados.map((comp, idx) => (
                                                    <li key={idx}>• {comp}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {doc.referencias_cruzadas && doc.referencias_cruzadas.length > 0 && (
                                        <div className="bg-purple-50 p-3 rounded">
                                            <h4 className="font-semibold text-sm mb-2">Referências Cruzadas:</h4>
                                            <div className="space-y-1 text-xs">
                                                {doc.referencias_cruzadas.map((ref, idx) => (
                                                    <div key={idx} className="text-gray-700">
                                                        → {ref.descricao}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}

                {documentosFiltrados.length === 0 && (
                    <Card>
                        <CardContent className="text-center py-12">
                            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                            <p className="text-gray-500">Nenhum documento encontrado.</p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {documentoPreview && (
                <PreviewDocumento
                    arquivo={{
                        ...documentoPreview,
                        nome: documentoPreview.titulo
                    }}
                    onFechar={() => setDocumentoPreview(null)}
                />
            )}
        </div>
    );
}