import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Clock, CheckCircle, X } from "lucide-react";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";

export default function MonitorDevolutivas() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [notificacoesVisiveis, setNotificacoesVisiveis] = useState(true);

    const { data: registros = [] } = useQuery({
        queryKey: ['registros-devolutivas'],
        queryFn: () => base44.entities.Registro.list('-created_date', 100)
    });

    const marcarDevolutivaMutation = useMutation({
        mutationFn: ({ registroId, demandaIndex, status }) => {
            const registro = registros.find(r => r.id === registroId);
            const demandas = [...registro.demandas];
            demandas[demandaIndex] = {
                ...demandas[demandaIndex],
                devolutiva_realizada: true,
                data_devolutiva: new Date().toISOString().split('T')[0],
                status: status
            };
            return base44.entities.Registro.update(registroId, { demandas });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['registros-devolutivas'] });
        }
    });

    const analisarPendencias = () => {
        const hoje = new Date();
        const pendencias = {
            atrasadas: [],
            proximasVencer: [],
            compromissosAtrasados: []
        };

        registros.forEach(registro => {
            // Analisar demandas
            registro.demandas?.forEach((demanda, index) => {
                if (!demanda.devolutiva_realizada && demanda.requer_devolutiva && demanda.prazo_devolutiva) {
                    const prazo = new Date(demanda.prazo_devolutiva);
                    const diasRestantes = Math.ceil((prazo - hoje) / (1000 * 60 * 60 * 24));
                    
                    if (diasRestantes < 0) {
                        pendencias.atrasadas.push({
                            tipo: 'demanda',
                            registro,
                            demanda,
                            demandaIndex: index,
                            diasAtraso: Math.abs(diasRestantes),
                            prazo: demanda.prazo_devolutiva
                        });
                    } else if (diasRestantes <= 3) {
                        pendencias.proximasVencer.push({
                            tipo: 'demanda',
                            registro,
                            demanda,
                            demandaIndex: index,
                            diasRestantes,
                            prazo: demanda.prazo_devolutiva
                        });
                    }
                }
            });

            // Analisar compromissos
            registro.compromissos?.forEach((compromisso, index) => {
                if (compromisso.status === 'pendente' && compromisso.prazo) {
                    const prazo = new Date(compromisso.prazo);
                    const diasRestantes = Math.ceil((prazo - hoje) / (1000 * 60 * 60 * 24));
                    
                    if (diasRestantes < 0) {
                        pendencias.compromissosAtrasados.push({
                            tipo: 'compromisso',
                            registro,
                            compromisso,
                            compromissoIndex: index,
                            diasAtraso: Math.abs(diasRestantes),
                            prazo: compromisso.prazo
                        });
                    }
                }
            });
        });

        return pendencias;
    };

    const pendencias = analisarPendencias();
    const totalPendencias = pendencias.atrasadas.length + pendencias.proximasVencer.length + pendencias.compromissosAtrasados.length;

    if (!notificacoesVisiveis || totalPendencias === 0) return null;

    return (
        <div className="fixed bottom-6 right-6 w-96 max-w-[calc(100vw-3rem)] space-y-2 z-50">
            {/* Devolutivas atrasadas */}
            {pendencias.atrasadas.length > 0 && (
                <Card className="border-2 border-red-500 bg-red-50 shadow-xl">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2 text-red-900">
                                <AlertTriangle className="w-5 h-5" />
                                {pendencias.atrasadas.length} Devolutivas Atrasadas
                            </CardTitle>
                            <Button variant="ghost" size="icon" onClick={() => setNotificacoesVisiveis(false)}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {pendencias.atrasadas.slice(0, 3).map((item, idx) => (
                            <div key={idx} className="p-3 bg-white rounded border border-red-200">
                                <p className="text-sm font-medium text-slate-900">{item.registro.titulo}</p>
                                <p className="text-xs text-slate-600 mt-1">{item.demanda.descricao}</p>
                                <div className="flex items-center justify-between mt-2">
                                    <Badge variant="destructive" className="text-xs">
                                        {item.diasAtraso} dias de atraso
                                    </Badge>
                                    <div className="flex gap-1">
                                        <Button 
                                            size="sm" 
                                            variant="outline"
                                            onClick={() => marcarDevolutivaMutation.mutate({ 
                                                registroId: item.registro.id, 
                                                demandaIndex: item.demandaIndex,
                                                status: 'atendida'
                                            })}
                                        >
                                            <CheckCircle className="w-3 h-3 mr-1" />
                                            Atendida
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {pendencias.atrasadas.length > 3 && (
                            <p className="text-xs text-center text-red-700">
                                +{pendencias.atrasadas.length - 3} mais atrasadas
                            </p>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Devolutivas próximas de vencer */}
            {pendencias.proximasVencer.length > 0 && (
                <Card className="border-2 border-amber-500 bg-amber-50 shadow-xl">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2 text-amber-900">
                                <Clock className="w-5 h-5" />
                                {pendencias.proximasVencer.length} Devolutivas Próximas
                            </CardTitle>
                            <Button variant="ghost" size="icon" onClick={() => setNotificacoesVisiveis(false)}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {pendencias.proximasVencer.slice(0, 2).map((item, idx) => (
                            <div key={idx} className="p-3 bg-white rounded border border-amber-200">
                                <p className="text-sm font-medium text-slate-900">{item.registro.titulo}</p>
                                <p className="text-xs text-slate-600 mt-1">{item.demanda.descricao}</p>
                                <Badge variant="outline" className="mt-2 text-xs bg-amber-100 text-amber-800">
                                    Vence em {item.diasRestantes} {item.diasRestantes === 1 ? 'dia' : 'dias'}
                                </Badge>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Compromissos atrasados */}
            {pendencias.compromissosAtrasados.length > 0 && (
                <Card className="border-2 border-orange-500 bg-orange-50 shadow-xl">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2 text-orange-900">
                            <AlertTriangle className="w-5 h-5" />
                            {pendencias.compromissosAtrasados.length} Compromissos Atrasados
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {pendencias.compromissosAtrasados.slice(0, 2).map((item, idx) => (
                            <div key={idx} className="p-3 bg-white rounded border border-orange-200">
                                <p className="text-sm font-medium text-slate-900">{item.compromisso.descricao}</p>
                                <p className="text-xs text-slate-600">Registro: {item.registro.titulo}</p>
                                <Badge variant="destructive" className="mt-2 text-xs">
                                    {item.diasAtraso} dias de atraso
                                </Badge>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}