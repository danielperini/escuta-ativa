import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { Upload, FileText, AlertTriangle, CheckCircle2, X, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export default function ImportadorCSV({ tipo, onConcluir }) {
    const [arquivo, setArquivo] = useState(null);
    const [dadosProcessados, setDadosProcessados] = useState(null);
    const [processando, setProcessando] = useState(false);
    const [importando, setImportando] = useState(false);
    const [itensSelecionados, setItensSelecionados] = useState([]);

    const handleArquivo = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setArquivo(file);
        setProcessando(true);

        try {
            // Upload do arquivo
            const { file_url } = await base44.integrations.Core.UploadFile({ file });

            // Extrair dados com IA
            const schema = tipo === 'lideranca' ? {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        nome: { type: "string" },
                        comunidade: { type: "string" },
                        telefone: { type: "string" },
                        email: { type: "string" },
                        papel_na_comunidade: { type: "string" }
                    }
                }
            } : {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        nome_oficial: { type: "string" },
                        natureza: { type: "string" },
                        cnpj: { type: "string" },
                        telefone: { type: "string" },
                        email: { type: "string" }
                    }
                }
            };

            const resultado = await base44.integrations.Core.ExtractDataFromUploadedFile({
                file_url: file_url,
                json_schema: schema
            });

            if (resultado.status === 'success') {
                // Verificar duplicatas para cada item
                const entidade = tipo === 'lideranca' ? 'LiderancaComunitaria' : 'ProjetoOrganizacao';
                const existentes = await base44.entities[entidade].list();

                const itensComStatus = resultado.output.map(item => {
                    // Verificação simples de duplicata
                    const isDuplicata = existentes.some(e => 
                        e.nome?.toLowerCase() === item.nome?.toLowerCase() ||
                        e.nome_oficial?.toLowerCase() === item.nome_oficial?.toLowerCase()
                    );

                    return {
                        ...item,
                        status: isDuplicata ? 'duplicata' : 'novo',
                        id_temp: Math.random().toString(36)
                    };
                });

                setDadosProcessados(itensComStatus);
                setItensSelecionados(itensComStatus.filter(i => i.status === 'novo').map(i => i.id_temp));
            } else {
                alert('Erro ao processar arquivo: ' + resultado.details);
            }
        } catch (error) {
            alert('Erro: ' + error.message);
        } finally {
            setProcessando(false);
        }
    };

    const toggleItem = (id) => {
        setItensSelecionados(
            itensSelecionados.includes(id)
                ? itensSelecionados.filter(i => i !== id)
                : [...itensSelecionados, id]
        );
    };

    const importarSelecionados = async () => {
        setImportando(true);
        try {
            const entidade = tipo === 'lideranca' ? 'LiderancaComunitaria' : 'ProjetoOrganizacao';
            const itens = dadosProcessados.filter(d => itensSelecionados.includes(d.id_temp));

            const usuario = await base44.auth.me();

            for (const item of itens) {
                const { id_temp, status, ...dados } = item;
                
                // Adicionar auditoria
                const dadosComAuditoria = {
                    ...dados,
                    historico_auditoria: [{
                        campo_alterado: 'Criação via Importação CSV',
                        valor_anterior: null,
                        valor_novo: 'Cadastro criado',
                        data_alteracao: new Date().toISOString(),
                        usuario_responsavel: usuario.email,
                        justificativa: `Importação em lote via CSV: ${arquivo.name}`
                    }]
                };

                await base44.entities[entidade].create(dadosComAuditoria);
            }

            alert(`${itens.length} registros importados com sucesso!`);
            onConcluir();
        } catch (error) {
            alert('Erro na importação: ' + error.message);
        } finally {
            setImportando(false);
        }
    };

    return (
        <Card className="border-2 border-blue-600">
            <CardHeader className="bg-blue-50">
                <CardTitle className="flex items-center gap-2 text-blue-900">
                    <Upload className="w-6 h-6" />
                    Importação em Massa (CSV)
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
                {!arquivo && (
                    <div>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-all cursor-pointer">
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleArquivo}
                                className="hidden"
                                id="csv-input"
                            />
                            <label htmlFor="csv-input" className="cursor-pointer">
                                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                                <p className="font-semibold text-gray-900 mb-1">
                                    Clique para selecionar arquivo CSV
                                </p>
                                <p className="text-xs text-gray-500">
                                    Formato: nome, comunidade, telefone, email, etc.
                                </p>
                            </label>
                        </div>
                    </div>
                )}

                {processando && (
                    <div className="text-center py-8">
                        <Loader2 className="w-12 h-12 animate-spin mx-auto mb-3 text-blue-600" />
                        <p className="font-semibold">Processando arquivo...</p>
                    </div>
                )}

                {dadosProcessados && !processando && (
                    <div className="space-y-4">
                        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                            <p className="text-sm font-semibold text-green-900">
                                ✓ Arquivo processado: {dadosProcessados.length} registros encontrados
                            </p>
                            <p className="text-xs text-green-700 mt-1">
                                {dadosProcessados.filter(d => d.status === 'novo').length} novos | 
                                {dadosProcessados.filter(d => d.status === 'duplicata').length} duplicatas detectadas
                            </p>
                        </div>

                        <div className="max-h-96 overflow-y-auto space-y-2">
                            {dadosProcessados.map(item => (
                                <div
                                    key={item.id_temp}
                                    className={`border rounded-lg p-3 ${
                                        item.status === 'duplicata' 
                                            ? 'bg-red-50 border-red-200' 
                                            : 'bg-gray-50'
                                    }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <Checkbox
                                            checked={itensSelecionados.includes(item.id_temp)}
                                            onCheckedChange={() => toggleItem(item.id_temp)}
                                            disabled={item.status === 'duplicata'}
                                        />
                                        <div className="flex-1">
                                            <p className="font-semibold text-sm">
                                                {item.nome || item.nome_oficial}
                                            </p>
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                {item.comunidade && (
                                                    <Badge variant="outline" className="text-xs">
                                                        {item.comunidade}
                                                    </Badge>
                                                )}
                                                {item.telefone && (
                                                    <Badge variant="outline" className="text-xs">
                                                        📞 {item.telefone}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                        {item.status === 'duplicata' && (
                                            <Badge className="bg-red-600 text-xs">
                                                <AlertTriangle className="w-3 h-3 mr-1" />
                                                Duplicata
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-3 pt-4 border-t">
                            <Button
                                onClick={importarSelecionados}
                                disabled={itensSelecionados.length === 0 || importando}
                                className="flex-1 bg-green-600 hover:bg-green-700"
                            >
                                {importando ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Importando...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                        Importar {itensSelecionados.length} Selecionados
                                    </>
                                )}
                            </Button>
                            <Button variant="outline" onClick={onConcluir}>
                                Cancelar
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}