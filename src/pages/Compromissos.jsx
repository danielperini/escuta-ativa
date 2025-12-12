import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, isPast, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  CheckSquare, 
  Plus, 
  Search, 
  Filter,
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
  FileText,
  Upload
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

const statusConfig = {
  pendente: { label: 'Pendente', color: 'bg-slate-100 text-slate-700', icon: Clock },
  em_andamento: { label: 'Em andamento', color: 'bg-blue-100 text-blue-700', icon: Clock },
  concluido: { label: 'Concluído', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  atrasado: { label: 'Atrasado', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
  cancelado: { label: 'Cancelado', color: 'bg-slate-100 text-slate-500', icon: XCircle }
};

const prioridadeConfig = {
  baixa: { label: 'Baixa', color: 'bg-slate-100 text-slate-600' },
  media: { label: 'Média', color: 'bg-blue-100 text-blue-600' },
  alta: { label: 'Alta', color: 'bg-orange-100 text-orange-600' },
  urgente: { label: 'Urgente', color: 'bg-red-100 text-red-600' }
};

export default function Compromissos() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [filterComunidade, setFilterComunidade] = useState('todos');
  const [activeTab, setActiveTab] = useState('todos');
  const [showDialog, setShowDialog] = useState(false);
  const [editingCompromisso, setEditingCompromisso] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    comunidade: '',
    responsavel: '',
    prazo: '',
    status: 'pendente',
    prioridade: 'media',
    evidencias: [],
    observacoes: ''
  });

  const { data: compromissos = [], isLoading } = useQuery({
    queryKey: ['compromissos'],
    queryFn: () => base44.entities.Compromisso.list('-created_date')
  });

  const { data: comunidades = [] } = useQuery({
    queryKey: ['comunidades'],
    queryFn: () => base44.entities.Comunidade.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Compromisso.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compromissos'] });
      setShowDialog(false);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Compromisso.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compromissos'] });
      setShowDialog(false);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Compromisso.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compromissos'] });
      setDeleteId(null);
    }
  });

  const resetForm = () => {
    setEditingCompromisso(null);
    setFormData({
      titulo: '',
      descricao: '',
      comunidade: '',
      responsavel: '',
      prazo: '',
      status: 'pendente',
      prioridade: 'media',
      evidencias: [],
      observacoes: ''
    });
  };

  const handleEdit = (compromisso) => {
    setEditingCompromisso(compromisso);
    setFormData({
      titulo: compromisso.titulo || '',
      descricao: compromisso.descricao || '',
      comunidade: compromisso.comunidade || '',
      responsavel: compromisso.responsavel || '',
      prazo: compromisso.prazo || '',
      status: compromisso.status || 'pendente',
      prioridade: compromisso.prioridade || 'media',
      evidencias: compromisso.evidencias || [],
      observacoes: compromisso.observacoes || ''
    });
    setShowDialog(true);
  };

  const handleSubmit = () => {
    if (editingCompromisso) {
      updateMutation.mutate({ id: editingCompromisso.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleUploadEvidencia = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setIsUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    
    setFormData(prev => ({
      ...prev,
      evidencias: [...prev.evidencias, {
        url: file_url,
        descricao: file.name,
        data: new Date().toISOString().split('T')[0]
      }]
    }));
    setIsUploading(false);
  };

  const handleQuickStatusChange = async (compromisso, newStatus) => {
    const data = { ...compromisso, status: newStatus };
    if (newStatus === 'concluido') {
      data.data_conclusao = new Date().toISOString().split('T')[0];
    }
    await base44.entities.Compromisso.update(compromisso.id, data);
    queryClient.invalidateQueries({ queryKey: ['compromissos'] });
  };

  // Process compromissos with overdue status
  const processedCompromissos = compromissos.map(c => {
    const isAtrasado = c.prazo && isPast(new Date(c.prazo)) && c.status !== 'concluido' && c.status !== 'cancelado';
    return { ...c, isAtrasado };
  });

  const filteredCompromissos = processedCompromissos.filter(c => {
    const matchSearch = !search || 
      c.titulo?.toLowerCase().includes(search.toLowerCase()) ||
      c.responsavel?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'todos' || c.status === filterStatus || (filterStatus === 'atrasado' && c.isAtrasado);
    const matchComunidade = filterComunidade === 'todos' || c.comunidade === filterComunidade;
    
    if (activeTab === 'pendentes') return matchSearch && matchComunidade && (c.status === 'pendente' || c.status === 'em_andamento');
    if (activeTab === 'atrasados') return matchSearch && matchComunidade && c.isAtrasado;
    if (activeTab === 'concluidos') return matchSearch && matchComunidade && c.status === 'concluido';
    return matchSearch && matchStatus && matchComunidade;
  });

  // Stats
  const stats = {
    total: compromissos.length,
    pendentes: processedCompromissos.filter(c => c.status === 'pendente' || c.status === 'em_andamento').length,
    atrasados: processedCompromissos.filter(c => c.isAtrasado).length,
    concluidos: processedCompromissos.filter(c => c.status === 'concluido').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Compromissos</h2>
          <p className="text-slate-500 mt-1">Gerencie os compromissos assumidos com as comunidades</p>
        </div>
        <Button 
          className="bg-[#2D6A4F] hover:bg-[#1B4332] gap-2"
          onClick={() => setShowDialog(true)}
        >
          <Plus className="w-4 h-4" />
          Novo Compromisso
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 cursor-pointer hover:shadow-md transition-all" onClick={() => setActiveTab('todos')}>
          <div className="text-sm text-slate-500">Total</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</div>
        </Card>
        <Card className="p-4 cursor-pointer hover:shadow-md transition-all" onClick={() => setActiveTab('pendentes')}>
          <div className="text-sm text-slate-500">Pendentes</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{stats.pendentes}</div>
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
          <TabsTrigger value="pendentes">Pendentes</TabsTrigger>
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
              placeholder="Buscar por título ou responsável..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterComunidade} onValueChange={setFilterComunidade}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Comunidade" />
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
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))
        ) : filteredCompromissos.length === 0 ? (
          <Card className="p-12 text-center">
            <CheckSquare className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhum compromisso encontrado</h3>
            <p className="text-slate-500 mb-4">
              {search || filterComunidade !== 'todos'
                ? 'Tente ajustar os filtros de busca'
                : 'Registre compromissos assumidos com as comunidades'
              }
            </p>
          </Card>
        ) : (
          filteredCompromissos.map(compromisso => {
            const status = statusConfig[compromisso.isAtrasado ? 'atrasado' : compromisso.status] || statusConfig.pendente;
            const prioridade = prioridadeConfig[compromisso.prioridade] || prioridadeConfig.media;
            const StatusIcon = status.icon;
            const diasRestantes = compromisso.prazo ? differenceInDays(new Date(compromisso.prazo), new Date()) : null;

            return (
              <Card 
                key={compromisso.id}
                className={cn(
                  "p-4 hover:shadow-md transition-all duration-200",
                  compromisso.isAtrasado && "border-red-200 bg-red-50/30"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={cn(
                      "p-2 rounded-lg",
                      compromisso.isAtrasado ? "bg-red-100" : "bg-slate-100"
                    )}>
                      <StatusIcon className={cn(
                        "w-5 h-5",
                        compromisso.isAtrasado ? "text-red-600" : "text-slate-600"
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900">{compromisso.titulo}</h3>
                      {compromisso.descricao && (
                        <p className="text-sm text-slate-500 mt-1 line-clamp-2">{compromisso.descricao}</p>
                      )}

                      <div className="flex items-center gap-3 mt-3 flex-wrap">
                        <Badge variant="secondary" className={cn("text-xs", status.color)}>
                          {status.label}
                        </Badge>
                        <Badge variant="secondary" className={cn("text-xs", prioridade.color)}>
                          {prioridade.label}
                        </Badge>
                        {compromisso.comunidade && (
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <MapPin className="w-3.5 h-3.5" />
                            {compromisso.comunidade}
                          </span>
                        )}
                        {compromisso.responsavel && (
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <User className="w-3.5 h-3.5" />
                            {compromisso.responsavel}
                          </span>
                        )}
                        {compromisso.prazo && (
                          <span className={cn(
                            "flex items-center gap-1 text-xs",
                            compromisso.isAtrasado ? "text-red-600 font-medium" :
                            diasRestantes !== null && diasRestantes <= 7 ? "text-amber-600" : "text-slate-500"
                          )}>
                            <Calendar className="w-3.5 h-3.5" />
                            {compromisso.isAtrasado 
                              ? `Atrasado ${Math.abs(diasRestantes)} dias`
                              : format(new Date(compromisso.prazo), "dd/MM/yyyy")
                            }
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {compromisso.status !== 'concluido' && compromisso.status !== 'cancelado' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                        onClick={() => handleQuickStatusChange(compromisso, 'concluido')}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Resolvido
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(compromisso)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => setDeleteId(compromisso.id)}
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

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={(open) => { setShowDialog(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCompromisso ? 'Editar Compromisso' : 'Novo Compromisso'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                value={formData.titulo}
                onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                placeholder="Ex: Construção de ponte"
              />
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={formData.descricao}
                onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                placeholder="Detalhes do compromisso..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Comunidade *</Label>
                <Select
                  value={formData.comunidade}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, comunidade: value }))}
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

              <div className="space-y-2">
                <Label>Responsável *</Label>
                <Input
                  value={formData.responsavel}
                  onChange={(e) => setFormData(prev => ({ ...prev, responsavel: e.target.value }))}
                  placeholder="Nome do responsável"
                />
              </div>

              <div className="space-y-2">
                <Label>Prazo</Label>
                <Input
                  type="date"
                  value={formData.prazo}
                  onChange={(e) => setFormData(prev => ({ ...prev, prazo: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Select
                  value={formData.prioridade}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, prioridade: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(prioridadeConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {editingCompromisso && (
                <div className="col-span-2 space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusConfig).filter(([k]) => k !== 'atrasado').map(([key, config]) => (
                        <SelectItem key={key} value={key}>{config.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Evidências</Label>
              <div className="space-y-2">
                {formData.evidencias.map((ev, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span className="text-sm flex-1 truncate">{ev.descricao}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        evidencias: prev.evidencias.filter((_, i) => i !== idx)
                      }))}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
                <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed rounded-lg cursor-pointer hover:bg-slate-50">
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 text-slate-400" />
                  )}
                  <span className="text-sm text-slate-500">Adicionar evidência</span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleUploadEvidencia}
                    disabled={isUploading}
                  />
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={formData.observacoes}
                onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                placeholder="Notas adicionais..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
            <Button 
              className="bg-[#2D6A4F] hover:bg-[#1B4332]"
              onClick={handleSubmit}
              disabled={!formData.titulo || !formData.comunidade || !formData.responsavel || createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {editingCompromisso ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir compromisso?</AlertDialogTitle>
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