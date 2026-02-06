import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Clock, 
  User, 
  AlertCircle,
  CheckCircle2,
  PlayCircle,
  ExternalLink
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const statusConfig = {
  pendente: { label: 'Pendente', color: 'bg-slate-100 text-slate-700' },
  em_andamento: { label: 'Em Andamento', color: 'bg-blue-100 text-blue-700' },
  atendida: { label: 'Atendida', color: 'bg-green-100 text-green-700' },
  nao_atendida: { label: 'Não Atendida', color: 'bg-red-100 text-red-700' }
};

const urgenciaConfig = {
  baixa: { color: 'bg-blue-100 text-blue-800', icon: '●' },
  media: { color: 'bg-yellow-100 text-yellow-800', icon: '●●' },
  alta: { color: 'bg-orange-100 text-orange-800', icon: '●●●' },
  critica: { color: 'bg-red-100 text-red-800', icon: '●●●●' }
};

export default function VisualizacaoLista({ demandas, onAtualizarDemanda, onSelecionarDemanda }) {
  const navigate = useNavigate();

  const verificarAtraso = (demanda) => {
    if (!demanda.prazo_devolutiva || demanda.devolutiva_realizada) return null;
    const dias = differenceInDays(new Date(), new Date(demanda.prazo_devolutiva));
    return dias > 0 ? dias : null;
  };

  return (
    <div className="space-y-2">
      {/* Header da tabela */}
      <div className="grid grid-cols-12 gap-3 px-4 py-2 bg-slate-100 rounded-lg text-xs font-semibold text-slate-600">
        <div className="col-span-4">Demanda</div>
        <div className="col-span-2">Comunidade</div>
        <div className="col-span-2">Status</div>
        <div className="col-span-1">Prioridade</div>
        <div className="col-span-2">Responsável</div>
        <div className="col-span-1">Ações</div>
      </div>

      {/* Lista de demandas */}
      <div className="space-y-2">
        {demandas.map((demanda, idx) => {
          const diasAtraso = verificarAtraso(demanda);
          const status = demanda.status || 'pendente';

          return (
            <div 
              key={`${demanda.registroId}-${idx}`}
              className="grid grid-cols-12 gap-3 px-4 py-3 bg-white border rounded-lg hover:shadow-md transition-shadow items-center"
            >
              {/* Demanda */}
              <div className="col-span-4">
                <p className="text-sm font-medium text-slate-900 line-clamp-2">
                  {demanda.descricao}
                </p>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                  <span>Registro: {demanda.registroTitulo}</span>
                  {demanda.prazo_devolutiva && (
                    <>
                      <span>•</span>
                      <Clock className="w-3 h-3" />
                      {format(new Date(demanda.prazo_devolutiva), 'dd/MM/yyyy')}
                    </>
                  )}
                </div>
                {diasAtraso && (
                  <div className="flex items-center gap-1 text-xs text-red-600 mt-1">
                    <AlertCircle className="w-3 h-3" />
                    {diasAtraso} dia{diasAtraso > 1 ? 's' : ''} de atraso
                  </div>
                )}
              </div>

              {/* Comunidade */}
              <div className="col-span-2">
                <div className="flex items-center gap-1 text-sm">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  <span className="text-slate-700">{demanda.comunidade || 'N/A'}</span>
                </div>
              </div>

              {/* Status */}
              <div className="col-span-2">
                <Badge className={statusConfig[status]?.color}>
                  {statusConfig[status]?.label}
                </Badge>
              </div>

              {/* Prioridade */}
              <div className="col-span-1">
                <Badge className={urgenciaConfig[demanda.urgencia]?.color || 'bg-slate-100'}>
                  {urgenciaConfig[demanda.urgencia]?.icon || '●'}
                </Badge>
              </div>

              {/* Responsável */}
              <div className="col-span-2">
                {demanda.responsavel ? (
                  <div className="flex items-center gap-1 text-sm text-slate-700">
                    <User className="w-3 h-3 text-slate-400" />
                    {demanda.responsavel}
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onSelecionarDemanda(demanda)}
                    className="text-xs"
                  >
                    Atribuir
                  </Button>
                )}
              </div>

              {/* Ações */}
              <div className="col-span-1 flex gap-1">
                {status === 'pendente' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onAtualizarDemanda({
                      registroId: demanda.registroId,
                      demandaIndex: demanda.demandaIndex,
                      dadosAtualizados: { status: 'em_andamento' }
                    })}
                    title="Iniciar"
                  >
                    <PlayCircle className="w-4 h-4" />
                  </Button>
                )}
                {status === 'em_andamento' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onAtualizarDemanda({
                      registroId: demanda.registroId,
                      demandaIndex: demanda.demandaIndex,
                      dadosAtualizados: { 
                        status: 'atendida',
                        devolutiva_realizada: true,
                        data_devolutiva: new Date().toISOString().split('T')[0]
                      }
                    })}
                    title="Concluir"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => navigate(createPageUrl('VerRegistro') + `?id=${demanda.registroId}`)}
                  title="Ver registro"
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}