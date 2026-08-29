import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { MapPin, User, AlertCircle, Clock, ExternalLink } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import QuadroDevolutiva from './QuadroDevolutiva';
import FormularioRegistroDevolutiva from './FormularioRegistroDevolutiva';
import { statusDevolutiva, devolutivaStatusConfig } from '@/lib/devolutiva';

const statusConfig = {
  pendente: { label: 'Pendente', color: 'bg-slate-100 text-slate-700' },
  em_andamento: { label: 'Em Andamento', color: 'bg-blue-100 text-blue-700' },
  atendida: { label: 'Atendida', color: 'bg-emerald-100 text-emerald-700' },
  nao_atendida: { label: 'Não Atendida', color: 'bg-red-100 text-red-700' }
};

export default function DialogDetalheDemanda({
  demanda,
  registros = [],
  usuarios = [],
  onAtualizarDemanda,
  salvando = false,
  onClose
}) {
  const navigate = useNavigate();
  const [mostrarForm, setMostrarForm] = useState(false);
  if (!demanda) return null;

  const registroOrigem = registros.find(r => r.id === demanda.registroId);
  const status = demanda.status || 'pendente';
  const devStatus = statusDevolutiva(demanda);
  const devConfig = devolutivaStatusConfig(demanda);

  const atraso = (() => {
    if (!demanda.prazo_devolutiva || devStatus === 'realizada') return null;
    const d = new Date(demanda.prazo_devolutiva);
    if (isNaN(d.getTime())) return null;
    const dias = differenceInDays(new Date(), d);
    return dias > 0 ? dias : null;
  })();

  const handleSalvarDevolutiva = (dados) => {
    onAtualizarDemanda({
      registroId: demanda.registroId,
      demandaIndex: demanda.demandaIndex,
      dadosAtualizados: dados
    });
  };

  const handleVincularNovoRegistro = async (novoRegistroId) => {
    if (!novoRegistroId) {
      setMostrarForm(false);
      return;
    }
    // Vincula o novo registro à demanda e marca devolutiva como realizada
    const ids = Array.from(new Set([
      ...(demanda.devolutiva_registro_ids || []),
      novoRegistroId
    ]));
    onAtualizarDemanda({
      registroId: demanda.registroId,
      demandaIndex: demanda.demandaIndex,
      dadosAtualizados: {
        devolutiva_status: 'realizada',
        devolutiva_registro_ids: ids,
        devolutiva_data_realizada: new Date().toISOString().split('T')[0],
        devolutiva_realizada: true,
        data_devolutiva: demanda.data_devolutiva || new Date().toISOString().split('T')[0]
      }
    });
    setMostrarForm(false);
  };

  const abrirRegistro = (id) => {
    navigate(createPageUrl('VerRegistro') + `?id=${id}`);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            <span>Demanda</span>
            <Badge className={statusConfig[status]?.color}>{statusConfig[status]?.label}</Badge>
            <Badge className={`${devConfig.badge} border`}>{devConfig.emoji} Devolutiva: {devConfig.label}</Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Resumo da demanda */}
        <div className="p-3 rounded-lg bg-slate-50 border space-y-2">
          <p className="text-sm font-medium text-slate-900">“{demanda.descricao}”</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {demanda.comunidade || 'N/A'}</span>
            {demanda.responsavel && (
              <span className="flex items-center gap-1"><User className="w-3 h-3" /> {demanda.responsavel}</span>
            )}
            {demanda.prazo_devolutiva && !isNaN(new Date(demanda.prazo_devolutiva).getTime()) && (
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Prazo: {format(new Date(demanda.prazo_devolutiva), 'dd/MM/yyyy')}</span>
            )}
            <span className="flex items-center gap-1 text-slate-500">
              Registro: {demanda.registroTitulo}
              <button className="text-primary hover:underline" onClick={() => abrirRegistro(demanda.registroId)}>
                <ExternalLink className="w-3 h-3" />
              </button>
            </span>
          </div>
          {atraso && (
            <div className="flex items-center gap-1 text-xs text-red-600">
              <AlertCircle className="w-3 h-3" /> {atraso} dia{atraso > 1 ? 's' : ''} de atraso na devolutiva
            </div>
          )}
        </div>

        {/* Quadro de Devolutiva */}
        <QuadroDevolutiva
          demanda={demanda}
          registros={registros}
          usuarios={usuarios}
          onSalvar={handleSalvarDevolutiva}
          onAbrirRegistro={abrirRegistro}
          onRegistrarAtividade={() => setMostrarForm(true)}
          salvando={salvando}
        />

        {/* Regra de conclusão (§5) */}
        {devStatus === 'pendente' && status !== 'atendida' && (
          <div className="flex items-start gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md p-3">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>Esta demanda ainda possui <b>devolutiva pendente</b>. Ao concluir, a pendência será registrada no histórico da devolutiva.</span>
          </div>
        )}

        {mostrarForm && (
          <FormularioRegistroDevolutiva
            demanda={demanda}
            registroOrigem={registroOrigem}
            onSalvo={handleVincularNovoRegistro}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}