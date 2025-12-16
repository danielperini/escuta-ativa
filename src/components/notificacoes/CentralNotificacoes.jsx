import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Filter,
  AlertTriangle,
  Calendar,
  Target,
  Users,
  FileText,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from "@/lib/utils";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const ICONES_TIPOS = {
  nova_demanda: AlertTriangle,
  demanda_atrasada: Clock,
  novo_compromisso: CheckCircle,
  compromisso_atrasado: AlertTriangle,
  nova_agenda: Calendar,
  agenda_atrasada: Clock,
  novo_risco: Target,
  risco_critico: AlertTriangle,
  stakeholder_atualizado: Users,
  novo_registro: FileText,
  alerta_etico: AlertTriangle
};

const CORES_PRIORIDADE = {
  baixa: 'border-slate-200 bg-slate-50',
  media: 'border-blue-200 bg-blue-50',
  alta: 'border-amber-200 bg-amber-50',
  urgente: 'border-red-200 bg-red-50'
};

export default function CentralNotificacoes() {
  const queryClient = useQueryClient();
  const [filtro, setFiltro] = useState('todos');

  const { data: notificacoes = [], isLoading } = useQuery({
    queryKey: ['notificacoes-central'],
    queryFn: () => base44.entities.Notificacao.list('-created_date', 200)
  });

  const marcarComoLidaMutation = useMutation({
    mutationFn: (id) => base44.entities.Notificacao.update(id, { lida: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificacoes-central'] });
    }
  });

  const marcarTodasComoLidasMutation = useMutation({
    mutationFn: async () => {
      const naoLidas = notificacoes.filter(n => !n.lida);
      await Promise.all(
        naoLidas.map(n => base44.entities.Notificacao.update(n.id, { lida: true }))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificacoes-central'] });
      toast.success('Todas as notificações marcadas como lidas');
    }
  });

  const excluirNotificacaoMutation = useMutation({
    mutationFn: (id) => base44.entities.Notificacao.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificacoes-central'] });
      toast.success('Notificação excluída');
    }
  });

  const limparLidasMutation = useMutation({
    mutationFn: async () => {
      const lidas = notificacoes.filter(n => n.lida);
      await Promise.all(
        lidas.map(n => base44.entities.Notificacao.delete(n.id))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificacoes-central'] });
      toast.success('Notificações lidas excluídas');
    }
  });

  const notificacoesFiltradas = notificacoes.filter(n => {
    if (filtro === 'nao_lidas') return !n.lida;
    if (filtro === 'lidas') return n.lida;
    if (filtro === 'urgentes') return n.prioridade === 'alta' || n.prioridade === 'urgente';
    return true;
  });

  const naoLidas = notificacoes.filter(n => !n.lida).length;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Central de Notificações
              {naoLidas > 0 && (
                <Badge className="bg-red-600">{naoLidas} novas</Badge>
              )}
            </CardTitle>
            <div className="flex gap-2">
              {naoLidas > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => marcarTodasComoLidasMutation.mutate()}
                >
                  <CheckCheck className="w-4 h-4 mr-2" />
                  Marcar Todas como Lidas
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => limparLidasMutation.mutate()}
                disabled={notificacoes.filter(n => n.lida).length === 0}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Limpar Lidas
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <Tabs value={filtro} onValueChange={setFiltro}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="todos">
                Todas ({notificacoes.length})
              </TabsTrigger>
              <TabsTrigger value="nao_lidas">
                Não Lidas ({naoLidas})
              </TabsTrigger>
              <TabsTrigger value="lidas">
                Lidas ({notificacoes.filter(n => n.lida).length})
              </TabsTrigger>
              <TabsTrigger value="urgentes">
                <AlertTriangle className="w-4 h-4 mr-1" />
                Urgentes
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* Lista de Notificações */}
      <div className="space-y-3">
        {isLoading ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-slate-500">Carregando notificações...</p>
            </CardContent>
          </Card>
        ) : notificacoesFiltradas.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Bell className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500">Nenhuma notificação encontrada</p>
            </CardContent>
          </Card>
        ) : (
          notificacoesFiltradas.map(notificacao => {
            const Icon = ICONES_TIPOS[notificacao.tipo] || Bell;
            const corPrioridade = CORES_PRIORIDADE[notificacao.prioridade] || 'border-slate-200 bg-slate-50';

            return (
              <Card
                key={notificacao.id}
                className={cn(
                  'transition-all hover:shadow-md cursor-pointer',
                  !notificacao.lida && 'border-l-4 border-l-[#E31E24]',
                  corPrioridade
                )}
                onClick={() => {
                  if (!notificacao.lida) {
                    marcarComoLidaMutation.mutate(notificacao.id);
                  }
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
                        !notificacao.lida ? 'bg-[#E31E24] text-white' : 'bg-slate-200 text-slate-600'
                      )}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className={cn(
                            'font-medium text-sm',
                            !notificacao.lida ? 'text-slate-900' : 'text-slate-600'
                          )}>
                            {notificacao.titulo}
                          </p>
                          {!notificacao.lida && (
                            <div className="w-2 h-2 rounded-full bg-[#E31E24]" />
                          )}
                        </div>
                        <p className="text-sm text-slate-600 mb-2">
                          {notificacao.mensagem}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {notificacao.created_date && format(new Date(notificacao.created_date), "dd MMM 'às' HH:mm", { locale: ptBR })}
                          </span>
                          {notificacao.prioridade && (
                            <Badge variant="outline" className="text-xs">
                              {notificacao.prioridade}
                            </Badge>
                          )}
                          {notificacao.status && (
                            <Badge variant="secondary" className="text-xs">
                              {notificacao.status}
                            </Badge>
                          )}
                        </div>
                        {notificacao.entidade_relacionada_id && (
                          <div className="mt-2">
                            <Link
                              to={createPageUrl('VerRegistro') + `?id=${notificacao.entidade_relacionada_id}`}
                              className="text-xs text-[#E31E24] hover:underline"
                            >
                              Ver detalhes →
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {!notificacao.lida && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            marcarComoLidaMutation.mutate(notificacao.id);
                          }}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          excluirNotificacaoMutation.mutate(notificacao.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}