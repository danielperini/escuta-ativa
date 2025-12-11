import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Save, ArrowRight } from "lucide-react";

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

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6">
            <div className="max-w-3xl mx-auto py-12">
                <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 space-y-8">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-indigo-100 text-indigo-700 rounded-full w-10 h-10 flex items-center justify-center font-bold">
                                1
                            </div>
                            <h1 className="text-3xl font-bold text-gray-900">Etapa 1</h1>
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
                            className="w-full sm:w-auto border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 font-semibold px-8 py-6 rounded-xl"
                        >
                            <Save className="w-5 h-5 mr-2" />
                            Salvar
                        </Button>
                        
                        <Button
                            onClick={handleProxima}
                            disabled={loading || !resposta.trim()}
                            size="lg"
                            className="w-full sm:flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold px-8 py-6 rounded-xl"
                        >
                            Próxima etapa
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}