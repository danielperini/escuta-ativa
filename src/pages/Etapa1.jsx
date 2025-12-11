import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Save, ArrowRight, AlertTriangle, MessageSquare, Check } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import LinhaTempodemanda from "../components/devolutiva/LinhaTempodemanda";
import RegistroDevolutiva from "../components/devolutiva/RegistroDevolutiva";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Etapa1() {
    const navigate = useNavigate();
    const [resposta, setResposta] = useState("");
    const [registroId, setRegistroId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showDevolutiva, setShowDevolutiva] = useState(false);

    // Verificar se há ID na URL
    React.useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('id');
        if (id) setRegistroId(id);
    }, []);

    const { data: atividade } = useQuery({
        queryKey: ['atividade-detalhes', registroId],
        queryFn: async () => {
            if (!registroId) return null;
            const atividades = await base44.entities.Atividade.list();
            return atividades.find(a => a.id === registroId);
        },
        enabled: !!registroId
    });

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
            <div className="max-w-5xl mx-auto py-12">
                {showDevolutiva && atividade && (
                    <RegistroDevolutiva
                        atividade={atividade}
                        onFechar={() => setShowDevolutiva(false)}
                        onSalvar={async (devolutiva) => {
                            await base44.entities.Atividade.update(registroId, {
                                devolutiva_realizada: true,
                                data_devolutiva: new Date().toISOString(),
                                conteudo_devolutiva: devolutiva.conteudo,
                                resultado_devolutiva: devolutiva.resultado,
                                status_devolutiva: 'realizada'
                            });
                            setShowDevolutiva(false);
                            alert('✓ Devolutiva registrada!');
                        }}
                    />
                )}

                <div className="grid lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
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

                    <div className="space-y-6">
                        {atividade && (
                            <>
                                {atividade.demanda_requer_devolutiva && !atividade.devolutiva_realizada && (
                                    <Card className="border-2 border-red-600">
                                        <CardHeader className="bg-red-50">
                                            <CardTitle className="text-red-900 text-sm">
                                                ⚠️ Devolutiva Obrigatória
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-4">
                                            <p className="text-xs text-gray-700 mb-3">
                                                Este registro possui demandas que exigem devolutiva.
                                            </p>
                                            <Button
                                                size="sm"
                                                className="w-full bg-blue-600 hover:bg-blue-700"
                                                onClick={() => setShowDevolutiva(true)}
                                            >
                                                <MessageSquare className="w-4 h-4 mr-2" />
                                                Registrar Devolutiva
                                            </Button>
                                        </CardContent>
                                    </Card>
                                )}

                                {atividade.devolutiva_realizada && (
                                    <Card className="border-2 border-green-600">
                                        <CardHeader className="bg-green-50">
                                            <CardTitle className="text-green-900 text-sm flex items-center gap-2">
                                                <Check className="w-4 h-4" />
                                                Devolutiva Realizada
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-4 text-xs">
                                            <p className="text-gray-700 mb-2">{atividade.conteudo_devolutiva}</p>
                                            <Badge className="bg-green-600">
                                                {atividade.resultado_devolutiva}
                                            </Badge>
                                        </CardContent>
                                    </Card>
                                )}

                                <LinhaTempodemanda atividadeId={registroId} />
                                </>
                                )}
                                </div>
                                </div>
                                </div>
                                </div>
                                </div>
                                );
                                }