import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Check,
  Settings
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from 'sonner';

const PERMISSOES_DISPONIVEIS = [
  { id: 'registros_criar', label: 'Criar Registros' },
  { id: 'registros_editar', label: 'Editar Registros' },
  { id: 'registros_excluir', label: 'Excluir Registros' },
  { id: 'casos_criar', label: 'Criar Casos' },
  { id: 'casos_editar', label: 'Editar Casos' },
  { id: 'stakeholders_visualizar', label: 'Ver Stakeholders' },
  { id: 'stakeholders_editar', label: 'Editar Stakeholders' },
  { id: 'relatorios_gerar', label: 'Gerar Relatórios' },
  { id: 'analise_visualizar', label: 'Ver Análises' }
];

export default function GerenciarEquipesSimples() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showMembersDialog, setShowMembersDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [editingEquipe, setEditingEquipe] = useState(null);
  const [selectedEquipe, setSelectedEquipe] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    foto_url: ''
  });

  const [inviteData, setInviteData] = useState({
    email: '',
    papel: 'membro',
    permissoes: []
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: equipes = [], isLoading } = useQuery({
    queryKey: ['equipes-simples'],
    queryFn: () => base44.entities.EquipeSimples.list('-created_date')
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.EquipeSimples.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipes-simples'] });
      setShowCreateDialog(false);
      resetForm();
      toast.success('Equipe criada com sucesso!');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.EquipeSimples.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipes-simples'] });
      setShowEditDialog(false);
      setEditingEquipe(null);
      toast.success('Equipe atualizada!');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.EquipeSimples.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipes-simples'] });
      toast.success('Equipe excluída!');
    }
  });

  const resetForm = () => {
    setFormData({ nome: '', descricao: '', foto_url: '' });
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
      administradores: [user?.email],
      membros: [{
        email: user?.email,
        nome: user?.full_name,
        papel: 'administrador',
        permissoes: PERMISSOES_DISPONIVEIS.map(p => p.id),
        data_entrada: new Date().toISOString(),
        ativo: true
      }]
    });
  };

  const handleEdit = (equipe) => {
    setEditingEquipe(equipe);
    setFormData({
      nome: equipe.nome,
      descricao: equipe.descricao || '',
      foto_url: equipe.foto_url || ''
    });
    setShowEditDialog(true);
  };

  const handleUpdate = () => {
    updateMutation.mutate({
      id: editingEquipe.id,
      data: formData
    });
  };

  const handleInviteMember = async () => {
    if (!inviteData.email) {
      toast.error('Email é obrigatório');
      return;
    }

    const token = Math.random().toString(36).substring(2, 15);
    const convite = {
      email: inviteData.email,
      papel: inviteData.papel,
      permissoes: inviteData.permissoes,
      data_convite: new Date().toISOString(),
      token
    };

    const equipeAtualizada = {
      ...selectedEquipe,
      convites_pendentes: [...(selectedEquipe.convites_pendentes || []), convite]
    };

    try {
      await base44.entities.EquipeSimples.update(selectedEquipe.id, equipeAtualizada);
      
      // Enviar email de convite
      const linkConvite = `${window.location.origin}/aceitar-convite?token=${token}&equipe=${selectedEquipe.id}`;
      await base44.integrations.Core.SendEmail({
        to: inviteData.email,
        subject: `Convite para equipe: ${selectedEquipe.nome}`,
        body: `
          <h2>Você foi convidado para a equipe ${selectedEquipe.nome}!</h2>
          <p><strong>Papel:</strong> ${inviteData.papel === 'administrador' ? 'Administrador' : 'Membro'}</p>
          <p>Clique no link abaixo para aceitar o convite:</p>
          <a href="${linkConvite}">${linkConvite}</a>
          <p>Após aceitar, você poderá fazer login na plataforma.</p>
        `
      });

      queryClient.invalidateQueries({ queryKey: ['equipes-simples'] });
      setShowInviteDialog(false);
      setInviteData({ email: '', papel: 'membro', permissoes: [] });
      toast.success('Convite enviado por email!');
    } catch (error) {
      toast.error('Erro ao enviar convite');
    }
  };

  const handleRemoveMember = async (equipe, membroEmail) => {
    const equipeAtualizada = {
      ...equipe,
      membros: equipe.membros.filter(m => m.email !== membroEmail)
    };

    try {
      await base44.entities.EquipeSimples.update(equipe.id, equipeAtualizada);
      queryClient.invalidateQueries({ queryKey: ['equipes-simples'] });
      toast.success('Membro removido!');
    } catch (error) {
      toast.error('Erro ao remover membro');
    }
  };

  const handleTogglePermissao = (permissaoId) => {
    setInviteData(prev => ({
      ...prev,
      permissoes: prev.permissoes.includes(permissaoId)
        ? prev.permissoes.filter(p => p !== permissaoId)
        : [...prev.permissoes, permissaoId]
    }));
  };

  const equipesFiltered = equipes.filter(e =>
    e.nome?.toLowerCase().includes(search.toLowerCase())
  );

  const isAdmin = (equipe) => {
    return equipe.administradores?.includes(user?.email) || 
           equipe.membros?.some(m => m.email === user?.email && m.papel === 'administrador');
  };

  return (
    <div className="space-y-6 pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Gerenciar Equipes</h2>
          <p className="text-slate-500 mt-1">{equipes.length} equipes criadas</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="bg-[#2D6A4F]">
          <Plus className="w-4 h-4 mr-2" />
          Nova Equipe
        </Button>
      </div>

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
        {equipesFiltered.map(equipe => (
          <Card key={equipe.id} className="hover:shadow-lg transition-all">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 flex-1">
                  {equipe.foto_url ? (
                    <img 
                      src={equipe.foto_url} 
                      alt={equipe.nome}
                      className="w-16 h-16 rounded-full object-cover border-2 border-[#2D6A4F]"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#2D6A4F] to-[#40916C] flex items-center justify-center text-white text-xl font-bold">
                      {equipe.nome.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate">{equipe.nome}</h3>
                    <p className="text-sm text-slate-500 truncate">{equipe.descricao}</p>
                  </div>
                </div>
                {isAdmin(equipe) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(equipe)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Editar Equipe
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setSelectedEquipe(equipe); setShowMembersDialog(true); }}>
                        <Users className="w-4 h-4 mr-2" />
                        Ver Membros
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setSelectedEquipe(equipe); setShowInviteDialog(true); }}>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Convidar Membro
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-red-600"
                        onClick={() => deleteMutation.mutate(equipe.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Membros:</span>
                  <Badge variant="secondary">{equipe.membros?.length || 0}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Administradores:</span>
                  <Badge className="bg-emerald-100 text-emerald-700">
                    {equipe.membros?.filter(m => m.papel === 'administrador').length || 0}
                  </Badge>
                </div>
                {equipe.convites_pendentes?.length > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Convites pendentes:</span>
                    <Badge className="bg-amber-100 text-amber-700">
                      {equipe.convites_pendentes.length}
                    </Badge>
                  </div>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full mt-4"
                onClick={() => { setSelectedEquipe(equipe); setShowMembersDialog(true); }}
              >
                <Eye className="w-4 h-4 mr-2" />
                Ver Detalhes
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog Criar Equipe */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Equipe</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Foto da Equipe</Label>
              <div className="flex items-center gap-4">
                {formData.foto_url ? (
                  <div className="relative">
                    <img 
                      src={formData.foto_url} 
                      alt="Preview"
                      className="w-20 h-20 rounded-full object-cover"
                    />
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
                  <input 
                    type="file" 
                    accept="image/*"
                    className="hidden" 
                    onChange={handlePhotoUpload}
                  />
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
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreate}
              disabled={createMutation.isPending || !formData.nome}
              className="bg-[#2D6A4F]"
            >
              Criar Equipe
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar Equipe */}
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
                    <img 
                      src={formData.foto_url} 
                      alt="Preview"
                      className="w-20 h-20 rounded-full object-cover"
                    />
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
                  <input 
                    type="file" 
                    accept="image/*"
                    className="hidden" 
                    onChange={handlePhotoUpload}
                  />
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleUpdate}
              disabled={updateMutation.isPending}
              className="bg-[#2D6A4F]"
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Ver Membros */}
      <Dialog open={showMembersDialog} onOpenChange={setShowMembersDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Membros da Equipe: {selectedEquipe?.nome}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedEquipe?.membros?.map((membro, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#2D6A4F] flex items-center justify-center text-white font-semibold">
                    {membro.nome?.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{membro.nome}</p>
                    <p className="text-sm text-slate-500">{membro.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={membro.papel === 'administrador' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}>
                    {membro.papel === 'administrador' ? (
                      <><Shield className="w-3 h-3 mr-1" /> Admin</>
                    ) : (
                      <><User className="w-3 h-3 mr-1" /> Membro</>
                    )}
                  </Badge>
                  {isAdmin(selectedEquipe) && membro.email !== user?.email && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-600"
                      onClick={() => handleRemoveMember(selectedEquipe, membro.email)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {selectedEquipe?.convites_pendentes?.length > 0 && (
              <>
                <div className="border-t pt-4">
                  <h4 className="font-medium text-slate-700 mb-3">Convites Pendentes</h4>
                  {selectedEquipe.convites_pendentes.map((convite, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg mb-2">
                      <div>
                        <p className="font-medium text-slate-900">{convite.email}</p>
                        <p className="text-xs text-slate-500">
                          Convidado em {new Date(convite.data_convite).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <Badge className="bg-amber-100 text-amber-700">
                        Pendente
                      </Badge>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Convidar Membro */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Convidar Novo Membro</DialogTitle>
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
              <Label>Papel</Label>
              <Select
                value={inviteData.papel}
                onValueChange={(value) => setInviteData(prev => ({ ...prev, papel: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="membro">Membro</SelectItem>
                  <SelectItem value="administrador">Administrador</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                {inviteData.papel === 'administrador' 
                  ? '✓ Administradores têm todas as permissões e podem gerenciar a equipe'
                  : 'Membros terão apenas as permissões selecionadas abaixo'}
              </p>
            </div>

            {inviteData.papel === 'membro' && (
              <div className="space-y-2">
                <Label>Permissões do Membro</Label>
                <div className="space-y-2 border rounded-lg p-3 max-h-60 overflow-y-auto">
                  {PERMISSOES_DISPONIVEIS.map(permissao => (
                    <div key={permissao.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={permissao.id}
                        checked={inviteData.permissoes.includes(permissao.id)}
                        onCheckedChange={() => handleTogglePermissao(permissao.id)}
                      />
                      <label
                        htmlFor={permissao.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {permissao.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <Mail className="w-4 h-4 inline mr-1" />
                Um email será enviado com o link de convite e instruções de acesso
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleInviteMember}
              disabled={!inviteData.email}
              className="bg-[#2D6A4F]"
            >
              <Mail className="w-4 h-4 mr-2" />
              Enviar Convite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}