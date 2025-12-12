import React from 'react';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Calendar } from 'lucide-react';

export default function ControlesMapa({ 
  search, 
  setSearch, 
  filterRisco, 
  setFilterRisco,
  filterDataInicio,
  setFilterDataInicio,
  filterDataFim,
  setFilterDataFim,
  camadasVisiveis,
  setCamadasVisiveis
}) {
  return (
    <>
      {/* Filtros */}
      <Card className="p-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar comunidade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div>
          <Label className="text-xs text-slate-600 mb-2 block">Nível de Risco</Label>
          <Select value={filterRisco} onValueChange={setFilterRisco}>
            <SelectTrigger>
              <Filter className="w-4 h-4 mr-2 text-slate-400" />
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os níveis</SelectItem>
              <SelectItem value="baixo">🟢 Baixo</SelectItem>
              <SelectItem value="medio">🟡 Médio</SelectItem>
              <SelectItem value="alto">🟠 Alto</SelectItem>
              <SelectItem value="critico">🔴 Crítico</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label className="text-xs text-slate-600 mb-2 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Período dos Registros
          </Label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="date"
              value={filterDataInicio}
              onChange={(e) => setFilterDataInicio(e.target.value)}
              className="text-xs"
              placeholder="Início"
            />
            <Input
              type="date"
              value={filterDataFim}
              onChange={(e) => setFilterDataFim(e.target.value)}
              className="text-xs"
              placeholder="Fim"
            />
          </div>
        </div>
      </Card>

      {/* Camadas */}
      <Card className="p-4">
        <h3 className="font-semibold text-sm text-slate-900 mb-3">Camadas do Mapa</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={camadasVisiveis.comunidades}
              onChange={() => setCamadasVisiveis({...camadasVisiveis, comunidades: !camadasVisiveis.comunidades})}
              className="rounded"
            />
            <span className="text-sm">Comunidades (áreas)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={camadasVisiveis.registros}
              onChange={() => setCamadasVisiveis({...camadasVisiveis, registros: !camadasVisiveis.registros})}
              className="rounded"
            />
            <span className="text-sm">Registros (pontos)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={camadasVisiveis.riscos}
              onChange={() => setCamadasVisiveis({...camadasVisiveis, riscos: !camadasVisiveis.riscos})}
              className="rounded"
            />
            <span className="text-sm">Riscos Sociais</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={camadasVisiveis.oportunidades}
              onChange={() => setCamadasVisiveis({...camadasVisiveis, oportunidades: !camadasVisiveis.oportunidades})}
              className="rounded"
            />
            <span className="text-sm">Oportunidades</span>
          </label>
        </div>
      </Card>
    </>
  );
}