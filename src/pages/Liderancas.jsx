import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Plus, User, AlertTriangle, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

export default function Liderancas() {
    const navigate = useNavigate();

    const { data: liderancas, isLoading } = useQuery({
        queryKey: ['liderancas'],
        queryFn: () => base44.entities.LiderancaComunitaria.list('-updated_date'),
        initialData: []
    });

    const getAvaliacaoColor = (avaliacao) => {
        const colors = {
            "boa": "bg-green-100 text-green-800",
            "média": "bg-yellow-100 text-yellow-800",
            "difícil": "bg-red-100 text-red-800",
            "neutro": "bg-gray-100 text-gray-800"
        };
        return colors[avaliacao] || "bg-gray-100 text-gray-800";
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
                            Lideranças Comunitárias
                        </h1>
                    </div>
                    <Button
                        onClick={() => navigate(createPageUrl("NovaLideranca"))}
                        className="text-white"
                        style={{ backgroundColor: '#F2B632' }}
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Nova Liderança
                    </Button>
                </div>

                {isLoading ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500">Carregando lideranças...</p>
                    </div>
                ) : liderancas.length === 0 ? (
                    <Card>
                        <CardContent className="text-center py-12">
                            <p className="text-gray-500">Nenhuma liderança cadastrada ainda.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {liderancas.map((lideranca) => (
                            <Card key={lideranca.id} className="hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <div className="flex items-start gap-3">
                                        <div className="p-3 rounded-full" style={{ backgroundColor: '#F2B632' }}>
                                            <User className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <CardTitle className="text-lg" style={{ color: '#0B1E33' }}>
                                                {lideranca.nome}
                                            </CardTitle>
                                            {lideranca.nome_social && (
                                                <p className="text-sm text-gray-500">({lideranca.nome_social})</p>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div>
                                        <p className="text-sm font-semibold" style={{ color: '#0B1E33' }}>
                                            {lideranca.comunidade}
                                        </p>
                                        {lideranca.papel_na_comunidade && (
                                            <p className="text-xs text-gray-600">{lideranca.papel_na_comunidade}</p>
                                        )}
                                    </div>

                                    {lideranca.avaliacao_interlocucao && (
                                        <Badge className={getAvaliacaoColor(lideranca.avaliacao_interlocucao)}>
                                            Interlocução: {lideranca.avaliacao_interlocucao}
                                        </Badge>
                                    )}

                                    <div className="flex flex-wrap gap-2">
                                        {lideranca.autorizado_LGPD ? (
                                            <Badge className="bg-green-100 text-green-800">
                                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                                LGPD OK
                                            </Badge>
                                        ) : (
                                            <Badge className="bg-yellow-100 text-yellow-800">
                                                <AlertTriangle className="w-3 h-3 mr-1" />
                                                Aguardando autorização
                                            </Badge>
                                        )}

                                        {lideranca.necessidade_atualizacao && (
                                            <Badge className="bg-orange-100 text-orange-800">
                                                Atualizar cadastro
                                            </Badge>
                                        )}
                                    </div>

                                    {lideranca.ultima_interacao && (
                                        <p className="text-xs text-gray-400 mt-2">
                                            Última interação: {format(new Date(lideranca.ultima_interacao), 'dd/MM/yyyy')}
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}