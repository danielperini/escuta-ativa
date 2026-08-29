import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Plus,
  MoreVertical,
  Trash2,
  Edit,
  CheckCircle2,
  CalendarDays,
  Eye,
  FileText,
  User
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { cn } from "@/lib/utils";
import CompromissosAtrasados from '@/components/agenda/CompromissosAtrasados';
import Pagination from '@/components/shared/Pagination';

const statusConfig = {
  confirmada: { label: 'Confirmada', color: 'bg-emerald-100 text-emerald-700' },
  prevista: { label: 'Prevista', color: 'bg-blue-100 text-blue-700' },
  solicitada: { label: 'Solicitada', color: 'bg-amber-100 text-amber-700' },
  acordada: { label: 'Acordada', color: 'bg-cyan-100 text-cyan-700' },
  realizada: { label: 'Realizada', color: 'bg-slate-100 text-slate-700' },
  nao_realizada: { label: 'Não Realizada', color: 'bg-red-100 text-red-700' }
};

const tipoOptions = [
  { value: 'reuniao', label: 'Reunião' },
  { value: 'visita', label: 'Visita' },
  { value: 'devolutiva', label: 'Devolutiva' },
  { value: 'encontro', label: 'Encontro' },
  { value: 'outro', label: 'Outro' }
];

export default function Agenda() {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [editingAgenda, setEditingAgenda] = useState(null);
  const [viewingAgenda, setViewingAgenda] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const [filterComunidade, setFilterComunidade] = useState('todas');
  const [filterTema, setFilterTema] = useState('todos');
  const [formData, setFormData] = useState({
    titulo: '',
    data: '',
    tipo: 'reuniao',
    comunidade: '',
    status: 'prevista',
    descricao: '',
    responsaveis: [],
    participantes: [],
    local: ''
  });

  const { data: agendas = [], isLoading } = useQuery({
    queryKey: ['agendas'],
    queryFn: () => base44.entities.Agenda.list('data', 200),
    staleTime: 60 * 1000
  });

  const { data: comunidades = [] } = useQuery({
    queryKey: ['comunidades'],
    queryFn: () => base44.entities.Comunidade.list()
  });

  const { data: temas = [] } = useQuery({
    queryKey: ['temas'],
    queryFn: () => base44.entities.Tema.list()
  });

  const { data: registros = [] } = useQuery({
    queryKey: ['registros-comunidades'],
    queryFn: () => base44.entities.Registro.list('-created_date', 200)
  });

  // Extrair comunidades únicas dos registros se não houver entidade Comunidade
  const comunidadesUnicas = React.useMemo(() => {
    if (!comunidades || !registros || !agendas) return [];
    if (comunidades.length > 0) {
      return comunidades.map(c => c.nome);
    }
    const comunidadesSet = new Set();
    registros.forEach(r => {
      if (r.comunidade) comunidadesSet.add(r.comunidade);
    });
    agendas.forEach(a => {
      if (a.comunidade) comunidadesSet.add(a.comunidade);
    });
    return Array.from(comunidadesSet).sort();
  }, [comunidades, registros, agendas]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Agenda.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agendas'] });
      setShowDialog(false);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Agenda.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agendas'] });
      setShowDialog(false);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Agenda.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agendas'] });
    }
  });

  const resetForm = () => {
    setEditingAgenda(null);
    setFormData({
      titulo: '',
      data: '',
      tipo: 'reuniao',
      comunidade: '',
      status: 'prevista',
      descricao: '',
      responsaveis: [],
      participantes: [],
      local: ''
    });
  };

  const handleEdit = (agenda) => {
    setEditingAgenda(agenda);
    setFormData(agenda);
    setShowDialog(true);
  };

  const handleViewDetails = (agenda) => {
    setViewingAgenda(agenda);
    setShowDetailsDialog(true);
  };

  const handleSubmit = () => {
    if (editingAgenda) {
      updateMutation.mutate({ id: editingAgenda.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  // Filtrar agendas
  const filteredAgendas = agendas.filter(a => {
    const matchComunidade = filterComunidade === 'todas' || a.comunidade === filterComunidade;
    const matchTema = filterTema === 'todos' || a.temas?.includes(filterTema);
    return matchComunidade && matchTema;
  });

  // Group agendas by status
  const agendasPorStatus = Object.keys(statusConfig).reduce((acc, status) => {
    acc[status] = filteredAgendas.filter(a => a.status === status);
    return acc;
  }, {});

  const allAgendas = filteredAgendas;
  const totalPages = Math.ceil(allAgendas.length / itemsPerPage);
  const paginatedAgendas = allAgendas.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  React.useEffect(() => {
    setCurrentPage(1);
  }, [agendas.length, filterComunidade, filterTema]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Agenda Inteligente</h2>
          <p className="text-slate-500 mt-1">Compromissos e encontros identificados</p>
        </div>
        <Button 
          className="bg-[#2D6A4F] hover:bg-[#1B4332] gap-2"
          onClick={() => setShowDialog(true)}
        >
          <Plus className="w-4 h-4" />
          Nova Agenda
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Object.entries(statusConfig).map(([key, config]) => (
          <Card key={key} className="p-4">
            <div className="text-sm text-slate-500">{config.label}</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {agendasPorStatus[key]?.length || 0}
            </div>
          </Card>
        ))}
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <Select value={filterComunidade} onValueChange={setFilterComunidade}>
            <SelectTrigger className="w-full sm:w-56">
              <MapPin className="w-4 h-4 mr-2 text-slate-400" />
              <SelectValue placeholder="Comunidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas comunidades</SelectItem>
              {comunidadesUnicas.map(com => (
                <SelectItem key={com} value={com}>{com}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterTema} onValueChange={setFilterTema}>
            <SelectTrigger className="w-full sm:w-56">
              <SelectValue placeholder="Tema" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos temas</SelectItem>
              {temas.map(t => (
                <SelectItem key={t.id} value={t.nome}>{t.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Compromissos Atrasados */}
      <CompromissosAtrasados />

      {/* Agendas */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedAgendas.map(agenda => {
                  if (!agenda.data) return null;
                  
                  let dataAgenda;
                  try {
                    dataAgenda = new Date(agenda.data);
                    if (isNaN(dataAgenda.getTime())) return null;
                  } catch {
                    return null;
                  }
                  
                  const isPast = isBefore(dataAgenda, startOfDay(new Date()));
                  const status = statusConfig[agenda.status] || statusConfig.prevista;
                  
                  return (
                    <Card 
                      key={agenda.id}
                      className={cn(
                        "hover:shadow-md transition-all cursor-pointer",
                        isPast && "opacity-60"
                      )}
                      onClick={() => handleEdit(agenda)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-slate-900">{agenda.titulo}</h3>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="secondary" className={cn("text-xs", status.color)}>
                                {status.label}
                              </Badge>
                              <span className="text-xs text-slate-500 capitalize">{agenda.tipo}</span>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleViewDetails(agenda); }}>
                                <Eye className="w-4 h-4 mr-2" />
                                Ver Detalhes
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(agenda); }}>
                                <Edit className="w-4 h-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(agenda.id); }}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Calendar className="w-4 h-4" />
                            {format(dataAgenda, "dd 'de' MMMM, yyyy", { locale: ptBR })}
                          </div>
                          {agenda.comunidade && (
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <MapPin className="w-4 h-4" />
                              {agenda.comunidade}
                            </div>
                          )}
                          {agenda.responsaveis?.length > 0 && (
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Users className="w-4 h-4" />
                              {agenda.responsaveis.join(', ')}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
        </div>

        {/* Pagination */}
        {!isLoading && allAgendas.length > 0 && (
          <Card className="p-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalItems={allAgendas.length}
            />
          </Card>
        )}
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      )}

      {!isLoading && agendas.length === 0 && (
        <Card className="p-12 text-center">
          <CalendarDays className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhuma agenda criada</h3>
          <p className="text-slate-500 mb-4">
            Agendas são criadas automaticamente pela IA ou você pode adicionar manualmente
          </p>
          <Button 
            className="bg-[#E31E24] hover:bg-[#B01419]"
            onClick={() => setShowDialog(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Criar Primeira Agenda
          </Button>
        </Card>
      )}

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Agenda</DialogTitle>
          </DialogHeader>
          {viewingAgenda && (
            <div className="space-y-4 py-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">{viewingAgenda.titulo}</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className={statusConfig[viewingAgenda.status]?.color}>
                    {statusConfig[viewingAgenda.status]?.label}
                  </Badge>
                  <span className="text-sm text-slate-500 capitalize">{viewingAgenda.tipo}</span>
                </div>
              </div>

              <div className="grid gap-3">
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-slate-500 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-slate-700">Data</div>
                    <div className="text-sm text-slate-600">
                      {viewingAgenda.data && format(new Date(viewingAgenda.data), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                    </div>
                  </div>
                </div>

                {viewingAgenda.comunidade && (
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <MapPin className="w-5 h-5 text-slate-500 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-slate-700">Comunidade</div>
                      <div className="text-sm text-slate-600">{viewingAgenda.comunidade}</div>
                    </div>
                  </div>
                )}

                {viewingAgenda.local && (
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <MapPin className="w-5 h-5 text-slate-500 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-slate-700">Local</div>
                      <div className="text-sm text-slate-600">{viewingAgenda.local}</div>
                    </div>
                  </div>
                )}

                {viewingAgenda.responsaveis?.length > 0 && (
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <Users className="w-5 h-5 text-slate-500 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-slate-700">Responsáveis</div>
                      <div className="text-sm text-slate-600">{viewingAgenda.responsaveis.join(', ')}</div>
                    </div>
                  </div>
                )}

                {viewingAgenda.participantes?.length > 0 && (
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <Users className="w-5 h-5 text-slate-500 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-slate-700">Participantes</div>
                      <div className="text-sm text-slate-600">{viewingAgenda.participantes.join(', ')}</div>
                    </div>
                  </div>
                )}

                {viewingAgenda.descricao && (
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <FileText className="w-5 h-5 text-slate-500 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-slate-700">Descrição</div>
                      <div className="text-sm text-slate-600 whitespace-pre-wrap">{viewingAgenda.descricao}</div>
                    </div>
                  </div>
                )}

                {viewingAgenda.registro_origem_id && (
                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-blue-700">Origem</div>
                      <div className="text-sm text-blue-600">Criada automaticamente a partir de um registro</div>
                    </div>
                  </div>
                )}

                {viewingAgenda.created_by && (
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <User className="w-5 h-5 text-slate-500 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-slate-700">Cadastrado por</div>
                      <div className="text-sm text-slate-600">{viewingAgenda.created_by}</div>
                    </div>
                  </div>
                )}

                {viewingAgenda.created_date && (
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <Clock className="w-5 h-5 text-slate-500 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-slate-700">Data de Cadastro</div>
                      <div className="text-sm text-slate-600">
                        {format(new Date(viewingAgenda.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={(open) => { setShowDialog(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAgenda ? 'Editar Agenda' : 'Nova Agenda'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Título *</label>
              <Input
                value={formData.titulo}
                onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                placeholder="Ex: Reunião com lideranças"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Data *</label>
                <Input
                  type="date"
                  value={formData.data}
                  onChange={(e) => setFormData(prev => ({ ...prev, data: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo</label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, tipo: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tipoOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Comunidade</label>
              <Select
                value={formData.comunidade}
                onValueChange={(value) => setFormData(prev => ({ ...prev, comunidade: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a comunidade" />
                </SelectTrigger>
                <SelectContent>
                  {comunidadesUnicas.length > 0 ? (
                    comunidadesUnicas.map(com => (
                      <SelectItem key={com} value={com}>{com}</SelectItem>
                    ))
                  ) : (
                    <SelectItem value={null} disabled>Nenhuma comunidade encontrada</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Local</label>
              <Input
                value={formData.local}
                onChange={(e) => setFormData(prev => ({ ...prev, local: e.target.value }))}
                placeholder="Ex: Salão da comunidade"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Descrição</label>
              <Textarea
                value={formData.descricao}
                onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                placeholder="Detalhes do encontro"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
            <Button 
              className="bg-[#E31E24] hover:bg-[#B01419]"
              onClick={handleSubmit}
              disabled={!formData.titulo || !formData.data}
            >
              {editingAgenda ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}