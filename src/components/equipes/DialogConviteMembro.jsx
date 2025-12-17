import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Mail, Shield, Edit, Eye, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const PAPEIS = {
  administrador_equipe: {
    label: 'Administrador da Equipe',
    icon: Shield,
    color: 'bg-emerald-100 text-emerald-700',
    descricao: 'Gerencia membros e permissões da equipe. Acesso total aos registros, casos e dados da equipe.'
  },
  editor: {
    label: 'Editor',
    icon: Edit,
    color: 'bg-blue-100 text-blue-700',
    descricao: 'Pode criar, editar e excluir registros. Criar e atualizar casos. Anexar evidências.'
  },
  observador: {
    label: 'Observador',
    icon: Eye,
    color: 'bg-slate-100 text-slate-700',
    descricao: 'Pode visualizar registros, casos e dados. Não pode editar ou excluir.'
  }
};

export default function DialogConviteMembro({ open, onOpenChange, equipe }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    email: '',
    papel: 'observador',
    mensagem: ''
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const enviarConviteMutation = useMutation({
    mutationFn: async (data) => {
      const token = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      const dataExpiracao = new Date();
      dataExpiracao.setDate(dataExpiracao.getDate() + 7);

      const convite = await base44.entities.ConviteEquipe.create({
        equipe_id: equipe.id,
        equipe_nome: equipe.nome,
        email_convidado: data.email,
        papel: data.papel,
        enviado_por: user?.email,
        token,
        status: 'pendente',
        data_expiracao: dataExpiracao.toISOString(),
        mensagem_personalizada: data.mensagem
      });

      const linkConvite = `${window.location.origin}${window.location.pathname}?convite=${token}`;
      
      await base44.integrations.Core.SendEmail({
        to: data.email,
        subject: `Convite para equipe: ${equipe.nome} - Societa.ai`,
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693acc814baf8083c262896b/8a81a6207_transparent-Photoroom12.png" alt="Societa.ai" style="height: 60px;" />
            </div>
            <h2 style="color: #E31E24; margin-bottom: 20px;">Você foi convidado para a equipe ${equipe.nome}!</h2>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0;"><strong>Papel:</strong> ${PAPEIS[data.papel].label}</p>
              <p style="margin: 0; color: #666; font-size: 14px;">${PAPEIS[data.papel].descricao}</p>
            </div>
            ${data.mensagem ? `
              <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196f3;">
                <p style="margin: 0; font-style: italic;">"${data.mensagem}"</p>
                <p style="margin: 5px 0 0 0; font-size: 12px; color: #666;">— ${user?.full_name}</p>
              </div>
            ` : ''}
            <div style="margin: 30px 0; text-align: center;">
              <a href="${linkConvite}" 
                 style="background-color: #E31E24; color: white; padding: 14px 32px; 
                        text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                Aceitar Convite
              </a>
            </div>
            <p style="color: #999; font-size: 12px; text-align: center;">
              Este convite expira em 7 dias
            </p>
          </div>
        `
      });

      return convite;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['convites'] });
      queryClient.invalidateQueries({ queryKey: ['equipes'] });
      toast.success('Convite enviado com sucesso!');
      setFormData({ email: '', papel: 'observador', mensagem: '' });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error('Erro ao enviar convite');
      console.error(error);
    }
  });

  const handleSubmit = () => {
    if (!formData.email) {
      toast.error('Email é obrigatório');
      return;
    }

    if (equipe.membros?.some(m => m.email === formData.email)) {
      toast.error('Este usuário já é membro da equipe');
      return;
    }

    enviarConviteMutation.mutate(formData);
  };

  const papelConfig = PAPEIS[formData.papel];
  const PapelIcon = papelConfig.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Convidar Novo Membro</DialogTitle>
          <DialogDescription>
            Envie um convite para adicionar um membro à equipe {equipe?.nome}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Email do convidado *</Label>
            <Input
              type="email"
              placeholder="email@exemplo.com"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Papel na Equipe</Label>
            <Select
              value={formData.papel}
              onValueChange={(value) => setFormData(prev => ({ ...prev, papel: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PAPEIS).map(([key, config]) => {
                  const Icon = config.icon;
                  return (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        {config.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 flex gap-3">
              <PapelIcon className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900 mb-1">{papelConfig.label}</p>
                <p className="text-xs text-blue-700">{papelConfig.descricao}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Mensagem Personalizada (opcional)</Label>
            <Textarea
              placeholder="Adicione uma mensagem de boas-vindas..."
              value={formData.mensagem}
              onChange={(e) => setFormData(prev => ({ ...prev, mensagem: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 flex gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">
              O usuário precisará aceitar o convite para entrar na equipe. O convite expira em 7 dias.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={enviarConviteMutation.isPending || !formData.email}
            className="bg-[#E31E24] hover:bg-[#B01419]"
          >
            <Mail className="w-4 h-4 mr-2" />
            {enviarConviteMutation.isPending ? 'Enviando...' : 'Enviar Convite'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}