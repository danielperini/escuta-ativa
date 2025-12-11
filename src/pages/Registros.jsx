import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Plus, 
  Search, 
  Filter, 
  FileText,
  Calendar,
  MapPin,
  Users,
  ChevronRight,
  MoreVertical,
  Trash2,
  Eye,
  Tag
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const tipoConfig = {
  reuniao: { label: 'Reunião', color: 'bg-purple-100 text-purple-700', icon: Users },
  conversa_campo: { label: 'Conversa de Campo', color: 'bg-blue-100 text-blue-700', icon: FileText },
  ocorrencia: { label: 'Ocorrência', color: 'bg-red-100 text-red-700', icon: FileText },
  demanda: { label: 'Demanda', color: 'bg-amber-100 text-amber-700', icon: FileText },
  visita: { label: 'Visita', color: 'bg-emerald-100 text-emerald-700', icon: MapPin }
};

const sentimentoConfig = {
  positivo: { label: 'Positivo', color: 'bg-emerald-100 text-emerald-700' },
  neutro: { label: 'Neutro', color: 'bg-slate-100 text-slate-700' },
  negativo: { label: 'Negativo', color: 'bg-red-100 text-red-700' },
  misto: { label: 'Misto', color: 'bg-amber-100 text-amber-700' }
};

export default function Registros() {
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState('todos');
  const [deleteId, setDeleteId] = useState(null);
  const queryClient = useQueryClient();

  const { data: registros = [], isLoading } = useQuery({
    queryKey: ['registros'],
    queryFn: () => base44.entities.Registro.list('-created_date', 100)
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Registro.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registros'] });
      setDeleteId(null);
    }
  });

  const filteredRegistros = registros.filter(r => {
    const matchSearch = !search || 
      r.titulo?.toLowerCase().includes(search.toLowerCase()) ||
      r.descricao?.toLowerCase().includes(search.toLowerCase()) ||
      r.comunidade?.toLowerCase().includes(search.toLowerCase());
    const matchTipo = tipoFilter === 'todos' || r.tipo === tipoFilter;
    return matchSearch && matchTipo;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Registros de Campo</h2>
          <p className="text-slate-500 mt-1">{registros.length} registros cadastrados</p>
        </div>
        <Link to={createPageUrl('NovoRegistro')}>
          <Button className="bg-[#2D6A4F] hover:bg-[#1B4332] gap-2">
            <Plus className="w-4 h-4" />
            Novo Registro
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por título, descrição ou comunidade..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={tipoFilter} onValueChange={setTipoFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="w-4 h-4 mr-2 text-slate-400" />
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os tipos</SelectItem>
              {Object.entries(tipoConfig).map(([key, config]) => (
                <SelectItem key={key} value={key}>{config.label}</SelectItem>
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
        ) : filteredRegistros.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhum registro encontrado</h3>
            <p className="text-slate-500 mb-4">
              {search || tipoFilter !== 'todos' 
                ? 'Tente ajustar os filtros de busca'
                : 'Comece registrando sua primeira interação comunitária'
              }
            </p>
            {!search && tipoFilter === 'todos' && (
              <Link to={createPageUrl('NovoRegistro')}>
                <Button className="bg-[#2D6A4F] hover:bg-[#1B4332]">
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro Registro
                </Button>
              </Link>
            )}
          </Card>
        ) : (
          filteredRegistros.map((registro) => {
            const tipo = tipoConfig[registro.tipo] || tipoConfig.visita;
            const sentimento = sentimentoConfig[registro.sentimento];
            const TipoIcon = tipo.icon;

            return (
              <Card 
                key={registro.id}
                className="p-4 hover:shadow-md transition-all duration-200 cursor-pointer"
                onClick={() => window.location.href = createPageUrl(`VerRegistro?id=${registro.id}`)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className={cn("p-3 rounded-xl", tipo.color.replace('text-', 'bg-').split(' ')[0])}>
                      <TipoIcon className={cn("w-5 h-5", tipo.color.split(' ')[1])} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-slate-900 truncate">{registro.titulo}</h3>
                      </div>
                      
                      {registro.descricao && (
                        <p className="text-sm text-slate-500 mt-1 line-clamp-2">{registro.descricao}</p>
                      )}

                      <div className="flex items-center gap-3 mt-3 flex-wrap">
                        <Badge variant="secondary" className={cn("text-xs", tipo.color)}>
                          {tipo.label}
                        </Badge>
                        {sentimento && (
                          <Badge variant="secondary" className={cn("text-xs", sentimento.color)}>
                            {sentimento.label}
                          </Badge>
                        )}
                        {registro.comunidade && (
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <MapPin className="w-3.5 h-3.5" />
                            {registro.comunidade}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <Calendar className="w-3.5 h-3.5" />
                          {format(new Date(registro.created_date), "dd MMM yyyy", { locale: ptBR })}
                        </span>
                      </div>

                      {registro.temas_identificados?.length > 0 && (
                        <div className="flex items-center gap-2 mt-3">
                          <Tag className="w-3.5 h-3.5 text-slate-400" />
                          <div className="flex gap-1.5 flex-wrap">
                            {registro.temas_identificados.slice(0, 3).map((tema, idx) => (
                              <span key={idx} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                                {tema}
                              </span>
                            ))}
                            {registro.temas_identificados.length > 3 && (
                              <span className="text-xs text-slate-400">
                                +{registro.temas_identificados.length - 3}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = createPageUrl(`VerRegistro?id=${registro.id}`);
                        }}>
                          <Eye className="w-4 h-4 mr-2" />
                          Ver detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteId(registro.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <ChevronRight className="w-5 h-5 text-slate-300" />
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
            <AlertDialogTitle>Excluir registro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O registro será permanentemente removido.
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