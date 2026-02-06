import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, 
  MapPin, 
  Clock, 
  TrendingUp,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function HistoricoDemandas({ registros, onClose }) {
  const [busca, setBusca] = useState('');
  const [filtroComunidade, setFiltroComunidade] = useState('todas');

  // Extrair histórico de todas as demandas
  const historico = useMemo(() => {
    const eventos = [];
    
    registros.forEach(registro => {
      if (registro.demandas && registro.demandas.length > 0) {
        registro.demandas.forEach(demanda => {
          // Evento de criação
          eventos.push({
            tipo: 'criacao',
            data: registro.created_date,
            demanda: demanda.descricao,
            comunidade: registro.comunidade,
            registro: registro.titulo,
            status: demanda.status || 'pendente',
            urgencia: demanda.urgencia
          });

          // Evento de devolutiva
          if (demanda.devolutiva_realizada && demanda.data_devolutiva) {
            eventos.push({
              tipo: 'devolutiva',
              data: demanda.data_devolutiva,
              demanda: demanda.descricao,
              comunidade: registro.comunidade,
              registro: registro.titulo,
              status: demanda.status
            });
          }
        });
      }
    });

    return eventos.sort((a, b) => new Date(b.data) - new Date(a.data));
  }, [registros]);

  // Filtrar histórico
  const historicoFiltrado = useMemo(() => {
    return historico.filter(evento => {
      const matchBusca = !busca || 
        evento.demanda.toLowerCase().includes(busca.toLowerCase()) ||
        evento.comunidade?.toLowerCase().includes(busca.toLowerCase());
      
      const matchComunidade = filtroComunidade === 'todas' || evento.comunidade === filtroComunidade;

      return matchBusca && matchComunidade;
    });
  }, [historico, busca, filtroComunidade]);

  // Comunidades únicas
  const comunidades = useMemo(() => {
    return [...new Set(historico.map(e => e.comunidade).filter(Boolean))].sort();
  }, [historico]);

  const getIcone = (tipo) => {
    switch(tipo) {
      case 'criacao': return <AlertCircle className="w-4 h-4 text-blue-600" />;
      case 'devolutiva': return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      default: return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      pendente: { label: 'Pendente', color: 'bg-slate-100 text-slate-700' },
      em_andamento: { label: 'Em Andamento', color: 'bg-blue-100 text-blue-700' },
      atendida: { label: 'Atendida', color: 'bg-green-100 text-green-700' },
      nao_atendida: { label: 'Não Atendida', color: 'bg-red-100 text-red-700' }
    };
    return config[status] || config.pendente;
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Histórico de Demandas
          </DialogTitle>
        </DialogHeader>

        {/* Filtros */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar no histórico..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={filtroComunidade} onValueChange={setFiltroComunidade}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por comunidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as Comunidades</SelectItem>
              {comunidades.map(com => (
                <SelectItem key={com} value={com}>{com}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <p className="text-sm text-slate-600">
            {historicoFiltrado.length} evento{historicoFiltrado.length !== 1 ? 's' : ''} encontrado{historicoFiltrado.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Timeline */}
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {historicoFiltrado.map((evento, idx) => {
              const statusBadge = getStatusBadge(evento.status);
              
              return (
                <div key={idx} className="flex gap-3 relative">
                  {/* Linha da timeline */}
                  {idx < historicoFiltrado.length - 1 && (
                    <div className="absolute left-[15px] top-8 bottom-0 w-px bg-slate-200" />
                  )}

                  {/* Ícone */}
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center z-10">
                    {getIcone(evento.tipo)}
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 bg-white border rounded-lg p-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">
                          {evento.tipo === 'criacao' ? 'Nova Demanda' : 'Devolutiva Realizada'}
                        </p>
                        <p className="text-xs text-slate-600 mt-1">
                          {evento.demanda}
                        </p>
                      </div>
                      <Badge className={statusBadge.color}>
                        {statusBadge.label}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(parseISO(evento.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </div>
                      {evento.comunidade && (
                        <>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {evento.comunidade}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}