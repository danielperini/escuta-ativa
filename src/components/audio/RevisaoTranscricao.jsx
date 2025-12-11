import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Edit2, AlertCircle } from "lucide-react";

export default function RevisaoTranscricao({ 
    audioUrl, 
    transcricao, 
    interpretacao, 
    onConfirmar, 
    onEditar 
}) {
    const [editando, setEditando] = useState(false);
    const [dadosEditados, setDadosEditados] = useState(interpretacao);

    const handleConfirmar = () => {
        onConfirmar(editando ? dadosEditados : interpretacao);
    };

    const getRiscoColor = (nivel) => {
        const colors = {
            baixo: "bg-green-100 text-green-800",
            moderado: "bg-yellow-100 text-yellow-800",
            alto: "bg-orange-100 text-orange-800",
            critico: "bg-red-100 text-red-800"
        };
        return colors[nivel] || colors.moderado;
    };

    return (
        <div className="space-y-6">
            <Card className="border-l-4 border-blue-600">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        🎧 Áudio Original
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <audio controls src={audioUrl} className="w-full" />
                </CardContent>
            </Card>

            <Card className="border-l-4 border-purple-600">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        ✍️ Transcrição Completa
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto">
                        <pre className="text-sm whitespace-pre-wrap font-sans text-gray-800">
                            {transcricao}
                        </pre>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-l-4 border-amber-600">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            🧠 Interpretação Automática da IA
                        </CardTitle>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditando(!editando)}
                        >
                            <Edit2 className="w-4 h-4 mr-2" />
                            {editando ? "Cancelar Edição" : "Editar Dados"}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {!editando ? (
                        <>
                            <div>
                                <h4 className="font-semibold text-sm mb-2">Título:</h4>
                                <p className="text-gray-700">{interpretacao.titulo}</p>
                            </div>

                            {interpretacao.local && (
                                <div>
                                    <h4 className="font-semibold text-sm mb-2">Local:</h4>
                                    <p className="text-gray-700">{interpretacao.local}</p>
                                </div>
                            )}

                            {interpretacao.temas && interpretacao.temas.length > 0 && (
                                <div>
                                    <h4 className="font-semibold text-sm mb-2">Temas:</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {interpretacao.temas.map((tema, idx) => (
                                            <Badge key={idx} variant="outline">{tema}</Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {interpretacao.demandas && interpretacao.demandas.length > 0 && (
                                <div>
                                    <h4 className="font-semibold text-sm mb-2">Demandas:</h4>
                                    <ul className="space-y-1">
                                        {interpretacao.demandas.map((dem, idx) => (
                                            <li key={idx} className="text-sm text-gray-700">• {dem}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {interpretacao.participantes && interpretacao.participantes.length > 0 && (
                                <div>
                                    <h4 className="font-semibold text-sm mb-2">Participantes:</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {interpretacao.participantes.map((part, idx) => (
                                            <Badge key={idx} className="bg-blue-100 text-blue-800">
                                                {part}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {interpretacao.risco_identificado && (
                                <div className="bg-red-50 p-3 rounded">
                                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4" />
                                        Risco Social Identificado:
                                    </h4>
                                    <Badge className={getRiscoColor(interpretacao.risco_identificado.nivel)}>
                                        {interpretacao.risco_identificado.nivel}
                                    </Badge>
                                    <p className="text-sm text-gray-700 mt-2">
                                        {interpretacao.risco_identificado.descricao}
                                    </p>
                                </div>
                            )}

                            {interpretacao.sentimento && (
                                <div>
                                    <h4 className="font-semibold text-sm mb-2">Sentimento/Emoção:</h4>
                                    <Badge variant="secondary">{interpretacao.sentimento}</Badge>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-semibold block mb-1">Título:</label>
                                <Textarea
                                    value={dadosEditados.titulo}
                                    onChange={(e) => setDadosEditados({...dadosEditados, titulo: e.target.value})}
                                    rows={2}
                                />
                            </div>

                            <div>
                                <label className="text-sm font-semibold block mb-1">Local:</label>
                                <Textarea
                                    value={dadosEditados.local || ""}
                                    onChange={(e) => setDadosEditados({...dadosEditados, local: e.target.value})}
                                    rows={2}
                                />
                            </div>

                            <div>
                                <label className="text-sm font-semibold block mb-1">Temas (separados por vírgula):</label>
                                <Textarea
                                    value={dadosEditados.temas?.join(", ") || ""}
                                    onChange={(e) => setDadosEditados({
                                        ...dadosEditados, 
                                        temas: e.target.value.split(",").map(t => t.trim()).filter(Boolean)
                                    })}
                                    rows={2}
                                />
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="bg-green-50 border-l-4 border-green-600">
                <CardContent className="pt-6 text-center space-y-4">
                    <p className="text-sm text-gray-700">
                        Revise as informações extraídas pela IA. Você pode editá-las antes de salvar.
                    </p>
                    <Button
                        onClick={handleConfirmar}
                        size="lg"
                        className="w-full"
                        style={{ backgroundColor: '#22c55e' }}
                    >
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Estou de acordo. Salvar Registro
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}