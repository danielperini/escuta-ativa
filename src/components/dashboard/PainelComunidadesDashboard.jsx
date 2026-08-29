import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { MapPin, ArrowRight, MessageSquare, ListChecks, FileText, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { statusDevolutiva, devolutivaStatusConfig } from '@/lib/devolutiva';

export default function PainelComunidadesDashboard({ registros = [], busca = '' }) {
  const [comunidadeSel, setComunidadeSel] = useState('todas');

  const { data: comunidades = [] } = useQuery({
    queryKey: ['comunidades-dashboard'],
    queryFn: () => base44.entities.Comunidade.list('-created_date', 200),
    staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false
  });

  // Mapa nome → entidade
  const comMap = useMemo(() => {
    const m = {};
    comunidades.forEach(c => { if (c.nome) m[c.nome] = c; });
    return m;
  }, [comunidades]);

  // Nomes de comunidades com registros
  const nomesComRegistros = useMemo(() => {
    const set = new Set();
    (registros || []).forEach(r => { if (r.comunidade) set.add(r.comunidade); });
    // inclui também cadastradas sem registros
    comunidades.forEach(c => { if (c.nome) set.add(c.nome); });
    return [...set].sort();
  }, [registros, comunidades]);

  const q = (busca || '').trim().toLowerCase();

  const filtrarComunidade = (nome) => {
    if (comunidadeSel !== 'todas' && nome !== comunidadeSel) return false;
    return true;
  };

  const buscarMatches = (nome) => {
    if (!q) return true;
    // se busca textual, mostra só comunidades cujo conteúdo matches
    const regs = (registros || []).filter(r => r.comunidade === nome);
    const blob = [nome, ...regs.flatMap(r => [r.titulo, r.descricao, r.resumo_automatico, ...(r.temas_identificados || []), ...(r.participantes || [])]), ...regs.flatMap(r => (r.demandas || []).map(d => d.descricao))].join(' ').toLowerCase();
    return blob.includes(q);
  };

  const comunidadesExibir = nomesComRegistros.filter(n => filtrarComunidade(n) && buscarMatches(n));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-foreground"># Comunidades</h2>
        <div className="w-full sm:w-72">
          <Select value={comunidadeSel} onValueChange={setComunidadeSel}>
            <SelectTrigger><SelectValue placeholder="Comunidade" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as comunidades</SelectItem>
              {nomesComRegistros.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {comunidadeSel === 'todas' && (
        <p className="text-sm text-muted-foreground">
          Mostrando {comunidadesExibir.length} comunidade(s) em blocos separados, sem misturar dados.
        </p>
      )}

      <div className="space-y-6">
        {comunidadesExibir.length === 0 ? (
          <Card><CardContent className="p-6 text-center text-muted-foreground">Nenhuma comunidade encontrada para o filtro atual.</CardContent></Card>
        ) : comunidadesExibir.map(nome => (
          <BlocoComunidade key={nome} nome={nome} com={comMap[nome]} registros={(registros || []).filter(r => r.comunidade === nome)} />
        ))}
      </div>
    </div>
  );
}

function BlocoComunidade({ nome, com, registros }) {
  const municipio = com?.municipio || '';
  const uf = com?.estado || '';
  const regs = [...registros].sort((a, b) => new Date(b.data_registro || b.created_date) - new Date(a.data_registro || a.created_date));
  const falas = regs.slice(0, 4);
  const demandas = regs.flatMap(r => (r.demandas || []).map(d => ({ ...d, registroId: r.id, registroTitulo: r.titulo, data: r.data_registro || r.created_date }))).slice(0, 6);
  const recentes = regs.slice(0, 5);
  const synth = regs.find(r => r.resumo_automatico);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Cabeçalho do bloco — título principal = nome da comunidade (§8) */}
        <div className="p-5 bg-primary/5 border-b">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" /> {nome}
              </h3>
              <p className="text-sm text-muted-foreground">{municipio}{uf ? `/${uf}` : ''}</p>
            </div>
            {com?.tipo && <Badge variant="secondary" className="capitalize">{com.tipo}</Badge>}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-border">
          {/* Falas e percepções (§9) */}
          <div className="p-5 space-y-3">
            <h4 className="font-semibold text-foreground flex items-center gap-2"><MessageSquare className="w-4 h-4 text-primary" /> Principais falas</h4>
            {falas.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma fala registrada.</p>
            ) : falas.map(r => (
              <Link key={r.id} to={createPageUrl('VerRegistro') + `?id=${r.id}`} className="block group">
                <div className="p-2.5 rounded-md border bg-card hover:bg-accent/40 transition-colors">
                  <p className="text-sm text-foreground line-clamp-2">“{r.descricao || r.titulo}”</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-muted-foreground">{format(new Date(r.data_registro || r.created_date), 'dd/MM/yyyy')}</span>
                    <span className="text-xs text-primary group-hover:underline">Ver registro →</span>
                  </div>
                </div>
              </Link>
            ))}
            {synth && (
              <div className="p-2.5 rounded-md bg-purple-50 border border-purple-200">
                <p className="text-xs font-medium text-purple-800 flex items-center gap-1"><Sparkles className="w-3.5 h-3.5" /> Síntese da IA baseada em {regs.length} registro(s)</p>
                <p className="text-xs text-purple-700 mt-1 line-clamp-3">{synth.resumo_automatico}</p>
                <Link to={createPageUrl('VerRegistro') + `?id=${synth.id}`} className="text-xs text-primary hover:underline">Acessar registro-base →</Link>
              </div>
            )}
          </div>

          {/* Demandas (§6) */}
          <div className="p-5 space-y-3">
            <h4 className="font-semibold text-foreground flex items-center gap-2"><ListChecks className="w-4 h-4 text-amber-600" /> Demandas</h4>
            {demandas.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma demanda.</p>
            ) : demandas.map((d, i) => {
              const dev = devolutivaStatusConfig(d);
              return (
                <div key={i} className="p-2.5 rounded-md border bg-card">
                  <p className="text-sm text-foreground line-clamp-2">“{d.descricao}”</p>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    <Badge variant="outline" className="capitalize text-xs">{d.status || 'pendente'}</Badge>
                    {d.urgencia && <Badge variant="outline" className="text-xs">{d.urgencia}</Badge>}
                    {d.data && <span className="text-xs text-muted-foreground">{format(new Date(d.data), 'dd/MM/yyyy')}</span>}
                    <span className={`text-xs inline-flex items-center gap-0.5 ${dev.badge} border rounded-full px-1.5`}>{dev.emoji} {dev.label}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Registros recentes (§6) */}
          <div className="p-5 space-y-3">
            <h4 className="font-semibold text-foreground flex items-center gap-2"><FileText className="w-4 h-4 text-indigo-600" /> Atividades recentes</h4>
            {recentes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma atividade recente.</p>
            ) : recentes.map(r => (
              <Link key={r.id} to={createPageUrl('VerRegistro') + `?id=${r.id}`} className="block group">
                <div className="p-2.5 rounded-md border bg-card hover:bg-accent/40 transition-colors">
                  <p className="text-sm text-foreground line-clamp-1">{r.titulo}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-muted-foreground capitalize">{r.tipo || 'registro'}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{format(new Date(r.data_registro || r.created_date), 'dd/MM/yyyy')}</span>
                      <span className="text-xs text-primary group-hover:underline">Ver →</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}