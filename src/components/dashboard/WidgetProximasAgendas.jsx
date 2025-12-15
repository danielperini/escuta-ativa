import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Clock } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function WidgetProximasAgendas() {
  const { data: agendas = [] } = useQuery({
    queryKey: ['proximas-agendas'],
    queryFn: async () => {
      const todas = await base44.entities.Agenda.list('data', 50);
      const hoje = new Date();
      return todas.filter(a => {
        const dataAgenda = new Date(a.data);
        return dataAgenda >= hoje && ['confirmada', 'prevista', 'acordada'].includes(a.status);
      }).slice(0, 5);
    }
  });

  const getDiasRestantes = (data) => {
    return differenceInDays(new Date(data), new Date());
  };

  const getCorUrgencia = (dias) => {
    if (dias === 0) return 'bg-red-100 text-red-700 border-red-300';
    if (dias <= 3) return 'bg-amber-100 text-amber-700 border-amber-300';
    return 'bg-blue-100 text-blue-700 border-blue-300';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          Próximas Agendas
          {agendas.length > 0 && (
            <Badge variant="secondary">{agendas.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {agendas.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">
            Nenhuma agenda programada
          </p>
        ) : (
          <div className="space-y-3">
            {agendas.map(agenda => {
              const dias = getDiasRestantes(agenda.data);
              return (
                <div 
                  key={agenda.id} 
                  className="p-4 rounded-lg border-2 bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-slate-900 flex-1">{agenda.titulo}</h4>
                    <Badge className={getCorUrgencia(dias)} variant="outline">
                      <Clock className="w-3 h-3 mr-1" />
                      {dias === 0 ? 'Hoje' : dias === 1 ? 'Amanhã' : `${dias}d`}
                    </Badge>
                  </div>
                  
                  <div className="space-y-1 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{format(new Date(agenda.data), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                    </div>
                    
                    {agenda.comunidade && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{agenda.comunidade}</span>
                      </div>
                    )}
                    
                    {agenda.responsaveis?.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>{agenda.responsaveis.slice(0, 2).join(', ')}</span>
                        {agenda.responsaveis.length > 2 && (
                          <span className="text-xs">+{agenda.responsaveis.length - 2}</span>
                        )}
                      </div>
                    )}
                  </div>

                  <Badge variant="outline" className="mt-2 text-xs capitalize">
                    {agenda.tipo}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}