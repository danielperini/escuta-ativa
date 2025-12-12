import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { isBefore, startOfToday } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CheckCircle2, Clock, MapPin, User, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function CompromissosAtrasados() {
  const queryClient = useQueryClient();
  const [expandido, setExpandido] = useState(true);
  const [resolvendoId, setResolvendoId] = useState(null);
  const [observacao, setObservacao] = useState('');

  const { data: compromissos = [] } = useQuery({
    queryKey: ['compromissos'],
    queryFn: () => base44.entities.Compromisso.list('-prazo', 500)
  });

  const resolverMutation = useMutation({
    mutationFn: ({ id, observacoes }) => 
      base44.entities.Compromisso.update(id, { 
        status: 'concluido',
        data_conclusao: new Date().toISOString().split('T')[0],
        observacoes: observacoes || 'Resolvido via painel de atrasados'
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compromissos'] });
      setResolvendoId(null);
      setObservacao('');
    }
  });

  const atrasados = compromissos.filter(c => 
    c.status !== 'concluido' && 
    c.status !== 'cancelado' && 
    c.prazo && 
    isBefore(new Date(c.prazo), startOfToday())
  );

  if (atrasados.length === 0) return null;

  return (
    <Card className="border-2 border-red-300 bg-red-50/50">
      <CardHeader 
        className="cursor-pointer hover:bg-red-100/50 transition-colors"
        onClick={() => setExpandido(!expandido)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-red-900">
            <AlertCircle className="w-5 h-5" />
            Compromissos Atrasados ({atrasados.length})
          </CardTitle>
          {expandido ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </CardHeader>
      
      {expandido && (
        <CardContent className="pt-4">
          <div className="space-y-3">
            {atrasados.map(compromisso => {
              const diasAtraso = Math.floor((startOfToday() - new Date(compromisso.prazo)) / (1000 * 60 * 60 * 24));
              const estaResolvendo = resolvendoId === compromisso.id;

              return (
                <div 
                  key={compromisso.id}
                  className={cn(
                    "p-4 rounded-lg border-2 transition-all",
                    estaResolvendo ? "bg-white border-emerald-300" : "bg-white border-red-200"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-slate-900 mb-2">{compromisso.titulo}</h4>
                      
                      {compromisso.descricao && (
                        <p className="text-sm text-slate-600 mb-2">{compromisso.descricao}</p>
                      )}

                      <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                        {compromisso.responsavel && (
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {compromisso.responsavel}
                          </div>
                        )}
                        {compromisso.comunidade && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {compromisso.comunidade}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Prazo: {new Date(compromisso.prazo).toLocaleDateString('pt-BR')}
                        </div>
                      </div>

                      <Badge className="mt-2 bg-red-100 text-red-700 border-red-300">
                        {diasAtraso} dia{diasAtraso !== 1 ? 's' : ''} atrasado{diasAtraso !== 1 ? 's' : ''}
                      </Badge>

                      {estaResolvendo && (
                        <div className="mt-3 space-y-2">
                          <Textarea
                            placeholder="Observações sobre a resolução (opcional)..."
                            value={observacao}
                            onChange={(e) => setObservacao(e.target.value)}
                            rows={2}
                            className="text-sm"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => resolverMutation.mutate({ 
                                id: compromisso.id, 
                                observacoes: observacao 
                              })}
                              className="bg-emerald-600 hover:bg-emerald-700"
                              disabled={resolverMutation.isPending}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              Confirmar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setResolvendoId(null);
                                setObservacao('');
                              }}
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {!estaResolvendo && (
                      <Button
                        size="sm"
                        onClick={() => setResolvendoId(compromisso.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 flex-shrink-0"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Resolver
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      )}
    </Card>
  );
}