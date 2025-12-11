import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Save, ArrowRight, AlertTriangle } from "lucide-react";

export default function Etapa1() {
    const navigate = useNavigate();
    const [resposta, setResposta] = useState("");
    const [registroId, setRegistroId] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSalvar = async () => {
        setLoading(true);
        if (registroId) {
            await base44.entities.Registro.update(registroId, {
                etapa1_resposta: resposta
            });
        } else {
            const novoRegistro = await base44.entities.Registro.create({
                etapa1_resposta: resposta,
                status: "rascunho"
            });
            setRegistroId(novoRegistro.id);
        }
        setLoading(false);
    };

    const handleProxima = async () => {
        setLoading(true);
        let id = registroId;
        if (!registroId) {
            const novoRegistro = await base44.entities.Registro.create({
                etapa1_resposta: resposta,
                status: "rascunho"
            });
            id = novoRegistro.id;
        } else {
            await base44.entities.Registro.update(registroId, {
                etapa1_resposta: resposta
            });
        }
        setLoading(false);
        navigate(createPageUrl("Etapa2") + "?id=" + id);
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
                                1
                            </div>
                            <h1 className="text-3xl font-bold" style={{ color: '#0B1E33' }}>Etapa 1</h1>
                        </div>
                        <p className="text-gray-600 text-lg">
                            Compartilhe suas reflexões e observações iniciais
                        </p>
                    </div>

                    <div>
                        <Textarea
                            placeholder="Digite suas respostas aqui..."
                            value={resposta}
                            onChange={(e) => setResposta(e.target.value)}
                            className="min-h-[300px] text-lg p-4 rounded-xl border-2 focus:border-indigo-500"
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
                            onClick={handleProxima}
                            disabled={loading || !resposta.trim()}
                            size="lg"
                            className="w-full sm:flex-1 text-white font-semibold px-8 py-6 rounded-xl"
                            style={{ backgroundColor: '#F2B632' }}
                        >
                            Próxima etapa
                            <ArrowRight className="w-5 h-5 ml-2" />
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
        </div>
    );
}