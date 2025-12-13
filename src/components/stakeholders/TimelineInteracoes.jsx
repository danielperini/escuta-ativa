import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Calendar, 
  CheckSquare, 
  Clock,
  MessageCircle,
  ExternalLink,
  Filter,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const tipoInteracaoConfig = {
  registro: { label: 'Registro', icon: FileText, color: 'bg-blue-100 text-blue-700' },
  agenda: { label: 'Agenda', icon: Calendar, color: 'bg-purple-100 text-purple-700' },
  caso: { label: 'Caso', icon: CheckSquare, color: 'bg-emerald-100 text-emerald-700' }
};

export default function TimelineInteracoes({ stakeholderId, stakeholderNome }) {
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [expandido, setExpandido] = useState(true);
  const [limite, setLimite] = useState(10);

  // Buscar registros relacionados
  const { data: registros = [] } = useQuery({
    queryKey: ['registros-stakeholder', stakeholderId],
    queryFn: async () => {
      const todosRegistros = await base44.entities.Registro.list('-created_date', 100);
      return todosRegistros.filter(r => 
        r.participantes?.some(p => p.toLowerCase().includes(stakeholderNome.toLowerCase())) ||
        r.stakeholders_vinculados?.includes(stakeholderId)
      );
    },
    enabled: !!stakeholderId
  });

  // Buscar agendas relacionadas
  const { data: agendas = [] } = useQuery({
    queryKey: ['agendas-stakeholder', stakeholderId],
    queryFn: async () => {
      const todasAgendas = await base44.entities.Agenda.list('-data', 100);
      return todasAgendas.filter(a => 
        a.participantes?.some(p => p.toLowerCase().includes(stakeholderNome.toLowerCase())) ||
        a.responsaveis?.some(r => r.toLowerCase().includes(stakeholderNome.toLowerCase()))
      );
    },
    enabled: !!stakeholderId
  });

  // Buscar casos relacionados
  const { data: casos = [] } = useQuery({
    queryKey: ['casos-stakeholder', stakeholderId],
    queryFn: async () => {
      const todosCasos = await base44.entities.Caso.list('-created_date', 100);
      return todosCasos.filter(c => 
        c.stakeholders_envolvidos?.includes(stakeholderId)
      );
    },
    enabled: !!stakeholderId
  });

  // Consolidar timeline
  const timeline = [
    ...registros.map(r => ({
      tipo: 'registro',
      data: r.created_date,
      titulo: r.titulo,
      descricao: r.descricao,
      id: r.id,
      detalhes: {
        tipo_registro: r.tipo,
        comunidade: r.comunidade,
        sentimento: r.sentimento
      }
    })),
    ...agendas.map(a => ({
      tipo: 'agenda',
      data: a.data,
      titulo: a.titulo,
      descricao: a.descricao,
      id: a.id,
      detalhes: {
        status: a.status,
        tipo_agenda: a.tipo,
        comunidade: a.comunidade
      }
    })),
    ...casos.map(c => ({
      tipo: 'caso',
      data: c.created_date,
      titulo: c.titulo,
      descricao: c.descricao,
      id: c.id,
      detalhes: {
        status: c.status,
        prioridade: c.prioridade,
        comunidade: c.comunidade
      }
    }))
  ].sort((a, b) => new Date(b.data) - new Date(a.data));

  const timelineFiltrada = filtroTipo === 'todos' 
    ? timeline 
    : timeline.filter(t => t.tipo === filtroTipo);

  const timelineExibida = timelineFiltrada.slice(0, limite);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-600" />
            <h3 className="font-semibold text-lg">Timeline de Interações</h3>
            <Badge variant="secondary">{timelineFiltrada.length}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="registro">Registros</SelectItem>
                <SelectItem value="agenda">Agendas</SelectItem>
                <SelectItem value="caso">Casos</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setExpandido(!expandido)}
            >
              {expandido ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {expandido && (
          <>
            {timelineExibida.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <MessageCircle className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <p>Nenhuma interação registrada</p>
              </div>
            ) : (
              <div className="space-y-3">
                {timelineExibida.map((item, index) => {
                  const config = tipoInteracaoConfig[item.tipo];
                  const Icon = config.icon;

                  return (
                    <div key={`${item.tipo}-${item.id}-${index}`} className="relative pl-8 pb-3 border-l-2 border-slate-200 last:border-l-0">
                      <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-slate-400">
                        <div className={cn("w-full h-full rounded-full", config.color.split(' ')[0])} />
                      </div>

                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Badge variant="secondary" className={cn("text-xs", config.color)}>
                            <Icon className="w-3 h-3 mr-1" />
                            {config.label}
                          </Badge>
                          <span className="text-xs text-slate-500">
                            {format(new Date(item.data), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        </div>
                        <Link 
                          to={createPageUrl(
                            item.tipo === 'registro' ? 'VerRegistro' :
                            item.tipo === 'agenda' ? 'Agenda' :
                            'VerCaso'
                          ) + `?id=${item.id}`}
                          className="flex-shrink-0"
                        >
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </Link>
                      </div>

                      <h4 className="font-medium text-slate-900 text-sm mb-1">{item.titulo}</h4>
                      
                      {item.descricao && (
                        <p className="text-xs text-slate-600 line-clamp-2 mb-2">
                          {item.descricao}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-1">
                        {item.detalhes.comunidade && (
                          <Badge variant="outline" className="text-xs">
                            {item.detalhes.comunidade}
                          </Badge>
                        )}
                        {item.detalhes.status && (
                          <Badge variant="outline" className="text-xs capitalize">
                            {item.detalhes.status.replace('_', ' ')}
                          </Badge>
                        )}
                        {item.detalhes.prioridade && (
                          <Badge variant="outline" className="text-xs capitalize">
                            {item.detalhes.prioridade}
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}

                {timelineFiltrada.length > limite && (
                  <div className="text-center pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLimite(prev => prev + 10)}
                    >
                      Carregar mais ({timelineFiltrada.length - limite} restantes)
                    </Button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}