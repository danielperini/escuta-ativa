import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ErrorBoundary from '@/components/ErrorBoundary';
import { removerDuplicatas } from '@/components/sistema/FiltroDuplicatasAutomatico';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Plus, FileText } from 'lucide-react';
import ExportadorDados from '@/components/shared/ExportadorDados';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import FiltrosAvancados from '@/components/registros/FiltrosAvancados';
import TabelaRegistros from '@/components/registros/TabelaRegistros';
import Pagination from '@/components/shared/Pagination';
import ContadorRegistrosRecentes from '@/components/registros/ContadorRegistrosRecentes';
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

export default function Registros() {
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [filtros, setFiltros] = useState({
    busca: '',
    comunidade: 'todas',
    tipo: 'todos',
    status: 'todos',
    temperatura: 'todos',
    sentimento: 'todos',
    tema: 'todos',
    municipio: 'todas',
    dataInicio: '',
    dataFim: ''
  });

  const { data: registros = [], isLoading } = useQuery({
    queryKey: ['registros'],
    queryFn: async () => {
      const lista = await base44.entities.Registro.list('-created_date', 300);
      return removerDuplicatas(lista, 'registro');
    },
    staleTime: 30 * 1000,
    refetchInterval: 2 * 60 * 1000
  });

  const { data: comunidades = [] } = useQuery({
    queryKey: ['comunidades'],
    queryFn: () => base44.entities.Comunidade.list()
  });

  const { data: temas = [] } = useQuery({
    queryKey: ['temas'],
    queryFn: () => base44.entities.Tema.list()
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Registro.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registros'] });
      setDeleteId(null);
    }
  });

  const filteredRegistros = useMemo(() => registros.filter(r => {
    // Busca texto livre
    if (filtros.busca) {
      const busca = filtros.busca.toLowerCase();
      const match = 
        r.titulo?.toLowerCase().includes(busca) ||
        r.descricao?.toLowerCase().includes(busca) ||
        r.transcricao?.toLowerCase().includes(busca) ||
        r.comunidade?.toLowerCase().includes(busca) ||
        r.local?.toLowerCase().includes(busca) ||
        r.participantes?.some(p => p.toLowerCase().includes(busca)) ||
        r.temas_identificados?.some(t => t.toLowerCase().includes(busca)) ||
        r.resumo_automatico?.toLowerCase().includes(busca);
      
      if (!match) return false;
    }

    // Filtro comunidade
    if (filtros.comunidade !== 'todas' && r.comunidade !== filtros.comunidade) return false;

    // Filtro tipo
    if (filtros.tipo !== 'todos' && r.tipo !== filtros.tipo) return false;

    // Filtro status
    if (filtros.status !== 'todos' && r.status !== filtros.status) return false;

    // Filtro temperatura
    if (filtros.temperatura !== 'todos' && r.temperatura_territorio !== filtros.temperatura) return false;

    // Filtro sentimento
    if (filtros.sentimento !== 'todos' && r.sentimento !== filtros.sentimento) return false;

    // Filtro tema
    if (filtros.tema !== 'todos') {
      if (!r.temas_identificados?.includes(filtros.tema)) return false;
    }

    // Filtro município
    if (filtros.municipio !== 'todas') {
      const municipioRegistro = r.localizacao?.municipio || r.comunidade?.split(',')[0];
      if (municipioRegistro !== filtros.municipio) return false;
    }

    // Filtro data
    if (filtros.dataInicio && r.data_registro < filtros.dataInicio) return false;
    if (filtros.dataFim && r.data_registro > filtros.dataFim) return false;

    return true;
    }), [registros, filtros]);

    const totalPages = Math.ceil(filteredRegistros.length / itemsPerPage);
    const paginatedRegistros = filteredRegistros.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
    );

    React.useEffect(() => {
      setCurrentPage(1);
    }, [filtros.busca, filtros.comunidade, filtros.tipo, filtros.status, filtros.temperatura, filtros.sentimento, filtros.tema, filtros.municipio, filtros.dataInicio, filtros.dataFim]);

    return (
      <ErrorBoundary>
        <div className="space-y-4 md:space-y-6 pb-4">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-10 rounded-full bg-gradient-to-b from-[#2D6A4F] to-[#1B4332]" />
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 leading-tight">
              Registros de Campo
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              <span className="font-semibold text-slate-700">{filteredRegistros.length}</span>
              {' de '}
              <span className="font-semibold text-slate-700">{registros.length}</span>
              {' registro(s)'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <ExportadorDados
            dados={filteredRegistros}
            colunas={[
              { key: 'titulo', label: 'Título' },
              { key: 'tipo', label: 'Tipo' },
              { key: 'comunidade', label: 'Comunidade' },
              { key: 'data_registro', label: 'Data' },
              { key: 'status', label: 'Status' },
              { key: 'temperatura_territorio', label: 'Temperatura' }
            ]}
            nomeArquivo="registros"
            titulo="Relatório de Registros"
          />
          <Link to={createPageUrl('RegistroUnificado') + '?manual=true'}>
            <Button variant="outline" className="gap-2">
              <FileText className="w-4 h-4" />
              Registro Manual
            </Button>
          </Link>
          <Link to={createPageUrl('RegistroUnificado')}>
            <Button className="bg-[#2D6A4F] hover:bg-[#1B4332] gap-2 shadow-sm">
              <Plus className="w-4 h-4" />
              Novo Registro
            </Button>
          </Link>
        </div>
      </div>

      <ContadorRegistrosRecentes registros={registros} />
      
      <FiltrosAvancados
        filtros={filtros}
        setFiltros={setFiltros}
        comunidades={comunidades}
        temas={temas}
      />

      {isLoading ? (
        <Card className="p-6">
          <div className="space-y-3">
            {Array(5).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded" />
            ))}
          </div>
        </Card>
      ) : filteredRegistros.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhum registro encontrado</h3>
          <p className="text-slate-500 mb-4">
            Tente ajustar os filtros ou criar um novo registro
          </p>
          <Link to={createPageUrl('RegistroUnificado')}>
            <Button className="bg-[#2D6A4F] hover:bg-[#1B4332]">
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Registro
            </Button>
          </Link>
        </Card>
      ) : (
        <>
          <TabelaRegistros 
            registros={paginatedRegistros} 
            onExcluir={(id) => setDeleteId(id)}
          />
          <Card className="p-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalItems={filteredRegistros.length}
            />
          </Card>
        </>
      )}

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
    </ErrorBoundary>
  );
}