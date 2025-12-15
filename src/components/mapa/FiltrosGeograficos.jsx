import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X, MapPin, Calendar, Thermometer } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

export default function FiltrosGeograficos({ 
  filtros, 
  onFiltrosChange, 
  comunidades = [],
  onLimparFiltros 
}) {
  const handleChange = (campo, valor) => {
    onFiltrosChange({ ...filtros, [campo]: valor });
  };

  const totalFiltrosAtivos = Object.values(filtros).filter(v => v && v !== 'todas').length;

  return (
    <Card className="absolute top-4 left-4 z-[1000] w-80 shadow-xl">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-[#E31E24]" />
            <h3 className="font-semibold text-slate-900">Filtros</h3>
          </div>
          {totalFiltrosAtivos > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{totalFiltrosAtivos}</Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={onLimparFiltros}
                className="h-7 text-xs"
              >
                <X className="w-3 h-3 mr-1" />
                Limpar
              </Button>
            </div>
          )}
        </div>

        {/* Busca por texto */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar por título, local..."
            value={filtros.busca || ''}
            onChange={(e) => handleChange('busca', e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Comunidade */}
        <div>
          <Label className="text-xs text-slate-600 mb-1 block">
            <MapPin className="w-3 h-3 inline mr-1" />
            Comunidade
          </Label>
          <Select
            value={filtros.comunidade || 'todas'}
            onValueChange={(v) => handleChange('comunidade', v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas Comunidades</SelectItem>
              {comunidades.map(c => (
                <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Temperatura */}
        <div>
          <Label className="text-xs text-slate-600 mb-1 block">
            <Thermometer className="w-3 h-3 inline mr-1" />
            Temperatura do Território
          </Label>
          <Select
            value={filtros.temperatura || 'todas'}
            onValueChange={(v) => handleChange('temperatura', v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              <SelectItem value="critico">🔴 Crítico</SelectItem>
              <SelectItem value="alto">🟠 Alto</SelectItem>
              <SelectItem value="medio">🟡 Médio</SelectItem>
              <SelectItem value="baixo">🟢 Baixo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Período */}
        <div>
          <Label className="text-xs text-slate-600 mb-1 block">
            <Calendar className="w-3 h-3 inline mr-1" />
            Período
          </Label>
          <Select
            value={filtros.periodo || '30'}
            onValueChange={(v) => handleChange('periodo', v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 3 meses</SelectItem>
              <SelectItem value="180">Últimos 6 meses</SelectItem>
              <SelectItem value="365">Último ano</SelectItem>
              <SelectItem value="all">Todo período</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tipo de Registro */}
        <div>
          <Label className="text-xs text-slate-600 mb-1 block">Tipo de Registro</Label>
          <Select
            value={filtros.tipo || 'todos'}
            onValueChange={(v) => handleChange('tipo', v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="reuniao">Reunião</SelectItem>
              <SelectItem value="conversa_campo">Conversa de Campo</SelectItem>
              <SelectItem value="visita">Visita</SelectItem>
              <SelectItem value="demanda">Demanda</SelectItem>
              <SelectItem value="ocorrencia">Ocorrência</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}