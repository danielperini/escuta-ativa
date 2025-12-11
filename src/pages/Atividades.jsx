import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Plus, AlertCircle } from "lucide-react";
import { format } from "date-fns";

export default function Atividades() {
    const navigate = useNavigate();

    const { data: atividades, isLoading } = useQuery({
        queryKey: ['atividades'],
        queryFn: () => base44.entities.Atividade.list('-created_date'),
        initialData: []
    });

    const getCategoriaColor = (categoria) => {
        const colors = {
            "Reuniões": "bg-blue-100 text-blue-800",
            "Diálogos espontâneos": "bg-green-100 text-green-800",
            "Demandas recebidas por WhatsApp": "bg-purple-100 text-purple-800",
            "Telefonemas": "bg-orange-100 text-orange-800",
            "Ocorrências gerais": "bg-gray-100 text-gray-800"
        };
        return colors[categoria] || "bg-gray-100 text-gray-800";
    };

    const getOrigemColor = (origem) => {
        const colors = {
            "Comunidade": "bg-emerald-100 text-emerald-800",
            "Poder Público": "bg-indigo-100 text-indigo-800",
            "Organização da Sociedade Civil": "bg-pink-100 text-pink-800",
            "Empresa": "bg-amber-100 text-amber-800"
        };
        return colors[origem] || "bg-gray-100 text-gray-800";
    };

    return (
        <div className="min-h-screen p-6" style={{ backgroundColor: '#f8f9fa' }}>
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            onClick={() => navigate(createPageUrl("Dashboard"))}
                            style={{ borderColor: '#0B1E33', color: '#0B1E33' }}
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Voltar
                        </Button>
                        <h1 className="text-3xl font-bold" style={{ color: '#0B1E33' }}>
                            Atividades
                        </h1>
                    </div>
                    <Button
                        onClick={() => navigate(createPageUrl("NovaAtividade"))}
                        className="text-white"
                        style={{ backgroundColor: '#F2B632' }}
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Nova Atividade
                    </Button>
                </div>

                {isLoading ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500">Carregando atividades...</p>
                    </div>
                ) : atividades.length === 0 ? (
                    <Card>
                        <CardContent className="text-center py-12">
                            <p className="text-gray-500">Nenhuma atividade registrada ainda.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        {atividades.map((atividade) => (
                            <Card key={atividade.id} className="hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex flex-wrap gap-2 mb-3">
                                                <Badge className={getCategoriaColor(atividade.categoria)}>
                                                    {atividade.categoria}
                                                </Badge>
                                                {atividade.origem && (
                                                    <Badge className={getOrigemColor(atividade.origem)}>
                                                        {atividade.origem}
                                                    </Badge>
                                                )}
                                                {atividade.alertas_eticos && atividade.alertas_eticos.length > 0 && (
                                                    <Badge className="bg-red-100 text-red-800">
                                                        <AlertCircle className="w-3 h-3 mr-1" />
                                                        {atividade.alertas_eticos.length} alerta(s) ético(s)
                                                    </Badge>
                                                )}
                                            </div>
                                            <CardTitle className="text-lg" style={{ color: '#0B1E33' }}>
                                                {atividade.descricao.substring(0, 100)}
                                                {atividade.descricao.length > 100 && "..."}
                                            </CardTitle>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {atividade.local && (
                                        <p className="text-sm text-gray-600">
                                            <span className="font-semibold">Local:</span> {atividade.local}
                                        </p>
                                    )}
                                    {atividade.participantes && (
                                        <p className="text-sm text-gray-600">
                                            <span className="font-semibold">Participantes:</span> {atividade.participantes}
                                        </p>
                                    )}
                                    {atividade.data_atividade && (
                                        <p className="text-sm text-gray-600">
                                            <span className="font-semibold">Data:</span> {format(new Date(atividade.data_atividade), 'dd/MM/yyyy HH:mm')}
                                        </p>
                                    )}
                                    {atividade.anexos && atividade.anexos.length > 0 && (
                                        <p className="text-sm text-gray-600">
                                            <span className="font-semibold">Anexos:</span> {atividade.anexos.length} arquivo(s)
                                        </p>
                                    )}
                                    <p className="text-xs text-gray-400 mt-2">
                                        Registrado em: {format(new Date(atividade.created_date), 'dd/MM/yyyy HH:mm')}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}