import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Search, Trash2, ExternalLink, Calendar, Star, Filter, X } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import EditorCadernoNota from '@/components/caderno/EditorCadernoNota.js';
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

export default function CadernoNotas() {
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState('');
  const [notaSelecionada, setNotaSelecionada] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [filtroFavoritas, setFiltroFavoritas] = useState(false);
  const [tagSelecionada, setTagSelecionada] = useState(null);

  const { data: notas = [], isLoading } = useQuery({
    queryKey: ['caderno-notas'],
    queryFn: () => base44.entities.CadernoNota.list('-created_date', 100)
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const novaNota = await base44.entities.CadernoNota.create({
        titulo: `Nova nota - ${format(new Date(), 'dd/MM/yyyy HH:mm')}`,
        tipo_conteudo: 'texto',
        texto_extraido: '',
        status: 'rascunho',
        arquivos: [],
        tags: []
      });
      return novaNota;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['caderno-notas'] });
      setNotaSelecionada(data);
      toast.success('Nova nota criada!');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CadernoNota.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caderno-notas'] });
      setDeleteId(null);
      if (notaSelecionada?.id === deleteId) {
        setNotaSelecionada(null);
      }
      toast.success('Nota excluída');
    }
  });

  const todasTags = [...new Set(notas.flatMap(n => n.tags || []))].sort();

  const toggleFavorita = async (notaId, favoritaAtual) => {
    try {
      await base44.entities.CadernoNota.update(notaId, { 
        favorita: !favoritaAtual,
        ultima_modificacao: new Date().toISOString()
      });
      queryClient.invalidateQueries({ queryKey: ['caderno-notas'] });
      toast.success(!favoritaAtual ? 'Nota favoritada!' : 'Removida dos favoritos');
    } catch (error) {
      toast.error('Erro ao atualizar nota');
    }
  };

  const notasFiltradas = notas.filter(n => {
    // Filtro de favoritas
    if (filtroFavoritas && !n.favorita) return false;
    
    // Filtro de tag específica
    if (tagSelecionada && !n.tags?.includes(tagSelecionada)) return false;
    
    // Busca texto livre
    if (busca) {
      const buscaLower = busca.toLowerCase();
      return n.titulo?.toLowerCase().includes(buscaLower) ||
             n.texto_extraido?.toLowerCase().includes(buscaLower) ||
             n.tags?.some(tag => tag.toLowerCase().includes(buscaLower));
    }
    
    return true;
  });

  const getTipoIcon = (tipo) => {
    const icons = {
      audio: '🎤',
      video: '🎥',
      documento: '📄',
      texto: '📝'
    };
    return icons[tipo] || '📝';
  };

  const getStatusColor = (status) => {
    const colors = {
      rascunho: 'bg-slate-100 text-slate-600',
      processando: 'bg-blue-100 text-blue-600',
      pronto: 'bg-emerald-100 text-emerald-600'
    };
    return colors[status] || colors.rascunho;
  };

  if (notaSelecionada) {
    return (
      <EditorCadernoNota 
        nota={notaSelecionada}
        onVoltar={() => {
          setNotaSelecionada(null);
          queryClient.invalidateQueries({ queryKey: ['caderno-notas'] });
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Caderno de Notas</h2>
          <p className="text-slate-500 mt-1">
            Espaço livre para transcrição e organização de conteúdos
          </p>
        </div>
        <Button 
          onClick={() => createMutation.mutate()}
          className="bg-[#E31E24] hover:bg-[#B01419]"
          disabled={createMutation.isPending}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Nota
        </Button>
      </div>

      {/* Busca e Filtros */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Buscar notas por título, conteúdo ou tags..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-10 pr-10"
          />
          {busca && (
            <button
              onClick={() => setBusca('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <Button
            variant={filtroFavoritas ? "default" : "outline"}
            size="sm"
            onClick={() => setFiltroFavoritas(!filtroFavoritas)}
            className={filtroFavoritas ? "bg-amber-500 hover:bg-amber-600" : ""}
          >
            <Star className="w-4 h-4 mr-1" />
            Favoritas {notas.filter(n => n.favorita).length > 0 && `(${notas.filter(n => n.favorita).length})`}
          </Button>

          {todasTags.length > 0 && (
            <>
              <div className="h-4 w-px bg-slate-300" />
              <Filter className="w-4 h-4 text-slate-500" />
              {todasTags.map(tag => (
                <Button
                  key={tag}
                  variant={tagSelecionada === tag ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTagSelecionada(tagSelecionada === tag ? null : tag)}
                  className={tagSelecionada === tag ? "bg-[#E31E24] hover:bg-[#B01419]" : ""}
                >
                  {tag} ({notas.filter(n => n.tags?.includes(tag)).length})
                </Button>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Grid de Notas */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E31E24] mx-auto"></div>
          <p className="text-slate-500 mt-4">Carregando notas...</p>
        </div>
      ) : notasFiltradas.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            {busca ? 'Nenhuma nota encontrada' : 'Nenhuma nota criada'}
          </h3>
          <p className="text-slate-500 mb-4">
            {busca ? 'Tente ajustar sua busca' : 'Crie sua primeira nota para começar'}
          </p>
          {!busca && (
            <Button 
              onClick={() => createMutation.mutate()}
              className="bg-[#E31E24] hover:bg-[#B01419]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeira Nota
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notasFiltradas.map(nota => (
            <Card 
              key={nota.id}
              className={`hover:shadow-lg transition-all cursor-pointer ${nota.favorita ? 'ring-2 ring-amber-500' : ''}`}
              onClick={() => setNotaSelecionada(nota)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-2xl">{getTipoIcon(nota.tipo_conteudo)}</span>
                    <CardTitle className="text-base truncate">
                      {nota.titulo}
                    </CardTitle>
                    {nota.favorita && (
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500 flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorita(nota.id, nota.favorita);
                      }}
                    >
                      <Star className={`w-4 h-4 ${nota.favorita ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteId(nota.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(nota.status)}>
                    {nota.status}
                  </Badge>
                  {nota.arquivos?.length > 0 && (
                    <Badge variant="outline">
                      {nota.arquivos.length} arquivo{nota.arquivos.length > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>

                {nota.texto_extraido && (
                  <p className="text-sm text-slate-600 line-clamp-3">
                    {nota.texto_extraido.substring(0, 150)}...
                  </p>
                )}

                {nota.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {nota.tags.slice(0, 3).map((tag, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t text-xs text-slate-500">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Criado: {format(new Date(nota.created_date), 'dd/MM/yyyy HH:mm')}
                    </div>
                    {nota.ultima_modificacao && (
                      <div className="text-slate-400">
                        Modificado: {format(new Date(nota.ultima_modificacao), 'dd/MM/yyyy HH:mm')}
                      </div>
                    )}
                  </div>
                  {nota.registros_referenciados?.length > 0 && (
                    <div className="flex items-center gap-1 text-emerald-600">
                      <ExternalLink className="w-3 h-3" />
                      {nota.registros_referenciados.length}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir nota?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A nota será permanentemente removida.
              Os registros criados a partir dela não serão afetados.
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