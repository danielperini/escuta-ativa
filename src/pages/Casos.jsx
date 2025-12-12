import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, isPast, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Briefcase, 
  Plus, 
  Search, 
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MoreVertical,
  Edit,
  Trash2,
  Loader2,
  Calendar,
  MapPin,
  User,
  Users,
  RefreshCw,
  Target
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const statusConfig = {
  em_aberto: { label: 'Em Aberto', color: 'bg-amber-100 text-amber-700', icon: Clock },
  pendente: { label: 'Pendente', color: 'bg-slate-100 text-slate-700', icon: Clock },
  em_andamento: { label: 'Em Andamento', color: 'bg-blue-100 text-blue-700', icon: Clock },
  concluido: { label: 'Concluído', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  cancelado: { label: 'Cancelado', color: 'bg-slate-100 text-slate-500', icon: XCircle }
};

const prioridadeConfig = {
  baixa: { label: 'Baixa', color: 'bg-slate-100 text-slate-600' },
  media: { label: 'Média', color: 'bg-blue-100 text-blue-600' },
  alta: { label: 'Alta', color: 'bg-orange-100 text-orange-600' },
  urgente: { label: 'Urgente', color: 'bg-red-100 text-red-600' }
};

const tipoConfig = {
  devolutiva: 'Devolutiva',
  demanda_individual: 'Demanda Individual',
  demanda_coletiva: 'Demanda Coletiva',
  indenizacao: 'Indenização',
  servico: 'Serviço',
  apoio: 'Apoio',
  infraestrutura: 'Infraestrutura',
  outro: 'Outro'
};

export default function Casos() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterComunidade, setFilterComunidade] = useState('todos');
  const [activeTab, setActiveTab] = useState('todos');
  const [deleteId, setDeleteId] = useState(null);

  const { data: casos = [], isLoading, refetch } = useQuery({
    queryKey: ['casos'],
    queryFn: () => base44.entities.Caso.list('-created_date'),
    staleTime: 30000,
    refetchInterval: 60000
  });

  const { data: comunidades = [] } = useQuery({
    queryKey: ['comunidades'],
    queryFn: () => base44.entities.Comunidade.list()
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Caso.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['casos'] });
      setDeleteId(null);
    }
  });

  const quickStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Caso.update(id, { 
      status,
      data_conclusao: status === 'concluido' ? new Date().toISOString().split('T')[0] : null
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['casos'] });
    }
  });

  // Process casos with overdue status
  const processedCasos = casos.map(c => {
    const isAtrasado = c.prazo && isPast(new Date(c.prazo)) && !['concluido', 'cancelado'].includes(c.status);
    return { ...c, isAtrasado };
  });

  const filteredCasos = processedCasos.filter(c => {
    const matchSearch = !search || 
      c.titulo?.toLowerCase().includes(search.toLowerCase()) ||
      c.descricao?.toLowerCase().includes(search.toLowerCase());
    const matchComunidade = filterComunidade === 'todos' || c.comunidade === filterComunidade;
    
    if (activeTab === 'abertos') return matchSearch && matchComunidade && ['em_aberto', 'pendente', 'em_andamento'].includes(c.status);
    if (activeTab === 'atrasados') return matchSearch && matchComunidade && c.isAtrasado;
    if (activeTab === 'concluidos') return matchSearch && matchComunidade && c.status === 'concluido';
    return matchSearch && matchComunidade;
  });

  const stats = {
    total: casos.length,
    abertos: processedCasos.filter(c => ['em_aberto', 'pendente', 'em_andamento'].includes(c.status)).length,
    atrasados: processedCasos.filter(c => c.isAtrasado).length,
    concluidos: processedCasos.filter(c => c.status === 'concluido').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Casos</h2>
          <p className="text-slate-500 mt-1">Situações que exigem devolutiva ou acompanhamento</p>
        </div>
        <Button 
          variant="outline"
          onClick={() => refetch()}
          disabled={isLoading}
        >
          <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 cursor-pointer hover:shadow-md transition-all" onClick={() => setActiveTab('todos')}>
          <div className="text-sm text-slate-500">Total</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</div>
        </Card>
        <Card className="p-4 cursor-pointer hover:shadow-md transition-all" onClick={() => setActiveTab('abertos')}>
          <div className="text-sm text-slate-500">Abertos</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{stats.abertos}</div>
        </Card>
        <Card className="p-4 cursor-pointer hover:shadow-md transition-all" onClick={() => setActiveTab('atrasados')}>
          <div className="text-sm text-slate-500">Atrasados</div>
          <div className="text-2xl font-bold text-red-600 mt-1">{stats.atrasados}</div>
        </Card>
        <Card className="p-4 cursor-pointer hover:shadow-md transition-all" onClick={() => setActiveTab('concluidos')}>
          <div className="text-sm text-slate-500">Concluídos</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{stats.concluidos}</div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="todos">Todos</TabsTrigger>
          <TabsTrigger value="abertos">Abertos</TabsTrigger>
          <TabsTrigger value="atrasados" className="text-red-600">Atrasados</TabsTrigger>
          <TabsTrigger value="concluidos">Concluídos</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar caso..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterComunidade} onValueChange={setFilterComunidade}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas comunidades</SelectItem>
              {comunidades.map(c => (
                <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* List */}
      <div className="space-y-3">
        {isLoading ? (
          Array(5).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))
        ) : filteredCasos.length === 0 ? (
          <Card className="p-12 text-center">
            <Briefcase className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhum caso encontrado</h3>
            <p className="text-slate-500">
              Casos são abertos automaticamente quando há devolutivas ou pendências
            </p>
          </Card>
        ) : (
          filteredCasos.map(caso => {
            const status = statusConfig[caso.isAtrasado ? 'em_aberto' : caso.status] || statusConfig.em_aberto;
            const prioridade = prioridadeConfig[caso.prioridade] || prioridadeConfig.media;
            const StatusIcon = status.icon;
            const diasRestantes = caso.prazo ? differenceInDays(new Date(caso.prazo), new Date()) : null;

            return (
              <Card 
                key={caso.id}
                className={cn(
                  "p-4 hover:shadow-md transition-all",
                  caso.isAtrasado && "border-red-200 bg-red-50/30"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={cn(
                      "p-2 rounded-lg",
                      caso.isAtrasado ? "bg-red-100" : "bg-slate-100"
                    )}>
                      {caso.isAtrasado ? (
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                      ) : (
                        <StatusIcon className="w-5 h-5 text-slate-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900">{caso.titulo}</h3>
                      {caso.descricao && (
                        <p className="text-sm text-slate-600 mt-1 line-clamp-2">{caso.descricao}</p>
                      )}

                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <Badge variant="secondary" className={cn("text-xs", status.color)}>
                          {status.label}
                        </Badge>
                        <Badge variant="secondary" className={cn("text-xs", prioridade.color)}>
                          {prioridade.label}
                        </Badge>
                        <Badge variant="outline" className="text-xs capitalize">
                          {tipoConfig[caso.tipo] || caso.tipo}
                        </Badge>
                        {caso.comunidade && (
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <MapPin className="w-3.5 h-3.5" />
                            {caso.comunidade}
                          </span>
                        )}
                        {caso.tema && (
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <Target className="w-3.5 h-3.5" />
                            {caso.tema}
                          </span>
                        )}
                        {caso.stakeholders_envolvidos?.length > 0 && (
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <Users className="w-3.5 h-3.5" />
                            {caso.stakeholders_envolvidos.length} stakeholder{caso.stakeholders_envolvidos.length !== 1 && 's'}
                          </span>
                        )}
                        {caso.prazo && (
                          <span className={cn(
                            "flex items-center gap-1 text-xs",
                            caso.isAtrasado ? "text-red-600 font-medium" :
                            diasRestantes !== null && diasRestantes <= 7 ? "text-amber-600" : "text-slate-500"
                          )}>
                            <Calendar className="w-3.5 h-3.5" />
                            {caso.isAtrasado 
                              ? `Atrasado ${Math.abs(diasRestantes)} dias`
                              : format(new Date(caso.prazo), "dd/MM/yyyy")
                            }
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!['concluido', 'cancelado'].includes(caso.status) && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                        onClick={() => quickStatusMutation.mutate({ id: caso.id, status: 'concluido' })}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Concluir
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => alert('Edição em desenvolvimento')}>
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => setDeleteId(caso.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir caso?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
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