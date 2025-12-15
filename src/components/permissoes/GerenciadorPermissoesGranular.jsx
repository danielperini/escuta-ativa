import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Shield, 
  Plus, 
  Trash2, 
  Edit,
  CheckCircle2,
  XCircle,
  Lock,
  Unlock
} from 'lucide-react';
import { toast } from 'sonner';

const MODULOS_CONFIG = {
  registros: {
    label: 'Registros',
    acoes: ['visualizar', 'criar', 'editar', 'excluir', 'exportar'],
    temRestricoes: true
  },
  stakeholders: {
    label: 'Stakeholders',
    acoes: ['visualizar', 'criar', 'editar', 'excluir']
  },
  casos: {
    label: 'Casos',
    acoes: ['visualizar', 'criar', 'editar', 'excluir', 'atribuir_responsavel']
  },
  agenda: {
    label: 'Agenda',
    acoes: ['visualizar', 'criar', 'editar', 'excluir']
  },
  comunidades: {
    label: 'Comunidades e Grupos',
    acoes: ['visualizar', 'criar', 'editar', 'excluir']
  },
  analise: {
    label: 'Análise',
    acoes: ['visualizar_dashboard', 'visualizar_materialidade', 'exportar_relatorios']
  },
  equipes: {
    label: 'Equipes',
    acoes: ['visualizar', 'criar', 'editar', 'gerenciar_membros']
  },
  usuarios: {
    label: 'Usuários',
    acoes: ['visualizar', 'convidar', 'editar_permissoes', 'desativar']
  }
};

const ACOES_LABELS = {
  visualizar: 'Visualizar',
  criar: 'Criar',
  editar: 'Editar',
  excluir: 'Excluir',
  exportar: 'Exportar',
  atribuir_responsavel: 'Atribuir Responsável',
  visualizar_dashboard: 'Ver Dashboard',
  visualizar_materialidade: 'Ver Materialidade',
  exportar_relatorios: 'Exportar Relatórios',
  gerenciar_membros: 'Gerenciar Membros',
  convidar: 'Convidar Usuários',
  editar_permissoes: 'Editar Permissões',
  desativar: 'Desativar Usuários'
};

export default function GerenciadorPermissoesGranular({ usuario, onSalvar }) {
  const queryClient = useQueryClient();
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [papeisUsuario, setPapeisUsuario] = useState(usuario?.papeis || []);

  const [formRole, setFormRole] = useState({
    nome: '',
    descricao: '',
    cor: '#E31E24',
    permissoes: {}
  });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser-permissoes'],
    queryFn: () => base44.auth.me()
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: () => base44.entities.Role.list()
  });

  const { data: comunidades = [] } = useQuery({
    queryKey: ['comunidades-permissoes'],
    queryFn: () => base44.entities.Comunidade.list()
  });

  const createRoleMutation = useMutation({
    mutationFn: (data) => base44.entities.Role.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setShowCreateRole(false);
      resetFormRole();
      toast.success('Papel criado!');
    }
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Role.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setEditingRole(null);
      toast.success('Papel atualizado!');
    }
  });

  const resetFormRole = () => {
    setFormRole({
      nome: '',
      descricao: '',
      cor: '#E31E24',
      permissoes: {}
    });
  };

  const togglePapel = (roleId) => {
    setPapeisUsuario(prev => 
      prev.includes(roleId) 
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    );
  };

  const salvarPermissoes = async () => {
    try {
      // Atualizar usuário com novos papéis
      await base44.entities.User.update(usuario.id, {
        papeis: papeisUsuario
      });

      // Registrar no histórico
      await base44.entities.HistoricoPermissoes.create({
        usuario_afetado_id: usuario.id,
        usuario_afetado_email: usuario.email,
        usuario_afetado_nome: usuario.full_name,
        usuario_responsavel_email: currentUser?.email,
        usuario_responsavel_nome: currentUser?.full_name,
        tipo_alteracao: 'permissao_alterada',
        detalhes_anterior: { papeis: usuario.papeis || [] },
        detalhes_novo: { papeis: papeisUsuario },
        ip_origem: window.location.hostname
      });

      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      toast.success('Permissões atualizadas!');
      if (onSalvar) onSalvar();
    } catch (error) {
      toast.error('Erro ao salvar permissões');
    }
  };

  const obterPermissoesConsolidadas = () => {
    const permissoesConsolidadas = {};
    
    papeisUsuario.forEach(papelId => {
      const papel = roles.find(r => r.id === papelId);
      if (!papel) return;
      
      Object.keys(papel.permissoes || {}).forEach(modulo => {
        if (!permissoesConsolidadas[modulo]) {
          permissoesConsolidadas[modulo] = {};
        }
        
        Object.keys(papel.permissoes[modulo] || {}).forEach(acao => {
          if (papel.permissoes[modulo][acao]) {
            permissoesConsolidadas[modulo][acao] = true;
          }
        });
      });
    });
    
    return permissoesConsolidadas;
  };

  const permissoesConsolidadas = obterPermissoesConsolidadas();

  return (
    <div className="space-y-6">
      {/* Papéis Disponíveis */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Papéis do Usuário</CardTitle>
            <Button onClick={() => setShowCreateRole(true)} size="sm" variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Criar Papel
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {roles.filter(r => r.ativo).map(role => {
              const isAtivo = papeisUsuario.includes(role.id);
              return (
                <div
                  key={role.id}
                  onClick={() => togglePapel(role.id)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    isAtivo 
                      ? 'border-[#E31E24] bg-red-50' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: role.cor || '#E31E24' }}
                      />
                      <p className="font-semibold text-slate-900">{role.nome}</p>
                    </div>
                    {isAtivo ? (
                      <CheckCircle2 className="w-5 h-5 text-[#E31E24]" />
                    ) : (
                      <XCircle className="w-5 h-5 text-slate-300" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600">{role.descricao}</p>
                  {role.tipo === 'sistema' && (
                    <Badge variant="outline" className="mt-2 text-xs">
                      Sistema
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>

          {papeisUsuario.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <Lock className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>Nenhum papel atribuído. Selecione ao menos um papel acima.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumo de Permissões Consolidadas */}
      {papeisUsuario.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Permissões Consolidadas</CardTitle>
            <p className="text-xs text-slate-500">
              Resumo das permissões efetivas baseadas nos papéis selecionados
            </p>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {Object.entries(MODULOS_CONFIG).map(([moduloKey, moduloConfig]) => {
                const permissoesModulo = permissoesConsolidadas[moduloKey] || {};
                const temPermissoes = Object.values(permissoesModulo).some(v => v);
                
                return (
                  <AccordionItem key={moduloKey} value={moduloKey}>
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        <span>{moduloConfig.label}</span>
                        {temPermissoes ? (
                          <Unlock className="w-4 h-4 text-green-600" />
                        ) : (
                          <Lock className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-2 gap-2 p-3">
                        {moduloConfig.acoes.map(acao => (
                          <div key={acao} className="flex items-center gap-2 text-sm">
                            {permissoesModulo[acao] ? (
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-slate-300" />
                            )}
                            <span className={permissoesModulo[acao] ? 'text-slate-900' : 'text-slate-400'}>
                              {ACOES_LABELS[acao] || acao}
                            </span>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => onSalvar && onSalvar()}>
          Cancelar
        </Button>
        <Button 
          onClick={salvarPermissoes}
          className="bg-[#E31E24] hover:bg-[#B01419]"
        >
          <Shield className="w-4 h-4 mr-2" />
          Salvar Permissões
        </Button>
      </div>

      {/* Dialog Criar Papel */}
      <Dialog open={showCreateRole} onOpenChange={setShowCreateRole}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Papel Customizado</DialogTitle>
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
                <Input
                  type="color"
                  value={formRole.cor}
                  onChange={(e) => setFormRole(prev => ({ ...prev, cor: e.target.value }))}
                />
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
              <Label className="text-base">Definir Permissões por Módulo</Label>
              <Accordion type="multiple" className="w-full">
                {Object.entries(MODULOS_CONFIG).map(([moduloKey, moduloConfig]) => (
                  <AccordionItem key={moduloKey} value={moduloKey}>
                    <AccordionTrigger>
                      <span className="font-semibold">{moduloConfig.label}</span>
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
                            <label className="text-sm font-medium">
                              {ACOES_LABELS[acao] || acao}
                            </label>
                          </div>
                        ))}
                      </div>

                      {/* Restrições por comunidade para Registros */}
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
                                  {c.nome}
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
            <Button variant="outline" onClick={() => setShowCreateRole(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => createRoleMutation.mutate({
                ...formRole,
                tipo: 'customizado',
                ativo: true
              })}
              disabled={!formRole.nome}
              className="bg-[#E31E24] hover:bg-[#B01419]"
            >
              Criar Papel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}