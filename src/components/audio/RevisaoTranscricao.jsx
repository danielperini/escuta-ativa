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

                            {interpretacao.tipo_registro && (
                                <div className="bg-indigo-50 p-3 rounded">
                                    <h4 className="font-semibold text-sm mb-2">Tipo de Registro Sugerido:</h4>
                                    <Badge className="bg-indigo-600 text-white text-sm">
                                        {interpretacao.tipo_registro === "reuniao" && "Reunião"}
                                        {interpretacao.tipo_registro === "conversa_de_campo" && "Conversa de Campo"}
                                        {interpretacao.tipo_registro === "visita" && "Visita"}
                                        {interpretacao.tipo_registro === "visita_institucional" && "Visita Institucional"}
                                        {interpretacao.tipo_registro === "dialogo_individualizado" && "Diálogo Individualizado"}
                                    </Badge>
                                    {interpretacao.justificativa_tipo && (
                                        <p className="text-xs text-gray-600 mt-2">
                                            {interpretacao.justificativa_tipo}
                                        </p>
                                    )}
                                </div>
                            )}

                            {interpretacao.sentimento && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <h4 className="font-semibold text-sm mb-2">Sentimento Predominante:</h4>
                                        <Badge className={
                                            interpretacao.sentimento === "irritado" ? "bg-red-100 text-red-800" :
                                            interpretacao.sentimento === "urgente" ? "bg-orange-100 text-orange-800" :
                                            interpretacao.sentimento === "preocupado" ? "bg-yellow-100 text-yellow-800" :
                                            interpretacao.sentimento === "satisfeito" ? "bg-green-100 text-green-800" :
                                            interpretacao.sentimento === "tenso" ? "bg-purple-100 text-purple-800" :
                                            "bg-gray-100 text-gray-800"
                                        }>
                                            {interpretacao.sentimento}
                                        </Badge>
                                    </div>
                                    {interpretacao.nivel_urgencia && (
                                        <div>
                                            <h4 className="font-semibold text-sm mb-2">Nível de Urgência:</h4>
                                            <Badge className={
                                                interpretacao.nivel_urgencia === "critico" ? "bg-red-600 text-white" :
                                                interpretacao.nivel_urgencia === "alto" ? "bg-red-100 text-red-800" :
                                                interpretacao.nivel_urgencia === "moderado" ? "bg-yellow-100 text-yellow-800" :
                                                "bg-green-100 text-green-800"
                                            }>
                                                {interpretacao.nivel_urgencia}
                                            </Badge>
                                        </div>
                                    )}
                                </div>
                            )}

                            {interpretacao.acionamentos && interpretacao.acionamentos.length > 0 && (
                                <div className="bg-purple-50 p-4 rounded border-l-4 border-purple-500">
                                    <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                                        🎯 Acionamentos Sugeridos pela IA:
                                    </h4>
                                    <div className="space-y-3">
                                        {interpretacao.acionamentos.map((acao, idx) => (
                                            <div key={idx} className="bg-white p-3 rounded shadow-sm">
                                                <div className="flex items-start justify-between mb-2">
                                                    <Badge className={
                                                        acao.tipo === "reuniao_emergencial" ? "bg-red-600 text-white" :
                                                        acao.tipo === "visita_tecnica" ? "bg-blue-600 text-white" :
                                                        acao.tipo === "comunicacao_institucional" ? "bg-indigo-600 text-white" :
                                                        acao.tipo === "monitoramento_continuo" ? "bg-amber-600 text-white" :
                                                        "bg-gray-600 text-white"
                                                    }>
                                                        {acao.tipo === "visita_tecnica" && "Visita Técnica"}
                                                        {acao.tipo === "comunicacao_institucional" && "Comunicação Institucional"}
                                                        {acao.tipo === "reuniao_emergencial" && "Reunião Emergencial"}
                                                        {acao.tipo === "monitoramento_continuo" && "Monitoramento Contínuo"}
                                                        {acao.tipo === "nenhum" && "Nenhum acionamento necessário"}
                                                    </Badge>
                                                    {acao.prazo_sugerido && (
                                                        <span className="text-xs text-gray-500">{acao.prazo_sugerido}</span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-700">{acao.justificativa}</p>
                                            </div>
                                        ))}
                                    </div>
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