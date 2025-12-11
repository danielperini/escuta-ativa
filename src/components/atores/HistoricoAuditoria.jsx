import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Clock, User, FileEdit } from "lucide-react";
import moment from "moment";

export default function HistoricoAuditoria({ atorId, tipoAtor }) {
    const { data: historico = [], isLoading } = useQuery({
        queryKey: ['auditoria', atorId],
        queryFn: async () => {
            // Buscar no histórico de auditoria
            const entidade = tipoAtor === 'lideranca' ? 'LiderancaComunitaria' : 'ProjetoOrganizacao';
            const ator = await base44.entities[entidade].list();
            const registro = ator.find(a => a.id === atorId);
            
            return registro?.historico_auditoria || [];
        }
    });

    if (isLoading) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <p className="text-sm text-gray-500">Carregando histórico...</p>
                </CardContent>
            </Card>
        );
    }

    if (historico.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4" />
                        Histórico de Alterações
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-gray-500">Nenhuma alteração registrada ainda</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Histórico de Alterações ({historico.length})
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                {historico.map((item, idx) => (
                    <div key={idx} className="border-l-2 border-blue-600 pl-3 py-2 bg-gray-50 rounded-r">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <FileEdit className="w-4 h-4 text-blue-600" />
                                <span className="text-sm font-semibold text-gray-900">
                                    {item.campo_alterado}
                                </span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                                {moment(item.data_alteracao).format('DD/MM/YYYY HH:mm')}
                            </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                            <div>
                                <p className="text-gray-500">Valor Anterior:</p>
                                <p className="font-medium text-gray-900 break-words">
                                    {item.valor_anterior || '(vazio)'}
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-500">Novo Valor:</p>
                                <p className="font-medium text-gray-900 break-words">
                                    {item.valor_novo}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-gray-600">
                            <div className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {item.usuario_responsavel}
                            </div>
                            {item.justificativa && (
                                <div>
                                    💬 {item.justificativa}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}