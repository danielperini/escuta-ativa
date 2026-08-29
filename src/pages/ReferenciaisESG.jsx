import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldCheck, Search, Sparkles, Loader2, AlertTriangle, FileText, MapPin, Users, Layers } from 'lucide-react';
import { REFERENCIAIS_ESG, GRI_DETALHAMENTO } from '@/lib/referenciais';
import { toast } from 'sonner';

export default function ReferenciaisESG() {
  const [filtroRef, setFiltroRef] = useState('todos');
  const [pergunta, setPergunta] = useState('');
  const [respostaIA, setRespostaIA] = useState(null);
  const [consultando, setConsultando] = useState(false);

  const { data: config, isLoading: loadingConfig } = useQuery({
    queryKey: ['configuracao-esg'],
    queryFn: async () => {
      const list = await base44.entities.ConfiguracaoESG.list('-created_date', 1);
      return list[0] || null;
    },
  });

  const { data: evidencias = [], isLoading: loadingEvid } = useQuery({
    queryKey: ['referenciais-esg-dashboard'],
    queryFn: async () => base44.entities.ReferencialEvidencia.list('-created_date', 500),
  });

  const { data: registros = [] } = useQuery({
    queryKey: ['registros-simples-ref'],
    queryFn: async () => base44.entities.Registro.list('-created_date', 50),
  });

  const referenciaisAdotados = useMemo(() => {
    const ids = config?.compromissos_publicos || [];
    return REFERENCIAIS_ESG.filter((r) => ids.includes(r.id));
  }, [config]);

  const stats = useMemo(() => {
    const filtradas = filtroRef === 'todos' ? evidencias : evidencias.filter((e) => e.referencial === filtroRef);
    const comunidades = new Set(evidencias.map((e) => e.comunidade).filter(Boolean));
    const territorios = new Set(evidencias.map((e) => e.territorio).filter(Boolean));
    const compromissos = evidencias.filter((e) => e.entidade_tipo === 'compromisso').length;
    const demandas = evidencias.filter((e) => e.entidade_tipo === 'demanda').length;
    const idsComEvidencia = new Set(evidencias.map((e) => e.entidade_id).filter(Boolean));
    const registrosSemClassificacao = registros.filter((r) => !idsComEvidencia.has(r.id)).length;
    const porReferencial = {};
    REFERENCIAIS_ESG.forEach((r) => {
      porReferencial[r.id] = evidencias.filter((e) => e.referencial === r.id).length;
    });
    return {
      filtradas,
      total: evidencias.length,
      comunidades: comunidades.size,
      territorios: territorios.size,
      compromissos,
      demandas,
      registrosSemClassificacao,
      porReferencial,
    };
  }, [evidencias, registros, filtroRef]);

  const handleConsultar = async () => {
    if (!pergunta.trim()) {
      toast.error('Digite uma pergunta');
      return;
    }
    setConsultando(true);
    setRespostaIA(null);
    try {
      const res = await base44.functions.invoke('consultarReferenciaisESG', { pergunta });
      const data = res?.data ?? res;
      if (data?.error) {
        toast.error(data.error);
      } else {
        setRespostaIA(data);
      }
    } catch (e) {
      toast.error('Falha ao consultar o assistente');
    } finally {
      setConsultando(false);
    }
  };

  const rotaPorTipo = (ev) => {
    if (ev.entidade_tipo === 'registro') return createPageUrl(`VerRegistro?id=${ev.entidade_id}`);
    if (ev.entidade_tipo === 'caso') return createPageUrl(`VerCaso?id=${ev.entidade_id}`);
    if (ev.entidade_tipo === 'stakeholder') return createPageUrl('Stakeholders');
    if (ev.entidade_tipo === 'comunidade') return createPageUrl('ComunidadesGrupos');
    if (ev.entidade_tipo === 'compromisso') return createPageUrl('Compromissos');
    if (ev.entidade_tipo === 'demanda') return createPageUrl('GestorDemandas');
    if (ev.entidade_tipo === 'reuniao') return createPageUrl('Agenda');
    return null;
  };

  const isLoading = loadingConfig || loadingEvid;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-emerald-600" />
          Referenciais e Compromissos ESG
        </h1>
        <p className="text-slate-500 mt-2 max-w-3xl">
          Referenciais relacionados ao relacionamento comunitário, engajamento de stakeholders,
          direitos humanos, impacto social e gestão territorial adotados ou utilizados pela organização.
        </p>
      </div>

      {/* Stats principais */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <StatCard icon={<Layers className="w-5 h-5" />} label="Referenciais adotados" value={referenciaisAdotados.length} color="emerald" />
        <StatCard icon={<FileText className="w-5 h-5" />} label="Evidências vinculadas" value={stats.total} color="emerald" />
        <StatCard icon={<Users className="w-5 h-5" />} label="Comunidades" value={stats.comunidades} color="emerald" />
        <StatCard icon={<MapPin className="w-5 h-5" />} label="Territórios" value={stats.territorios} color="emerald" />
        <StatCard icon={<ShieldCheck className="w-5 h-5" />} label="Compromissos" value={stats.compromissos} color="emerald" />
        <StatCard icon={<AlertTriangle className="w-5 h-5" />} label="Registros sem classificação" value={stats.registrosSemClassificacao} color="amber" />
      </div>

      {/* Referenciais adotados com contagens */}
      {referenciaisAdotados.length === 0 ? (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-900">Nenhum referencial adotado</p>
              <p className="text-xs text-amber-700 mt-1">
                Configure os referenciais adotados pela organização em{' '}
                <Link to={createPageUrl('ConfiguracoesESG')} className="underline font-medium">Configurações ESG</Link>.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {referenciaisAdotados.map((r) => {
            const count = stats.porReferencial[r.id] || 0;
            const ativo = filtroRef === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setFiltroRef(ativo ? 'todos' : r.id)}
                className={`text-left rounded-xl border p-4 transition-colors ${ativo ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white hover:border-emerald-300'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">{r.nome}</span>
                  <Badge className={count > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}>
                    {count} evidência(s)
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-2">{r.descricao}</p>
                {r.id === 'GRI' && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {GRI_DETALHAMENTO.map((g) => (
                      <span key={g.codigo} className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 border border-emerald-200">
                        {g.codigo}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Assistente de IA */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#40916C]" />
            Assistente de Referenciais ESG
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-500">
            Pergunte sobre suas evidências (ex: "Quais registros servem de evidência para o GRI 413?",
            "Quais ODS aparecem com mais frequência?", "Quais compromissos estão relacionados a direitos humanos?").
          </p>
          <div className="flex gap-2">
            <Input
              value={pergunta}
              onChange={(e) => setPergunta(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleConsultar()}
              placeholder="Digite sua pergunta sobre os referenciais e evidências..."
            />
            <Button onClick={handleConsultar} disabled={consultando} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
              {consultando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Consultar
            </Button>
          </div>
          {respostaIA && (
            <div className="rounded-lg border bg-slate-50 p-4 space-y-2">
              <div className="text-xs text-slate-500 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> SUGESTÃO DA IA — não constitui declaração de conformidade
              </div>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{respostaIA.resposta}</p>
              <p className="text-xs text-slate-400">{respostaIA.disclaimer}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de evidências */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            Evidências {filtroRef !== 'todos' && <Badge className="bg-emerald-100 text-emerald-700 ml-1">{filtroRef}</Badge>}
          </CardTitle>
          {filtroRef !== 'todos' && (
            <Button variant="ghost" size="sm" onClick={() => setFiltroRef('todos')}>Limpar filtro</Button>
          )}
        </CardHeader>
        <CardContent>
          {stats.filtradas.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Nenhuma evidência vinculada ainda. Abra um registro para vincular referenciais.</p>
          ) : (
            <div className="space-y-2 max-h-[480px] overflow-y-auto">
              {stats.filtradas.map((ev) => {
                const rota = rotaPorTipo(ev);
                const conteudo = (
                  <div className="flex items-start justify-between gap-3 p-3 bg-slate-50 rounded-lg border hover:bg-slate-100 transition-colors">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className="bg-emerald-100 text-emerald-700">{ev.referencial}</Badge>
                        {ev.sub_referencial && <Badge variant="outline" className="border-emerald-300 text-emerald-700">{ev.sub_referencial}</Badge>}
                        <Badge variant="outline" className="text-slate-500">{ev.entidade_tipo}</Badge>
                        {ev.status === 'sugerido' ? (
                          <Badge variant="outline" className="border-amber-300 text-amber-700"><Sparkles className="w-3 h-3 mr-1" />Sugestão IA</Badge>
                        ) : (
                          <Badge variant="outline" className="border-emerald-300 text-emerald-700"><ShieldCheck className="w-3 h-3 mr-1" />Validado</Badge>
                        )}
                      </div>
                      {ev.entidade_nome && <p className="text-sm font-medium text-slate-800 mt-1 truncate">{ev.entidade_nome}</p>}
                      {(ev.comunidade || ev.territorio) && (
                        <p className="text-xs text-slate-500 mt-1">
                          {ev.comunidade && <span className="mr-2">📍 {ev.comunidade}</span>}
                          {ev.territorio && <span>🗺️ {ev.territorio}</span>}
                        </p>
                      )}
                      {ev.observacoes && <p className="text-xs text-slate-600 mt-1">{ev.observacoes}</p>}
                    </div>
                  </div>
                );
                return rota ? (
                  <Link key={ev.id} to={rota}>{conteudo}</Link>
                ) : (
                  <div key={ev.id}>{conteudo}</div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  const colorMap = {
    emerald: 'text-emerald-600 bg-emerald-50',
    amber: 'text-amber-600 bg-amber-50',
  };
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${colorMap[color] || colorMap.emerald}`}>
        {icon}
      </div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}