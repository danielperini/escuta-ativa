import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LayoutGrid, 
  List, 
  Search, 
  Filter,
  Clock,
  AlertCircle,
  CheckCircle2,
  Users,
  MapPin,
  Calendar,
  TrendingUp
} from 'lucide-react';
import VisualizacaoKanban from '@/components/demandas/VisualizacaoKanban';
import VisualizacaoLista from '@/components/demandas/VisualizacaoLista';
import DialogAtribuirResponsavel from '@/components/demandas/DialogAtribuirResponsavel';
import HistoricoDemandas from '@/components/demandas/HistoricoDemandas';
import EstatisticasDemandas from '@/components/demandas/EstatisticasDemandas';

export default function GestorDemandas() {
  const queryClient = useQueryClient();
  const [visualizacao, setVisualizacao] = useState('kanban');
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroPrioridade, setFiltroPrioridade] = useState('todos');
  const [filtroComunidade, setFiltroComunidade] = useState('todos');
  const [filtroResponsavel, setFiltroResponsavel] = useState('todos');
  const [demandaSelecionada, setDemandaSelecionada] = useState(null);
  const [mostrarHistorico, setMostrarHistorico] = useState(false);

  const { data: registros = [], isLoading } = useQuery({
    queryKey: ['registros-demandas'],
    queryFn: () => base44.entities.Registro.list('-created_date', 500)
  });

  const { data: usuarios = [] } = useQuery({
    queryKey: ['usuarios-demandas'],
    queryFn: () => base44.entities.User.list()
  });

  // Extrair todas as demandas dos registros
  const todasDemandas = useMemo(() => {
    const demandas = [];
    registros.forEach(registro => {
      if (registro.demandas && registro.demandas.length > 0) {
        registro.demandas.forEach((demanda, index) => {
          demandas.push({
            ...demanda,
            registroId: registro.id,
            registroTitulo: registro.titulo,
            comunidade: registro.comunidade,
            demandaIndex: index,
            data_registro: registro.created_date
          });
        });
      }
    });
    return demandas;
  }, [registros]);

  // Aplicar filtros
  const demandasFiltradas = useMemo(() => {
    return todasDemandas.filter(demanda => {
      const matchBusca = !busca || 
        demanda.descricao?.toLowerCase().includes(busca.toLowerCase()) ||
        demanda.comunidade?.toLowerCase().includes(busca.toLowerCase());
      
      const matchStatus = filtroStatus === 'todos' || demanda.status === filtroStatus;
      const matchPrioridade = filtroPrioridade === 'todos' || demanda.urgencia === filtroPrioridade;
      const matchComunidade = filtroComunidade === 'todos' || demanda.comunidade === filtroComunidade;
      const matchResponsavel = filtroResponsavel === 'todos' || demanda.responsavel === filtroResponsavel;

      return matchBusca && matchStatus && matchPrioridade && matchComunidade && matchResponsavel;
    });
  }, [todasDemandas, busca, filtroStatus, filtroPrioridade, filtroComunidade, filtroResponsavel]);

  // Obter listas únicas para filtros
  const comunidadesUnicas = useMemo(() => 
    [...new Set(todasDemandas.map(d => d.comunidade).filter(Boolean))].sort(),
    [todasDemandas]
  );

  const responsaveisUnicos = useMemo(() =>
    [...new Set(todasDemandas.map(d => d.responsavel).filter(Boolean))].sort(),
    [todasDemandas]
  );

  const atualizarDemandaMutation = useMutation({
    mutationFn: async ({ registroId, demandaIndex, dadosAtualizados }) => {
      const registro = registros.find(r => r.id === registroId);
      const demandasAtualizadas = [...registro.demandas];
      demandasAtualizadas[demandaIndex] = {
        ...demandasAtualizadas[demandaIndex],
        ...dadosAtualizados
      };
      return base44.entities.Registro.update(registroId, { demandas: demandasAtualizadas });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registros-demandas'] });
    }
  });

  const limparFiltros = () => {
    setBusca('');
    setFiltroStatus('todos');
    setFiltroPrioridade('todos');
    setFiltroComunidade('todos');
    setFiltroResponsavel('todos');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gestão de Demandas</h1>
          <p className="text-slate-600 mt-1">Gerencie e acompanhe todas as demandas comunitárias</p>
        </div>
        <Button onClick={() => setMostrarHistorico(true)}>
          <TrendingUp className="w-4 h-4 mr-2" />
          Ver Histórico
        </Button>
      </div>

      {/* Estatísticas */}
      <EstatisticasDemandas demandas={todasDemandas} />

      {/* Filtros e Busca */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar demandas..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filtros */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="em_andamento">Em Andamento</SelectItem>
                <SelectItem value="atendida">Atendida</SelectItem>
                <SelectItem value="nao_atendida">Não Atendida</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filtroPrioridade} onValueChange={setFiltroPrioridade}>
              <SelectTrigger>
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas as Prioridades</SelectItem>
                <SelectItem value="baixa">Baixa</SelectItem>
                <SelectItem value="media">Média</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="critica">Crítica</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filtroComunidade} onValueChange={setFiltroComunidade}>
              <SelectTrigger>
                <SelectValue placeholder="Comunidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas as Comunidades</SelectItem>
                {comunidadesUnicas.map(com => (
                  <SelectItem key={com} value={com}>{com}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filtroResponsavel} onValueChange={setFiltroResponsavel}>
              <SelectTrigger>
                <SelectValue placeholder="Responsável" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Responsáveis</SelectItem>
                {responsaveisUnicos.map(resp => (
                  <SelectItem key={resp} value={resp}>{resp}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600">
              {demandasFiltradas.length} demanda{demandasFiltradas.length !== 1 ? 's' : ''} encontrada{demandasFiltradas.length !== 1 ? 's' : ''}
            </p>
            <Button variant="outline" size="sm" onClick={limparFiltros}>
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Visualização */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Demandas</CardTitle>
            <div className="flex gap-2">
              <Button
                variant={visualizacao === 'kanban' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setVisualizacao('kanban')}
              >
                <LayoutGrid className="w-4 h-4 mr-2" />
                Kanban
              </Button>
              <Button
                variant={visualizacao === 'lista' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setVisualizacao('lista')}
              >
                <List className="w-4 h-4 mr-2" />
                Lista
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-slate-500">Carregando demandas...</div>
          ) : demandasFiltradas.length === 0 ? (
            <div className="text-center py-12 text-slate-500">Nenhuma demanda encontrada</div>
          ) : visualizacao === 'kanban' ? (
            <VisualizacaoKanban 
              demandas={demandasFiltradas}
              onAtualizarDemanda={atualizarDemandaMutation.mutate}
              onSelecionarDemanda={setDemandaSelecionada}
            />
          ) : (
            <VisualizacaoLista
              demandas={demandasFiltradas}
              onAtualizarDemanda={atualizarDemandaMutation.mutate}
              onSelecionarDemanda={setDemandaSelecionada}
            />
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      {demandaSelecionada && (
        <DialogAtribuirResponsavel
          demanda={demandaSelecionada}
          usuarios={usuarios}
          onClose={() => setDemandaSelecionada(null)}
          onAtribuir={(responsavel) => {
            atualizarDemandaMutation.mutate({
              registroId: demandaSelecionada.registroId,
              demandaIndex: demandaSelecionada.demandaIndex,
              dadosAtualizados: { responsavel }
            });
            setDemandaSelecionada(null);
          }}
        />
      )}

      {mostrarHistorico && (
        <HistoricoDemandas
          registros={registros}
          onClose={() => setMostrarHistorico(false)}
        />
      )}
    </div>
  );
}