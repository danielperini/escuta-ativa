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
  CalendarDays
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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

const statusConfig = {
  futura: { label: 'Futura', color: 'bg-purple-100 text-purple-700' },
  confirmada: { label: 'Confirmada', color: 'bg-emerald-100 text-emerald-700' },
  prevista: { label: 'Prevista', color: 'bg-blue-100 text-blue-700' },
  solicitada: { label: 'Solicitada', color: 'bg-amber-100 text-amber-700' },
  acordada: { label: 'Acordada', color: 'bg-cyan-100 text-cyan-700' }
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
  const [editingAgenda, setEditingAgenda] = useState(null);
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

  const handleSubmit = () => {
    if (editingAgenda) {
      updateMutation.mutate({ id: editingAgenda.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  // Group agendas by status
  const agendasPorStatus = {
    futura: agendas.filter(a => a.status === 'futura'),
    confirmada: agendas.filter(a => a.status === 'confirmada'),
    prevista: agendas.filter(a => a.status === 'prevista'),
    solicitada: agendas.filter(a => a.status === 'solicitada'),
    acordada: agendas.filter(a => a.status === 'acordada')
  };

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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(statusConfig).map(([key, config]) => (
          <Card key={key} className="p-4">
            <div className="text-sm text-slate-500">{config.label}</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {agendasPorStatus[key].length}
            </div>
          </Card>
        ))}
      </div>

      {/* Agendas by Status */}
      <div className="space-y-6">
        {Object.entries(statusConfig).map(([statusKey, statusInfo]) => {
          const items = agendasPorStatus[statusKey];
          
          if (items.length === 0) return null;

          return (
            <div key={statusKey}>
              <div className="flex items-center gap-3 mb-4">
                <Badge variant="secondary" className={cn("text-sm", statusInfo.color)}>
                  {statusInfo.label}
                </Badge>
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-sm text-slate-500">{items.length} itens</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map(agenda => {
                  const isPast = isBefore(new Date(agenda.data), startOfDay(new Date()));
                  
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
                            <h3 className="font-semibold text-slate-900">{agenda.titulo}</h3>
                            <p className="text-sm text-slate-500 mt-1 capitalize">{agenda.tipo}</p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
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
                            {format(new Date(agenda.data), "dd 'de' MMMM, yyyy", { locale: ptBR })}
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
            </div>
          );
        })}
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
            className="bg-[#2D6A4F] hover:bg-[#1B4332]"
            onClick={() => setShowDialog(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Criar Primeira Agenda
          </Button>
        </Card>
      )}

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={(open) => { setShowDialog(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAgenda ? 'Editar Agenda' : 'Nova Agenda'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                value={formData.titulo}
                onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                placeholder="Ex: Reunião com lideranças"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data *</Label>
                <Input
                  type="date"
                  value={formData.data}
                  onChange={(e) => setFormData(prev => ({ ...prev, data: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
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
              <Label>Status</Label>
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
              <Label>Comunidade</Label>
              <Select
                value={formData.comunidade}
                onValueChange={(value) => setFormData(prev => ({ ...prev, comunidade: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a comunidade" />
                </SelectTrigger>
                <SelectContent>
                  {comunidades.map(c => (
                    <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Local</Label>
              <Input
                value={formData.local}
                onChange={(e) => setFormData(prev => ({ ...prev, local: e.target.value }))}
                placeholder="Ex: Salão da comunidade"
              />
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
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
              className="bg-[#2D6A4F] hover:bg-[#1B4332]"
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