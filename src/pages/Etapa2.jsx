import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Save, CheckCircle, AlertTriangle } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export default function Etapa2() {
    const navigate = useNavigate();
    const urlParams = new URLSearchParams(window.location.search);
    const registroId = urlParams.get("id");
    
    const [resposta, setResposta] = useState("");
    const [loading, setLoading] = useState(false);
    const [showDialog, setShowDialog] = useState(false);

    useEffect(() => {
        if (registroId) {
            base44.entities.Registro.list().then(registros => {
                const registro = registros.find(r => r.id === registroId);
                if (registro && registro.etapa2_resposta) {
                    setResposta(registro.etapa2_resposta);
                }
            });
        }
    }, [registroId]);

    const handleSalvar = async () => {
        if (!registroId) return;
        setLoading(true);
        await base44.entities.Registro.update(registroId, {
            etapa2_resposta: resposta
        });
        setLoading(false);
    };

    const handleFinalizar = () => {
        if (!resposta.trim()) return;
        setShowDialog(true);
    };

    const confirmarFinalizacao = async () => {
        if (!registroId) return;
        setLoading(true);
        await base44.entities.Registro.update(registroId, {
            etapa2_resposta: resposta,
            status: "finalizado",
            data_finalizacao: new Date().toISOString()
        });
        setLoading(false);
        setShowDialog(false);
        navigate(createPageUrl("Dashboard"));
    };

    const handlePanico = () => {
        if (window.confirm("⚠️ Você está prestes a acionar o BOTÃO DE PÂNICO. Deseja continuar?")) {
            alert("Alerta de emergência enviado!");
        }
    };

    return (
        <div className="min-h-screen p-6" style={{ backgroundColor: '#f8f9fa' }}>
            <div className="max-w-3xl mx-auto py-12">
                <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 space-y-8" style={{ borderTop: '4px solid #F2B632' }}>
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="rounded-full w-10 h-10 flex items-center justify-center font-bold text-white" style={{ backgroundColor: '#0B1E33' }}>
                                2
                            </div>
                            <h1 className="text-3xl font-bold" style={{ color: '#0B1E33' }}>Etapa 2</h1>
                        </div>
                        <p className="text-gray-600 text-lg">
                            Continue suas reflexões e considerações finais
                        </p>
                    </div>

                    <div>
                        <Textarea
                            placeholder="Digite suas respostas aqui..."
                            value={resposta}
                            onChange={(e) => setResposta(e.target.value)}
                            className="min-h-[300px] text-lg p-4 rounded-xl border-2 focus:border-purple-500"
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <Button
                            onClick={handleSalvar}
                            disabled={loading || !resposta.trim()}
                            variant="outline"
                            size="lg"
                            className="w-full sm:w-auto font-semibold px-8 py-6 rounded-xl border-2"
                            style={{ borderColor: '#0B1E33', color: '#0B1E33' }}
                        >
                            <Save className="w-5 h-5 mr-2" />
                            Salvar
                        </Button>
                        
                        <Button
                            onClick={handleFinalizar}
                            disabled={loading || !resposta.trim()}
                            size="lg"
                            className="w-full sm:flex-1 text-white font-semibold px-8 py-6 rounded-xl"
                            style={{ backgroundColor: '#F2B632' }}
                        >
                            <CheckCircle className="w-5 h-5 mr-2" />
                            Finalizar Registro
                        </Button>
                    </div>

                    <div className="flex justify-center mt-6">
                        <Button
                            onClick={handlePanico}
                            variant="outline"
                            className="bg-red-600 hover:bg-red-700 text-white border-0"
                        >
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            Botão de Pânico
                        </Button>
                    </div>
                </div>
            </div>

            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-2xl">Confirmação</DialogTitle>
                        <DialogDescription className="text-lg pt-4">
                            As informações foram revisadas. Estou de acordo.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-4">
                        <Button
                            onClick={() => setShowDialog(false)}
                            variant="outline"
                            size="lg"
                            className="w-full sm:w-auto border-2"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={confirmarFinalizacao}
                            disabled={loading}
                            size="lg"
                            className="w-full sm:flex-1 text-white"
                            style={{ backgroundColor: '#F2B632' }}
                        >
                            Confirmar e Finalizar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}