import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Briefcase } from 'lucide-react';
import { toast } from 'sonner';

export default function GestaoFuncoes({ usuarios = [], currentUser, onSelecionarFuncao }) {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [showDelete, setShowDelete] = useState(null);
  const [editData, setEditData] = useState({ nome: '', descricao: '', ativo: true, ordem: 1 });

  const isAdm = currentUser?.role === 'admin';

  const { data: funcoes = [] } = useQuery({
    queryKey: ['funcoes'],
    queryFn: () => base44.entities.Funcao.list('ordem', 100)
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Funcao.create({ ...data, criado_por: currentUser?.email }),
    onSuccess: () => {
      queryClient.invalidateQueries(['funcoes']);
      queryClient.invalidateQueries(['funcoes-usuario']);
      toast.success('Função criada!');
      setShowDialog(false);
    },
    onError: (e) => toast.error('Erro ao criar função: ' + (e.message || ''))
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Funcao.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['funcoes']);
      queryClient.invalidateQueries(['funcoes-usuario']);
      toast.success('Função atualizada!');
      setShowDialog(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Funcao.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['funcoes']);
      queryClient.invalidateQueries(['funcoes-usuario']);
      toast.success('Função excluída!');
      setShowDelete(null);
    }
  });

  const countUsuarios = (nome) => usuarios.filter(u => u.funcao === nome).length;

  const abrirNova = () => {
    setEditData({ nome: '', descricao: '', ativo: true, ordem: (funcoes?.length || 0) + 1 });
    setShowDialog(true);
  };

  const abrirEditar = (f) => {
    setEditData({ id: f.id, nome: f.nome, descricao: f.descricao || '', ativo: f.ativo !== false, ordem: f.ordem || 0 });
    setShowDialog(true);
  };

  const salvar = () => {
    if (!editData.nome || !editData.nome.trim()) {
      toast.error('Informe o nome da função');
      return;
    }
    const payload = {
      nome: editData.nome.trim(),
      descricao: editData.descricao || '',
      ativo: editData.ativo,
      ordem: Number(editData.ordem) || 0
    };
    if (editData.id) {
      updateMutation.mutate({ id: editData.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const toggleAtivo = (f) => {
    updateMutation.mutate({ id: f.id, data: { ativo: !(f.ativo === false ? true : false) } });
  };

  const excluirEstaVinculado = showDelete && countUsuarios(showDelete.nome) > 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-[#2D6A4F]" />
            Funções da Equipe
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {funcoes.map((f) => {
              const count = countUsuarios(f.nome);
              return (
                <button
                  key={f.id}
                  onClick={() => onSelecionarFuncao && onSelecionarFuncao(f.nome)}
                  className={`text-left p-3 rounded-lg border transition-all hover:border-[#2D6A4F] hover:shadow-sm ${f.ativo === false ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 text-sm truncate">{f.nome}</p>
                      {f.descricao && (
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{f.descricao}</p>
                      )}
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      {count} {count === 1 ? 'pessoa' : 'pessoas'}
                    </Badge>
                  </div>
                  {f.ativo === false && (
                    <span className="inline-block mt-1 text-xs text-slate-400">Inativa</span>
                  )}
                </button>
              );
            })}
            {funcoes.length === 0 && (
              <p className="text-sm text-slate-500 col-span-full">Nenhuma função cadastrada ainda.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {isAdm && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Gestão de Funções</CardTitle>
              <Button size="sm" onClick={abrirNova} className="bg-[#2D6A4F] hover:bg-[#1B4332]">
                <Plus className="w-4 h-4 mr-1" />
                Nova Função
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
                    <th className="py-2 px-2">Função</th>
                    <th className="py-2 px-2">Descrição</th>
                    <th className="py-2 px-2 text-center">Usuários</th>
                    <th className="py-2 px-2 text-center">Status</th>
                    <th className="py-2 px-2 text-center">Ordem</th>
                    <th className="py-2 px-2 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {funcoes.map((f) => (
                    <tr key={f.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-2 font-medium text-slate-900">{f.nome}</td>
                      <td className="py-3 px-2 text-slate-600 text-xs">{f.descricao || '—'}</td>
                      <td className="py-3 px-2 text-center">{countUsuarios(f.nome)}</td>
                      <td className="py-3 px-2 text-center">
                        <Switch
                          checked={f.ativo !== false}
                          onCheckedChange={() => toggleAtivo(f)}
                        />
                      </td>
                      <td className="py-3 px-2 text-center text-xs text-slate-500">{f.ordem ?? '—'}</td>
                      <td className="py-3 px-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => abrirEditar(f)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => setShowDelete(f)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {funcoes.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-500">
                        Nenhuma função cadastrada ainda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editData.id ? 'Editar Função' : 'Nova Função'}</DialogTitle>
            <DialogDescription>
              Defina o nome, descrição e ordem de exibição. Apenas administradores podem alterar a lista mestre.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome *</label>
              <Input
                value={editData.nome}
                onChange={(e) => setEditData((prev) => ({ ...prev, nome: e.target.value }))}
                placeholder="Ex.: Analista de Campo"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Descrição</label>
              <Textarea
                value={editData.descricao}
                onChange={(e) => setEditData((prev) => ({ ...prev, descricao: e.target.value }))}
                placeholder="Descreva brevemente as responsabilidades da função"
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Ordem</label>
                <Input
                  type="number"
                  value={editData.ordem}
                  onChange={(e) => setEditData((prev) => ({ ...prev, ordem: e.target.value }))}
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <label className="text-sm font-medium">Ativo</label>
                  <p className="text-xs text-slate-500">Funções inativas não aparecem para seleção</p>
                </div>
                <Switch
                  checked={editData.ativo}
                  onCheckedChange={(v) => setEditData((prev) => ({ ...prev, ativo: v }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
            <Button onClick={salvar} className="bg-[#2D6A4F] hover:bg-[#1B4332]">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!showDelete} onOpenChange={(o) => !o && setShowDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {excluirEstaVinculado
                ? 'Não é possível excluir'
                : `Excluir função "${showDelete?.nome}"?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {excluirEstaVinculado
                ? 'Esta função está vinculada a usuários. Reatribua os usuários antes de excluir.'
                : 'Esta ação não pode ser desfeita. A função será permanentemente removida.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            {excluirEstaVinculado ? (
              <AlertDialogAction
                onClick={() =>
                  toast.error('Esta função está vinculada a usuários. Reatribua os usuários antes de excluir.')
                }
              >
                Entendi
              </AlertDialogAction>
            ) : (
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700"
                onClick={() => deleteMutation.mutate(showDelete.id)}
              >
                Excluir
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}