import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format, differenceInDays } from 'date-fns';
import {
  AlertTriangle, CheckCircle2, Clock, ArrowRight, MessageSquareReply, Flame
} from 'lucide-react';
import { statusDevolutiva, devolutivaStatusConfig } from '@/lib/devolutiva';

const statusConfig = {
  pendente: { label: 'Pendente', color: 'bg-slate-100 text-slate-700' },
  em_andamento: { label: 'Em tratamento', color: 'bg-blue-100 text-blue-700' },
  atendida: { label: 'Concluída', color: 'bg-emerald-100 text-emerald-700' },
  nao_atendida: { label: 'Não atendida', color: 'bg-red-100 text-red-700' }
};
const urgenciaConfig = {
  baixa: 'bg-blue-100 text-blue-800', media: 'bg-yellow-100 text-yellow-800',
  alta: 'bg-orange-100 text-orange-800', critica: 'bg-red-100 text-red-800'
};

export default function PainelDemandasDashboard({ registros = [], busca = '' }) {
  const todas = useMemo(() => {
    const arr = [];
    (registros || []).forEach(r => {
      (r.demandas || []).forEach((d, i) => {
        arr.push({
          ...d,
          registroId: r.id, registroTitulo: r.titulo,
          comunidade: r.comunidade, data: r.data_registro || r.created_date
        });
      });
    });
    return arr;
  }, [registros]);

  const filtradas = useMemo(() => {
    const q = (busca || '').trim().toLowerCase();
    if (!q) return todas;
    return todos_filter(todas, q);
  }, [todas, busca]);

  // Priorização (§3): abertas > em tratamento > urgentes/críticas > devolutiva pendente > vencidas > concluídas recentes
  const ordenadas = useMemo(() => {
    const hoje = new Date();
    const score = (d) => {
      const st = d.status || 'pendente';
      const dev = statusDevolutiva(d);
      let s = 0;
      if (st === 'pendente') s += 100;
      if (st === 'em_andamento') s += 90;
      if (['alta', 'critica'].includes(d.urgencia)) s += 50;
      if (dev === 'pendente') s += 40;
      // vencida (prazo_devolutiva no passado e não realizada)
      if (d.prazo_devolutiva && dev !== 'realizada') {
        const pr = new Date(d.prazo_devolutiva);
        if (!isNaN(pr.getTime()) && pr < hoje) s += 30;
      }
      if (st === 'atendida') s -= 50; // concluídas vão para o fim
      return s;
    };
    return [...filtradas].sort((a, b) => score(b) - score(a));
  }, [filtradas]);

  const abertas = ordenadas.filter(d => ['pendente', 'em_andamento'].includes(d.status || 'pendente'));
  const concluidasRecentes = ordenadas.filter(d => d.status === 'atendida').slice(0, 5);
  const topo = abertas.slice(0, 8);

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <MessageSquareReply className="w-5 h-5 text-primary" /> Demandas
          </h2>
          <Link to={createPageUrl('GestorDemandas')}>
            <Button variant="outline" size="sm">Gestão de demandas <ArrowRight className="w-4 h-4" /></Button>
          </Link>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <Badge className="bg-slate-100 text-slate-700">Abertas: {abertas.filter(d => d.status === 'pendente').length}</Badge>
          <Badge className="bg-blue-100 text-blue-700">Em tratamento: {abertas.filter(d => d.status === 'em_andamento').length}</Badge>
          <Badge className="bg-orange-100 text-orange-800 flex items-center gap-1"><Flame className="w-3 h-3" /> Urgentes: {ordenadas.filter(d => ['alta','critica'].includes(d.urgencia) && (d.status||'pendente')!=='atendida').length}</Badge>
          <Badge className="bg-amber-100 text-amber-800">Devolutiva pendente: {ordenadas.filter(d => statusDevolutiva(d) === 'pendente').length}</Badge>
          <Badge className="bg-red-100 text-red-700">Vencidas: {
            ordenadas.filter(d => {
              if (!d.prazo_devolutiva || statusDevolutiva(d) === 'realizada') return false;
              const pr = new Date(d.prazo_devolutiva); return !isNaN(pr.getTime()) && pr < new Date();
            }).length
          }</Badge>
          <Badge className="bg-emerald-100 text-emerald-700">Concluídas recentes: {concluidasRecentes.length}</Badge>
        </div>

        <div className="space-y-2">
          {topo.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma demanda aberta.</p>
          ) : topo.map((d, idx) => {
            const devConfig = devolutivaStatusConfig(d);
            const vencida = d.prazo_devolutiva && statusDevolutiva(d) !== 'realizada' && new Date(d.prazo_devolutiva) < new Date();
            return (
              <Link key={`${d.registroId}-${idx}`} to={createPageUrl('GestorDemandas')} className="block">
                <div className="p-3 rounded-lg border bg-card hover:bg-accent/40 transition-colors">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <p className="text-sm font-medium text-foreground line-clamp-2 flex-1">“{d.descricao}”</p>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge className={statusConfig[d.status || 'pendente']?.color}>{statusConfig[d.status || 'pendente']?.label}</Badge>
                      {d.urgencia && <Badge className={urgenciaConfig[d.urgencia] || 'bg-slate-100'}>{d.urgencia}</Badge>}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5 text-xs text-muted-foreground">
                    {d.comunidade && <span>{d.comunidade}</span>}
                    {d.data && <span>{format(new Date(d.data), 'dd/MM/yyyy')}</span>}
                    {d.responsavel && <span>{d.responsavel}</span>}
                    <span className={`inline-flex items-center gap-1 ${devConfig.badge} border rounded-full px-1.5`}>
                      {devConfig.emoji} Devolutiva: {devConfig.label}
                    </span>
                    {vencida && <span className="text-red-600 flex items-center gap-0.5"><AlertTriangle className="w-3 h-3" /> Vencida</span>}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function todos_filter(arr, q) {
  return arr.filter(d => {
    const blob = [d.descricao, d.comunidade, d.responsavel, d.registroTitulo, d.urgencia, d.status].join(' ').toLowerCase();
    return blob.includes(q);
  });
}