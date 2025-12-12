import React from 'react';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Filter, X, Calendar } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

export default function FiltrosAvancados({ filtros, setFiltros, comunidades, temas }) {
  const limparFiltros = () => {
    setFiltros({
      busca: '',
      comunidade: 'todas',
      tipo: 'todos',
      status: 'todos',
      temperatura: 'todos',
      tema: 'todos',
      dataInicio: '',
      dataFim: ''
    });
  };

  const contarFiltrosAtivos = () => {
    let count = 0;
    if (filtros.busca) count++;
    if (filtros.comunidade !== 'todas') count++;
    if (filtros.tipo !== 'todos') count++;
    if (filtros.status !== 'todos') count++;
    if (filtros.temperatura !== 'todos') count++;
    if (filtros.tema !== 'todos') count++;
    if (filtros.dataInicio || filtros.dataFim) count++;
    return count;
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-slate-600" />
          <h3 className="font-semibold text-slate-900">Filtros Avançados</h3>
          {contarFiltrosAtivos() > 0 && (
            <Badge className="bg-blue-600">{contarFiltrosAtivos()}</Badge>
          )}
        </div>
        {contarFiltrosAtivos() > 0 && (
          <Button variant="ghost" size="sm" onClick={limparFiltros}>
            <X className="w-4 h-4 mr-1" />
            Limpar
          </Button>
        )}
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <div className="md:col-span-4">
          <Label className="text-xs">Busca em Texto Livre</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar em título, descrição, participantes, temas..."
              value={filtros.busca}
              onChange={(e) => setFiltros({ ...filtros, busca: e.target.value })}
              className="pl-10"
            />
          </div>
        </div>

        <div>
          <Label className="text-xs">Comunidade</Label>
          <Select value={filtros.comunidade} onValueChange={(v) => setFiltros({ ...filtros, comunidade: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              {comunidades.map(c => (
                <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs">Tipo</Label>
          <Select value={filtros.tipo} onValueChange={(v) => setFiltros({ ...filtros, tipo: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="reuniao">Reunião</SelectItem>
              <SelectItem value="conversa_campo">Conversa Campo</SelectItem>
              <SelectItem value="visita">Visita</SelectItem>
              <SelectItem value="demanda">Demanda</SelectItem>
              <SelectItem value="ocorrencia">Ocorrência</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs">Status</Label>
          <Select value={filtros.status} onValueChange={(v) => setFiltros({ ...filtros, status: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="rascunho">Rascunho</SelectItem>
              <SelectItem value="finalizado">Finalizado</SelectItem>
              <SelectItem value="arquivado">Arquivado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs">Temperatura</Label>
          <Select value={filtros.temperatura} onValueChange={(v) => setFiltros({ ...filtros, temperatura: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="baixo">🟢 Baixo</SelectItem>
              <SelectItem value="medio">🟡 Médio</SelectItem>
              <SelectItem value="alto">🟠 Alto</SelectItem>
              <SelectItem value="critico">🔴 Crítico</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs">Tema</Label>
          <Select value={filtros.tema} onValueChange={(v) => setFiltros({ ...filtros, tema: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {temas.map(t => (
                <SelectItem key={t.id} value={t.nome}>{t.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-2">
          <Label className="text-xs flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Período
          </Label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="date"
              value={filtros.dataInicio}
              onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })}
              className="text-xs"
            />
            <Input
              type="date"
              value={filtros.dataFim}
              onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
              className="text-xs"
            />
          </div>
        </div>
      </div>
    </Card>
  );
}