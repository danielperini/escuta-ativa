import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import { Plus, Edit, Trash2, MoreVertical, Shield, Lock, Unlock } from 'lucide-react';
import { toast } from 'sonner';

const MODULOS_CONFIG = {
  registros: { label: 'Registros', acoes: ['visualizar', 'criar', 'editar', 'excluir', 'exportar'], temRestricoes: true },
  stakeholders: { label: 'Stakeholders', acoes: ['visualizar', 'criar', 'editar', 'excluir'] },
  casos: { label: 'Casos', acoes: ['visualizar', 'criar', 'editar', 'excluir', 'atribuir_responsavel'] },
  agenda: { label: 'Agenda', acoes: ['visualizar', 'criar', 'editar', 'excluir'] },
  comunidades: { label: 'Comunidades e Grupos', acoes: ['visualizar', 'criar', 'editar', 'excluir'] },
  analise: { label: 'Análise', acoes: ['visualizar_dashboard', 'visualizar_materialidade', 'exportar_relatorios'] },
  equipes: { label: 'Equipes', acoes: ['visualizar', 'criar', 'editar', 'gerenciar_membros'] },
  usuarios: { label: 'Usuários', acoes: ['visualizar', 'convidar', 'editar_permissoes', 'desativar'] }
};

const ACOES_LABELS = {
  visualizar: 'Visualizar', criar: 'Criar', editar: 'Editar', excluir: 'Excluir',
  exportar: 'Exportar', atribuir_responsavel: 'Atribuir Responsável',
  visualizar_dashboard: 'Ver Dashboard', visualizar_materialidade: 'Ver Materialidade',
  exportar_relatorios: 'Exportar Relatórios', gerenciar_membros: 'Gerenciar Membros',
  convidar: 'Convidar Usuários', editar_permissoes: 'Editar Permissões',
  desativar: 'Desativar Usuários'
};

export default function GerenciadorPapeisCustomizados() {
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingRole, setEditingRole] = useState(null);

  const [formRole, setFormRole] = useState({
    nome: '',
    descricao: '',
    cor: '#3B82F6',
    permissoes: {}
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['roles-customizados'],
    queryFn: () => base44.entities.Role.list('-created_date')
  });

  const { data: comunidades = [] } = useQuery({
    queryKey: ['comunidades-roles'],
    queryFn: () => base44.entities.Comunidade.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Role.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles-customizados'] });
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setShowCreateDialog(false);
      resetForm();
      toast.success('Papel criado!');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Role.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles-customizados'] });
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setShowEditDialog(false);
      setEditingRole(null);
      toast.success('Papel atualizado!');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Role.update(id, { ativo: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles-customizados'] });
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Papel desativado!');
    }
  });

  const resetForm = () => {
    setFormRole({ nome: '', descricao: '', cor: '#3B82F6', permissoes: {} });
  };

  const handleEdit = (role) => {
    setEditingRole(role);
    setFormRole({
      nome: role.nome,
      descricao: role.descricao || '',
      cor: role.cor || '#3B82F6',
      permissoes: role.permissoes || {}
    });
    setShowEditDialog(true);
  };

  const rolesAtivos = roles.filter(r => r.ativo !== false);
  const rolesSistema = rolesAtivos.filter(r => r.tipo === 'sistema');
  const rolesCustomizados = rolesAtivos.filter(r => r.tipo === 'customizado');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">Papéis Customizados</h3>
          <p className="text-sm text-slate-500">Crie conjuntos de permissões reutilizáveis</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="bg-[#E31E24] hover:bg-[#B01419]">
          <Plus className="w-4 h-4 mr-2" />
          Criar Papel
        </Button>
      </div>

      {/* Papéis do Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#E31E24]" />
            Papéis do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {rolesSistema.map(role => (
              <div key={role.id} className="p-4 border rounded-lg bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: role.cor }} />
                  <div className="flex-1">
                    <p className="font-semibold">{role.nome}</p>
                    <p className="text-xs text-slate-600">{role.descricao}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">Sistema</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Papéis Customizados */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Seus Papéis Customizados</CardTitle>
        </CardHeader>
        <CardContent>
          {rolesCustomizados.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Lock className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>Nenhum papel customizado criado ainda</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {rolesCustomizados.map(role => (
                <div key={role.id} className="p-4 border rounded-lg hover:shadow-md transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: role.cor }} />
                      <div className="flex-1">
                        <p className="font-semibold">{role.nome}</p>
                        <p className="text-xs text-slate-600">{role.descricao}</p>
                        <Badge variant="secondary" className="mt-2 text-xs">
                          {role.usuarios_com_papel?.length || 0} usuário(s)
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
                        <DropdownMenuItem onClick={() => handleEdit(role)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => deleteMutation.mutate(role.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Desativar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Criar/Editar Papel */}
      <Dialog open={showCreateDialog || showEditDialog} onOpenChange={(open) => {
        if (!open) {
          setShowCreateDialog(false);
          setShowEditDialog(false);
          setEditingRole(null);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRole ? 'Editar' : 'Criar'} Papel Customizado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome do Papel *</Label>
                <Input
                  value={formRole.nome}
                  onChange={(e) => setFormRole(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Ex: Coordenador Regional"
                />
              </div>
              <div className="space-y-2">
                <Label>Cor de Identificação</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={formRole.cor}
                    onChange={(e) => setFormRole(prev => ({ ...prev, cor: e.target.value }))}
                    className="w-20"
                  />
                  <Input
                    value={formRole.cor}
                    onChange={(e) => setFormRole(prev => ({ ...prev, cor: e.target.value }))}
                    placeholder="#3B82F6"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={formRole.descricao}
                onChange={(e) => setFormRole(prev => ({ ...prev, descricao: e.target.value }))}
                placeholder="Descreva as responsabilidades deste papel..."
                rows={2}
              />
            </div>

            <div className="space-y-3">
              <Label className="text-base font-bold">Definir Permissões por Módulo</Label>
              <Accordion type="multiple" className="w-full">
                {Object.entries(MODULOS_CONFIG).map(([moduloKey, moduloConfig]) => (
                  <AccordionItem key={moduloKey} value={moduloKey}>
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{moduloConfig.label}</span>
                        {Object.values(formRole.permissoes[moduloKey] || {}).some(v => v) && (
                          <Unlock className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-2 gap-3 p-3">
                        {moduloConfig.acoes.map(acao => (
                          <div key={acao} className="flex items-center space-x-2">
                            <Checkbox
                              checked={formRole.permissoes[moduloKey]?.[acao] || false}
                              onCheckedChange={(checked) => {
                                setFormRole(prev => ({
                                  ...prev,
                                  permissoes: {
                                    ...prev.permissoes,
                                    [moduloKey]: {
                                      ...prev.permissoes[moduloKey],
                                      [acao]: checked
                                    }
                                  }
                                }));
                              }}
                            />
                            <label className="text-sm font-medium cursor-pointer">
                              {ACOES_LABELS[acao] || acao}
                            </label>
                          </div>
                        ))}
                      </div>

                      {moduloKey === 'registros' && moduloConfig.temRestricoes && (
                        <div className="mt-4 p-3 bg-amber-50 rounded border border-amber-200">
                          <Label className="text-sm font-semibold mb-2 block">
                            Restringir a Comunidades Específicas
                          </Label>
                          <p className="text-xs text-amber-800 mb-3">
                            Deixe vazio para permitir todas as comunidades
                          </p>
                          <Select
                            value=""
                            onValueChange={(comunidadeId) => {
                              const comunidade = comunidades.find(c => c.id === comunidadeId);
                              if (!comunidade) return;
                              
                              setFormRole(prev => ({
                                ...prev,
                                permissoes: {
                                  ...prev.permissoes,
                                  registros: {
                                    ...prev.permissoes.registros,
                                    comunidades_restritas: [
                                      ...(prev.permissoes.registros?.comunidades_restritas || []),
                                      comunidade.nome
                                    ]
                                  }
                                }
                              }));
                            }}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Adicionar comunidade..." />
                            </SelectTrigger>
                            <SelectContent>
                              {comunidades.map(c => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.nome} ({c.municipio})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          <div className="flex flex-wrap gap-2 mt-2">
                            {(formRole.permissoes.registros?.comunidades_restritas || []).map((com, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {com}
                                <button
                                  onClick={() => {
                                    setFormRole(prev => ({
                                      ...prev,
                                      permissoes: {
                                        ...prev.permissoes,
                                        registros: {
                                          ...prev.permissoes.registros,
                                          comunidades_restritas: prev.permissoes.registros.comunidades_restritas.filter((_, i) => i !== idx)
                                        }
                                      }
                                    }));
                                  }}
                                  className="ml-1"
                                >
                                  ×
                                </button>
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCreateDialog(false);
              setShowEditDialog(false);
              setEditingRole(null);
            }}>
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                if (editingRole) {
                  updateMutation.mutate({ id: editingRole.id, data: { ...formRole, tipo: 'customizado', ativo: true } });
                } else {
                  createMutation.mutate({ ...formRole, tipo: 'customizado', ativo: true });
                }
              }}
              disabled={!formRole.nome}
              className="bg-[#E31E24] hover:bg-[#B01419]"
            >
              {editingRole ? 'Salvar' : 'Criar'} Papel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lista de Papéis */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rolesCustomizados.map(role => (
          <Card key={role.id} className="hover:shadow-lg transition-all">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: role.cor + '20' }}
                  >
                    <Shield className="w-6 h-6" style={{ color: role.cor }} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{role.nome}</p>
                    <p className="text-xs text-slate-500">{role.descricao}</p>
                    <Badge variant="secondary" className="mt-2 text-xs">
                      {role.usuarios_com_papel?.length || 0} usuário(s)
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
                    <DropdownMenuItem onClick={() => handleEdit(role)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-red-600"
                      onClick={() => deleteMutation.mutate(role.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Desativar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}