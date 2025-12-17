import React, { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Mail, Clock, Shield, Edit, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const PAPEIS = {
  administrador_equipe: { label: 'Administrador da Equipe', icon: Shield, color: 'bg-emerald-100 text-emerald-700' },
  editor: { label: 'Editor', icon: Edit, color: 'bg-blue-100 text-blue-700' },
  observador: { label: 'Observador', icon: Eye, color: 'bg-slate-100 text-slate-700' }
};

export default function GerenciadorConvites() {
  const queryClient = useQueryClient();
  const [conviteAtivo, setConviteAtivo] = React.useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: convites = [] } = useQuery({
    queryKey: ['convites', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const todos = await base44.entities.ConviteEquipe.filter({
        email_convidado: user.email,
        status: 'pendente'
      });
      return todos.filter(c => new Date(c.data_expiracao) > new Date());
    },
    enabled: !!user?.email
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('convite');
    if (token && convites.length > 0) {
      const convite = convites.find(c => c.token === token);
      if (convite) {
        setConviteAtivo(convite);
      }
    }
  }, [convites]);

  const aceitarMutation = useMutation({
    mutationFn: async (convite) => {
      await base44.entities.ConviteEquipe.update(convite.id, {
        status: 'aceito',
        data_resposta: new Date().toISOString()
      });

      const equipes = await base44.entities.Equipe.filter({ id: convite.equipe_id });
      const equipe = equipes[0];

      if (!equipe) throw new Error('Equipe não encontrada');

      const novoMembro = {
        usuario_id: user.id,
        email: user.email,
        nome: user.full_name,
        papel: convite.papel,
        data_entrada: new Date().toISOString(),
        status: 'ativo'
      };

      await base44.entities.Equipe.update(equipe.id, {
        membros: [...(equipe.membros || []), novoMembro]
      });

      return equipe;
    },
    onSuccess: (equipe) => {
      queryClient.invalidateQueries({ queryKey: ['convites'] });
      queryClient.invalidateQueries({ queryKey: ['equipes'] });
      setConviteAtivo(null);
      toast.success(`Você agora faz parte da equipe ${equipe.nome}!`);
      
      const params = new URLSearchParams(window.location.search);
      params.delete('convite');
      window.history.replaceState({}, '', `${window.location.pathname}?${params}`);
    },
    onError: () => {
      toast.error('Erro ao aceitar convite');
    }
  });

  const recusarMutation = useMutation({
    mutationFn: async (convite) => {
      await base44.entities.ConviteEquipe.update(convite.id, {
        status: 'recusado',
        data_resposta: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['convites'] });
      setConviteAtivo(null);
      toast.success('Convite recusado');
      
      const params = new URLSearchParams(window.location.search);
      params.delete('convite');
      window.history.replaceState({}, '', `${window.location.pathname}?${params}`);
    }
  });

  if (convites.length === 0 && !conviteAtivo) return null;

  return (
    <>
      {/* Dialog para convite específico via URL */}
      <Dialog open={!!conviteAtivo} onOpenChange={(open) => !open && setConviteAtivo(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Convite para Equipe</DialogTitle>
            <DialogDescription>
              Você foi convidado para participar de uma equipe
            </DialogDescription>
          </DialogHeader>

          {conviteAtivo && (
            <div className="space-y-4 py-4">
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-slate-500">Equipe</p>
                      <p className="font-semibold text-lg text-slate-900">{conviteAtivo.equipe_nome}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-slate-500 mb-2">Seu papel</p>
                      <Badge className={PAPEIS[conviteAtivo.papel]?.color}>
                        {PAPEIS[conviteAtivo.papel]?.label}
                      </Badge>
                    </div>

                    <div>
                      <p className="text-sm text-slate-500">Convidado por</p>
                      <p className="text-sm text-slate-700">{conviteAtivo.enviado_por}</p>
                    </div>

                    {conviteAtivo.mensagem_personalizada && (
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-900 italic">"{conviteAtivo.mensagem_personalizada}"</p>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Clock className="w-3 h-3" />
                      Expira em {format(new Date(conviteAtivo.data_expiracao), 'dd/MM/yyyy', { locale: ptBR })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => recusarMutation.mutate(conviteAtivo)}
              disabled={recusarMutation.isPending}
            >
              <X className="w-4 h-4 mr-2" />
              Recusar
            </Button>
            <Button
              onClick={() => aceitarMutation.mutate(conviteAtivo)}
              disabled={aceitarMutation.isPending}
              className="bg-[#2D6A4F] hover:bg-[#1B4332]"
            >
              <Check className="w-4 h-4 mr-2" />
              Aceitar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notificações de convites pendentes */}
      {convites.length > 0 && !conviteAtivo && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-blue-900">
                  Você tem {convites.length} convite(s) pendente(s)
                </p>
                <div className="mt-2 space-y-2">
                  {convites.map(convite => (
                    <div key={convite.id} className="flex items-center justify-between bg-white p-2 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{convite.equipe_nome}</p>
                        <p className="text-xs text-slate-500">
                          Como {PAPEIS[convite.papel]?.label}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => setConviteAtivo(convite)}
                        className="bg-[#2D6A4F] hover:bg-[#1B4332]"
                      >
                        Ver Convite
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}