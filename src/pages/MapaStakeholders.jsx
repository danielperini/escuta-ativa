import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Network, 
  Users, 
  AlertCircle, 
  Filter,
  Building,
  User,
  X,
  MapPin,
  Phone,
  Mail,
  FileText
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import GrafoRedeAtores from '@/components/atores/GrafoRedeAtores';

export default function MapaStakeholders() {
  const [selectedStakeholder, setSelectedStakeholder] = useState(null);
  const [filterTipo, setFilterTipo] = useState('todos');
  const [filterComunidade, setFilterComunidade] = useState('todos');

  const { data: stakeholders = [], isLoading } = useQuery({
    queryKey: ['stakeholders-mapa'],
    queryFn: () => base44.entities.Stakeholder.list(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  const { data: registros = [] } = useQuery({
    queryKey: ['registros-mapa'],
    queryFn: () => base44.entities.Registro.list('-created_date', 200)
  });

  const { data: comunidades = [] } = useQuery({
    queryKey: ['comunidades'],
    queryFn: () => base44.entities.Comunidade.list()
  });

  // Obter todas comunidades dos stakeholders
  const comunidadesStakeholders = [...new Set(stakeholders.map(s => s.comunidade).filter(Boolean))];

  // Filtrar stakeholders
  const stakeholdersFiltrados = stakeholders.filter(s => {
    const matchTipo = filterTipo === 'todos' || s.tipo === filterTipo;
    const matchComunidade = filterComunidade === 'todos' || s.comunidade === filterComunidade;
    return matchTipo && matchComunidade;
  });

  // Estatísticas
  const stats = {
    pessoas: stakeholders.filter(s => s.tipo === 'pessoa').length,
    entidades: stakeholders.filter(s => s.tipo === 'entidade').length,
    liderancas: stakeholders.filter(s => s.subtipo === 'lideranca').length,
    organizacoes: stakeholders.filter(s => ['associacao', 'ong', 'governo'].includes(s.subtipo)).length
  };

  const handleNodeClick = (stakeholder) => {
    setSelectedStakeholder(stakeholder);
  };

  if (isLoading) {
    return (
      <Card className="p-12 text-center">
        <Users className="w-12 h-12 mx-auto mb-4 text-slate-300 animate-pulse" />
        <p className="text-slate-500">Carregando mapa de stakeholders...</p>
      </Card>
    );
  }

  if (stakeholders.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Network className="w-12 h-12 mx-auto mb-4 text-slate-300" />
        <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhum stakeholder mapeado</h3>
        <p className="text-slate-500">
          Stakeholders são criados automaticamente quando mencionados nos registros
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Mapa de Stakeholders</h2>
          <p className="text-slate-500 mt-1">Visualização de rede e conexões territoriais</p>
        </div>
        {selectedStakeholder && (
          <Button
            variant="outline"
            onClick={() => setSelectedStakeholder(null)}
            className="gap-2"
          >
            <X className="w-4 h-4" />
            Fechar Detalhes
          </Button>
        )}
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <User className="w-4 h-4 text-blue-600" />
            <div className="text-sm text-slate-500">Pessoas</div>
          </div>
          <div className="text-2xl font-bold text-blue-600">{stats.pessoas}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Building className="w-4 h-4 text-purple-600" />
            <div className="text-sm text-slate-500">Entidades</div>
          </div>
          <div className="text-2xl font-bold text-purple-600">{stats.entidades}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-emerald-600" />
            <div className="text-sm text-slate-500">Lideranças</div>
          </div>
          <div className="text-2xl font-bold text-emerald-600">{stats.liderancas}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Network className="w-4 h-4 text-amber-600" />
            <div className="text-sm text-slate-500">Organizações</div>
          </div>
          <div className="text-2xl font-bold text-amber-600">{stats.organizacoes}</div>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <Filter className="w-4 h-4 text-slate-500" />
          <Select value={filterTipo} onValueChange={setFilterTipo}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos Tipos</SelectItem>
              <SelectItem value="pessoa">Pessoas</SelectItem>
              <SelectItem value="entidade">Entidades</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterComunidade} onValueChange={setFilterComunidade}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas Comunidades</SelectItem>
              {comunidadesStakeholders.sort().map(nome => (
                <SelectItem key={nome} value={nome}>{nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(filterTipo !== 'todos' || filterComunidade !== 'todos') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterTipo('todos');
                setFilterComunidade('todos');
              }}
            >
              <X className="w-4 h-4 mr-1" />
              Limpar
            </Button>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mapa de Rede */}
        <div className={cn("lg:col-span-2", selectedStakeholder && "lg:col-span-2")}>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 flex items-start gap-3 mb-6">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">Clique em um ator para ver detalhes</p>
              <p className="text-blue-700">
                Stakeholders agrupados por localização (comunidade/município)
              </p>
            </div>
          </div>
          <GrafoRedeAtores 
            atores={stakeholdersFiltrados} 
            registros={registros}
            onNodeClick={handleNodeClick}
          />
        </div>

        {/* Detalhes do Stakeholder Selecionado */}
        {selectedStakeholder && (
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#2D6A4F] flex items-center justify-center text-white text-xl">
                      {selectedStakeholder.tipo === 'pessoa' ? '👤' : '🏢'}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{selectedStakeholder.nome}</CardTitle>
                      {selectedStakeholder.id_sequencial && (
                        <p className="text-xs text-slate-400">ID #{selectedStakeholder.id_sequencial}</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className={selectedStakeholder.tipo === 'pessoa' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}>
                    {selectedStakeholder.tipo === 'pessoa' ? 'Pessoa' : 'Entidade'}
                  </Badge>
                  {selectedStakeholder.subtipo && (
                    <Badge variant="outline" className="capitalize">
                      {selectedStakeholder.subtipo}
                    </Badge>
                  )}
                  {selectedStakeholder.status_cadastro && (
                    <Badge variant="outline" className="capitalize">
                      {selectedStakeholder.status_cadastro}
                    </Badge>
                  )}
                </div>

                {/* Papel Social */}
                {selectedStakeholder.papel_social && (
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-1">Papel Social</p>
                    <p className="text-sm text-slate-600">{selectedStakeholder.papel_social}</p>
                  </div>
                )}

                {/* Organização */}
                {selectedStakeholder.organizacao && (
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                      <Building className="w-4 h-4" />
                      Organização
                    </p>
                    <p className="text-sm text-slate-600">{selectedStakeholder.organizacao}</p>
                  </div>
                )}

                {/* Localização */}
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    Localização
                  </p>
                  <div className="space-y-1 text-sm text-slate-600">
                    <p>📍 {selectedStakeholder.comunidade}</p>
                    {selectedStakeholder.municipio && (
                      <p className="text-xs text-slate-500">• {selectedStakeholder.municipio}</p>
                    )}
                    {selectedStakeholder.endereco && (
                      <p className="text-xs text-slate-500">• {selectedStakeholder.endereco}</p>
                    )}
                  </div>
                </div>

                {/* Contato */}
                {(selectedStakeholder.contato?.telefone || selectedStakeholder.contato?.email) && (
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">Contato</p>
                    <div className="space-y-2 text-sm text-slate-600">
                      {selectedStakeholder.contato?.telefone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-slate-400" />
                          {selectedStakeholder.contato.telefone}
                        </div>
                      )}
                      {selectedStakeholder.contato?.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-slate-400" />
                          <span className="text-xs truncate">{selectedStakeholder.contato.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Estatísticas */}
                <div className="pt-4 border-t space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Interações</span>
                    <span className="font-semibold">{selectedStakeholder.historico_interacoes || 0}</span>
                  </div>
                  {selectedStakeholder.casos_vinculados?.length > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Casos Vinculados</span>
                      <Badge variant="outline">{selectedStakeholder.casos_vinculados.length}</Badge>
                    </div>
                  )}
                  {selectedStakeholder.registros_vinculados?.length > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Registros</span>
                      <Badge variant="outline">{selectedStakeholder.registros_vinculados.length}</Badge>
                    </div>
                  )}
                </div>

                {/* Temas Recorrentes */}
                {selectedStakeholder.temas_recorrentes?.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">Temas Recorrentes</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedStakeholder.temas_recorrentes.map((tema, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {tema}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}