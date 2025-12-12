import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Clock, Calendar, MessageSquare, MapPin, CheckCircle2, ExternalLink } from "lucide-react";
import moment from "moment";
import RegistroDevolutiva from "./RegistroDevolutiva";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function MonitorDevolutivas() {
    const navigate = useNavigate();
    const [devolutivasAtrasadas, setDevolutivasAtrasadas] = useState([]);
    const [registroSelecionado, setRegistroSelecionado] = useState(null);
    const [autoDismissed, setAutoDismissed] = useState(false);

    const { data: atividades = [] } = useQuery({
        queryKey: ['atividades-devolutivas'],
        queryFn: () => base44.entities.Atividade.list('-created_date', 500)
    });

    const { data: user } = useQuery({
        queryKey: ['user-config-devolutivas'],
        queryFn: () => base44.auth.me()
    });

    useEffect(() => {
        verificarDevolutivasAtrasadas();
    }, [atividades, user]);

    // Auto-dismiss após 10 segundos
    useEffect(() => {
        if (devolutivasAtrasadas.length > 0 && !autoDismissed) {
            const timer = setTimeout(() => {
                setAutoDismissed(true);
                setDevolutivasAtrasadas([]);
            }, 10000);
            return () => clearTimeout(timer);
        }
    }, [devolutivasAtrasadas, autoDismissed]);

    const verificarDevolutivasAtrasadas = () => {
        const hoje = new Date();
        const prazoDevolutiva = user?.configuracoes?.prazo_devolutiva_dias || 15;

        const atrasadas = atividades.filter(a => {
            if (!a.demanda_requer_devolutiva) return false;
            if (a.devolutiva_realizada) return false;

            const dataRegistro = new Date(a.created_date);
            const diasDecorridos = Math.floor((hoje - dataRegistro) / (1000 * 60 * 60 * 24));

            return diasDecorridos >= prazoDevolutiva;
        });

        setDevolutivasAtrasadas(atrasadas);

        // Gerar notificações automáticas
        atrasadas.forEach(async (ativ) => {
            const notificacaoExiste = await base44.entities.Notificacao.list();
            const jaNotificado = notificacaoExiste.some(n => 
                n.entidade_relacionada_id === ativ.id && 
                n.tipo === 'nova_demanda'
            );

            if (!jaNotificado) {
                await base44.entities.Notificacao.create({
                    tipo: 'nova_demanda',
                    titulo: `⚠️ Devolutiva em Atraso - ${ativ.local}`,
                    mensagem: `A demanda registrada em ${moment(ativ.created_date).format('DD/MM/YYYY')} para ${ativ.local} não possui devolutiva há ${Math.floor((hoje - new Date(ativ.created_date)) / (1000 * 60 * 60 * 24))} dias.`,
                    prioridade: 'alta',
                    entidade_relacionada_tipo: 'Atividade',
                    entidade_relacionada_id: ativ.id
                });

                // Atualizar status
                await base44.entities.Atividade.update(ativ.id, {
                    status_devolutiva: 'em_atraso'
                });
            }
        });
    };

    if (devolutivasAtrasadas.length === 0) return null;

    return (
        <>
            {registroSelecionado && (
                <RegistroDevolutiva
                    atividade={registroSelecionado}
                    onFechar={() => setRegistroSelecionado(null)}
                    onSalvar={async (devolutiva) => {
                        await base44.entities.Atividade.update(registroSelecionado.id, {
                            devolutiva_realizada: true,
                            data_devolutiva: new Date().toISOString(),
                            conteudo_devolutiva: devolutiva.conteudo,
                            resultado_devolutiva: devolutiva.resultado,
                            status_devolutiva: 'realizada'
                        });
                        setRegistroSelecionado(null);
                        verificarDevolutivasAtrasadas();
                    }}
                />
            )}

            <Card className="border-2 border-red-600">
                <CardHeader className="bg-red-50">
                    <CardTitle className="flex items-center gap-2 text-red-900">
                        <AlertTriangle className="w-6 h-6" />
                        {devolutivasAtrasadas.length} Devolutiva(s) em Atraso (+ de 15 dias)
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-3">
                    {devolutivasAtrasadas.map((ativ) => {
                        const diasAtraso = Math.floor((new Date() - new Date(ativ.created_date)) / (1000 * 60 * 60 * 24));
                        
                        return (
                            <div key={ativ.id} className="border-2 border-red-200 bg-red-50 rounded-lg p-4">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                        <p className="font-bold text-gray-900">{ativ.titulo}</p>
                                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {moment(ativ.created_date).format('DD/MM/YYYY')}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <MapPin className="w-3 h-3" />
                                                {ativ.local}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge className="bg-red-600">
                                            {diasAtraso} dias de atraso
                                        </Badge>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => navigate(createPageUrl('Compromissos'))}
                                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                        >
                                            <ExternalLink className="w-3 h-3" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={() => setRegistroSelecionado(ativ)}
                                            className="bg-emerald-600 hover:bg-emerald-700"
                                        >
                                            <CheckCircle2 className="w-3 h-3" />
                                        </Button>
                                    </div>
                                    </div>

                                    {ativ.demandas && ativ.demandas.length > 0 && (
                                    <div className="mt-3">
                                        <p className="text-xs font-semibold text-gray-700 mb-1">Demandas:</p>
                                        <ul className="space-y-1">
                                            {ativ.demandas.slice(0, 2).map((d, i) => (
                                                <li key={i} className="text-xs text-gray-600">• {d}</li>
                                            ))}
                                        </ul>
                                    </div>
                                    )}
                            </div>
                        );
                    })}
                </CardContent>
            </Card>
        </>
    );
}