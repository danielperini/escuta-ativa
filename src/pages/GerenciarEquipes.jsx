import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Plus, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2,
  UserPlus,
  Mail,
  Shield,
  User,
  Upload,
  X,
  Eye,
  Clock,
  Activity,
  Laptop,
  UserX,
  UserCheck,
  Settings,
  Lock
} from 'lucide-react';
import GerenciadorPermissoesGranular from '@/components/permissoes/GerenciadorPermissoesGranular';
import HistoricoPermissoes from '@/components/permissoes/HistoricoPermissoes';
import DialogConviteMembro from '@/components/equipes/DialogConviteMembro';
import GerenciadorConvites from '@/components/equipes/GerenciadorConvites';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const PERMISSOES_CONFIG = {
  administrador: {
    label: 'Administrador',
    icon: Shield,
    color: 'bg-emerald-100 text-emerald-700',
    descricao: 'Controle total: criar/excluir equipes, gerenciar membros e permissões'
  },
  editor: {
    label: 'Editor',
    icon: Edit,
    color: 'bg-blue-100 text-blue-700',
    descricao: 'Visualizar membros e criar conteúdo, sem alterar permissões'
  },
  visualizador: {
    label: 'Visualizador',
    icon: Eye,
    color: 'bg-slate-100 text-slate-700',
    descricao: 'Apenas leitura de informações da equipe'
  }
};

const STATUS_CONFIG = {
  ativo: { label: 'Ativo', color: 'bg-emerald-100 text-emerald-700' },
  convidado: { label: 'Convidado', color: 'bg-amber-100 text-amber-700' },
  inativo: { label: 'Inativo', color: 'bg-slate-100 text-slate-600' }
};

export default function GerenciarEquipes() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showMembersDialog, setShowMembersDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPermissoesDialog, setShowPermissoesDialog] = useState(false);
  const [selectedUserForPermissions, setSelectedUserForPermissions] = useState(null);
  const [editingEquipe, setEditingEquipe] = useState(null);
  const [selectedEquipe, setSelectedEquipe] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [activeTab, setActiveTab] = useState('equipes');
  
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    foto_url: '',
    status: 'ativa'
  });

  const [inviteData, setInviteData] = useState({
    email: '',
    permissao: 'editor'
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: equipes = [], isLoading } = useQuery({
    queryKey: ['equipes'],
    queryFn: () => base44.entities.Equipe.list('-created_date')
  });

  const { data: logs = [] } = useQuery({
    queryKey: ['logs-acesso'],
    queryFn: () => base44.entities.LogAcesso.list('-created_date', 100)
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Equipe.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipes'] });
      setShowCreateDialog(false);
      resetForm();
      registrarLog('criacao', 'Criou nova equipe');
      toast.success('Equipe criada com sucesso!');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Equipe.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipes'] });
      setShowEditDialog(false);
      setShowMembersDialog(false);
      setEditingEquipe(null);
      registrarLog('edicao', 'Atualizou equipe');
      toast.success('Equipe atualizada!');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Equipe.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipes'] });
      setShowDeleteDialog(false);
      setDeleteTarget(null);
      toast.success('Equipe excluída!');
    }
  });

  const registrarLog = async (acao, descricao) => {
    try {
      await base44.entities.LogAcesso.create({
        usuario_email: user?.email,
        usuario_nome: user?.full_name,
        acao,
        dispositivo: navigator.userAgent,
        navegador: navigator.userAgent.split(') ')[1]?.split(' ')[0]
      });
    } catch (error) {
      console.error('Erro ao registrar log:', error);
    }
  };

  const resetForm = () => {
    setFormData({ nome: '', descricao: '', foto_url: '', status: 'ativa' });
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, foto_url: file_url }));
      toast.success('Foto enviada!');
    } catch (error) {
      toast.error('Erro ao enviar foto');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleCreate = () => {
    if (!formData.nome) {
      toast.error('Nome da equipe é obrigatório');
      return;
    }

    createMutation.mutate({
      ...formData,
      membros: [{
        usuario_id: user?.id,
        email: user?.email,
        nome: user?.full_name,
        permissao: 'administrador',
        data_entrada: new Date().toISOString(),
        ultimo_login: new Date().toISOString(),
        status_usuario: 'ativo'
      }]
    });
  };

  const handleEdit = (equipe) => {
    setEditingEquipe(equipe);
    setFormData({
      nome: equipe.nome,
      descricao: equipe.descricao || '',
      foto_url: equipe.foto_url || '',
      status: equipe.status || 'ativa'
    });
    setShowEditDialog(true);
  };

  const handleUpdate = () => {
    updateMutation.mutate({
      id: editingEquipe.id,
      data: { ...editingEquipe, ...formData }
    });
  };

  const handleInviteMember = async () => {
    if (!inviteData.email) {
      toast.error('Email é obrigatório');
      return;
    }

    const token = Math.random().toString(36).substring(2, 15);
    const novoConvite = {
      email: inviteData.email,
      permissao: inviteData.permissao,
      data_convite: new Date().toISOString(),
      token
    };

    const equipeAtualizada = {
      ...selectedEquipe,
      convites_pendentes: [...(selectedEquipe.convites_pendentes || []), novoConvite]
    };

    try {
      await base44.entities.Equipe.update(selectedEquipe.id, equipeAtualizada);
      
      const linkConvite = `${window.location.origin}/aceitar-convite?token=${token}&equipe=${selectedEquipe.id}`;
      await base44.integrations.Core.SendEmail({
        to: inviteData.email,
        subject: `Convite para equipe: ${selectedEquipe.nome} - Societa.ai`,
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="text-align: center; margin-bottom: 30px;">
              <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693acc814baf8083c262896b/6ef53ae31_transparent-Photoroom12.png" alt="Societa.ai" style="height: 60px;" />
            </div>
            <h2 style="color: #E31E24;">Você foi convidado para a equipe ${selectedEquipe.nome}!</h2>
            <p><strong>Permissão:</strong> ${PERMISSOES_CONFIG[inviteData.permissao].label}</p>
            <p>${PERMISSOES_CONFIG[inviteData.permissao].descricao}</p>
            <div style="margin: 30px 0;">
              <a href="${linkConvite}" 
                 style="background-color: #E31E24; color: white; padding: 12px 24px; 
                        text-decoration: none; border-radius: 6px; display: inline-block;">
                Aceitar Convite
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              Ou copie e cole este link no navegador:<br/>
              <code style="background: #f5f5f5; padding: 4px 8px; border-radius: 4px;">${linkConvite}</code>
            </p>
          </div>
        `
      });

      queryClient.invalidateQueries({ queryKey: ['equipes'] });
      setShowInviteDialog(false);
      setInviteData({ email: '', permissao: 'editor' });
      registrarLog('criacao', `Convidou ${inviteData.email} para equipe`);
      toast.success('Convite enviado por email!');
    } catch (error) {
      toast.error('Erro ao enviar convite');
    }
  };

  const handleChangePermissao = async (equipe, membroEmail, novaPermissao) => {
    const membrosAtualizados = equipe.membros.map(m =>
      m.email === membroEmail ? { ...m, permissao: novaPermissao } : m
    );

    try {
      await base44.entities.Equipe.update(equipe.id, {
        ...equipe,
        membros: membrosAtualizados
      });
      queryClient.invalidateQueries({ queryKey: ['equipes'] });
      registrarLog('edicao', `Alterou permissão de ${membroEmail}`);
      toast.success('Permissão atualizada!');
    } catch (error) {
      toast.error('Erro ao atualizar permissão');
    }
  };

  const handleToggleStatusMembro = async (equipe, membroEmail) => {
    const membrosAtualizados = equipe.membros.map(m =>
      m.email === membroEmail 
        ? { ...m, status_usuario: m.status_usuario === 'ativo' ? 'inativo' : 'ativo' } 
        : m
    );

    try {
      await base44.entities.Equipe.update(equipe.id, {
        ...equipe,
        membros: membrosAtualizados
      });
      queryClient.invalidateQueries({ queryKey: ['equipes'] });
      toast.success('Status do membro atualizado!');
    } catch (error) {
      toast.error('Erro ao atualizar status');
    }
  };

  const handleRemoveMember = async (equipe, membroEmail) => {
    const membrosAtualizados = equipe.membros.filter(m => m.email !== membroEmail);

    try {
      await base44.entities.Equipe.update(equipe.id, {
        ...equipe,
        membros: membrosAtualizados
      });
      queryClient.invalidateQueries({ queryKey: ['equipes'] });
      registrarLog('edicao', `Removeu ${membroEmail} da equipe`);
      toast.success('Membro removido!');
    } catch (error) {
      toast.error('Erro ao remover membro');
    }
  };

  const isAdmin = (equipe) => {
    return equipe?.membros?.some(m => 
      m.email === user?.email && m.permissao === 'administrador'
    );
  };

  const equipesFiltered = equipes.filter(e =>
    e.nome?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-6">
      <GerenciadorConvites />
      
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Gerenciar Equipes</h2>
          <p className="text-slate-500 mt-1">Administração de usuários, permissões e times de trabalho</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="bg-[#E31E24] hover:bg-[#B01419]">
          <Plus className="w-4 h-4 mr-2" />
          Criar Nova Equipe
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="equipes">
            <Users className="w-4 h-4 mr-2" />
            Equipes
          </TabsTrigger>
          <TabsTrigger value="atividade">
            <Activity className="w-4 h-4 mr-2" />
            Atividade
          </TabsTrigger>
          <TabsTrigger value="historico">
            <Clock className="w-4 h-4 mr-2" />
            Histórico Permissões
          </TabsTrigger>
        </TabsList>

        <TabsContent value="equipes" className="space-y-4">
          <Card className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar equipe..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {equipesFiltered.map(equipe => {
              const admins = equipe.membros?.filter(m => m.permissao === 'administrador') || [];
              const PermissaoIcon = PERMISSOES_CONFIG[equipe.membros?.find(m => m.email === user?.email)?.permissao]?.icon || User;

              return (
                <Card key={equipe.id} className="hover:shadow-lg transition-all">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3 flex-1">
                        {equipe.foto_url ? (
                          <img 
                            src={equipe.foto_url} 
                            alt={equipe.nome}
                            className="w-16 h-16 rounded-full object-cover border-2 border-[#E31E24]"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#E31E24] to-[#FF4D52] flex items-center justify-center text-white text-xl font-bold">
                            {equipe.nome.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-900 truncate">{equipe.nome}</h3>
                          <p className="text-xs text-slate-500 truncate">{equipe.descricao}</p>
                          <Badge className={`text-xs mt-1 ${equipe.status === 'ativa' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                            {equipe.status === 'ativa' ? 'Ativa' : 'Inativa'}
                          </Badge>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setSelectedEquipe(equipe); setShowMembersDialog(true); }}>
                            <Users className="w-4 h-4 mr-2" />
                            Ver Membros
                          </DropdownMenuItem>
                          {isAdmin(equipe) && (
                            <>
                              <DropdownMenuItem onClick={() => handleEdit(equipe)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Editar Equipe
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setSelectedEquipe(equipe); setShowInviteDialog(true); }}>
                                <UserPlus className="w-4 h-4 mr-2" />
                                Convidar Membro
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => { setDeleteTarget(equipe); setShowDeleteDialog(true); }}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600 flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          Membros
                        </span>
                        <Badge variant="secondary">{equipe.membros?.length || 0}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600 flex items-center gap-1">
                          <Shield className="w-4 h-4" />
                          Administradores
                        </span>
                        <Badge className="bg-emerald-100 text-emerald-700">
                          {admins.length}
                        </Badge>
                      </div>
                      {equipe.convites_pendentes?.length > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600 flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            Convites pendentes
                          </span>
                          <Badge className="bg-amber-100 text-amber-700">
                            {equipe.convites_pendentes.length}
                          </Badge>
                        </div>
                      )}
                      <div className="pt-2 border-t text-xs text-slate-500">
                        Criada em {format(new Date(equipe.created_date), 'dd/MM/yyyy', { locale: ptBR })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="atividade" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Histórico de Login e Atividade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {logs.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">Nenhuma atividade registrada</p>
                ) : (
                  logs.map((log, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 rounded-full bg-[#E31E24] flex items-center justify-center text-white font-semibold">
                          {log.usuario_nome?.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">{log.usuario_nome}</p>
                          <p className="text-sm text-slate-500">{log.usuario_email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {format(new Date(log.created_date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </div>
                        {log.dispositivo && (
                          <div className="flex items-center gap-1">
                            <Laptop className="w-4 h-4" />
                            {log.navegador || 'Desktop'}
                          </div>
                        )}
                        <Badge variant="outline">{log.acao}</Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historico" className="space-y-4">
          <HistoricoPermissoes />
        </TabsContent>
      </Tabs>

      {/* Dialog Permissões Granulares */}
      <Dialog open={showPermissoesDialog} onOpenChange={setShowPermissoesDialog}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Permissões Granulares - {selectedUserForPermissions?.full_name}</DialogTitle>
          </DialogHeader>
          <GerenciadorPermissoesGranular
            usuario={selectedUserForPermissions}
            onSalvar={() => setShowPermissoesDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog Criar */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Nova Equipe</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Foto da Equipe</Label>
              <div className="flex items-center gap-4">
                {formData.foto_url ? (
                  <div className="relative">
                    <img src={formData.foto_url} alt="Preview" className="w-20 h-20 rounded-full object-cover" />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white hover:bg-red-600"
                      onClick={() => setFormData(prev => ({ ...prev, foto_url: '' }))}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center">
                    <Upload className="w-8 h-8 text-slate-400" />
                  </div>
                )}
                <label>
                  <Button variant="outline" size="sm" disabled={uploadingPhoto} asChild>
                    <div>
                      <Upload className="w-4 h-4 mr-2" />
                      {uploadingPhoto ? 'Enviando...' : 'Escolher Foto'}
                    </div>
                  </Button>
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Nome da Equipe *</Label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Ex: Equipe de Campo Norte"
              />
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={formData.descricao}
                onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                placeholder="Descreva o propósito desta equipe..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!formData.nome} className="bg-[#E31E24] hover:bg-[#B01419]">
              Criar Equipe
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Equipe</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Foto da Equipe</Label>
              <div className="flex items-center gap-4">
                {formData.foto_url ? (
                  <div className="relative">
                    <img src={formData.foto_url} alt="Preview" className="w-20 h-20 rounded-full object-cover" />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white hover:bg-red-600"
                      onClick={() => setFormData(prev => ({ ...prev, foto_url: '' }))}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center">
                    <Upload className="w-8 h-8 text-slate-400" />
                  </div>
                )}
                <label>
                  <Button variant="outline" size="sm" disabled={uploadingPhoto} asChild>
                    <div>
                      <Upload className="w-4 h-4 mr-2" />
                      {uploadingPhoto ? 'Enviando...' : 'Trocar Foto'}
                    </div>
                  </Button>
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Nome da Equipe *</Label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={formData.descricao}
                onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <Label>Status da Equipe</Label>
                <p className="text-xs text-slate-500">
                  {formData.status === 'ativa' ? 'Equipe ativa e funcional' : 'Equipe inativa (membros não terão acesso)'}
                </p>
              </div>
              <Switch
                checked={formData.status === 'ativa'}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, status: checked ? 'ativa' : 'inativa' }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancelar</Button>
            <Button onClick={handleUpdate} className="bg-[#E31E24] hover:bg-[#B01419]">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Membros */}
      <Dialog open={showMembersDialog} onOpenChange={setShowMembersDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Membros: {selectedEquipe?.nome}</span>
              {isAdmin(selectedEquipe) && (
                <Button 
                  size="sm" 
                  className="bg-[#E31E24] hover:bg-[#B01419]"
                  onClick={() => {
                    setShowMembersDialog(false);
                    setShowInviteDialog(true);
                  }}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Convidar Membro
                </Button>
              )}
            </DialogTitle>
            <DialogDescription>
              Gerencie permissões e status dos membros da equipe
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedEquipe?.membros?.map((membro, idx) => {
              const permConfig = PERMISSOES_CONFIG[membro.permissao];
              const statusConfig = STATUS_CONFIG[membro.status_usuario];
              const PermIcon = permConfig.icon;

              return (
                <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-12 h-12 rounded-full bg-[#E31E24] flex items-center justify-center text-white font-semibold">
                      {membro.nome?.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{membro.nome}</p>
                      <p className="text-sm text-slate-500">{membro.email}</p>
                      {membro.ultimo_login && (
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" />
                          Último login: {format(new Date(membro.ultimo_login), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={statusConfig.color}>
                      {statusConfig.label}
                    </Badge>
                    {isAdmin(selectedEquipe) && membro.email !== user?.email ? (
                      <>
                        <Select
                          value={membro.permissao}
                          onValueChange={(value) => handleChangePermissao(selectedEquipe, membro.email, value)}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue>
                              <div className="flex items-center gap-2">
                                <PermIcon className="w-4 h-4" />
                                {permConfig.label}
                              </div>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="administrador">
                              <div className="flex items-center gap-2">
                                <Shield className="w-4 h-4" />
                                Administrador
                              </div>
                            </SelectItem>
                            <SelectItem value="editor">
                              <div className="flex items-center gap-2">
                                <Edit className="w-4 h-4" />
                                Editor
                              </div>
                            </SelectItem>
                            <SelectItem value="visualizador">
                              <div className="flex items-center gap-2">
                                <Eye className="w-4 h-4" />
                                Visualizador
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={async () => {
                              const usuarios = await base44.entities.User.list();
                              const usuario = usuarios.find(u => u.email === membro.email);
                              if (usuario) {
                                setSelectedUserForPermissions(usuario);
                                setShowMembersDialog(false);
                                setShowPermissoesDialog(true);
                              }
                            }}>
                              <Lock className="w-4 h-4 mr-2" />
                              Gerenciar Permissões
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleToggleStatusMembro(selectedEquipe, membro.email)}>
                              {membro.status_usuario === 'ativo' ? (
                                <><UserX className="w-4 h-4 mr-2" /> Desativar Acesso</>
                              ) : (
                                <><UserCheck className="w-4 h-4 mr-2" /> Ativar Acesso</>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => handleRemoveMember(selectedEquipe, membro.email)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Remover da Equipe
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </>
                    ) : (
                      <Badge className={permConfig.color}>
                        <PermIcon className="w-3 h-3 mr-1" />
                        {permConfig.label}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}

            {selectedEquipe?.convites_pendentes?.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="font-medium text-slate-700 mb-3">Convites Pendentes</h4>
                {selectedEquipe.convites_pendentes.map((convite, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg mb-2">
                    <div>
                      <p className="font-medium text-slate-900">{convite.email}</p>
                      <p className="text-xs text-slate-500">
                        Convidado em {format(new Date(convite.data_convite), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    </div>
                    <Badge className="bg-amber-100 text-amber-700">
                      {PERMISSOES_CONFIG[convite.permissao].label}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Convidar - Novo Sistema */}
      <DialogConviteMembro
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
        equipe={selectedEquipe}
      />

      {/* Dialog Convidar - Antigo (manter temporariamente) */}
      <Dialog open={false} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convidar Novo Membro</DialogTitle>
            <DialogDescription>
              Envie um convite por email para adicionar um membro à equipe
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={inviteData.email}
                onChange={(e) => setInviteData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@exemplo.com"
              />
            </div>

            <div className="space-y-2">
              <Label>Nível de Permissão</Label>
              <Select
                value={inviteData.permissao}
                onValueChange={(value) => setInviteData(prev => ({ ...prev, permissao: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PERMISSOES_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <config.icon className="w-4 h-4" />
                        {config.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  {PERMISSOES_CONFIG[inviteData.permissao].descricao}
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>Cancelar</Button>
            <Button onClick={handleInviteMember} disabled={!inviteData.email} className="bg-[#E31E24] hover:bg-[#B01419]">
              <Mail className="w-4 h-4 mr-2" />
              Enviar Convite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Excluir */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir equipe?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A equipe "{deleteTarget?.nome}" será permanentemente removida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteMutation.mutate(deleteTarget.id)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}