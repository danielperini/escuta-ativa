import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { AlertTriangle, Clock, MapPin, TrendingUp } from "lucide-react";
import moment from "moment";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function PainelPendencias() {
    const { data: atividades = [] } = useQuery({
        queryKey: ['atividades-pendencias'],
        queryFn: () => base44.entities.Atividade.list('-created_date', 500)
    });

    const pendentes = atividades.filter(a => 
        a.demanda_requer_devolutiva && !a.devolutiva_realizada
    );

    const emAtraso = pendentes.filter(a => {
        const dias = Math.floor((new Date() - new Date(a.created_date)) / (1000 * 60 * 60 * 24));
        return dias >= 15;
    });

    const proximasVencer = pendentes.filter(a => {
        const dias = Math.floor((new Date() - new Date(a.created_date)) / (1000 * 60 * 60 * 24));
        return dias < 15 && dias >= 10;
    });

    const agrupamentoPorComunidade = {};
    pendentes.forEach(p => {
        const com = p.local || 'Não especificada';
        if (!agrupamentoPorComunidade[com]) {
            agrupamentoPorComunidade[com] = { total: 0, atrasadas: 0 };
        }
        agrupamentoPorComunidade[com].total++;
        const dias = Math.floor((new Date() - new Date(p.created_date)) / (1000 * 60 * 60 * 24));
        if (dias >= 15) agrupamentoPorComunidade[com].atrasadas++;
    });

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-l-4 border-red-600">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Em Atraso (+15 dias)</p>
                                <p className="text-3xl font-bold text-red-600">{emAtraso.length}</p>
                            </div>
                            <AlertTriangle className="w-8 h-8 text-red-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-amber-600">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Próximas a Vencer</p>
                                <p className="text-3xl font-bold text-amber-600">{proximasVencer.length}</p>
                            </div>
                            <Clock className="w-8 h-8 text-amber-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-blue-600">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Total Pendente</p>
                                <p className="text-3xl font-bold text-blue-600">{pendentes.length}</p>
                            </div>
                            <TrendingUp className="w-8 h-8 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Pendências por Comunidade</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {Object.entries(agrupamentoPorComunidade).map(([comunidade, dados]) => (
                            <div key={comunidade} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-gray-500" />
                                    <span className="font-semibold text-sm">{comunidade}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Badge className="bg-blue-600">{dados.total} total</Badge>
                                    {dados.atrasadas > 0 && (
                                        <Badge className="bg-red-600">{dados.atrasadas} atrasadas</Badge>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {emAtraso.length > 0 && (
                <Card className="border-2 border-red-600">
                    <CardHeader className="bg-red-50">
                        <CardTitle className="text-red-900">
                            🚨 Devolutivas em Atraso Crítico
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-3">
                        {emAtraso.slice(0, 5).map(ativ => {
                            const diasAtraso = Math.floor((new Date() - new Date(ativ.created_date)) / (1000 * 60 * 60 * 24));
                            
                            return (
                                <div key={ativ.id} className="border border-red-200 bg-red-50 rounded-lg p-3">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                            <p className="font-bold text-sm">{ativ.titulo}</p>
                                            <p className="text-xs text-gray-600">{ativ.local}</p>
                                        </div>
                                        <Badge className="bg-red-600">{diasAtraso} dias</Badge>
                                    </div>
                                    <Link to={createPageUrl("Etapa1") + "?id=" + ativ.id}>
                                        <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 mt-2">
                                            Ver Registro
                                        </Button>
                                    </Link>
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}