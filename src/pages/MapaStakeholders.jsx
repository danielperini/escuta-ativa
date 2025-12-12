import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Network, Users, AlertCircle } from 'lucide-react';
import GrafoRedeAtores from '@/components/atores/GrafoRedeAtores';

export default function MapaStakeholders() {
  const { data: stakeholders = [], isLoading } = useQuery({
    queryKey: ['stakeholders-mapa'],
    queryFn: () => base44.entities.Stakeholder.list()
  });

  const { data: registros = [] } = useQuery({
    queryKey: ['registros-mapa'],
    queryFn: () => base44.entities.Registro.list('-created_date', 200)
  });

  if (isLoading) {
    return (
      <Card className="p-12 text-center">
        <Users className="w-12 h-12 mx-auto mb-4 text-slate-300 animate-pulse" />
        <p className="text-slate-500">Carregando mapa de stakeholders...</p>
      </Card>
    );
  }

  if (stakeholders.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Network className="w-12 h-12 mx-auto mb-4 text-slate-300" />
        <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhum stakeholder mapeado</h3>
        <p className="text-slate-500">
          Stakeholders são criados automaticamente quando mencionados nos registros
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Mapa de Stakeholders</h2>
        <p className="text-slate-500 mt-1">Visualização de rede e conexões territoriais</p>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-900">
          <p className="font-medium mb-1">Mapa baseado em Comunidade e Município</p>
          <p className="text-blue-700">
            Stakeholders são agrupados por localização mínima. Não é necessário endereço completo.
          </p>
        </div>
      </div>

      <GrafoRedeAtores atores={stakeholders} registros={registros} />
    </div>
  );
}