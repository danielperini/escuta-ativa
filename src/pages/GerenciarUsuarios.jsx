import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  UserPlus, 
  Search, 
  MoreVertical, 
  Shield, 
  User,
  Mail,
  Trash2,
  Edit,
  Users,
  UserX,
  UserCheck,
  Clock,
  Activity,
  Lock
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import GerenciadorPermissoesGranular from '@/components/permissoes/GerenciadorPermissoesGranular';
import HistoricoPermissoes from '@/components/permissoes/HistoricoPermissoes';
import GerenciadorPapeisCustomizados from '@/components/permissoes/GerenciadorPapeisCustomizados';

const ROLES_CONFIG = {
  admin: {
    label: 'Administrador',
    color: 'bg-red-100 text-red-700',
    icon: Shield,
    descricao: 'Acesso total ao sistema e gestão de usuários'
  },
  user: {
    label: 'Usuário',
    color: 'bg-blue-100 text-blue-700',
    icon: User,
    descricao: 'Acesso padrão às funcionalidades'
  }
};

export default function GerenciarUsuarios() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showTeamsDialog, setShowTeamsDialog] = useState(false);
  const [showPermissoesDialog, setShowPermissoesDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [activeTab, setActiveTab] = useState('usuarios');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [agruparPorEquipe, setAgruparPorEquipe] = useState(false);

  const [inviteData, setInviteData] = useState({
    email: '',
    full_name: '',
    role: 'user',
    equipes_vincular: []
  });

  const [editData, setEditData] = useState({
    role: 'user',
    ativo: true
  });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser-gestao'],
    queryFn: () => base44.auth.me()
  });

  const { data: usuarios = [] } = useQuery({
    queryKey: ['usuarios'],
    queryFn: () => base44.entities.User.list('-created_date')
  });

  const { data: equipes = [] } = useQuery({
    queryKey: ['equipes-gestao'],
    queryFn: () => base44.entities.Equipe.list()
  });

  const { data: logs = [] } = useQuery({
    queryKey: ['logs-usuarios'],
    queryFn: () => base44.entities.LogAcesso.list('-created_date', 200)
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['roles-usuarios'],
    queryFn: () => base44.entities.Role.list()
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, data }) => {
      // Atualizar dados do usuário
      await base44.entities.User.update(userId, data);
      return userId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      setShowEditDialog(false);
      toast.success('Usuário atualizado!');
    }
  });

  const handleInviteUser = async () => {
    if (!inviteData.email || !inviteData.full_name) {
      toast.error('Email e nome são obrigatórios');
      return;
    }

    try {
      const token = Math.random().toString(36).substring(2, 15);
      const linkConvite = `${window.location.origin}?invite_token=${token}&email=${inviteData.email}`;

      // Enviar email de convite
      await base44.integrations.Core.SendEmail({
        to: inviteData.email,
        subject: 'Convite para Societa.ai - Inteligência Social',
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693acc814baf8083c262896b/6ef53ae31_transparent-Photoroom12.png" alt="Societa.ai" style="height: 80px;" />
            </div>
            <h2 style="color: #E31E24; margin-bottom: 20px;">Olá, ${inviteData.full_name}!</h2>
            <p style="font-size: 16px; line-height: 1.6; color: #333;">
              Você foi convidado para fazer parte da plataforma <strong>Societa.ai</strong> - 
              Inteligência Social para gestão territorial.
            </p>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Nível de acesso:</strong> ${ROLES_CONFIG[inviteData.role].label}</p>
              <p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">
                ${ROLES_CONFIG[inviteData.role].descricao}
              </p>
            </div>
            ${inviteData.equipes_vincular.length > 0 ? `
              <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
                <p style="margin: 0; font-weight: bold; color: #856404;">Equipes vinculadas:</p>
                <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                  ${inviteData.equipes_vincular.map(eq => `<li style="color: #856404;">${eq}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
            <div style="text-align: center; margin: 40px 0;">
              <a href="${linkConvite}" 
                 style="background-color: #E31E24; color: white; padding: 15px 40px; 
                        text-decoration: none; border-radius: 8px; display: inline-block; 
                        font-weight: bold; font-size: 16px;">
                Aceitar Convite e Criar Conta
              </a>
            </div>
            <p style="color: #666; font-size: 14px; text-align: center;">
              Ou copie e cole este link no navegador:<br/>
              <code style="background: #f5f5f5; padding: 8px 12px; border-radius: 4px; display: inline-block; margin-top: 10px;">${linkConvite}</code>
            </p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;" />
            <p style="font-size: 12px; color: #999; text-align: center;">
              Societa.ai - Inteligência Social<br/>
              Este é um email automático, não responda.
            </p>
          </div>
        `
      });

      // Registrar log de auditoria detalhado
      await base44.entities.LogAcesso.create({
        usuario_email: currentUser?.email,
        usuario_nome: currentUser?.full_name,
        acao: 'convite_enviado',
        dispositivo: `Convite enviado para ${inviteData.email} (${inviteData.full_name})`,
        navegador: navigator.userAgent.split(') ')[1]?.split(' ')[0],
        detalhes: JSON.stringify({
          email_convidado: inviteData.email,
          nome_convidado: inviteData.full_name,
          role: inviteData.role,
          equipes: inviteData.equipes_vincular,
          timestamp: new Date().toISOString()
        })
      });

      queryClient.invalidateQueries({ queryKey: ['logs-usuarios'] });
      setShowInviteDialog(false);
      setInviteData({ email: '', full_name: '', role: 'user', equipes_vincular: [] });
      
      // Mensagem de sucesso detalhada
      toast.success(`✅ Convite enviado para ${inviteData.full_name}!`, {
        description: `Um email foi enviado para ${inviteData.email} com as instruções de acesso.`,
        duration: 5000
      });
    } catch (error) {
      console.error('Erro ao enviar convite:', error);
      toast.error(`❌ Erro ao enviar convite: ${error.message}`, {
        description: 'Verifique o email e tente novamente.',
        duration: 5000
      });
    }
  };

  const handleEditUser = (usuario) => {
    setSelectedUser(usuario);
    setEditData({
      role: usuario.role || 'user',
      ativo: usuario.ativo !== false
    });
    setShowEditDialog(true);
  };

  const handleUpdateUser = async () => {
    try {
      const alteracoes = [];
      if (editData.role !== selectedUser.role) alteracoes.push(`Role: ${selectedUser.role} → ${editData.role}`);
      if (editData.ativo !== selectedUser.ativo) alteracoes.push(`Status: ${selectedUser.ativo ? 'Ativo' : 'Inativo'} → ${editData.ativo ? 'Ativo' : 'Inativo'}`);

      await base44.entities.User.update(selectedUser.id, editData);
      
      // Log de auditoria detalhado
      await base44.entities.LogAcesso.create({
        usuario_email: currentUser?.email,
        usuario_nome: currentUser?.full_name,
        acao: 'usuario_editado',
        dispositivo: `Usuário ${selectedUser.full_name} editado`,
        navegador: navigator.userAgent.split(') ')[1]?.split(' ')[0],
        detalhes: JSON.stringify({
          usuario_editado: selectedUser.email,
          alteracoes: alteracoes,
          dados_anteriores: { role: selectedUser.role, ativo: selectedUser.ativo },
          dados_novos: editData,
          timestamp: new Date().toISOString()
        })
      });

      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      queryClient.invalidateQueries({ queryKey: ['logs-usuarios'] });
      setShowEditDialog(false);
      toast.success('Usuário atualizado!');
    } catch (error) {
      toast.error('Erro ao atualizar usuário');
    }
  };

  const handleDeleteUser = async () => {
    try {
      await base44.entities.User.update(deleteTarget.id, { ativo: false });
      
      // Log de auditoria
      await base44.entities.LogAcesso.create({
        usuario_email: currentUser?.email,
        usuario_nome: currentUser?.full_name,
        acao: 'usuario_desativado',
        dispositivo: `Usuário ${deleteTarget.full_name} desativado`,
        navegador: navigator.userAgent.split(') ')[1]?.split(' ')[0],
        detalhes: JSON.stringify({
          usuario_desativado: deleteTarget.email,
          nome: deleteTarget.full_name,
          timestamp: new Date().toISOString()
        })
      });

      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      queryClient.invalidateQueries({ queryKey: ['logs-usuarios'] });
      setShowDeleteDialog(false);
      toast.success('Usuário desativado!');
    } catch (error) {
      toast.error('Erro ao desativar usuário');
    }
  };

  const handleVincularEquipes = async () => {
    // Implementar vinculação de equipes
    setShowTeamsDialog(false);
    toast.success('Vinculação de equipes atualizada!');
  };

  const getEquipesDoUsuario = (usuario) => {
    return equipes.filter(eq => 
      eq.membros?.some(m => m.email === usuario.email)
    );
  };

  const usuariosFiltrados = usuarios.filter(u =>
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  const usuariosAtivos = usuariosFiltrados.filter(u => u.ativo !== false);
  const usuariosInativos = usuariosFiltrados.filter(u => u.ativo === false);

  const isCurrentUserAdmin = currentUser?.role === 'admin';

  const toggleSelectUser = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === usuariosAtivos.filter(u => u.id !== currentUser?.id).length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(usuariosAtivos.filter(u => u.id !== currentUser?.id).map(u => u.id));
    }
  };

  const handleAcoesEmLote = async (acao) => {
    if (selectedUsers.length === 0) {
      toast.error('Selecione pelo menos um usuário');
      return;
    }

    try {
      const usuarios = usuariosAtivos.filter(u => selectedUsers.includes(u.id));
      
      for (const usuario of usuarios) {
        if (acao === 'desativar') {
          await base44.entities.User.update(usuario.id, { ativo: false });
        } else if (acao === 'ativar') {
          await base44.entities.User.update(usuario.id, { ativo: true });
        } else if (acao === 'admin') {
          await base44.entities.User.update(usuario.id, { role: 'admin' });
        } else if (acao === 'user') {
          await base44.entities.User.update(usuario.id, { role: 'user' });
        }
      }

      // Log de auditoria em lote
      await base44.entities.LogAcesso.create({
        usuario_email: currentUser?.email,
        usuario_nome: currentUser?.full_name,
        acao: `acao_lote_${acao}`,
        dispositivo: `Ação em lote: ${acao} para ${selectedUsers.length} usuário(s)`,
        navegador: navigator.userAgent.split(') ')[1]?.split(' ')[0],
        detalhes: JSON.stringify({
          acao: acao,
          usuarios_afetados: usuarios.map(u => ({ id: u.id, email: u.email, nome: u.full_name })),
          quantidade: selectedUsers.length,
          timestamp: new Date().toISOString()
        })
      });

      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      queryClient.invalidateQueries({ queryKey: ['logs-usuarios'] });
      setSelectedUsers([]);
      toast.success(`${selectedUsers.length} usuário(s) atualizados!`);
    } catch (error) {
      toast.error('Erro ao executar ação em lote');
    }
  };

  // Agrupar usuários por equipe
  const usuariosPorEquipe = agruparPorEquipe
    ? usuariosAtivos.reduce((acc, usuario) => {
        const equipesDoUsuario = getEquipesDoUsuario(usuario);
        if (equipesDoUsuario.length === 0) {
          if (!acc['sem_equipe']) acc['sem_equipe'] = [];
          acc['sem_equipe'].push(usuario);
        } else {
          equipesDoUsuario.forEach(equipe => {
            if (!acc[equipe.nome]) acc[equipe.nome] = [];
            acc[equipe.nome].push(usuario);
          });
        }
        return acc;
      }, {})
    : null;

  return (
    <div className="space-y-6 pb-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Gerenciar Usuários</h2>
          <p className="text-slate-500 mt-1">Controle de acesso e permissões da plataforma</p>
        </div>
        {isCurrentUserAdmin && (
          <div className="flex gap-2">
            <Button onClick={() => setShowInviteDialog(true)} className="bg-[#E31E24] hover:bg-[#B01419]">
              <UserPlus className="w-4 h-4 mr-2" />
              Convidar Usuário
            </Button>
          </div>
        )}
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant={agruparPorEquipe ? "default" : "outline"}
            onClick={() => setAgruparPorEquipe(!agruparPorEquipe)}
            className="gap-2"
          >
            <Users className="w-4 h-4" />
            Agrupar por Equipe
          </Button>
        </div>
      </Card>

      {/* Ações em Lote */}
      {isCurrentUserAdmin && selectedUsers.length > 0 && (
        <Card className="p-4 bg-gradient-to-r from-blue-50 to-emerald-50 border-2 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge className="bg-blue-600">{selectedUsers.length} selecionados</Badge>
              <p className="text-sm font-medium text-slate-700">Ações em Lote:</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAcoesEmLote('admin')}
              >
                <Shield className="w-4 h-4 mr-1" />
                Tornar Admin
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAcoesEmLote('user')}
              >
                <User className="w-4 h-4 mr-1" />
                Tornar Usuário
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => handleAcoesEmLote('desativar')}
              >
                <UserX className="w-4 h-4 mr-1" />
                Desativar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedUsers([])}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="usuarios">
            <Users className="w-4 h-4 mr-2" />
            Ativos ({usuariosAtivos.length})
          </TabsTrigger>
          <TabsTrigger value="inativos">
            <UserX className="w-4 h-4 mr-2" />
            Inativos ({usuariosInativos.length})
          </TabsTrigger>
          <TabsTrigger value="papeis">
            <Shield className="w-4 h-4 mr-2" />
            Papéis
          </TabsTrigger>
          <TabsTrigger value="atividade">
            <Activity className="w-4 h-4 mr-2" />
            Logs
          </TabsTrigger>
          <TabsTrigger value="historico">
            <Clock className="w-4 h-4 mr-2" />
            Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="usuarios" className="space-y-3">
          {/* Checkbox Selecionar Todos */}
          {isCurrentUserAdmin && usuariosAtivos.length > 1 && (
            <Card className="p-3 bg-slate-50">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedUsers.length === usuariosAtivos.filter(u => u.id !== currentUser?.id).length && usuariosAtivos.filter(u => u.id !== currentUser?.id).length > 0}
                  onCheckedChange={toggleSelectAll}
                />
                <label className="text-sm font-medium text-slate-700 cursor-pointer" onClick={toggleSelectAll}>
                  Selecionar todos ({usuariosAtivos.filter(u => u.id !== currentUser?.id).length} usuários)
                </label>
              </div>
            </Card>
          )}

          {agruparPorEquipe && usuariosPorEquipe ? (
            Object.entries(usuariosPorEquipe).map(([nomeEquipe, usuariosEquipe]) => (
              <div key={nomeEquipe} className="space-y-3">
                <div className="flex items-center gap-2 mt-4">
                  <Badge variant="outline" className="text-sm">
                    {nomeEquipe === 'sem_equipe' ? 'Sem Equipe' : nomeEquipe}
                  </Badge>
                  <span className="text-xs text-slate-500">{usuariosEquipe.length} usuário(s)</span>
                </div>
                {usuariosEquipe.map(usuario => {
                  const RoleIcon = ROLES_CONFIG[usuario.role]?.icon || User;
                  const equipesUsuario = getEquipesDoUsuario(usuario);

                  return (
                    <Card key={usuario.id} className="hover:shadow-md transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          {isCurrentUserAdmin && usuario.id !== currentUser?.id && (
                            <Checkbox
                              checked={selectedUsers.includes(usuario.id)}
                              onCheckedChange={() => toggleSelectUser(usuario.id)}
                              className="mr-3"
                            />
                          )}
                          <div className="flex items-center gap-4 flex-1">
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#E31E24] to-[#FF4D52] flex items-center justify-center text-white text-xl font-bold">
                              {usuario.full_name?.substring(0, 2).toUpperCase() || 'U'}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-slate-900">{usuario.full_name}</p>
                                {usuario.id === currentUser?.id && (
                                  <Badge variant="outline" className="text-xs">Você</Badge>
                                )}
                              </div>
                              <p className="text-sm text-slate-500">{usuario.email}</p>
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <Badge className={ROLES_CONFIG[usuario.role]?.color || 'bg-slate-100'}>
                                  <RoleIcon className="w-3 h-3 mr-1" />
                                  {ROLES_CONFIG[usuario.role]?.label || 'Usuário'}
                                </Badge>
                                {usuario.papeis && usuario.papeis.length > 0 && (
                                  <Badge className="bg-purple-100 text-purple-700 text-xs">
                                    <Shield className="w-3 h-3 mr-1" />
                                    {usuario.papeis.length} papel(eis)
                                  </Badge>
                                )}
                                {equipesUsuario.length > 0 && (
                                  <Badge variant="secondary" className="text-xs">
                                    <Users className="w-3 h-3 mr-1" />
                                    {equipesUsuario.length} equipe(s)
                                  </Badge>
                                )}
                                {usuario.created_date && (
                                  <span className="text-xs text-slate-400">
                                    Desde {format(new Date(usuario.created_date), 'dd/MM/yyyy', { locale: ptBR })}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {isCurrentUserAdmin && usuario.id !== currentUser?.id && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditUser(usuario)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Editar Perfil
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setSelectedUser(usuario); setShowPermissoesDialog(true); }}>
                                  <Lock className="w-4 h-4 mr-2" />
                                  Gerenciar Permissões
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setSelectedUser(usuario); setShowTeamsDialog(true); }}>
                                  <Users className="w-4 h-4 mr-2" />
                                  Gerenciar Equipes
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={() => { setDeleteTarget(usuario); setShowDeleteDialog(true); }}
                                >
                                  <UserX className="w-4 h-4 mr-2" />
                                  Desativar Usuário
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>

                        {equipesUsuario.length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-xs font-medium text-slate-600 mb-2">Equipes:</p>
                            <div className="flex flex-wrap gap-2">
                              {equipesUsuario.map(eq => (
                                <Badge key={eq.id} variant="outline" className="text-xs">
                                  {eq.nome}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ))
          ) : (
            usuariosAtivos.map(usuario => {
            const RoleIcon = ROLES_CONFIG[usuario.role]?.icon || User;
            const equipesUsuario = getEquipesDoUsuario(usuario);

            return (
              <Card key={usuario.id} className="hover:shadow-md transition-all">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    {isCurrentUserAdmin && usuario.id !== currentUser?.id && (
                      <Checkbox
                        checked={selectedUsers.includes(usuario.id)}
                        onCheckedChange={() => toggleSelectUser(usuario.id)}
                        className="mr-3"
                      />
                    )}
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#E31E24] to-[#FF4D52] flex items-center justify-center text-white text-xl font-bold">
                        {usuario.full_name?.substring(0, 2).toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-900">{usuario.full_name}</p>
                          {usuario.id === currentUser?.id && (
                            <Badge variant="outline" className="text-xs">Você</Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-500">{usuario.email}</p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <Badge className={ROLES_CONFIG[usuario.role]?.color || 'bg-slate-100'}>
                            <RoleIcon className="w-3 h-3 mr-1" />
                            {ROLES_CONFIG[usuario.role]?.label || 'Usuário'}
                          </Badge>
                          {usuario.papeis && usuario.papeis.length > 0 && (
                            <Badge className="bg-purple-100 text-purple-700 text-xs">
                              <Shield className="w-3 h-3 mr-1" />
                              {usuario.papeis.length} papel(eis)
                            </Badge>
                          )}
                          {equipesUsuario.length > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              <Users className="w-3 h-3 mr-1" />
                              {equipesUsuario.length} equipe(s)
                            </Badge>
                          )}
                          {usuario.created_date && (
                            <span className="text-xs text-slate-400">
                              Desde {format(new Date(usuario.created_date), 'dd/MM/yyyy', { locale: ptBR })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {isCurrentUserAdmin && usuario.id !== currentUser?.id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditUser(usuario)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar Perfil
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setSelectedUser(usuario); setShowPermissoesDialog(true); }}>
                            <Lock className="w-4 h-4 mr-2" />
                            Gerenciar Permissões
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setSelectedUser(usuario); setShowTeamsDialog(true); }}>
                            <Users className="w-4 h-4 mr-2" />
                            Gerenciar Equipes
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => { setDeleteTarget(usuario); setShowDeleteDialog(true); }}
                          >
                            <UserX className="w-4 h-4 mr-2" />
                            Desativar Usuário
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>

                  {equipesUsuario.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs font-medium text-slate-600 mb-2">Equipes:</p>
                      <div className="flex flex-wrap gap-2">
                        {equipesUsuario.map(eq => (
                          <Badge key={eq.id} variant="outline" className="text-xs">
                            {eq.nome}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
          )}
        </TabsContent>

        <TabsContent value="inativos" className="space-y-3">
          {usuariosInativos.map(usuario => (
            <Card key={usuario.id} className="opacity-60">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-14 h-14 rounded-full bg-slate-300 flex items-center justify-center text-slate-600 text-xl font-bold">
                      {usuario.full_name?.substring(0, 2).toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-700">{usuario.full_name}</p>
                      <p className="text-sm text-slate-500">{usuario.email}</p>
                      <Badge className="mt-2 bg-slate-200 text-slate-600">
                        <UserX className="w-3 h-3 mr-1" />
                        Inativo
                      </Badge>
                    </div>
                  </div>
                  {isCurrentUserAdmin && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        await base44.entities.User.update(usuario.id, { ativo: true });
                        queryClient.invalidateQueries({ queryKey: ['usuarios'] });
                        toast.success('Usuário reativado!');
                      }}
                    >
                      <UserCheck className="w-4 h-4 mr-2" />
                      Reativar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="atividade" className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Histórico de Atividades do Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {logs.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">Nenhuma atividade registrada</p>
                ) : (
                  logs.slice(0, 100).map((log, idx) => {
                    const detalhes = log.detalhes ? JSON.parse(log.detalhes) : null;
                    
                    return (
                      <div key={idx} className="p-4 bg-slate-50 rounded-lg border-l-4 border-l-[#E31E24]">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="w-10 h-10 rounded-full bg-[#E31E24] flex items-center justify-center text-white font-semibold shrink-0">
                              {log.usuario_nome?.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold text-slate-900">{log.usuario_nome}</p>
                                <Badge variant="outline" className="text-xs">
                                  {log.acao?.replace(/_/g, ' ')}
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-600 mb-2">{log.dispositivo}</p>
                              <p className="text-xs text-slate-500">{log.usuario_email}</p>
                              
                              {detalhes && (
                                <div className="mt-2 p-2 bg-white rounded border text-xs">
                                  {detalhes.alteracoes && (
                                    <div className="mb-1">
                                      <strong>Alterações:</strong>
                                      <ul className="ml-4 mt-1 list-disc">
                                        {detalhes.alteracoes.map((alt, i) => (
                                          <li key={i}>{alt}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {detalhes.quantidade && (
                                    <p><strong>Quantidade:</strong> {detalhes.quantidade} usuário(s)</p>
                                  )}
                                  {detalhes.role && (
                                    <p><strong>Nível de acesso:</strong> {detalhes.role}</p>
                                  )}
                                  {detalhes.email_convidado && (
                                    <p><strong>Email convidado:</strong> {detalhes.email_convidado}</p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-slate-500 shrink-0">
                            <Clock className="w-3 h-3" />
                            {format(new Date(log.created_date), 'dd/MM HH:mm', { locale: ptBR })}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="papeis" className="space-y-3">
          <GerenciadorPapeisCustomizados />
        </TabsContent>

        <TabsContent value="historico" className="space-y-3">
          <HistoricoPermissoes />
        </TabsContent>
      </Tabs>

      {/* Dialog Gerenciar Permissões Granulares */}
      <Dialog open={showPermissoesDialog} onOpenChange={setShowPermissoesDialog}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerenciar Permissões - {selectedUser?.full_name}</DialogTitle>
          </DialogHeader>
          <GerenciadorPermissoesGranular
            usuario={selectedUser}
            onSalvar={() => setShowPermissoesDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog Convidar */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Convidar Novo Usuário</DialogTitle>
            <DialogDescription>
              Envie um convite por email para adicionar um novo usuário à plataforma
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome Completo *</Label>
              <Input
                value={inviteData.full_name}
                onChange={(e) => setInviteData(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="João Silva"
              />
            </div>

            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={inviteData.email}
                onChange={(e) => setInviteData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="joao@exemplo.com"
              />
            </div>

            <div className="space-y-2">
              <Label>Nível de Acesso</Label>
              <Select
                value={inviteData.role}
                onValueChange={(value) => setInviteData(prev => ({ ...prev, role: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLES_CONFIG).map(([key, config]) => (
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
                  {ROLES_CONFIG[inviteData.role].descricao}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Vincular a Equipes (opcional)</Label>
              <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                {equipes.map(equipe => (
                  <div key={equipe.id} className="flex items-center gap-2">
                    <Checkbox
                      checked={inviteData.equipes_vincular.includes(equipe.nome)}
                      onCheckedChange={(checked) => {
                        setInviteData(prev => ({
                          ...prev,
                          equipes_vincular: checked
                            ? [...prev.equipes_vincular, equipe.nome]
                            : prev.equipes_vincular.filter(e => e !== equipe.nome)
                        }));
                      }}
                    />
                    <label className="text-sm flex-1 cursor-pointer">
                      {equipe.nome}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>Cancelar</Button>
            <Button 
              onClick={handleInviteUser} 
              disabled={!inviteData.email || !inviteData.full_name}
              className="bg-[#E31E24] hover:bg-[#B01419]"
            >
              <Mail className="w-4 h-4 mr-2" />
              Enviar Convite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Altere as permissões e status de {selectedUser?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-sm"><strong>Email:</strong> {selectedUser?.email}</p>
              <p className="text-sm"><strong>Nome:</strong> {selectedUser?.full_name}</p>
            </div>

            <div className="space-y-2">
              <Label>Nível de Acesso</Label>
              <Select
                value={editData.role}
                onValueChange={(value) => setEditData(prev => ({ ...prev, role: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLES_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <config.icon className="w-4 h-4" />
                        {config.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <Label>Status do Usuário</Label>
                <p className="text-xs text-slate-500">
                  {editData.ativo ? 'Usuário ativo no sistema' : 'Usuário bloqueado (sem acesso)'}
                </p>
              </div>
              <Switch
                checked={editData.ativo}
                onCheckedChange={(checked) => setEditData(prev => ({ ...prev, ativo: checked }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancelar</Button>
            <Button onClick={handleUpdateUser} className="bg-[#E31E24] hover:bg-[#B01419]">
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Gerenciar Equipes */}
      <Dialog open={showTeamsDialog} onOpenChange={setShowTeamsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gerenciar Equipes - {selectedUser?.full_name}</DialogTitle>
            <DialogDescription>
              Adicione ou remova o usuário de equipes existentes
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-96 overflow-y-auto">
            {equipes.map(equipe => {
              const usuarioNaEquipe = equipe.membros?.some(m => m.email === selectedUser?.email);
              const permissaoAtual = equipe.membros?.find(m => m.email === selectedUser?.email)?.permissao;

              return (
                <div key={equipe.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {equipe.foto_url ? (
                        <img src={equipe.foto_url} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#E31E24] to-[#FF4D52] flex items-center justify-center text-white font-bold">
                          {equipe.nome.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{equipe.nome}</p>
                        <p className="text-xs text-slate-500">{equipe.descricao}</p>
                      </div>
                    </div>
                    <Switch
                      checked={usuarioNaEquipe}
                      onCheckedChange={async (checked) => {
                        if (checked) {
                          // Adicionar à equipe
                          const novoMembro = {
                            usuario_id: selectedUser.id,
                            email: selectedUser.email,
                            nome: selectedUser.full_name,
                            permissao: 'editor',
                            data_entrada: new Date().toISOString(),
                            status_usuario: 'ativo'
                          };
                          await base44.entities.Equipe.update(equipe.id, {
                            ...equipe,
                            membros: [...(equipe.membros || []), novoMembro]
                          });
                        } else {
                          // Remover da equipe
                          await base44.entities.Equipe.update(equipe.id, {
                            ...equipe,
                            membros: equipe.membros.filter(m => m.email !== selectedUser.email)
                          });
                        }
                        queryClient.invalidateQueries({ queryKey: ['equipes-gestao'] });
                        toast.success(checked ? 'Usuário adicionado à equipe' : 'Usuário removido da equipe');
                      }}
                    />
                  </div>

                  {usuarioNaEquipe && (
                    <div className="mt-2">
                      <Label className="text-xs">Permissão na equipe</Label>
                      <Select
                        value={permissaoAtual}
                        onValueChange={async (value) => {
                          const membrosAtualizados = equipe.membros.map(m =>
                            m.email === selectedUser.email ? { ...m, permissao: value } : m
                          );
                          await base44.entities.Equipe.update(equipe.id, {
                            ...equipe,
                            membros: membrosAtualizados
                          });
                          queryClient.invalidateQueries({ queryKey: ['equipes-gestao'] });
                          toast.success('Permissão atualizada!');
                        }}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="administrador">Administrador</SelectItem>
                          <SelectItem value="editor">Editor</SelectItem>
                          <SelectItem value="visualizador">Visualizador</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowTeamsDialog(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Desativar */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar usuário?</AlertDialogTitle>
            <AlertDialogDescription>
              O usuário "{deleteTarget?.full_name}" será desativado e perderá acesso ao sistema.
              Você poderá reativá-lo posteriormente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDeleteUser}
            >
              Desativar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}