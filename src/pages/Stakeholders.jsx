import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Plus, 
  Search,
  Network, 
  MapPin,
  Phone,
  Mail,
  Building,
  MoreVertical,
  Edit,
  Trash2,
  Loader2,
  Star,
  Eye,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  Grid3x3,
  List
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import DetalhesStakeholderCompleto from '@/components/stakeholders/DetalhesStakeholderCompleto';
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import Pagination from '@/components/shared/Pagination';

const tipoConfig = {
  pessoa: { label: 'Pessoa', color: 'bg-blue-100 text-blue-700' },
  entidade: { label: 'Entidade', color: 'bg-purple-100 text-purple-700' }
};

const subtipoConfig = {
  lideranca: { label: 'Liderança', color: 'bg-purple-100 text-purple-700' },
  representante: { label: 'Representante', color: 'bg-blue-100 text-blue-700' },
  morador: { label: 'Morador', color: 'bg-slate-100 text-slate-700' },
  associacao: { label: 'Associação', color: 'bg-emerald-100 text-emerald-700' },
  ong: { label: 'ONG', color: 'bg-amber-100 text-amber-700' },
  governo: { label: 'Governo', color: 'bg-red-100 text-red-700' },
  outro: { label: 'Outro', color: 'bg-gray-100 text-gray-600' }
};

const statusCadastroConfig = {
  provisorio: { label: 'Provisório', color: 'bg-amber-100 text-amber-700', icon: AlertCircle },
  parcial: { label: 'Parcial', color: 'bg-blue-100 text-blue-700', icon: AlertCircle },
  completo: { label: 'Completo', color: 'bg-emerald-100 text-emerald-700', icon: Star }
};

const influenciaConfig = {
  baixo: { label: 'Baixa', color: 'bg-slate-100 text-slate-600' },
  medio: { label: 'Média', color: 'bg-amber-100 text-amber-600' },
  alto: { label: 'Alta', color: 'bg-emerald-100 text-emerald-600' }
};

export default function Stakeholders() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState('todos');
  const [filterComunidade, setFilterComunidade] = useState('todos');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [deleteId, setDeleteId] = useState(null);
  const [viewMode, setViewMode] = useState('cards');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [editingStakeholder, setEditingStakeholder] = useState(null);
  const [viewingStakeholder, setViewingStakeholder] = useState(null);
  const [detalhesStakeholder, setDetalhesStakeholder] = useState(null);
  const [filterTags, setFilterTags] = useState('todas');
  const [formData, setFormData] = useState({});

  const { data: stakeholders = [], isLoading, refetch } = useQuery({
    queryKey: ['stakeholders'],
    queryFn: () => base44.entities.Stakeholder.list('-created_date'),
    staleTime: 30000,
    refetchInterval: 60000
  });

  const { data: comunidades = [] } = useQuery({
    queryKey: ['comunidades'],
    queryFn: () => base44.entities.Comunidade.list(),
    staleTime: 300000
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Stakeholder.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stakeholders'] });
      setDeleteId(null);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Stakeholder.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stakeholders'] });
      setShowEditDialog(false);
      setEditingStakeholder(null);
    }
  });

  const handleEdit = (stakeholder) => {
    setEditingStakeholder(stakeholder);
    setFormData({
      nome: stakeholder.nome || '',
      tipo: stakeholder.tipo || 'pessoa',
      subtipo: stakeholder.subtipo || '',
      comunidade: stakeholder.comunidade || '',
      municipio: stakeholder.municipio || '',
      papel_social: stakeholder.papel_social || '',
      organizacao: stakeholder.organizacao || '',
      endereco: stakeholder.endereco || '',
      contato: stakeholder.contato || { telefone: '', email: '', whatsapp: '' },
      nivel_influencia: stakeholder.nivel_influencia || 'medio',
      nivel_atividade: stakeholder.nivel_atividade || 'baixo',
      notas: stakeholder.notas || ''
    });
    setShowEditDialog(true);
  };

  const handleSave = () => {
    updateMutation.mutate({ id: editingStakeholder.id, data: formData });
  };

  // Extrair todas as tags únicas
  const todasTags = React.useMemo(() => {
    const tags = new Set();
    stakeholders.forEach(s => {
      s.segmentos?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [stakeholders]);

  const filteredStakeholders = stakeholders.filter(s => {
    const matchSearch = !search || 
      s.nome?.toLowerCase().includes(search.toLowerCase()) ||
      s.organizacao?.toLowerCase().includes(search.toLowerCase()) ||
      s.papel_social?.toLowerCase().includes(search.toLowerCase());
    const matchTipo = filterTipo === 'todos' || s.tipo === filterTipo;
    const matchComunidade = filterComunidade === 'todos' || s.comunidade === filterComunidade;
    const matchStatus = filterStatus === 'todos' || s.status_cadastro === filterStatus;
    const matchTags = filterTags === 'todas' || s.segmentos?.includes(filterTags);
    return matchSearch && matchTipo && matchComunidade && matchStatus && matchTags;
  });

  const totalPages = Math.ceil(filteredStakeholders.length / itemsPerPage);
  const paginatedStakeholders = filteredStakeholders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, filterTipo, filterComunidade, filterStatus, filterTags]);

  const stats = {
    total: stakeholders.length,
    provisorios: stakeholders.filter(s => s.status_cadastro === 'provisorio').length,
    pessoas: stakeholders.filter(s => s.tipo === 'pessoa').length,
    entidades: stakeholders.filter(s => s.tipo === 'entidade').length
  };

  return (
    <div className="space-y-4 md:space-y-6 pb-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Stakeholders</h2>
          <p className="text-slate-500 mt-1">{stakeholders.length} stakeholders mapeados</p>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1 border rounded-lg p-1">
            <Button 
              variant={viewMode === 'cards' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('cards')}
              className={cn("h-8 w-8", viewMode === 'cards' && "bg-[#2D6A4F]")}
            >
              <Grid3x3 className="w-4 h-4" />
            </Button>
            <Button 
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('list')}
              className={cn("h-8 w-8", viewMode === 'list' && "bg-[#2D6A4F]")}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
          <Button 
            variant="outline"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          </Button>
          <Link to={createPageUrl('MapaStakeholders')}>
            <Button variant="outline" className="gap-2">
              <Network className="w-4 h-4" />
              Mapa de Rede
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card className="p-3 md:p-4">
          <div className="text-sm text-slate-500">Total</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</div>
        </Card>
        <Card className="p-3 md:p-4">
          <div className="text-sm text-slate-500">Provisórios</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{stats.provisorios}</div>
        </Card>
        <Card className="p-3 md:p-4">
          <div className="text-sm text-slate-500">Pessoas</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{stats.pessoas}</div>
        </Card>
        <Card className="p-3 md:p-4">
          <div className="text-sm text-slate-500">Entidades</div>
          <div className="text-2xl font-bold text-purple-600 mt-1">{stats.entidades}</div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-3 md:p-4">
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por nome, organização ou papel..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterTipo} onValueChange={setFilterTipo}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="pessoa">Pessoas</SelectItem>
              <SelectItem value="entidade">Entidades</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos status</SelectItem>
              <SelectItem value="provisorio">Provisórios</SelectItem>
              <SelectItem value="parcial">Parciais</SelectItem>
              <SelectItem value="completo">Completos</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterComunidade} onValueChange={setFilterComunidade}>
            <SelectTrigger className="w-full sm:w-40">
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
          {todasTags.length > 0 && (
            <Select value={filterTags} onValueChange={setFilterTags}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue>
                  {filterTags === 'todas' ? 'Todas Tags' : filterTags}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas Tags</SelectItem>
                {todasTags.map(tag => (
                  <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </Card>

      {/* Grid / List */}
      <div className={cn(
        viewMode === 'cards' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4" : "space-y-3"
      )}>
        {isLoading ? (
          Array(6).fill(0).map((_, i) => (
            <Skeleton key={i} className={cn(viewMode === 'cards' ? "h-56" : "h-32", "rounded-xl")} />
          ))
        ) : filteredStakeholders.length === 0 ? (
          <Card className="col-span-full p-12 text-center">
            <Users className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhum stakeholder encontrado</h3>
            <p className="text-slate-500">
              Stakeholders são criados automaticamente quando mencionados nos registros
            </p>
          </Card>
        ) : (
          paginatedStakeholders.map(stakeholder => {
            const tipo = tipoConfig[stakeholder.tipo] || tipoConfig.pessoa;
            const statusCadastro = statusCadastroConfig[stakeholder.status_cadastro] || statusCadastroConfig.provisorio;
            const StatusIcon = statusCadastro.icon;

            if (viewMode === 'list') {
              return (
                <Card key={stakeholder.id} className="hover:shadow-md transition-all p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-full bg-[#2D6A4F] flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                        {stakeholder.tipo === 'pessoa' ? '👤' : '🏢'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Link to={createPageUrl('PerfilStakeholder') + `?id=${stakeholder.id}`}>
                            <h3 className="font-semibold text-slate-900 hover:text-blue-600 cursor-pointer">
                              {stakeholder.nome}
                            </h3>
                          </Link>
                          {stakeholder.id_sequencial && (
                            <span className="text-xs text-slate-400">#{stakeholder.id_sequencial}</span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 items-center">
                          <Badge variant="secondary" className={cn("text-xs", tipo.color)}>
                            {tipo.label}
                          </Badge>
                          {stakeholder.subtipo && (
                            <Badge variant="secondary" className={cn("text-xs", subtipoConfig[stakeholder.subtipo]?.color)}>
                              {subtipoConfig[stakeholder.subtipo]?.label}
                            </Badge>
                          )}
                          <Badge variant="outline" className={cn("text-xs flex items-center gap-1", statusCadastro.color)}>
                            <StatusIcon className="w-3 h-3" />
                            {statusCadastro.label}
                          </Badge>
                          <span className="flex items-center gap-1 text-sm text-slate-600">
                            <MapPin className="w-4 h-4" />
                            {stakeholder.comunidade}
                          </span>
                          {stakeholder.papel_social && (
                            <span className="text-sm text-slate-500">• {stakeholder.papel_social}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="text-right">
                        <div className="text-sm font-medium text-slate-900">
                          {stakeholder.historico_interacoes || 0} interações
                        </div>
                        {stakeholder.casos_vinculados?.length > 0 && (
                          <div className="text-xs text-slate-500">
                            {stakeholder.casos_vinculados.length} caso{stakeholder.casos_vinculados.length !== 1 && 's'}
                          </div>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setDetalhesStakeholder(stakeholder)}>
                            <Eye className="w-4 h-4 mr-2" />
                            Ver Detalhes Completos
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to={createPageUrl('PerfilStakeholder') + `?id=${stakeholder.id}`}>
                              <Eye className="w-4 h-4 mr-2" />
                              Ver Perfil
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(stakeholder)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => setDeleteId(stakeholder.id)}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </Card>
              );
            }

            return (
              <Card key={stakeholder.id} className="hover:shadow-md transition-all">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-full bg-[#2D6A4F] flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                        {stakeholder.tipo === 'pessoa' ? '👤' : '🏢'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <Link to={createPageUrl('PerfilStakeholder') + `?id=${stakeholder.id}`}>
                          <h3 className="font-semibold text-slate-900 truncate hover:text-blue-600 cursor-pointer">
                            {stakeholder.nome}
                          </h3>
                        </Link>
                        {stakeholder.id_sequencial && (
                          <p className="text-xs text-slate-400">ID: #{stakeholder.id_sequencial}</p>
                        )}
                        {stakeholder.papel_social && (
                          <p className="text-sm text-slate-600 truncate">{stakeholder.papel_social}</p>
                        )}
                        {stakeholder.organizacao && (
                          <p className="text-sm text-slate-500 truncate flex items-center gap-1">
                            <Building className="w-3.5 h-3.5 flex-shrink-0" />
                            {stakeholder.organizacao}
                          </p>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setDetalhesStakeholder(stakeholder)}>
                          <Eye className="w-4 h-4 mr-2" />
                          Ver Detalhes Completos
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={createPageUrl('PerfilStakeholder') + `?id=${stakeholder.id}`}>
                            <Eye className="w-4 h-4 mr-2" />
                            Ver Perfil
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(stakeholder)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => setDeleteId(stakeholder.id)}>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge variant="secondary" className={cn("text-xs", tipo.color)}>
                      {tipo.label}
                    </Badge>
                    {stakeholder.subtipo && (
                      <Badge variant="secondary" className={cn("text-xs", subtipoConfig[stakeholder.subtipo]?.color)}>
                        {subtipoConfig[stakeholder.subtipo]?.label}
                      </Badge>
                    )}
                    <Badge variant="outline" className={cn("text-xs flex items-center gap-1", statusCadastro.color)}>
                      <StatusIcon className="w-3 h-3" />
                      {statusCadastro.label}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                      <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{stakeholder.comunidade}</span>
                    </div>
                    {stakeholder.municipio && (
                      <div className="text-xs text-slate-500 pl-6">
                        📍 {stakeholder.municipio}
                      </div>
                    )}
                    {stakeholder.contato?.telefone && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{stakeholder.contato.telefone}</span>
                      </div>
                    )}
                    {stakeholder.contato?.email && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span className="truncate text-xs">{stakeholder.contato.email}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">
                        {stakeholder.historico_interacoes || 0} interações
                      </span>
                      {stakeholder.casos_vinculados?.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {stakeholder.casos_vinculados.length} caso{stakeholder.casos_vinculados.length !== 1 && 's'}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {!isLoading && filteredStakeholders.length > 0 && (
        <Card className="p-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            totalItems={filteredStakeholders.length}
          />
        </Card>
      )}

      {/* Detalhes Completos Dialog */}
      <DetalhesStakeholderCompleto
        stakeholder={detalhesStakeholder}
        open={!!detalhesStakeholder}
        onOpenChange={(open) => !open && setDetalhesStakeholder(null)}
      />

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Perfil do Stakeholder</DialogTitle>
          </DialogHeader>
          {viewingStakeholder && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-[#2D6A4F] flex items-center justify-center text-white text-2xl font-semibold">
                  {viewingStakeholder.tipo === 'pessoa' ? '👤' : '🏢'}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{viewingStakeholder.nome}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className={tipoConfig[viewingStakeholder.tipo]?.color}>
                      {tipoConfig[viewingStakeholder.tipo]?.label}
                    </Badge>
                    {viewingStakeholder.subtipo && (
                      <Badge variant="secondary" className={subtipoConfig[viewingStakeholder.subtipo]?.color}>
                        {subtipoConfig[viewingStakeholder.subtipo]?.label}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-3">
                {viewingStakeholder.papel_social && (
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="text-sm font-medium text-slate-700">Papel Social</div>
                    <div className="text-sm text-slate-600">{viewingStakeholder.papel_social}</div>
                  </div>
                )}

                {viewingStakeholder.comunidade && (
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="text-sm font-medium text-slate-700">Comunidade</div>
                    <div className="text-sm text-slate-600">{viewingStakeholder.comunidade}</div>
                  </div>
                )}

                {viewingStakeholder.municipio && (
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="text-sm font-medium text-slate-700">Município</div>
                    <div className="text-sm text-slate-600">{viewingStakeholder.municipio}</div>
                  </div>
                )}

                {viewingStakeholder.organizacao && (
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="text-sm font-medium text-slate-700">Organização</div>
                    <div className="text-sm text-slate-600">{viewingStakeholder.organizacao}</div>
                  </div>
                )}

                {viewingStakeholder.contato && (
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="text-sm font-medium text-slate-700 mb-2">Contato</div>
                    <div className="space-y-1 text-sm text-slate-600">
                      {viewingStakeholder.contato.telefone && <div>📞 {viewingStakeholder.contato.telefone}</div>}
                      {viewingStakeholder.contato.whatsapp && <div>💬 {viewingStakeholder.contato.whatsapp}</div>}
                      {viewingStakeholder.contato.email && <div>✉️ {viewingStakeholder.contato.email}</div>}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="text-sm font-medium text-slate-700">Influência</div>
                    <Badge variant="secondary" className={influenciaConfig[viewingStakeholder.nivel_influencia]?.color}>
                      {influenciaConfig[viewingStakeholder.nivel_influencia]?.label}
                    </Badge>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="text-sm font-medium text-slate-700">Interações</div>
                    <div className="text-sm text-slate-600">{viewingStakeholder.historico_interacoes || 0}</div>
                  </div>
                </div>

                {viewingStakeholder.casos_vinculados?.length > 0 && (
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="text-sm font-medium text-slate-700">Casos Vinculados</div>
                    <div className="text-sm text-slate-600">{viewingStakeholder.casos_vinculados.length} caso(s)</div>
                  </div>
                )}

                {viewingStakeholder.notas && (
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="text-sm font-medium text-slate-700">Notas</div>
                    <div className="text-sm text-slate-600 whitespace-pre-wrap">{viewingStakeholder.notas}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={(open) => {
        setShowEditDialog(open);
        if (!open) setEditingStakeholder(null);
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Stakeholder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  value={formData.nome || ''}
                  onChange={(e) => setFormData(p => ({ ...p, nome: e.target.value }))}
                  placeholder="Nome do stakeholder"
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={formData.tipo || 'pessoa'}
                  onValueChange={(value) => setFormData(p => ({ ...p, tipo: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pessoa">Pessoa</SelectItem>
                    <SelectItem value="entidade">Entidade</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Subtipo</Label>
                <Select
                  value={formData.subtipo || ''}
                  onValueChange={(value) => setFormData(p => ({ ...p, subtipo: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(subtipoConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Comunidade *</Label>
                <Select
                  value={formData.comunidade || ''}
                  onValueChange={(value) => setFormData(p => ({ ...p, comunidade: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {comunidades.map(c => (
                      <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Município</Label>
                <Input
                  value={formData.municipio || ''}
                  onChange={(e) => setFormData(p => ({ ...p, municipio: e.target.value }))}
                  placeholder="Município"
                />
              </div>
              <div className="space-y-2">
                <Label>Papel Social</Label>
                <Input
                  value={formData.papel_social || ''}
                  onChange={(e) => setFormData(p => ({ ...p, papel_social: e.target.value }))}
                  placeholder="Ex: Liderança comunitária"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Organização</Label>
              <Input
                value={formData.organizacao || ''}
                onChange={(e) => setFormData(p => ({ ...p, organizacao: e.target.value }))}
                placeholder="Organização vinculada"
              />
            </div>

            <div className="space-y-2">
              <Label>Endereço</Label>
              <Input
                value={formData.endereco || ''}
                onChange={(e) => setFormData(p => ({ ...p, endereco: e.target.value }))}
                placeholder="Endereço completo"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  value={formData.contato?.telefone || ''}
                  onChange={(e) => setFormData(p => ({ ...p, contato: { ...p.contato, telefone: e.target.value } }))}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="space-y-2">
                <Label>WhatsApp</Label>
                <Input
                  value={formData.contato?.whatsapp || ''}
                  onChange={(e) => setFormData(p => ({ ...p, contato: { ...p.contato, whatsapp: e.target.value } }))}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={formData.contato?.email || ''}
                  onChange={(e) => setFormData(p => ({ ...p, contato: { ...p.contato, email: e.target.value } }))}
                  placeholder="email@exemplo.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nível de Influência</Label>
                <Select
                  value={formData.nivel_influencia || 'medio'}
                  onValueChange={(value) => setFormData(p => ({ ...p, nivel_influencia: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(influenciaConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Nível de Atividade</Label>
                <Select
                  value={formData.nivel_atividade || 'baixo'}
                  onValueChange={(value) => setFormData(p => ({ ...p, nivel_atividade: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inativo">Inativo</SelectItem>
                    <SelectItem value="baixo">Baixo</SelectItem>
                    <SelectItem value="moderado">Moderado</SelectItem>
                    <SelectItem value="alto">Alto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea
                value={formData.notas || ''}
                onChange={(e) => setFormData(p => ({ ...p, notas: e.target.value }))}
                placeholder="Observações adicionais"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button 
              className="bg-[#2D6A4F] hover:bg-[#1B4332]"
              onClick={handleSave}
              disabled={updateMutation.isPending || !formData.nome || !formData.comunidade}
            >
              {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir stakeholder?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O stakeholder será permanentemente removido.
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