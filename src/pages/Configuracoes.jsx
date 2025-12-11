import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { 
  Settings,
  Users,
  MapPin,
  Tag,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Save,
  Building,
  AlertCircle
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
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

const tipoComunidade = [
  { value: 'bairro', label: 'Bairro' },
  { value: 'vila', label: 'Vila' },
  { value: 'distrito', label: 'Distrito' },
  { value: 'assentamento', label: 'Assentamento' },
  { value: 'quilombo', label: 'Quilombo' },
  { value: 'indigena', label: 'Indígena' },
  { value: 'outro', label: 'Outro' }
];

const termometroOptions = [
  { value: 'baixo', label: 'Baixo', color: 'bg-emerald-500' },
  { value: 'medio', label: 'Médio', color: 'bg-amber-500' },
  { value: 'alto', label: 'Alto', color: 'bg-orange-500' },
  { value: 'critico', label: 'Crítico', color: 'bg-red-500' }
];

export default function Configuracoes() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('comunidades');
  const [showComunidadeDialog, setShowComunidadeDialog] = useState(false);
  const [editingComunidade, setEditingComunidade] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteType, setDeleteType] = useState(null);

  const [comunidadeForm, setComunidadeForm] = useState({
    nome: '',
    tipo: 'bairro',
    municipio: '',
    estado: '',
    populacao_estimada: '',
    localizacao: { lat: '', lng: '' },
    termometro_social: 'baixo',
    notas: ''
  });

  const { data: comunidades = [], isLoading: loadingComunidades } = useQuery({
    queryKey: ['comunidades'],
    queryFn: () => base44.entities.Comunidade.list()
  });

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list()
  });

  const createComunidadeMutation = useMutation({
    mutationFn: (data) => base44.entities.Comunidade.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comunidades'] });
      setShowComunidadeDialog(false);
      resetComunidadeForm();
    }
  });

  const updateComunidadeMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Comunidade.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comunidades'] });
      setShowComunidadeDialog(false);
      resetComunidadeForm();
    }
  });

  const deleteComunidadeMutation = useMutation({
    mutationFn: (id) => base44.entities.Comunidade.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comunidades'] });
      setDeleteId(null);
      setDeleteType(null);
    }
  });

  const resetComunidadeForm = () => {
    setEditingComunidade(null);
    setComunidadeForm({
      nome: '',
      tipo: 'bairro',
      municipio: '',
      estado: '',
      populacao_estimada: '',
      localizacao: { lat: '', lng: '' },
      termometro_social: 'baixo',
      notas: ''
    });
  };

  const handleEditComunidade = (comunidade) => {
    setEditingComunidade(comunidade);
    setComunidadeForm({
      nome: comunidade.nome || '',
      tipo: comunidade.tipo || 'bairro',
      municipio: comunidade.municipio || '',
      estado: comunidade.estado || '',
      populacao_estimada: comunidade.populacao_estimada || '',
      localizacao: comunidade.localizacao || { lat: '', lng: '' },
      termometro_social: comunidade.termometro_social || 'baixo',
      notas: comunidade.notas || ''
    });
    setShowComunidadeDialog(true);
  };

  const handleSubmitComunidade = () => {
    const data = {
      ...comunidadeForm,
      populacao_estimada: comunidadeForm.populacao_estimada ? parseInt(comunidadeForm.populacao_estimada) : undefined,
      localizacao: comunidadeForm.localizacao.lat && comunidadeForm.localizacao.lng
        ? { lat: parseFloat(comunidadeForm.localizacao.lat), lng: parseFloat(comunidadeForm.localizacao.lng) }
        : undefined
    };

    if (editingComunidade) {
      updateComunidadeMutation.mutate({ id: editingComunidade.id, data });
    } else {
      createComunidadeMutation.mutate(data);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Configurações</h2>
        <p className="text-slate-500 mt-1">Gerencie comunidades, usuários e parâmetros do sistema</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="comunidades" className="gap-2">
            <MapPin className="w-4 h-4" />
            Comunidades
          </TabsTrigger>
          <TabsTrigger value="usuarios" className="gap-2">
            <Users className="w-4 h-4" />
            Usuários
          </TabsTrigger>
        </TabsList>

        {/* Comunidades Tab */}
        <TabsContent value="comunidades" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Comunidades</CardTitle>
                <CardDescription>Gerencie as comunidades monitoradas</CardDescription>
              </div>
              <Button 
                className="bg-[#2D6A4F] hover:bg-[#1B4332] gap-2"
                onClick={() => setShowComunidadeDialog(true)}
              >
                <Plus className="w-4 h-4" />
                Nova Comunidade
              </Button>
            </CardHeader>
            <CardContent>
              {loadingComunidades ? (
                <div className="space-y-3">
                  {Array(3).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-16 rounded-lg" />
                  ))}
                </div>
              ) : comunidades.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <MapPin className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p>Nenhuma comunidade cadastrada</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {comunidades.map(comunidade => (
                    <div 
                      key={comunidade.id}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-3 h-3 rounded-full",
                          termometroOptions.find(t => t.value === comunidade.termometro_social)?.color || 'bg-emerald-500'
                        )} />
                        <div>
                          <h4 className="font-medium text-slate-900">{comunidade.nome}</h4>
                          <p className="text-sm text-slate-500">
                            {comunidade.municipio}{comunidade.estado ? `, ${comunidade.estado}` : ''}
                            {comunidade.populacao_estimada && ` • ${comunidade.populacao_estimada.toLocaleString()} hab.`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="capitalize">
                          {comunidade.tipo?.replace('_', ' ')}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditComunidade(comunidade)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-600"
                          onClick={() => { setDeleteId(comunidade.id); setDeleteType('comunidade'); }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usuários Tab */}
        <TabsContent value="usuarios" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Usuários</CardTitle>
              <CardDescription>Membros da equipe com acesso ao sistema</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingUsers ? (
                <div className="space-y-3">
                  {Array(3).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-16 rounded-lg" />
                  ))}
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Users className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p>Nenhum usuário cadastrado</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {users.map(user => (
                    <div 
                      key={user.id}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-[#2D6A4F] flex items-center justify-center text-white font-medium">
                          {user.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-medium text-slate-900">{user.full_name || 'Sem nome'}</h4>
                          <p className="text-sm text-slate-500">{user.email}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className={cn(
                        user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'
                      )}>
                        {user.role === 'admin' ? 'Administrador' : 'Usuário'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-800">Gerenciamento de usuários</h4>
                    <p className="text-sm text-amber-700 mt-1">
                      Para convidar novos usuários, acesse o painel administrativo da plataforma Base44.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Comunidade Dialog */}
      <Dialog open={showComunidadeDialog} onOpenChange={(open) => { 
        setShowComunidadeDialog(open); 
        if (!open) resetComunidadeForm(); 
      }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingComunidade ? 'Editar Comunidade' : 'Nova Comunidade'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>Nome *</Label>
                <Input
                  value={comunidadeForm.nome}
                  onChange={(e) => setComunidadeForm(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Nome da comunidade"
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={comunidadeForm.tipo}
                  onValueChange={(value) => setComunidadeForm(prev => ({ ...prev, tipo: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tipoComunidade.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Termômetro Social</Label>
                <Select
                  value={comunidadeForm.termometro_social}
                  onValueChange={(value) => setComunidadeForm(prev => ({ ...prev, termometro_social: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {termometroOptions.map(t => (
                      <SelectItem key={t.value} value={t.value}>
                        <div className="flex items-center gap-2">
                          <div className={cn("w-2 h-2 rounded-full", t.color)} />
                          {t.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Município *</Label>
                <Input
                  value={comunidadeForm.municipio}
                  onChange={(e) => setComunidadeForm(prev => ({ ...prev, municipio: e.target.value }))}
                  placeholder="Ex: São Paulo"
                />
              </div>

              <div className="space-y-2">
                <Label>Estado</Label>
                <Input
                  value={comunidadeForm.estado}
                  onChange={(e) => setComunidadeForm(prev => ({ ...prev, estado: e.target.value }))}
                  placeholder="Ex: SP"
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label>População Estimada</Label>
                <Input
                  type="number"
                  value={comunidadeForm.populacao_estimada}
                  onChange={(e) => setComunidadeForm(prev => ({ ...prev, populacao_estimada: e.target.value }))}
                  placeholder="Ex: 5000"
                />
              </div>

              <div className="space-y-2">
                <Label>Latitude</Label>
                <Input
                  type="number"
                  step="any"
                  value={comunidadeForm.localizacao.lat}
                  onChange={(e) => setComunidadeForm(prev => ({ 
                    ...prev, 
                    localizacao: { ...prev.localizacao, lat: e.target.value } 
                  }))}
                  placeholder="-23.5505"
                />
              </div>

              <div className="space-y-2">
                <Label>Longitude</Label>
                <Input
                  type="number"
                  step="any"
                  value={comunidadeForm.localizacao.lng}
                  onChange={(e) => setComunidadeForm(prev => ({ 
                    ...prev, 
                    localizacao: { ...prev.localizacao, lng: e.target.value } 
                  }))}
                  placeholder="-46.6333"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowComunidadeDialog(false)}>
              Cancelar
            </Button>
            <Button 
              className="bg-[#2D6A4F] hover:bg-[#1B4332]"
              onClick={handleSubmitComunidade}
              disabled={!comunidadeForm.nome || !comunidadeForm.municipio || createComunidadeMutation.isPending || updateComunidadeMutation.isPending}
            >
              {(createComunidadeMutation.isPending || updateComunidadeMutation.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {editingComunidade ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => { setDeleteId(null); setDeleteType(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {deleteType}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (deleteType === 'comunidade') {
                  deleteComunidadeMutation.mutate(deleteId);
                }
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}