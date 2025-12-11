import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { 
  Users, 
  Plus, 
  Search, 
  Filter,
  MapPin,
  Phone,
  Mail,
  Building,
  Activity,
  MoreVertical,
  Edit,
  Trash2,
  X,
  Loader2,
  Star,
  Eye,
  ArrowLeft
} from 'lucide-react';
import FormularioAtor from '@/components/atores/FormularioAtor';
import PerfilAtor from '@/components/atores/PerfilAtor';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { cn } from "@/lib/utils";

const tipoConfig = {
  lideranca: { label: 'Liderança', color: 'bg-purple-100 text-purple-700' },
  representante: { label: 'Representante', color: 'bg-blue-100 text-blue-700' },
  morador: { label: 'Morador', color: 'bg-slate-100 text-slate-700' },
  associacao: { label: 'Associação', color: 'bg-emerald-100 text-emerald-700' },
  ong: { label: 'ONG', color: 'bg-amber-100 text-amber-700' },
  governo: { label: 'Governo', color: 'bg-red-100 text-red-700' },
  outro: { label: 'Outro', color: 'bg-gray-100 text-gray-600' }
};

const influenciaConfig = {
  baixo: { label: 'Baixa', color: 'bg-slate-100 text-slate-600' },
  medio: { label: 'Média', color: 'bg-amber-100 text-amber-600' },
  alto: { label: 'Alta', color: 'bg-emerald-100 text-emerald-600' }
};

const atividadeConfig = {
  inativo: { label: 'Inativo', color: 'bg-slate-300' },
  baixo: { label: 'Baixa', color: 'bg-blue-400' },
  moderado: { label: 'Moderada', color: 'bg-amber-400' },
  alto: { label: 'Alta', color: 'bg-emerald-500' }
};

export default function Atores() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState('todos');
  const [filterComunidade, setFilterComunidade] = useState('todos');
  const [showDialog, setShowDialog] = useState(false);
  const [editingAtor, setEditingAtor] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [viewingAtor, setViewingAtor] = useState(null);

  const { data: atores = [], isLoading } = useQuery({
    queryKey: ['atores'],
    queryFn: () => base44.entities.Ator.list('-created_date')
  });

  const { data: comunidades = [] } = useQuery({
    queryKey: ['comunidades'],
    queryFn: () => base44.entities.Comunidade.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Ator.create({
      ...data,
      historico_interacoes: 0,
      ultima_interacao: new Date().toISOString().split('T')[0]
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['atores'] });
      setShowDialog(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Ator.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['atores'] });
      setShowDialog(false);
      setViewingAtor(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Ator.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['atores'] });
      setDeleteId(null);
      setViewingAtor(null);
    }
  });

  const filteredAtores = atores.filter(a => {
    const matchSearch = !search || 
      a.nome?.toLowerCase().includes(search.toLowerCase()) ||
      a.organizacao?.toLowerCase().includes(search.toLowerCase());
    const matchTipo = filterTipo === 'todos' || a.tipo === filterTipo;
    const matchComunidade = filterComunidade === 'todos' || a.comunidade === filterComunidade;
    return matchSearch && matchTipo && matchComunidade;
  });

  if (viewingAtor) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => setViewingAtor(null)} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
        <PerfilAtor 
          atorId={viewingAtor} 
          onEditar={(ator) => {
            setEditingAtor(ator);
            setShowDialog(true);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Mapa de Atores</h2>
          <p className="text-slate-500 mt-1">{atores.length} atores mapeados</p>
        </div>
        <Button 
          className="bg-[#2D6A4F] hover:bg-[#1B4332] gap-2"
          onClick={() => setShowDialog(true)}
        >
          <Plus className="w-4 h-4" />
          Novo Ator
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por nome ou organização..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterTipo} onValueChange={setFilterTipo}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os tipos</SelectItem>
              {Object.entries(tipoConfig).map(([key, config]) => (
                <SelectItem key={key} value={key}>{config.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterComunidade} onValueChange={setFilterComunidade}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Comunidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas</SelectItem>
              {comunidades.map(c => (
                <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))
        ) : filteredAtores.length === 0 ? (
          <Card className="col-span-full p-12 text-center">
            <Users className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhum ator encontrado</h3>
            <p className="text-slate-500 mb-4">
              {search || filterTipo !== 'todos' || filterComunidade !== 'todos'
                ? 'Tente ajustar os filtros de busca'
                : 'Comece mapeando os atores do seu território'
              }
            </p>
            {!search && filterTipo === 'todos' && filterComunidade === 'todos' && (
              <Button 
                className="bg-[#2D6A4F] hover:bg-[#1B4332]"
                onClick={() => setShowDialog(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Primeiro Ator
              </Button>
            )}
          </Card>
        ) : (
          filteredAtores.map(ator => {
            const tipo = tipoConfig[ator.tipo] || tipoConfig.outro;
            const influencia = influenciaConfig[ator.nivel_influencia] || influenciaConfig.medio;
            const atividade = atividadeConfig[ator.nivel_atividade] || atividadeConfig.baixo;

            return (
              <Card key={ator.id} className="hover:shadow-md transition-all duration-200">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-full bg-[#2D6A4F] flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                        {ator.nome?.[0]?.toUpperCase() || 'A'}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-slate-900 truncate">{ator.nome}</h3>
                        {ator.cargo && (
                          <p className="text-sm text-slate-500 truncate">{ator.cargo}</p>
                        )}
                        {ator.organizacao && (
                          <p className="text-sm text-slate-500 truncate flex items-center gap-1">
                            <Building className="w-3.5 h-3.5" />
                            {ator.organizacao}
                          </p>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setViewingAtor(ator.id)}>
                          <Eye className="w-4 h-4 mr-2" />
                          Ver Perfil
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setEditingAtor(ator);
                          setShowDialog(true);
                        }}>
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => setDeleteId(ator.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4">
                    <Badge variant="secondary" className={cn("text-xs", tipo.color)}>
                      {tipo.label}
                    </Badge>
                    <Badge variant="secondary" className={cn("text-xs", influencia.color)}>
                      <Star className="w-3 h-3 mr-1" />
                      {influencia.label}
                    </Badge>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                    {ator.comunidade && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        {ator.comunidade}
                      </div>
                    )}
                    {ator.contato?.telefone && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Phone className="w-4 h-4 text-slate-400" />
                        {ator.contato.telefone}
                      </div>
                    )}
                    {ator.contato?.email && (
                      <div className="flex items-center gap-2 text-sm text-slate-600 truncate">
                        <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{ator.contato.email}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                    <span className="text-xs text-slate-500">Nível de atividade</span>
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full", atividade.color)} />
                      <span className="text-xs text-slate-600">{atividade.label}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={(open) => { 
        setShowDialog(open); 
        if (!open) setEditingAtor(null);
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <FormularioAtor
            ator={editingAtor}
            onSalvar={(data) => {
              if (editingAtor) {
                updateMutation.mutate({ id: editingAtor.id, data });
              } else {
                createMutation.mutate(data);
              }
            }}
            onCancelar={() => {
              setShowDialog(false);
              setEditingAtor(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir ator?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O ator será permanentemente removido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteMutation.mutate(deleteId)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}