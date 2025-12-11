import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { AlertTriangle, Package, Search, Filter, TrendingUp } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { cn } from "@/lib/utils";

export default function MaterialidadeViva() {
  const [search, setSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState('todos');

  const { data: registros = [], isLoading } = useQuery({
    queryKey: ['registros'],
    queryFn: () => base44.entities.Registro.list('-created_date', 200)
  });

  // Extract impacts/damages from registros
  const impactos = [];
  const acoes = [];

  registros.forEach(r => {
    // Extract damages/impacts (typically from demandas, temas, indicadores_risco)
    if (r.demandas) {
      r.demandas.forEach(d => {
        impactos.push({
          descricao: d.descricao,
          tipo: 'demanda',
          urgencia: d.urgencia,
          comunidade: r.comunidade,
          data: r.created_date
        });
      });
    }

    if (r.indicadores_risco) {
      r.indicadores_risco.forEach(ind => {
        impactos.push({
          descricao: ind,
          tipo: 'risco',
          urgencia: 'alta',
          comunidade: r.comunidade,
          data: r.created_date
        });
      });
    }

    // Extract company actions/deliveries (typically from compromissos)
    if (r.compromissos) {
      r.compromissos.forEach(c => {
        acoes.push({
          descricao: c.descricao,
          responsavel: c.responsavel,
          status: c.status,
          prazo: c.prazo,
          comunidade: r.comunidade,
          data: r.created_date
        });
      });
    }
  });

  // Filter
  const filteredImpactos = impactos.filter(i => 
    (!search || i.descricao?.toLowerCase().includes(search.toLowerCase())) &&
    (filterTipo === 'todos' || filterTipo === 'impactos')
  );

  const filteredAcoes = acoes.filter(a => 
    (!search || a.descricao?.toLowerCase().includes(search.toLowerCase())) &&
    (filterTipo === 'todos' || filterTipo === 'acoes')
  );

  // Count by category
  const temasCount = {};
  registros.forEach(r => {
    (r.temas_identificados || []).forEach(tema => {
      temasCount[tema] = (temasCount[tema] || 0) + 1;
    });
  });

  const topTemas = Object.entries(temasCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Materialidade Viva</h2>
        <p className="text-slate-500 mt-1">
          Impactos percebidos pela comunidade e ações entregues pela empresa
        </p>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterTipo} onValueChange={setFilterTipo}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="w-4 h-4 mr-2 text-slate-400" />
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="impactos">Impactos/Danos</SelectItem>
              <SelectItem value="acoes">Ações/Entregas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-slate-500">Total de Impactos</div>
          <div className="text-2xl font-bold text-red-600 mt-1">{impactos.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-slate-500">Ações/Entregas</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{acoes.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-slate-500">Temas Identificados</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{Object.keys(temasCount).length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-slate-500">Registros Analisados</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{registros.length}</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Impactos/Danos */}
        <div className="lg:col-span-2 space-y-6">
          {(filterTipo === 'todos' || filterTipo === 'impactos') && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="w-5 h-5" />
                  Impactos / Danos Percebidos pela Comunidade
                </CardTitle>
                <p className="text-sm text-slate-500">
                  Demandas, problemas e riscos identificados nos registros
                </p>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[500px] overflow-y-auto">
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)
                ) : filteredImpactos.length === 0 ? (
                  <p className="text-center py-8 text-slate-500">
                    Nenhum impacto registrado ainda. Os dados aparecerão automaticamente conforme registros forem criados.
                  </p>
                ) : (
                  filteredImpactos.map((imp, idx) => (
                    <div 
                      key={idx}
                      className={cn(
                        "p-4 rounded-lg border-l-4",
                        imp.urgencia === 'critica' ? 'border-l-red-500 bg-red-50' :
                        imp.urgencia === 'alta' ? 'border-l-orange-500 bg-orange-50' :
                        imp.urgencia === 'media' ? 'border-l-amber-500 bg-amber-50' :
                        'border-l-slate-400 bg-slate-50'
                      )}
                    >
                      <p className="text-slate-900 font-medium">{imp.descricao}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                        {imp.comunidade && <span>{imp.comunidade}</span>}
                        <Badge variant="secondary" className="text-xs capitalize">
                          {imp.tipo}
                        </Badge>
                        {imp.urgencia && (
                          <Badge variant="secondary" className={cn(
                            "text-xs",
                            imp.urgencia === 'critica' && 'bg-red-100 text-red-700',
                            imp.urgencia === 'alta' && 'bg-orange-100 text-orange-700',
                            imp.urgencia === 'media' && 'bg-amber-100 text-amber-700'
                          )}>
                            {imp.urgencia}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )}

          {(filterTipo === 'todos' || filterTipo === 'acoes') && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-emerald-700">
                  <Package className="w-5 h-5" />
                  Ações e Entregas Materiais da Empresa
                </CardTitle>
                <p className="text-sm text-slate-500">
                  Compromissos assumidos e ações realizadas
                </p>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[500px] overflow-y-auto">
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)
                ) : filteredAcoes.length === 0 ? (
                  <p className="text-center py-8 text-slate-500">
                    Nenhuma ação registrada ainda. Os dados aparecerão automaticamente conforme registros forem criados.
                  </p>
                ) : (
                  filteredAcoes.map((acao, idx) => (
                    <div 
                      key={idx}
                      className="p-4 rounded-lg bg-emerald-50 border-l-4 border-l-emerald-500"
                    >
                      <p className="text-slate-900 font-medium">{acao.descricao}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                        {acao.comunidade && <span>{acao.comunidade}</span>}
                        {acao.responsavel && <span>• {acao.responsavel}</span>}
                        {acao.status && (
                          <Badge variant="secondary" className="text-xs capitalize">
                            {acao.status.replace('_', ' ')}
                          </Badge>
                        )}
                        {acao.prazo && <span>• Prazo: {new Date(acao.prazo).toLocaleDateString('pt-BR')}</span>}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Temas Sidebar */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#40916C]" />
                Temas Mais Recorrentes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {topTemas.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">
                  Nenhum tema identificado ainda
                </p>
              ) : (
                topTemas.map(([tema, count], idx) => (
                  <div 
                    key={tema}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                        idx < 3 ? "bg-[#40916C] text-white" : "bg-slate-200 text-slate-600"
                      )}>
                        {idx + 1}
                      </span>
                      <span className="text-sm font-medium text-slate-700">{tema}</span>
                    </div>
                    <Badge variant="secondary" className="bg-slate-200">
                      {count}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}