import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { ThumbsUp, ThumbsDown, MessageSquare, X, Star } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function FeedbackIA({ 
    tipo_analise, 
    analise_original, 
    entidade_relacionada_tipo, 
    entidade_relacionada_id,
    contexto,
    onFeedbackEnviado 
}) {
    const [showDialog, setShowDialog] = useState(false);
    const [validado, setValidado] = useState(null);
    const [comentario, setComentario] = useState("");
    const [precisao, setPrecisao] = useState(0);
    const [enviando, setEnviando] = useState(false);

    const enviarFeedback = async () => {
        setEnviando(true);
        try {
            await base44.entities.FeedbackIA.create({
                tipo_analise,
                entidade_relacionada_tipo,
                entidade_relacionada_id,
                analise_original,
                validado,
                comentario,
                contexto,
                precisao_avaliada: precisao
            });

            setShowDialog(false);
            if (onFeedbackEnviado) onFeedbackEnviado();
            
            // Resetar estado
            setComentario("");
            setPrecisao(0);
        } catch (error) {
            alert("Erro ao enviar feedback: " + error.message);
        } finally {
            setEnviando(false);
        }
    };

    const handleValidacao = (isValid) => {
        setValidado(isValid);
        setShowDialog(true);
    };

    return (
        <>
            <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Análise IA útil?</span>
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleValidacao(true)}
                    className="h-8 px-2"
                >
                    <ThumbsUp className="w-4 h-4 text-green-600" />
                </Button>
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleValidacao(false)}
                    className="h-8 px-2"
                >
                    <ThumbsDown className="w-4 h-4 text-red-600" />
                </Button>
            </div>

            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <MessageSquare className="w-5 h-5" />
                            Feedback sobre Análise IA
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Badge className={validado ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                                {validado ? "✓ Análise Correta" : "✗ Análise Incorreta"}
                            </Badge>
                        </div>

                        <div>
                            <Label>Avalie a precisão da análise</Label>
                            <div className="flex gap-2 mt-2">
                                {[1, 2, 3, 4, 5].map((valor) => (
                                    <button
                                        key={valor}
                                        onClick={() => setPrecisao(valor)}
                                        className={`p-2 rounded ${precisao >= valor ? 'text-yellow-500' : 'text-gray-300'}`}
                                    >
                                        <Star className="w-6 h-6" fill={precisao >= valor ? 'currentColor' : 'none'} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <Label>Comentário (opcional)</Label>
                            <Textarea
                                placeholder={validado 
                                    ? "A análise foi precisa porque..." 
                                    : "O que estava incorreto? Qual seria a análise correta?"
                                }
                                value={comentario}
                                onChange={(e) => setComentario(e.target.value)}
                                className="mt-2"
                                rows={4}
                            />
                        </div>

                        <div className="bg-blue-50 p-3 rounded-lg">
                            <p className="text-xs text-blue-800">
                                💡 Seu feedback ajuda a IA a aprender e melhorar suas análises futuras, tornando o sistema mais preciso e contextual ao seu território.
                            </p>
                        </div>

                        <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={() => setShowDialog(false)}>
                                Cancelar
                            </Button>
                            <Button 
                                onClick={enviarFeedback} 
                                disabled={enviando || precisao === 0}
                                style={{ backgroundColor: '#F2B632' }}
                            >
                                {enviando ? "Enviando..." : "Enviar Feedback"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}