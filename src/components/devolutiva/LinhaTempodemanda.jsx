import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Clock, MessageSquare, Link2, CheckCircle, AlertCircle } from "lucide-react";
import moment from "moment";

export default function LinhaTempodemanda({ atividadeId }) {
    const { data: atividade } = useQuery({
        queryKey: ['atividade-timeline', atividadeId],
        queryFn: async () => {
            const atividades = await base44.entities.Atividade.list();
            return atividades.find(a => a.id === atividadeId);
        }
    });

    const { data: atividadesRelacionadas = [] } = useQuery({
        queryKey: ['atividades-relacionadas', atividadeId],
        queryFn: async () => {
            if (!atividade) return [];
            
            const todas = await base44.entities.Atividade.list();
            
            const relacionadas = todas.filter(a => 
                a.registros_continuidade?.includes(atividadeId) ||
                a.registro_origem_continuidade === atividadeId ||
                atividade.registros_continuidade?.includes(a.id)
            );

            return relacionadas;
        },
        enabled: !!atividade
    });

    if (!atividade) return null;

    const construirLinhaTempo = () => {
        const eventos = [];

        // Registro inicial
        eventos.push({
            data: atividade.created_date,
            tipo: 'registro_inicial',
            titulo: 'Demanda Registrada',
            descricao: atividade.titulo,
            icon: MessageSquare,
            cor: 'blue'
        });

        // Encaminhamento
        if (atividade.encaminhamento_realizado) {
            eventos.push({
                data: atividade.data_encaminhamento,
                tipo: 'encaminhamento',
                titulo: 'Encaminhamento Realizado',
                descricao: atividade.detalhes_encaminhamento,
                icon: Link2,
                cor: 'purple'
            });
        }

        // Registros de continuidade
        atividadesRelacionadas.forEach(rel => {
            eventos.push({
                data: rel.created_date,
                tipo: 'continuidade',
                titulo: 'Registro de Continuidade',
                descricao: rel.titulo,
                icon: MessageSquare,
                cor: 'amber'
            });
        });

        // Devolutiva
        if (atividade.devolutiva_realizada) {
            eventos.push({
                data: atividade.data_devolutiva,
                tipo: 'devolutiva',
                titulo: 'Devolutiva Realizada',
                descricao: atividade.conteudo_devolutiva,
                resultado: atividade.resultado_devolutiva,
                icon: CheckCircle,
                cor: 'green'
            });
        } else if (atividade.demanda_requer_devolutiva) {
            const diasDecorridos = Math.floor((new Date() - new Date(atividade.created_date)) / (1000 * 60 * 60 * 24));
            eventos.push({
                data: new Date().toISOString(),
                tipo: 'pendente',
                titulo: diasDecorridos >= 15 ? '⚠️ Devolutiva em Atraso' : 'Aguardando Devolutiva',
                descricao: `${diasDecorridos} dias desde o registro`,
                icon: AlertCircle,
                cor: diasDecorridos >= 15 ? 'red' : 'gray'
            });
        }

        return eventos.sort((a, b) => new Date(a.data) - new Date(b.data));
    };

    const linhaTempo = construirLinhaTempo();

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Linha do Tempo da Demanda
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {linhaTempo.map((evento, idx) => {
                        const Icone = evento.icon;
                        const corMap = {
                            blue: 'border-blue-600 bg-blue-50',
                            purple: 'border-purple-600 bg-purple-50',
                            amber: 'border-amber-600 bg-amber-50',
                            green: 'border-green-600 bg-green-50',
                            red: 'border-red-600 bg-red-50',
                            gray: 'border-gray-600 bg-gray-50'
                        };

                        return (
                            <div key={idx} className="relative pl-8">
                                {idx < linhaTempo.length - 1 && (
                                    <div className="absolute left-3 top-8 bottom-0 w-0.5 bg-gray-300" />
                                )}
                                
                                <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-2 flex items-center justify-center ${corMap[evento.cor]}`}>
                                    <Icone className="w-3 h-3" />
                                </div>

                                <div className={`border-l-2 pl-4 pb-4 ${corMap[evento.cor]}`}>
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="font-semibold text-sm text-gray-900">{evento.titulo}</p>
                                        <span className="text-xs text-gray-500">
                                            {moment(evento.data).format('DD/MM/YYYY HH:mm')}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-700">{evento.descricao}</p>
                                    {evento.resultado && (
                                        <Badge className="mt-2 text-xs">
                                            Resultado: {evento.resultado}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}