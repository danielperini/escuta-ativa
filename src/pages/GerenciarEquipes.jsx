import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Plus, 
  Users, 
  Crown,
  ShieldCheck,
  UserCheck,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  RefreshCw
} from 'lucide-react';
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
import { Input } from "@/components/ui/input";
import FormularioEquipe from '@/components/equipes/FormularioEquipe';
import DetalhesEquipe from '@/components/equipes/DetalhesEquipe';
import { toast } from 'sonner';
import { cn } from "@/lib/utils";
import GraficosInterativos from '@/components/dashboard/GraficosInterativos';

const funcaoConfig = {
  coordenador_geral: { label: 'Coordenador Geral', icon: Crown, color: 'bg-purple-100 text-purple-700' },
  coordenador: { label: 'Coordenador', icon: ShieldCheck, color: 'bg-blue-100 text-blue-700' },
  supervisor: { label: 'Supervisor', icon: UserCheck, color: 'bg-emerald-100 text-emerald-700' },
  membro: { label: 'Membro', icon: Users, color: 'bg-slate-100 text-slate-700' }
};

const tipoConfig = {
  campo: { label: 'Campo', color: 'bg-green-100 text-green-700' },
  analise: { label: 'Análise', color: 'bg-blue-100 text-blue-700' },
  coordenacao: { label: 'Coordenação', color: 'bg-purple-100 text-purple-700' },
  mista: { label: 'Mista', color: 'bg-amber-100 text-amber-700' }
};

export default function GerenciarEquipes() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingEquipe, setEditingEquipe] = useState(null);
  const [viewingEquipe, setViewingEquipe] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: equipes = [], isLoading, refetch } = useQuery({
    queryKey: ['equipes'],
    queryFn: () => base44.entities.Equipe.list('-created_date')
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Equipe.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipes'] });
      setDeleteId(null);
      toast.success('Equipe excluída com sucesso');
    }
  });

  // Determinar função do usuário atual
  const minhaFuncao = React.useMemo(() => {
    if (!user || !equipes) return 'membro';
    
    // Verifica se é coordenador geral de alguma equipe
    if (equipes.some(e => e.coordenador_geral_email === user.email)) {
      return 'coordenador_geral';
    }
    
    // Verifica se é coordenador
    if (equipes.some(e => e.coordenadores_emails?.includes(user.email))) {
      return 'coordenador';
    }
    
    // Verifica se é supervisor
    if (equipes.some(e => e.supervisor_email === user.email)) {
      return 'supervisor';
    }
    
    return 'membro';
  }, [user, equipes]);

  // Filtrar equipes baseado na função
  const equipesVisiveis = React.useMemo(() => {
    if (!user) return [];
    
    let filtered = equipes;
    
    // Coordenador geral vê tudo
    if (minhaFuncao === 'coordenador_geral') {
      filtered = equipes;
    }
    // Coordenador vê suas equipes
    else if (minhaFuncao === 'coordenador') {
      filtered = equipes.filter(e => 
        e.coordenadores_emails?.includes(user.email) ||
        e.coordenador_geral_email === user.email
      );
    }
    // Supervisor vê sua equipe
    else if (minhaFuncao === 'supervisor') {
      filtered = equipes.filter(e => e.supervisor_email === user.email);
    }
    // Membro vê sua equipe
    else {
      filtered = equipes.filter(e => 
        e.membros?.some(m => m.email === user.email && m.ativo)
      );
    }

    // Aplicar busca
    if (search) {
      filtered = filtered.filter(e =>
        e.nome?.toLowerCase().includes(search.toLowerCase()) ||
        e.descricao?.toLowerCase().includes(search.toLowerCase()) ||
        e.comunidades_atendidas?.some(c => c.toLowerCase().includes(search.toLowerCase()))
      );
    }

    return filtered;
  }, [equipes, user, minhaFuncao, search]);

  const handleEdit = (equipe) => {
    setEditingEquipe(equipe);
    setShowForm(true);
  };

  const handleView = (equipe) => {
    setViewingEquipe(equipe);
  };

  const stats = {
    total: equipesVisiveis.length,
    ativas: equipesVisiveis.filter(e => e.ativa).length,
    membrosTotal: equipesVisiveis.reduce((acc, e) => acc + (e.membros?.filter(m => m.ativo).length || 0), 0)
  };

  const podeGerenciar = minhaFuncao === 'coordenador_geral' || minhaFuncao === 'coordenador';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Gerenciar Equipes</h2>
          <p className="text-slate-500 mt-1">
            {equipesVisiveis.length} equipe{equipesVisiveis.length !== 1 && 's'} • Seu nível: {funcaoConfig[minhaFuncao]?.label}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          {podeGerenciar && (
            <Button 
              onClick={() => {
                setEditingEquipe(null);
                setShowForm(true);
              }}
              className="bg-[#2D6A4F] hover:bg-[#1B4332] gap-2"
            >
              <Plus className="w-4 h-4" />
              Nova Equipe
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total de Equipes</p>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              </div>
              <Users className="w-10 h-10 text-slate-300" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Equipes Ativas</p>
                <p className="text-2xl font-bold text-emerald-600">{stats.ativas}</p>
              </div>
              <ShieldCheck className="w-10 h-10 text-emerald-300" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total de Membros</p>
                <p className="text-2xl font-bold text-blue-600">{stats.membrosTotal}</p>
              </div>
              <UserCheck className="w-10 h-10 text-blue-300" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar equipes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Gráficos */}
      {equipesVisiveis.length > 0 && (
        <div className="mt-6">
          <GraficosInterativos />
        </div>
      )}

      {/* Lista de Equipes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-xl" />
          ))
        ) : equipesVisiveis.length === 0 ? (
          <Card className="col-span-full p-12 text-center">
            <Users className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhuma equipe encontrada</h3>
            <p className="text-slate-500">
              {podeGerenciar ? 'Crie sua primeira equipe para começar' : 'Você ainda não faz parte de nenhuma equipe'}
            </p>
          </Card>
        ) : (
          equipesVisiveis.map(equipe => {
            const FuncaoIcon = funcaoConfig[minhaFuncao]?.icon || Users;
            const membrosAtivos = equipe.membros?.filter(m => m.ativo).length || 0;
            
            return (
              <Card key={equipe.id} className="hover:shadow-md transition-all">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {equipe.cor_identificacao && (
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: equipe.cor_identificacao }}
                          />
                        )}
                        <CardTitle className="text-base">{equipe.nome}</CardTitle>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary" className={tipoConfig[equipe.tipo]?.color}>
                          {tipoConfig[equipe.tipo]?.label}
                        </Badge>
                        {equipe.ativa ? (
                          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                            Ativa
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                            Inativa
                          </Badge>
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
                        <DropdownMenuItem onClick={() => handleView(equipe)}>
                          <Eye className="w-4 h-4 mr-2" />
                          Ver Detalhes
                        </DropdownMenuItem>
                        {podeGerenciar && (
                          <>
                            <DropdownMenuItem onClick={() => handleEdit(equipe)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => setDeleteId(equipe.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {equipe.descricao && (
                    <p className="text-sm text-slate-600 line-clamp-2">{equipe.descricao}</p>
                  )}
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Membros</span>
                      <span className="font-medium">{membrosAtivos}</span>
                    </div>
                    {equipe.comunidades_atendidas?.length > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Comunidades</span>
                        <span className="font-medium">{equipe.comunidades_atendidas.length}</span>
                      </div>
                    )}
                    {equipe.estatisticas?.total_registros > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Registros</span>
                        <span className="font-medium">{equipe.estatisticas.total_registros}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Crown className="w-3 h-3" />
                      <span className="truncate">
                        {equipe.supervisor_email?.split('@')[0]}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Formulário de Equipe */}
      <FormularioEquipe
        open={showForm}
        onOpenChange={setShowForm}
        equipe={editingEquipe}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['equipes'] });
          setShowForm(false);
          setEditingEquipe(null);
        }}
      />

      {/* Detalhes da Equipe */}
      <DetalhesEquipe
        equipe={viewingEquipe}
        open={!!viewingEquipe}
        onOpenChange={(open) => !open && setViewingEquipe(null)}
        onEdit={() => {
          handleEdit(viewingEquipe);
          setViewingEquipe(null);
        }}
      />

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir equipe?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A equipe será permanentemente removida.
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