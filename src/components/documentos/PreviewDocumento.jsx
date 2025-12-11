import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Download, Maximize2, Minimize2, Loader2 } from "lucide-react";

export default function PreviewDocumento({ arquivo, onFechar }) {
    const [conteudo, setConteudo] = useState("");
    const [carregando, setCarregando] = useState(true);
    const [expandido, setExpandido] = useState(false);
    const [erro, setErro] = useState(null);

    useEffect(() => {
        carregarPreview();
    }, [arquivo]);

    const carregarPreview = async () => {
        setCarregando(true);
        setErro(null);

        try {
            const extensao = arquivo.nome?.split('.').pop()?.toLowerCase();
            
            if (extensao === 'txt') {
                // TXT: buscar diretamente
                const response = await fetch(arquivo.arquivo_url);
                const texto = await response.text();
                setConteudo(texto);
            } else {
                // Para PDF, DOC, DOCX: usar conteúdo extraído
                setConteudo(arquivo.conteudo_extraido || "Nenhum conteúdo disponível para pré-visualização.");
            }
        } catch (error) {
            console.error("Erro ao carregar preview:", error);
            setErro("Erro ao carregar pré-visualização.");
        } finally {
            setCarregando(false);
        }
    };

    const getTipoArquivo = () => {
        const extensao = arquivo.nome?.split('.').pop()?.toLowerCase();
        const tipos = {
            pdf: { icone: "📄", cor: "text-red-600" },
            doc: { icone: "📘", cor: "text-blue-600" },
            docx: { icone: "📘", cor: "text-blue-600" },
            txt: { icone: "📝", cor: "text-gray-600" }
        };
        return tipos[extensao] || { icone: "📄", cor: "text-gray-600" };
    };

    const tipo = getTipoArquivo();

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 ${expandido ? '' : 'md:p-8'}`}>
            <Card className={`${expandido ? 'w-full h-full' : 'max-w-4xl w-full max-h-[90vh]'} flex flex-col`}>
                <CardHeader className="border-b">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <span className={`text-2xl ${tipo.cor}`}>{tipo.icone}</span>
                            {arquivo.titulo || arquivo.nome || "Documento"}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setExpandido(!expandido)}
                            >
                                {expandido ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => window.open(arquivo.arquivo_url, '_blank')}
                            >
                                <Download className="w-5 h-5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onFechar}
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden p-0">
                    {carregando ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                            <span className="ml-2 text-gray-600">Carregando pré-visualização...</span>
                        </div>
                    ) : erro ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <p className="text-red-600 mb-4">{erro}</p>
                                <Button onClick={() => window.open(arquivo.arquivo_url, '_blank')}>
                                    Abrir arquivo original
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full overflow-y-auto p-6">
                            <div className="prose max-w-none">
                                <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800 leading-relaxed">
                                    {conteudo}
                                </pre>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}