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
  CheckCircle2,
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
  Target,
  Eye,
  FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { removerDuplicatas } from '@/components/sistema/FiltroDuplicatasAutomatico';
import Pagination from '@/components/shared/Pagination';
import ConsolidadorCasos from '@/components/casos/ConsolidadorCasos';
import FormularioCasoInteligente from '@/components/casos/FormularioCasoInteligente';

const statusConfig = {
  em_aberto: { label: 'Em Aberto', color: 'bg-amber-100 text-amber-700', icon: Clock },
  pendente: { label: 'Pendente', color: 'bg-slate-100 text-slate-700', icon: Clock },
  em_andamento: { label: 'Em Andamento', color: 'bg-blue-100 text-blue-700', icon: Clock },
  concluido: { label: 'Concluído', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
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
  const [viewingCaso, setViewingCaso] = useState(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data: casos = [], isLoading, refetch } = useQuery({
    queryKey: ['casos'],
    queryFn: async () => {
      const lista = await base44.entities.Caso.list('-created_date');
      return removerDuplicatas(lista, 'caso');
    },
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
    mutationFn: async ({ id, status, prioridade }) => {
      const caso = casos.find(c => c.id === id);
      const updates = { status };
      
      if (status === 'concluido') {
        updates.data_conclusao = new Date().toISOString().split('T')[0];
        // Adicionar ao histórico
        updates.historico_atualizacoes = [
          ...(caso?.historico_atualizacoes || []),
          {
            data: new Date().toISOString(),
            usuario: (await base44.auth.me()).email,
            acao: 'Caso concluído',
            observacao: 'Status atualizado para concluído'
          }
        ];
      }
      
      if (prioridade) {
        updates.prioridade = prioridade;
      }
      
      return base44.entities.Caso.update(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['casos'] });
    }
  });

  // Process casos with overdue status and auto-update
  const processedCasos = React.useMemo(() => {
    return casos.map(c => {
      const isAtrasado = c.prazo && isPast(new Date(c.prazo)) && !['concluido', 'cancelado'].includes(c.status);
      return { ...c, isAtrasado };
    });
  }, [casos]);

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

  const totalPages = Math.ceil(filteredCasos.length / itemsPerPage);
  const paginatedCasos = filteredCasos.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, filterComunidade, activeTab]);

  const stats = {
    total: casos.length,
    abertos: processedCasos.filter(c => ['em_aberto', 'pendente', 'em_andamento'].includes(c.status)).length,
    atrasados: processedCasos.filter(c => c.isAtrasado).length,
    concluidos: processedCasos.filter(c => c.status === 'concluido').length
  };

  return (
    <div className="space-y-4 md:space-y-6 pb-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Casos</h2>
          <p className="text-slate-500 mt-1">Situações que exigem devolutiva ou acompanhamento</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowCreateDialog(true)}
            className="bg-[#2D6A4F] hover:bg-[#1B4332]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Caso
          </Button>
          <Button 
            variant="outline"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Consolidador de Casos */}
      <ConsolidadorCasos casos={casos} />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card className="p-3 md:p-4 cursor-pointer hover:shadow-md transition-all active:scale-95" onClick={() => setActiveTab('todos')}>
          <div className="text-xs md:text-sm text-slate-500">Total</div>
          <div className="text-xl md:text-2xl font-bold text-slate-900 mt-1">{stats.total}</div>
        </Card>
        <Card className="p-3 md:p-4 cursor-pointer hover:shadow-md transition-all active:scale-95" onClick={() => setActiveTab('abertos')}>
          <div className="text-xs md:text-sm text-slate-500">Abertos</div>
          <div className="text-xl md:text-2xl font-bold text-blue-600 mt-1">{stats.abertos}</div>
        </Card>
        <Card className="p-3 md:p-4 cursor-pointer hover:shadow-md transition-all active:scale-95" onClick={() => setActiveTab('atrasados')}>
          <div className="text-xs md:text-sm text-slate-500">Atrasados</div>
          <div className="text-xl md:text-2xl font-bold text-red-600 mt-1">{stats.atrasados}</div>
        </Card>
        <Card className="p-3 md:p-4 cursor-pointer hover:shadow-md transition-all active:scale-95" onClick={() => setActiveTab('concluidos')}>
          <div className="text-xs md:text-sm text-slate-500">Concluídos</div>
          <div className="text-xl md:text-2xl font-bold text-emerald-600 mt-1">{stats.concluidos}</div>
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
      <Card className="p-3 md:p-4">
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
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
              <SelectValue>
                {filterComunidade === 'todos' ? 'Todas Comunidades' : filterComunidade}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas Comunidades</SelectItem>
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
          paginatedCasos.map(caso => {
            const status = statusConfig[caso.isAtrasado ? 'em_aberto' : caso.status] || statusConfig.em_aberto;
            const prioridade = prioridadeConfig[caso.prioridade] || prioridadeConfig.media;
            const StatusIcon = status.icon;
            const diasRestantes = caso.prazo ? differenceInDays(new Date(caso.prazo), new Date()) : null;

            return (
              <Card 
                key={caso.id}
                className={cn(
                  "p-3 md:p-4 hover:shadow-md transition-all",
                  caso.isAtrasado && "border-red-200 bg-red-50/30"
                )}
              >
                <div className="flex flex-col md:flex-row items-start justify-between gap-3 md:gap-4">
                  <div className="flex items-start gap-3 md:gap-4 flex-1">
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
                      <Link to={createPageUrl('VerCaso') + `?id=${caso.id}`}>
                        <h3 className="font-semibold text-slate-900 hover:text-blue-600 cursor-pointer">
                          {caso.titulo}
                        </h3>
                      </Link>
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
                        <CheckCircle2 className="w-4 h-4 mr-1" />
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
                        <DropdownMenuItem onClick={() => {
                          setViewingCaso(caso);
                          setShowDetailsDialog(true);
                        }}>
                          <Eye className="w-4 h-4 mr-2" />
                          Ver Detalhes
                        </DropdownMenuItem>
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

      {/* Pagination */}
      {!isLoading && filteredCasos.length > 0 && (
        <Card className="p-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            totalItems={filteredCasos.length}
          />
        </Card>
      )}

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Caso</DialogTitle>
          </DialogHeader>
          {viewingCaso && (
            <div className="space-y-4 py-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">{viewingCaso.titulo}</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className={statusConfig[viewingCaso.status]?.color}>
                    {statusConfig[viewingCaso.status]?.label}
                  </Badge>
                  <Badge variant="secondary" className={prioridadeConfig[viewingCaso.prioridade]?.color}>
                    {prioridadeConfig[viewingCaso.prioridade]?.label}
                  </Badge>
                  <Badge variant="outline" className="text-xs capitalize">
                    {tipoConfig[viewingCaso.tipo]}
                  </Badge>
                </div>
              </div>

              <div className="grid gap-3">
                {viewingCaso.descricao && (
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <FileText className="w-5 h-5 text-slate-500 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-slate-700">Descrição</div>
                      <div className="text-sm text-slate-600 whitespace-pre-wrap">{viewingCaso.descricao}</div>
                    </div>
                  </div>
                )}

                {viewingCaso.comunidade && (
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <MapPin className="w-5 h-5 text-slate-500 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-slate-700">Comunidade</div>
                      <div className="text-sm text-slate-600">{viewingCaso.comunidade}</div>
                    </div>
                  </div>
                )}

                {viewingCaso.municipio && (
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <MapPin className="w-5 h-5 text-slate-500 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-slate-700">Município</div>
                      <div className="text-sm text-slate-600">{viewingCaso.municipio}</div>
                    </div>
                  </div>
                )}

                {viewingCaso.tema && (
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <Target className="w-5 h-5 text-slate-500 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-slate-700">Tema</div>
                      <div className="text-sm text-slate-600">{viewingCaso.tema}</div>
                    </div>
                  </div>
                )}

                {viewingCaso.stakeholders_envolvidos?.length > 0 && (
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <Users className="w-5 h-5 text-slate-500 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-slate-700">Stakeholders Envolvidos</div>
                      <div className="text-sm text-slate-600">{viewingCaso.stakeholders_envolvidos.length} stakeholder(s)</div>
                    </div>
                  </div>
                )}

                {viewingCaso.prazo && (
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-slate-500 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-slate-700">Prazo</div>
                      <div className="text-sm text-slate-600">
                        {format(new Date(viewingCaso.prazo), "dd/MM/yyyy", { locale: ptBR })}
                      </div>
                    </div>
                  </div>
                )}

                {viewingCaso.responsavel_empresa && (
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <User className="w-5 h-5 text-slate-500 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-slate-700">Responsável</div>
                      <div className="text-sm text-slate-600">{viewingCaso.responsavel_empresa}</div>
                    </div>
                  </div>
                )}

                {viewingCaso.registro_origem_id && (
                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-blue-700">Registro de Origem</div>
                      <div className="text-sm text-blue-600">ID: {viewingCaso.registro_origem_id}</div>
                    </div>
                  </div>
                )}

                {viewingCaso.created_by && (
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <User className="w-5 h-5 text-slate-500 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-slate-700">Criado por</div>
                      <div className="text-sm text-slate-600">{viewingCaso.created_by}</div>
                    </div>
                  </div>
                )}

                {viewingCaso.created_date && (
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <Clock className="w-5 h-5 text-slate-500 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-slate-700">Data de Criação</div>
                      <div className="text-sm text-slate-600">
                        {format(new Date(viewingCaso.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <FormularioCasoInteligente
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={() => {
          refetch();
          setShowCreateDialog(false);
        }}
      />

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