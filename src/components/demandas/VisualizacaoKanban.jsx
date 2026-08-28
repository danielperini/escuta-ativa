import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, User, AlertCircle } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

const statusConfig = {
  pendente: { label: 'Pendente', color: 'bg-slate-100 text-slate-700', border: 'border-slate-300' },
  em_andamento: { label: 'Em Andamento', color: 'bg-blue-100 text-blue-700', border: 'border-blue-300' },
  atendida: { label: 'Atendida', color: 'bg-green-100 text-green-700', border: 'border-green-300' },
  nao_atendida: { label: 'Não Atendida', color: 'bg-red-100 text-red-700', border: 'border-red-300' }
};

const urgenciaConfig = {
  baixa: { color: 'bg-blue-100 text-blue-800' },
  media: { color: 'bg-yellow-100 text-yellow-800' },
  alta: { color: 'bg-orange-100 text-orange-800' },
  critica: { color: 'bg-red-100 text-red-800' }
};

export default function VisualizacaoKanban({ demandas, onAtualizarDemanda, onSelecionarDemanda }) {
  const colunas = [
    { status: 'pendente', titulo: 'Pendente' },
    { status: 'em_andamento', titulo: 'Em Andamento' },
    { status: 'atendida', titulo: 'Atendida' },
    { status: 'nao_atendida', titulo: 'Não Atendida' }
  ];

  const demandasPorStatus = (status) => {
    return demandas.filter(d => (d.status || 'pendente') === status);
  };

  const verificarAtraso = (demanda) => {
    if (!demanda.prazo_devolutiva || demanda.devolutiva_realizada) return null;
    const prazoDate = new Date(demanda.prazo_devolutiva);
    if (isNaN(prazoDate.getTime())) return null;
    const dias = differenceInDays(new Date(), prazoDate);
    return dias > 0 ? dias : null;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {colunas.map(coluna => {
        const demandasColuna = demandasPorStatus(coluna.status);
        const config = statusConfig[coluna.status];

        return (
          <div key={coluna.status} className="flex flex-col">
            <div className={`p-3 rounded-t-lg ${config.color} border-b-2 ${config.border}`}>
              <h3 className="font-semibold text-sm flex items-center justify-between">
                {coluna.titulo}
                <Badge variant="secondary" className="ml-2">
                  {demandasColuna.length}
                </Badge>
              </h3>
            </div>

            <div className="space-y-3 p-3 bg-slate-50 rounded-b-lg min-h-[400px]">
              {demandasColuna.map((demanda, idx) => {
                const diasAtraso = verificarAtraso(demanda);
                
                return (
                  <Card 
                    key={`${demanda.registroId}-${idx}`}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => onSelecionarDemanda(demanda)}
                  >
                    <CardContent className="p-4 space-y-3">
                      {/* Urgência */}
                      <Badge className={urgenciaConfig[demanda.urgencia]?.color || 'bg-slate-100'}>
                        {demanda.urgencia || 'média'}
                      </Badge>

                      {/* Descrição */}
                      <p className="text-sm font-medium text-slate-900 line-clamp-3">
                        {demanda.descricao}
                      </p>

                      {/* Metadados */}
                      <div className="space-y-1 text-xs text-slate-600">
                        {demanda.comunidade && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {demanda.comunidade}
                          </div>
                        )}
                        
                        {demanda.responsavel && (
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {demanda.responsavel}
                          </div>
                        )}

                        {demanda.prazo_devolutiva && !isNaN(new Date(demanda.prazo_devolutiva).getTime()) && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Prazo: {format(new Date(demanda.prazo_devolutiva), 'dd/MM/yyyy')}
                          </div>
                        )}
                      </div>

                      {/* Alerta de atraso */}
                      {diasAtraso && (
                        <div className="flex items-center gap-1 text-xs text-red-600 bg-red-50 p-2 rounded">
                          <AlertCircle className="w-3 h-3" />
                          {diasAtraso} dia{diasAtraso > 1 ? 's' : ''} de atraso
                        </div>
                      )}

                      {/* Ações rápidas */}
                      <div className="flex gap-2 pt-2 border-t">
                        {coluna.status === 'pendente' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="flex-1 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              onAtualizarDemanda({
                                registroId: demanda.registroId,
                                demandaIndex: demanda.demandaIndex,
                                dadosAtualizados: { status: 'em_andamento' }
                              });
                            }}
                          >
                            Iniciar
                          </Button>
                        )}
                        {coluna.status === 'em_andamento' && (
                          <Button 
                            size="sm" 
                            className="flex-1 text-xs bg-green-600 hover:bg-green-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              onAtualizarDemanda({
                                registroId: demanda.registroId,
                                demandaIndex: demanda.demandaIndex,
                                dadosAtualizados: { 
                                  status: 'atendida',
                                  devolutiva_realizada: true,
                                  data_devolutiva: new Date().toISOString().split('T')[0]
                                }
                              });
                            }}
                          >
                            Concluir
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}