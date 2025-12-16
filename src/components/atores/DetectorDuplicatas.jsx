import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { AlertTriangle, Link2, X, CheckCircle2, Eye } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export default function DetectorDuplicatas({ tipo, dadosNovo, onCancelar, onConfirmar }) {
    const [duplicatasPotenciais, setDuplicatasPotenciais] = useState([]);
    const [verificando, setVerificando] = useState(false);
    const [showDetalhes, setShowDetalhes] = useState(null);

    const verificarDuplicatas = async () => {
        setVerificando(true);
        try {
            const entidade = tipo === 'lideranca' ? 'LiderancaComunitaria' : 'ProjetoOrganizacao';
            const existentes = await base44.entities[entidade].list();

            // Usar IA para detectar similaridades
            const prompt = `
Analise os seguintes dados e identifique DUPLICATAS POTENCIAIS:

NOVO CADASTRO:
${JSON.stringify(dadosNovo, null, 2)}

CADASTROS EXISTENTES:
${JSON.stringify(existentes, null, 2)}

Critérios de detecção:
1. Similaridade de nome (incluir variações, apelidos, abreviações)
2. Telefone idêntico ou similar
3. E-mail idêntico
4. Endereço similar
5. Menções em registros anteriores

Para cada possível duplicata, retorne:
- grau de similaridade (baixo/medio/alto/muito_alto)
- campos que coincidem
- justificativa
- recomendação (vincular/criar_novo/revisar)

IMPORTANTE: Seja rigoroso. É melhor alertar demais do que permitir duplicatas.
`;

            const resultado = await base44.integrations.Core.InvokeLLM({
                prompt: prompt,
                response_json_schema: {
                    type: "object",
                    properties: {
                        duplicatas_encontradas: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    id_existente: { type: "string" },
                                    nome_existente: { type: "string" },
                                    grau_similaridade: {
                                        type: "string",
                                        enum: ["baixo", "medio", "alto", "muito_alto"]
                                    },
                                    campos_coincidentes: {
                                        type: "array",
                                        items: { type: "string" }
                                    },
                                    justificativa: { type: "string" },
                                    recomendacao: {
                                        type: "string",
                                        enum: ["vincular", "criar_novo", "revisar"]
                                    }
                                }
                            }
                        }
                    }
                }
            });

            setDuplicatasPotenciais(resultado.duplicatas_encontradas || []);
        } catch (error) {
            console.error("Erro ao verificar duplicatas:", error);
            alert("Erro ao verificar: " + error.message);
        } finally {
            setVerificando(false);
        }
    };

    React.useEffect(() => {
        verificarDuplicatas();
    }, []);

    const vincularAExistente = (duplicata) => {
        if (confirm(`Confirma vincular ao cadastro existente: ${duplicata.nome_existente}?`)) {
            onConfirmar({ tipo: 'vincular', id_existente: duplicata.id_existente });
        }
    };

    const criarNovo = () => {
        if (confirm('Tem certeza que deseja criar um NOVO cadastro mesmo com duplicatas detectadas?')) {
            onConfirmar({ tipo: 'criar_novo', dados: dadosNovo });
        }
    };

    const corSimilaridade = (grau) => {
        switch (grau) {
            case 'muito_alto': return 'bg-red-100 text-red-800 border-red-300';
            case 'alto': return 'bg-orange-100 text-orange-800 border-orange-300';
            case 'medio': return 'bg-amber-100 text-amber-800 border-amber-300';
            case 'baixo': return 'bg-blue-100 text-blue-800 border-blue-300';
            default: return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    if (verificando) {
        return (
            <Card className="border-2 border-amber-600">
                <CardContent className="pt-6 text-center">
                    <div className="animate-spin w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full mx-auto mb-4" />
                    <p className="font-semibold text-gray-900">Verificando Duplicatas...</p>
                    <p className="text-sm text-gray-600 mt-2">Analisando cadastros existentes com IA</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card className="border-2 border-amber-600">
                <CardHeader className="bg-amber-50">
                    <CardTitle className="flex items-center gap-2 text-amber-900">
                        <AlertTriangle className="w-6 h-6" />
                        {duplicatasPotenciais.length > 0 
                            ? `⚠️ ${duplicatasPotenciais.length} Duplicata(s) Potencial(is) Detectada(s)`
                            : '✓ Nenhuma Duplicata Detectada'
                        }
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                    {duplicatasPotenciais.length === 0 ? (
                        <div>
                            <p className="text-gray-700 mb-4">
                                Nenhum cadastro similar foi encontrado. Você pode prosseguir com segurança.
                            </p>
                            <div className="flex gap-3">
                                <Button onClick={() => onConfirmar({ tipo: 'criar_novo', dados: dadosNovo })} className="flex-1 bg-green-600 hover:bg-green-700">
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    Confirmar Novo Cadastro
                                </Button>
                                <Button variant="outline" onClick={onCancelar}>
                                    Cancelar
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-sm text-gray-700 font-semibold">
                                Encontramos cadastros similares. Revise antes de continuar:
                            </p>

                            {duplicatasPotenciais.map((dup, idx) => (
                                <div key={idx} className={`border-2 rounded-lg p-4 ${corSimilaridade(dup.grau_similaridade)}`}>
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <p className="font-bold text-lg">{dup.nome_existente}</p>
                                            <Badge className="mt-1">{dup.grau_similaridade.replace('_', ' ').toUpperCase()}</Badge>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setShowDetalhes(dup)}
                                        >
                                            <Eye className="w-4 h-4 mr-1" />
                                            Ver Detalhes
                                        </Button>
                                    </div>

                                    <p className="text-sm mb-3">{dup.justificativa}</p>

                                    <div className="flex flex-wrap gap-2 mb-3">
                                        <span className="text-xs font-semibold">Campos coincidentes:</span>
                                        {dup.campos_coincidentes?.map((campo, i) => (
                                            <Badge key={i} variant="outline" className="text-xs">
                                                {campo}
                                            </Badge>
                                        ))}
                                    </div>

                                    {dup.recomendacao === 'vincular' && (
                                        <Button
                                            size="sm"
                                            className="w-full bg-blue-600 hover:bg-blue-700"
                                            onClick={() => vincularAExistente(dup)}
                                        >
                                            <Link2 className="w-4 h-4 mr-2" />
                                            Vincular a Este Cadastro
                                        </Button>
                                    )}
                                </div>
                            ))}

                            <div className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-300">
                                <p className="text-sm font-semibold mb-2">Opções:</p>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={criarNovo}
                                        className="flex-1"
                                    >
                                        Criar NOVO Cadastro (Ignorar Alertas)
                                    </Button>
                                    <Button variant="outline" onClick={onCancelar}>
                                        <X className="w-4 h-4 mr-1" />
                                        Cancelar
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {showDetalhes && (
                <Dialog open={!!showDetalhes} onOpenChange={() => setShowDetalhes(null)}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Detalhes do Cadastro Existente</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs text-gray-500">Nome</p>
                                <p className="font-semibold">{showDetalhes.nome_existente}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Grau de Similaridade</p>
                                <Badge className={corSimilaridade(showDetalhes.grau_similaridade)}>
                                    {showDetalhes.grau_similaridade.replace('_', ' ').toUpperCase()}
                                </Badge>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Justificativa</p>
                                <p className="text-sm">{showDetalhes.justificativa}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-2">Campos Coincidentes</p>
                                <div className="flex flex-wrap gap-2">
                                    {showDetalhes.campos_coincidentes?.map((campo, i) => (
                                        <Badge key={i} variant="outline">{campo}</Badge>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
}