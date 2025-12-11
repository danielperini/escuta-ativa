import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ArrowRight, Check, X, FileText } from "lucide-react";

export default function ResolvedorConflitos({ conflitos, onResolver }) {
    const [decisoes, setDecisoes] = useState({});

    const escolherValor = (campoId, opcao) => {
        setDecisoes({
            ...decisoes,
            [campoId]: opcao
        });
    };

    const confirmarResolucao = () => {
        const todosResolvidos = conflitos.every(c => decisoes[c.campo]);
        
        if (!todosResolvidos) {
            alert('Por favor, resolva todos os conflitos antes de continuar');
            return;
        }

        if (confirm(`Confirma as ${conflitos.length} alterações selecionadas?`)) {
            onResolver(decisoes);
        }
    };

    return (
        <Card className="border-2 border-orange-600">
            <CardHeader className="bg-orange-50">
                <CardTitle className="flex items-center gap-2 text-orange-900">
                    <AlertTriangle className="w-6 h-6" />
                    {conflitos.length} Conflito(s) de Dados Detectado(s)
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
                <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                    <p className="text-sm text-orange-900 font-semibold mb-1">
                        ⚠️ Dados Concorrentes Identificados
                    </p>
                    <p className="text-xs text-orange-700">
                        O sistema detectou informações diferentes para os mesmos campos. 
                        Escolha qual informação manter para cada conflito.
                    </p>
                </div>

                {conflitos.map((conflito, idx) => (
                    <div key={idx} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center gap-2 mb-3">
                            <Badge variant="outline" className="text-xs">
                                {conflito.campo}
                            </Badge>
                            <span className="text-xs text-gray-500">
                                {conflito.fonte || 'Registro recente'}
                            </span>
                        </div>

                        <div className="grid md:grid-cols-3 gap-3">
                            <div
                                className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${
                                    decisoes[conflito.campo] === 'antigo'
                                        ? 'border-blue-600 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                                onClick={() => escolherValor(conflito.campo, 'antigo')}
                            >
                                <p className="text-xs text-gray-500 mb-1">Dado Atual (Sistema)</p>
                                <p className="font-semibold text-sm text-gray-900 break-words">
                                    {conflito.valor_antigo || '(vazio)'}
                                </p>
                                {decisoes[conflito.campo] === 'antigo' && (
                                    <Check className="w-4 h-4 text-blue-600 mt-2" />
                                )}
                            </div>

                            <div className="flex items-center justify-center">
                                <ArrowRight className="w-5 h-5 text-gray-400" />
                            </div>

                            <div
                                className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${
                                    decisoes[conflito.campo] === 'novo'
                                        ? 'border-green-600 bg-green-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                                onClick={() => escolherValor(conflito.campo, 'novo')}
                            >
                                <p className="text-xs text-gray-500 mb-1">Dado Novo (Registro)</p>
                                <p className="font-semibold text-sm text-gray-900 break-words">
                                    {conflito.valor_novo || '(vazio)'}
                                </p>
                                {decisoes[conflito.campo] === 'novo' && (
                                    <Check className="w-4 h-4 text-green-600 mt-2" />
                                )}
                            </div>
                        </div>

                        <div className="mt-3 pt-3 border-t">
                            <Button
                                size="sm"
                                variant="outline"
                                className="w-full text-xs"
                                onClick={() => escolherValor(conflito.campo, 'observacao')}
                            >
                                <FileText className="w-3 h-3 mr-1" />
                                {decisoes[conflito.campo] === 'observacao' ? '✓ ' : ''}
                                Adicionar como Observação (Manter dado atual)
                            </Button>
                        </div>
                    </div>
                ))}

                <div className="flex gap-3 pt-4 border-t">
                    <Button
                        onClick={confirmarResolucao}
                        disabled={conflitos.length !== Object.keys(decisoes).length}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                        <Check className="w-4 h-4 mr-2" />
                        Confirmar Resoluções ({Object.keys(decisoes).length}/{conflitos.length})
                    </Button>
                    <Button variant="outline" onClick={() => onResolver(null)}>
                        <X className="w-4 h-4 mr-1" />
                        Cancelar
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}