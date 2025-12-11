import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Users, Building2, Link as LinkIcon } from "lucide-react";

export default function AtividadeConexoes({ atividadeId, liderancasIds = [], organizacoesIds = [] }) {
    const { data: liderancas } = useQuery({
        queryKey: ['liderancas', liderancasIds],
        queryFn: async () => {
            if (!liderancasIds || liderancasIds.length === 0) return [];
            const todas = await base44.entities.LiderancaComunitaria.list();
            return todas.filter(l => liderancasIds.includes(l.id));
        },
        enabled: liderancasIds && liderancasIds.length > 0,
        initialData: []
    });

    const { data: organizacoes } = useQuery({
        queryKey: ['organizacoes', organizacoesIds],
        queryFn: async () => {
            if (!organizacoesIds || organizacoesIds.length === 0) return [];
            const todas = await base44.entities.ProjetoOrganizacao.list();
            return todas.filter(o => organizacoesIds.includes(o.id));
        },
        enabled: organizacoesIds && organizacoesIds.length > 0,
        initialData: []
    });

    if ((!liderancas || liderancas.length === 0) && (!organizacoes || organizacoes.length === 0)) {
        return null;
    }

    return (
        <Card style={{ borderLeft: '3px solid #F2B632' }}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg" style={{ color: '#0B1E33' }}>
                    <LinkIcon className="w-5 h-5" style={{ color: '#F2B632' }} />
                    Conexões Identificadas pela IA
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {liderancas && liderancas.length > 0 && (
                    <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2" style={{ color: '#0B1E33' }}>
                            <Users className="w-4 h-4" />
                            Lideranças Comunitárias ({liderancas.length})
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {liderancas.map(lideranca => (
                                <Badge key={lideranca.id} className="bg-blue-100 text-blue-800">
                                    {lideranca.nome} - {lideranca.comunidade}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                {organizacoes && organizacoes.length > 0 && (
                    <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2" style={{ color: '#0B1E33' }}>
                            <Building2 className="w-4 h-4" />
                            Organizações ({organizacoes.length})
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {organizacoes.map(org => (
                                <Badge key={org.id} className="bg-purple-100 text-purple-800">
                                    {org.nome_oficial}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}