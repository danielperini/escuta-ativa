import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { 
  Target, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Trash2,
  Edit,
  X,
  AlertTriangle,
  MapPin,
  Loader2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
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
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import ComparadorPeriodos from "../components/analise/ComparadorPeriodos";

const categoriaColors = {
  ambiental: 'bg-emerald-100 text-emerald-700',
  social: 'bg-purple-100 text-purple-700',
  economico: 'bg-blue-100 text-blue-700',
  infraestrutura: 'bg-orange-100 text-orange-700',
  saude: 'bg-red-100 text-red-700',
  educacao: 'bg-amber-100 text-amber-700',
  seguranca: 'bg-slate-100 text-slate-700',
  emprego: 'bg-cyan-100 text-cyan-700',
  cultura: 'bg-pink-100 text-pink-700',
  outro: 'bg-gray-100 text-gray-700'
};

const tendenciaIcon = {
  subindo: TrendingUp,
  estavel: Minus,
  caindo: TrendingDown
};

const tendenciaColor = {
  subindo: 'text-red-500',
  estavel: 'text-amber-500',
  caindo: 'text-emerald-500'
};

export default function Materialidade() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('todos');
  const [showDialog, setShowDialog] = useState(false);
  const [editingTema, setEditingTema] = useState(null);
  const [modoAdicaoInterativa, setModoAdicaoInterativa] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    categoria: 'social',
    relevancia_comunidade: 5,
    relevancia_empresa: 5,
    tendencia: 'estavel',
    prioritario: false
  });

  const { data: temas = [], isLoading } = useQuery({
    queryKey: ['temas'],
    queryFn: () => base44.entities.Tema.list('-mencoes_total', 100),
    staleTime: 3 * 60 * 1000
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Tema.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['temas'] });
      setShowDialog(false);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Tema.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['temas'] });
      setShowDialog(false);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Tema.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['temas'] });
    }
  });

  const resetForm = () => {
    setEditingTema(null);
    setFormData({
      nome: '',
      categoria: 'social',
      relevancia_comunidade: 5,
      relevancia_empresa: 5,
      tendencia: 'estavel',
      prioritario: false
    });
  };

  const handleEdit = (tema) => {
    setEditingTema(tema);
    setFormData({
      nome: tema.nome,
      categoria: tema.categoria,
      relevancia_comunidade: tema.relevancia_comunidade || 5,
      relevancia_empresa: tema.relevancia_empresa || 5,
      tendencia: tema.tendencia || 'estavel',
      prioritario: tema.prioritario || false
    });
    setShowDialog(true);
  };

  const handleSubmit = () => {
    const divergencia = Math.abs(formData.relevancia_comunidade - formData.relevancia_empresa);
    const dataWithDivergencia = { ...formData, divergencia };
    
    if (editingTema) {
      updateMutation.mutate({ id: editingTema.id, data: dataWithDivergencia });
    } else {
      createMutation.mutate(dataWithDivergencia);
    }
  };

  const filteredTemas = temas.filter(t => {
    const matchSearch = !search || t.nome?.toLowerCase().includes(search.toLowerCase());
    const matchCategoria = filterCategoria === 'todos' || t.categoria === filterCategoria;
    return matchSearch && matchCategoria;
  });

  // Calculate matrix positions
  const getMatrixPosition = (tema) => {
    const x = ((tema.relevancia_empresa || 5) - 1) / 9 * 100;
    const y = 100 - ((tema.relevancia_comunidade || 5) - 1) / 9 * 100;
    return { x, y };
  };

  const handleMatrixClick = (e) => {
    if (!modoAdicaoInterativa) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const relevancia_empresa = Math.round((x / 100) * 9) + 1;
    const relevancia_comunidade = Math.round(((100 - y) / 100) * 9) + 1;

    setFormData({
      ...formData,
      relevancia_empresa: Math.max(1, Math.min(10, relevancia_empresa)),
      relevancia_comunidade: Math.max(1, Math.min(10, relevancia_comunidade))
    });
    setShowDialog(true);
    setModoAdicaoInterativa(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Matriz de Materialidade</h2>
          <p className="text-slate-500 mt-1">Análise de relevância dos temas para comunidade e empresa</p>
        </div>
        <div className="flex gap-2">
          <Button 
            className="bg-[#2D6A4F] hover:bg-[#1B4332] gap-2"
            onClick={() => setShowDialog(true)}
          >
            <Plus className="w-4 h-4" />
            Novo Tema
          </Button>
          <Button 
            variant={modoAdicaoInterativa ? "default" : "outline"}
            className={modoAdicaoInterativa ? "bg-blue-600 hover:bg-blue-700" : ""}
            onClick={() => setModoAdicaoInterativa(!modoAdicaoInterativa)}
          >
            <Target className="w-4 h-4 mr-2" />
            {modoAdicaoInterativa ? 'Cancelar Adição' : 'Adicionar no Gráfico'}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar tema..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterCategoria} onValueChange={setFilterCategoria}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="w-4 h-4 mr-2 text-slate-400" />
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas categorias</SelectItem>
              {Object.keys(categoriaColors).map(cat => (
                <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <ComparadorPeriodos />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Matrix Chart */}
        <Card className="p-6">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-lg">Matriz de Materialidade</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {modoAdicaoInterativa && (
              <div className="bg-blue-100 border border-blue-400 rounded-lg p-3 mb-3">
                <p className="text-sm font-semibold text-blue-900 mb-1">
                  🎯 Modo Adição Interativa Ativado
                </p>
                <p className="text-xs text-blue-700">
                  Clique em qualquer ponto da matriz para adicionar um novo tema naquela posição
                </p>
              </div>
            )}
            <div 
              className={cn(
                "relative aspect-square bg-gradient-to-br from-emerald-50 via-amber-50 to-red-50 rounded-lg border",
                modoAdicaoInterativa && "cursor-crosshair ring-2 ring-blue-400"
              )}
              onClick={handleMatrixClick}
            >
              {/* Quadrant labels */}
              <div className="absolute top-2 left-2 text-xs text-slate-400">
                Alta relevância comunidade<br/>Baixa relevância empresa
              </div>
              <div className="absolute top-2 right-2 text-xs text-slate-400 text-right">
                Alta relevância comunidade<br/>Alta relevância empresa
              </div>
              <div className="absolute bottom-2 left-2 text-xs text-slate-400">
                Baixa relevância<br/>para ambos
              </div>
              <div className="absolute bottom-2 right-2 text-xs text-slate-400 text-right">
                Baixa relevância comunidade<br/>Alta relevância empresa
              </div>

              {/* Axis lines */}
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-200" />
              <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-200" />

              {/* Data points */}
              {filteredTemas.map(tema => {
                const { x, y } = getMatrixPosition(tema);
                const TrendIcon = tendenciaIcon[tema.tendencia] || Minus;
                
                return (
                  <div
                    key={tema.id}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                    style={{ left: `${x}%`, top: `${y}%` }}
                    onClick={() => handleEdit(tema)}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-transform group-hover:scale-125",
                      categoriaColors[tema.categoria]?.split(' ')[0] || 'bg-slate-100'
                    )}>
                      <TrendIcon className={cn("w-4 h-4", tendenciaColor[tema.tendencia])} />
                    </div>
                    <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white px-2 py-1 rounded shadow-lg text-xs whitespace-nowrap z-10">
                      {tema.nome}
                    </div>
                  </div>
                );
              })}

              {/* Axis labels */}
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-slate-500">
                Relevância para a Empresa →
              </div>
              <div className="absolute -left-6 top-1/2 -translate-y-1/2 -rotate-90 text-xs text-slate-500 whitespace-nowrap">
                Relevância para a Comunidade →
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Themes List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Temas ({filteredTemas.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[500px] overflow-y-auto">
            {isLoading ? (
              Array(5).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))
            ) : filteredTemas.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Target className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p>Nenhum tema encontrado</p>
              </div>
            ) : (
              filteredTemas.map(tema => {
                const TrendIcon = tendenciaIcon[tema.tendencia] || Minus;
                
                return (
                  <div
                    key={tema.id}
                    className="p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-slate-900">{tema.nome}</h4>
                          {tema.prioritario && (
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <Badge variant="secondary" className={cn("text-xs", categoriaColors[tema.categoria])}>
                            {tema.categoria}
                          </Badge>
                          <span className={cn("flex items-center gap-1 text-xs", tendenciaColor[tema.tendencia])}>
                            <TrendIcon className="w-3 h-3" />
                            {tema.tendencia}
                          </span>
                          {tema.mencoes_total && (
                            <span className="text-xs text-slate-500">
                              {tema.mencoes_total} menções
                            </span>
                          )}
                        </div>
                        <div className="flex gap-4 mt-3 text-xs">
                          <div>
                            <span className="text-slate-500">Comunidade:</span>
                            <span className="ml-1 font-medium">{tema.relevancia_comunidade || 5}/10</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Empresa:</span>
                            <span className="ml-1 font-medium">{tema.relevancia_empresa || 5}/10</span>
                          </div>
                          {tema.divergencia !== undefined && (
                            <div>
                              <span className="text-slate-500">Divergência:</span>
                              <span className={cn(
                                "ml-1 font-medium",
                                tema.divergencia > 3 ? "text-red-600" : tema.divergencia > 1 ? "text-amber-600" : "text-emerald-600"
                              )}>
                                {tema.divergencia}
                              </span>
                            </div>
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
                          <DropdownMenuItem onClick={() => handleEdit(tema)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => deleteMutation.mutate(tema.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={(open) => { setShowDialog(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTema ? 'Editar Tema' : 'Novo Tema'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome do Tema</Label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Ex: Qualidade da água"
              />
            </div>

            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={formData.categoria}
                onValueChange={(value) => setFormData(prev => ({ ...prev, categoria: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(categoriaColors).map(cat => (
                    <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Relevância para Comunidade: {formData.relevancia_comunidade}</Label>
              <Slider
                value={[formData.relevancia_comunidade]}
                onValueChange={([value]) => setFormData(prev => ({ ...prev, relevancia_comunidade: value }))}
                min={1}
                max={10}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <Label>Relevância para Empresa: {formData.relevancia_empresa}</Label>
              <Slider
                value={[formData.relevancia_empresa]}
                onValueChange={([value]) => setFormData(prev => ({ ...prev, relevancia_empresa: value }))}
                min={1}
                max={10}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <Label>Tendência</Label>
              <Select
                value={formData.tendencia}
                onValueChange={(value) => setFormData(prev => ({ ...prev, tendencia: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="subindo">Subindo</SelectItem>
                  <SelectItem value="estavel">Estável</SelectItem>
                  <SelectItem value="caindo">Caindo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
            <Button 
              className="bg-[#2D6A4F] hover:bg-[#1B4332]"
              onClick={handleSubmit}
              disabled={!formData.nome || createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {editingTema ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}