import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Calendar, MapPin, Users, Clock, ArrowRight, History, CheckCircle2, Search, Star
} from 'lucide-react';
import { format, startOfDay, isAfter, isBefore, subDays, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const TIPO_LABEL = {
  reuniao: 'Reunião', visita: 'Visita', devolutiva: 'Devolutiva', encontro: 'Encontro',
  outro: 'Outro', conversa_campo: 'Conversa de Campo', demanda: 'Demanda', ocorrencia: 'Ocorrência'
};
const STATUS_AGENDA_LABEL = {
  confirmada: 'Confirmada', prevista: 'Prevista', solicitada: 'Solicitada',
  acordada: 'Acordada', realizada: 'Realizada', nao_realizada: 'Não realizada', em_atraso: 'Em atraso'
};

function uid(a) { return a.id || `${a.origem}-${a.titulo}-${a.data}`; }
function unique(arr) { return Array.from(new Set(arr.filter(Boolean))); }

function normalizarAtividades(agendas, registros) {
  const items = [];
  (agendas || []).forEach(a => {
    items.push({
      id: a.id, titulo: a.titulo, data: a.data, tipo: a.tipo,
      comunidade: a.comunidade || '', municipio: '',
      responsavel: (a.responsaveis || []).join(', ') || '',
      responsaveis: a.responsaveis || [],
      local: a.local || '', participantes: a.participantes || [],
      status: a.status, origem: 'agenda', registroId: a.registro_origem_id, descricao: a.descricao
    });
  });
  (registros || []).forEach(r => {
    items.push({
      id: r.id, titulo: r.titulo, data: r.data_registro || r.created_date, tipo: r.tipo,
      comunidade: r.comunidade || '', municipio: (r.localizacao && r.localizacao.municipio) || '',
      responsavel: r.usuario_criador || r.equipe_nome || '',
      responsaveis: [], local: r.local || '', participantes: r.participantes || [],
      status: r.status, origem: 'registro', registroId: r.id, descricao: r.descricao
    });
  });
  return items.filter(a => {
    if (!a.data) return false;
    const dt = new Date(a.data);
    return !isNaN(dt.getTime());
  });
}

function withinPeriod(dataStr, filtro) {
  if (filtro === 'todos' || !filtro) return true;
  const d = startOfDay(new Date(dataStr));
  const hoje = startOfDay(new Date());
  switch (filtro) {
    case 'hoje': return d.getTime() === hoje.getTime();
    case 'proximos_7': return !isBefore(d, hoje) && !isAfter(d, addDays(hoje, 7));
    case 'proximos_30': return !isBefore(d, hoje) && !isAfter(d, addDays(hoje, 30));
    case 'ultimos_7': return !isAfter(d, hoje) && !isBefore(d, subDays(hoje, 7));
    case 'ultimos_30': return !isAfter(d, hoje) && !isBefore(d, subDays(hoje, 30));
    case 'futuro': return !isBefore(d, hoje);
    case 'passado': return !isAfter(d, hoje);
    default: return true;
  }
}

export default function PainelAgendaDashboard({ agendas = [], registros = [], busca = '' }) {
  const [filtroPeriodo, setFiltroPeriodo] = useState('todos');
  const [filtroComunidade, setFiltroComunidade] = useState('todos');
  const [filtroMunicipio, setFiltroMunicipio] = useState('todos');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroResponsavel, setFiltroResponsavel] = useState('todos');
  const [buscaLocal, setBuscaLocal] = useState('');

  const atividades = useMemo(() => normalizarAtividades(agendas, registros), [agendas, registros]);

  const comunidades = useMemo(() => unique(atividades.map(a => a.comunidade)).sort(), [atividades]);
  const municipios = useMemo(() => unique(atividades.map(a => a.municipio)).sort(), [atividades]);
  const tipos = useMemo(() => unique(atividades.map(a => a.tipo)).sort(), [atividades]);
  const responsaveis = useMemo(() => unique(atividades.flatMap(a =>
    a.responsaveis.length ? a.responsaveis : (a.responsavel ? [a.responsavel] : []))).sort(), [atividades]);

  const q = ((busca ? busca + ' ' : '') + buscaLocal).trim().toLowerCase();

  const filtradas = useMemo(() => {
    const out = atividades.filter(a => {
      if (!withinPeriod(a.data, filtroPeriodo)) return false;
      if (filtroComunidade !== 'todos' && a.comunidade !== filtroComunidade) return false;
      if (filtroMunicipio !== 'todos' && a.municipio !== filtroMunicipio) return false;
      if (filtroTipo !== 'todos' && a.tipo !== filtroTipo) return false;
      if (filtroResponsavel !== 'todos') {
        const todos = a.responsaveis.length ? a.responsaveis : (a.responsavel ? [a.responsavel] : []);
        if (!todos.includes(filtroResponsavel)) return false;
      }
      if (q) {
        const blob = [a.titulo, a.comunidade, a.municipio, a.local, a.tipo, a.responsavel, a.descricao, ...(a.participantes || [])].join(' ').toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });
    return out.sort((a, b) => new Date(a.data) - new Date(b.data));
  }, [atividades, filtroPeriodo, filtroComunidade, filtroMunicipio, filtroTipo, filtroResponsavel, q]);

  const hoje = startOfDay(new Date());
  const futuras = filtradas.filter(a => !isBefore(new Date(a.data), hoje));
  const realizadas = filtradas.filter(a => isBefore(new Date(a.data), hoje)).reverse();

  const proxima = futuras[0];
  const proximasLista = futuras.slice(1, 8);
  const realizadasLista = realizadas.slice(0, 8);

  const limpar = () => {
    setFiltroPeriodo('todos'); setFiltroComunidade('todos'); setFiltroMunicipio('todos');
    setFiltroTipo('todos'); setFiltroResponsavel('todos'); setBuscaLocal('');
  };

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500" /> Próxima Agenda
          </h2>
          <Link to={createPageUrl('Agenda')}>
            <Button variant="outline" size="sm">Ver agenda <ArrowRight className="w-4 h-4" /></Button>
          </Link>
        </div>
        {proxima ? (
          <Card className="border-2 border-primary/40 bg-primary/5">
            <CardContent className="p-5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-2 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className="bg-primary text-primary-foreground">
                      {format(new Date(proxima.data), 'dd/MM/yyyy', { locale: ptBR })}
                    </Badge>
                    <Badge variant="outline">{STATUS_AGENDA_LABEL[proxima.status] || proxima.status}</Badge>
                    {proxima.tipo && <Badge variant="secondary">{TIPO_LABEL[proxima.tipo] || proxima.tipo}</Badge>}
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold text-foreground">{proxima.titulo}</h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    {proxima.comunidade && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {proxima.comunidade}</span>}
                    {proxima.local && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {proxima.local}</span>}
                    {proxima.responsavel && <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {proxima.responsavel}</span>}
                    {proxima.participantes && proxima.participantes.length > 0 && (
                      <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {proxima.participantes.slice(0, 3).join(', ')}{proxima.participantes.length > 3 ? ` +${proxima.participantes.length - 3}` : ''}</span>
                    )}
                  </div>
                  {proxima.descricao && <p className="text-sm text-muted-foreground line-clamp-2">{proxima.descricao}</p>}
                </div>
                <Link to={createPageUrl(proxima.origem === 'agenda' ? 'Agenda' : 'VerRegistro') + (proxima.origem === 'agenda' ? `?id=${proxima.id}` : `?id=${proxima.registroId || proxima.id}`)}>
                  <Button className="shrink-0">Abrir <ArrowRight className="w-4 h-4" /></Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card><CardContent className="p-6 text-center text-muted-foreground">Nenhuma agenda futura encontrada para os filtros atuais.</CardContent></Card>
        )}
      </div>

      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" /> Agenda e Atividades
            </h3>
            <p className="text-xs text-muted-foreground">REALIZADAS ← HISTÓRICO | HOJE | PRÓXIMA AGENDA → AGENDAS FUTURAS</p>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Buscar atividades antigas por título, comunidade, responsável..." value={buscaLocal} onChange={e => setBuscaLocal(e.target.value)} className="pl-10" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            <Select value={filtroPeriodo} onValueChange={setFiltroPeriodo}>
              <SelectTrigger><SelectValue placeholder="Período" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todo período</SelectItem>
                <SelectItem value="hoje">Hoje</SelectItem>
                <SelectItem value="proximos_7">Próximos 7 dias</SelectItem>
                <SelectItem value="proximos_30">Próximos 30 dias</SelectItem>
                <SelectItem value="ultimos_7">Últimos 7 dias</SelectItem>
                <SelectItem value="ultimos_30">Últimos 30 dias</SelectItem>
                <SelectItem value="futuro">Tudo futuro</SelectItem>
                <SelectItem value="passado">Todo histórico</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filtroComunidade} onValueChange={setFiltroComunidade}>
              <SelectTrigger><SelectValue placeholder="Comunidade" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas</SelectItem>
                {comunidades.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filtroMunicipio} onValueChange={setFiltroMunicipio}>
              <SelectTrigger><SelectValue placeholder="Município" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {municipios.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {tipos.map(t => <SelectItem key={t} value={t}>{TIPO_LABEL[t] || t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filtroResponsavel} onValueChange={setFiltroResponsavel}>
              <SelectTrigger><SelectValue placeholder="Responsável" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {responsaveis.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={limpar}>Limpar</Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                <Calendar className="w-4 h-4" /> Próximas atividades ({futuras.length})
              </h4>
              <div className="space-y-2">
                {proximasLista.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">Nenhuma atividade futura.</p>
                ) : proximasLista.map(a => <AtividadeRow key={uid(a)} a={a} />)}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                <History className="w-4 h-4" /> Atividades realizadas ({realizadas.length})
              </h4>
              <div className="space-y-2">
                {realizadasLista.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">Nenhuma atividade realizada no período.</p>
                ) : realizadasLista.map(a => <AtividadeRow key={uid(a)} a={a} realizada />)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AtividadeRow({ a, realizada }) {
  const dest = a.origem === 'agenda'
    ? createPageUrl('Agenda') + `?id=${a.id}`
    : createPageUrl('VerRegistro') + `?id=${a.registroId || a.id}`;
  return (
    <Link to={dest} className="block">
      <div className="p-3 rounded-lg border bg-card hover:bg-accent/40 transition-colors">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-foreground line-clamp-1 flex-1">{a.titulo}</p>
          {realizada ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> : <Clock className="w-4 h-4 text-amber-500 shrink-0" />}
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-muted-foreground">
          <span>{format(new Date(a.data), 'dd/MM/yyyy')}</span>
          {a.comunidade && <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" /> {a.comunidade}</span>}
          {a.tipo && <span>{TIPO_LABEL[a.tipo] || a.tipo}</span>}
          {a.responsavel && <span className="flex items-center gap-0.5"><Users className="w-3 h-3" /> {a.responsavel}</span>}
          {realizada && (a.registroId || a.origem === 'registro') && (
            <span className="text-primary hover:underline">Ver registro →</span>
          )}
        </div>
      </div>
    </Link>
  );
}