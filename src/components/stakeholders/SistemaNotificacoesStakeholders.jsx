import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, X, TrendingUp, AlertTriangle, Users } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function SistemaNotificacoesStakeholders() {
  const [mostrarApenas, setMostrarApenas] = useState('todas');
  const queryClient = useQueryClient();

  const { data: notificacoes = [] } = useQuery({
    queryKey: ['notificacoes-stakeholders'],
    queryFn: () => base44.entities.Notificacao.filter({ 
      tipo: 'stakeholder_atividade'
    }).then(data => data.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)))
  });

  const marcarLidaMutation = useMutation({
    mutationFn: (id) => base44.entities.Notificacao.update(id, { lida: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificacoes-stakeholders'] });
    }
  });

  const descartarMutation = useMutation({
    mutationFn: (id) => base44.entities.Notificacao.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificacoes-stakeholders'] });
    }
  });

  const notificacoesFiltradas = notificacoes.filter(n => {
    if (mostrarApenas === 'nao_lidas') return !n.lida;
    if (mostrarApenas === 'alta_prioridade') return n.prioridade === 'alta';
    return true;
  });

  const getIcone = (tipo) => {
    switch (tipo) {
      case 'mudanca_influencia':
        return <TrendingUp className="w-5 h-5 text-orange-500" />;
      case 'alta_atividade':
        return <Users className="w-5 h-5 text-blue-500" />;
      case 'alerta_critico':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default:
        return <Bell className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notificações de Stakeholders
            {notificacoes.filter(n => !n.lida).length > 0 && (
              <Badge className="bg-red-500">
                {notificacoes.filter(n => !n.lida).length}
              </Badge>
            )}
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant={mostrarApenas === 'todas' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMostrarApenas('todas')}
            >
              Todas
            </Button>
            <Button
              variant={mostrarApenas === 'nao_lidas' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMostrarApenas('nao_lidas')}
            >
              Não Lidas
            </Button>
            <Button
              variant={mostrarApenas === 'alta_prioridade' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMostrarApenas('alta_prioridade')}
            >
              Alta Prioridade
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {notificacoesFiltradas.map((notificacao) => (
            <div
              key={notificacao.id}
              className={`p-4 border rounded-lg transition-all ${
                notificacao.lida ? 'bg-slate-50' : 'bg-white border-[#2D6A4F]'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {getIcone(notificacao.subtipo)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-semibold text-sm">{notificacao.titulo}</h4>
                    <Badge variant={notificacao.prioridade === 'alta' ? 'destructive' : 'secondary'}>
                      {notificacao.prioridade}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600 mb-2">{notificacao.mensagem}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      {format(new Date(notificacao.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                    <div className="flex gap-2">
                      {!notificacao.lida && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => marcarLidaMutation.mutate(notificacao.id)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Marcar como lida
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => descartarMutation.mutate(notificacao.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Descartar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {notificacoesFiltradas.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <Bell className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>Nenhuma notificação encontrada</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}