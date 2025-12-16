import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { Sparkles, Calendar, CheckCircle2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function AutomacaoCompromissos({ demanda, onConfirmar, onCancelar }) {
    const [editando, setEditando] = useState(false);
    const [compromissoSugerido, setCompromissoSugerido] = useState({
        titulo: demanda.titulo_sugerido || '',
        descricao: demanda.descricao || '',
        prazo: demanda.prazo_sugerido || '',
        responsavel: demanda.responsavel_sugerido || '',
        comunidade: demanda.comunidade || '',
        prioridade: demanda.prioridade || 'media'
    });

    const criarCompromisso = async () => {
        try {
            const usuario = await base44.auth.me();

            const novoCompromisso = await base44.entities.Compromisso.create({
                ...compromissoSugerido,
                status: 'pendente',
                registro_origem_id: demanda.registro_id,
                observacoes: `Criado automaticamente pela IA a partir de demanda recorrente: ${demanda.tema}`
            });

            alert('✓ Compromisso criado com sucesso!');
            onConfirmar(novoCompromisso);
        } catch (error) {
            alert('Erro ao criar: ' + error.message);
        }
    };

    return (
        <Card className="border-2 border-purple-600">
            <CardHeader className="bg-purple-50">
                <CardTitle className="flex items-center gap-2 text-purple-900">
                    <Sparkles className="w-6 h-6" />
                    Automação Inteligente: Criar Compromisso
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
                    <p className="text-sm font-semibold text-purple-900 mb-2">
                        🤖 Demanda Recorrente Detectada
                    </p>
                    <p className="text-xs text-purple-700">
                        A IA identificou menções repetidas sobre: <strong>{demanda.tema}</strong>
                    </p>
                    <p className="text-xs text-purple-600 mt-1">
                        Frequência: {demanda.frequencia} vezes | Última menção: {demanda.ultima_mencao}
                    </p>
                </div>

                <div className="space-y-3">
                    {!editando ? (
                        <>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Título Sugerido</p>
                                <p className="font-semibold text-gray-900">{compromissoSugerido.titulo}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Descrição</p>
                                <p className="text-sm text-gray-700">{compromissoSugerido.descricao}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Prazo Sugerido</p>
                                    <Badge variant="outline">{compromissoSugerido.prazo}</Badge>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Prioridade</p>
                                    <Badge className={
                                        compromissoSugerido.prioridade === 'alta' ? 'bg-red-600' :
                                        compromissoSugerido.prioridade === 'media' ? 'bg-amber-600' :
                                        'bg-blue-600'
                                    }>
                                        {compromissoSugerido.prioridade}
                                    </Badge>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div>
                                <label className="text-xs text-gray-500">Título</label>
                                <Input
                                    value={compromissoSugerido.titulo}
                                    onChange={(e) => setCompromissoSugerido({
                                        ...compromissoSugerido,
                                        titulo: e.target.value
                                    })}
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500">Descrição</label>
                                <Textarea
                                    value={compromissoSugerido.descricao}
                                    onChange={(e) => setCompromissoSugerido({
                                        ...compromissoSugerido,
                                        descricao: e.target.value
                                    })}
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500">Prazo</label>
                                <Input
                                    type="date"
                                    value={compromissoSugerido.prazo}
                                    onChange={(e) => setCompromissoSugerido({
                                        ...compromissoSugerido,
                                        prazo: e.target.value
                                    })}
                                />
                            </div>
                        </>
                    )}
                </div>

                <div className="flex gap-2 pt-4 border-t">
                    {!editando ? (
                        <>
                            <Button
                                onClick={criarCompromisso}
                                className="flex-1 bg-green-600 hover:bg-green-700"
                            >
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Confirmar e Criar Compromisso
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setEditando(true)}
                            >
                                Editar
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                onClick={() => setEditando(false)}
                                className="flex-1"
                            >
                                Salvar Alterações
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setEditando(false)}
                            >
                                Cancelar Edição
                            </Button>
                        </>
                    )}
                    <Button variant="outline" onClick={onCancelar}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}