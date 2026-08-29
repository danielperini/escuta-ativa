import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users, HeartPulse, ListChecks, MapPin, TrendingUp, BarChart3,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, CartesianGrid,
} from 'recharts';

const COLORS_STATUS = {
  pendente: '#f59e0b',
  em_andamento: '#3b82f6',
  atendida: '#10b981',
  nao_atendida: '#ef4444',
};
const COLORS_URGENCIA = {
  baixa: '#84cc16',
  media: '#3b82f6',
  alta: '#f59e0b',
  critica: '#ef4444',
};
const LABEL_STATUS = {
  pendente: 'Pendente',
  em_andamento: 'Em andam.',
  atendida: 'Atendida',
  nao_atendida: 'Não atendida',
};
const LABEL_URGENCIA = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  critica: 'Crítica',
};

const CATEGORIAS_SAUDE = ['saude', 'saneamento', 'agua_recursos_hidricos'];

function formatValor(d) {
  if (d.value_number != null) {
    return `${d.value_number.toLocaleString('pt-BR')}${d.unit ? ' ' + d.unit : ''}`;
  }
  return d.value_text || '—';
}

function truncar(s, n) {
  if (!s) return '';
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

function ChartVazio({ mensagem }) {
  return (
    <div className="flex items-center justify-center h-32 text-xs text-slate-400 text-center px-3">
      {mensagem}
    </div>
  );
}

export default function PainelConsolidadoComunidade({ comunidadeNome }) {
  const { data: comunidade, isLoading: isLoadingCom } = useQuery({
    queryKey: ['comunidade-entity', comunidadeNome],
    queryFn: async () => {
      const all = await base44.entities.Comunidade.list();
      return all.find((c) => c.nome === comunidadeNome) || null;
    },
    enabled: !!comunidadeNome,
  });

  const { data: registros = [], isLoading: isLoadingReg } = useQuery({
    queryKey: ['painel-registros', comunidadeNome],
    queryFn: async () => {
      const all = await base44.entities.Registro.list('-created_date', 500);
      return all.filter((r) => r.comunidade === comunidadeNome);
    },
    enabled: !!comunidadeNome,
  });

  const municipio = comunidade?.municipio;

  const { data: dadosSecundarios = [], isLoading: isLoadingDados } = useQuery({
    queryKey: ['painel-dados-secundarios', municipio],
    queryFn: async () => {
      if (!municipio) return [];
      const all = await base44.entities.DadoSecundario.list('-updated_date', 300);
      return all.filter((d) => d.municipality === municipio);
    },
    enabled: !!municipio,
  });

  const isLoading = isLoadingCom || isLoadingReg || isLoadingDados;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  if (!comunidade) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-slate-500">
            Comunidade "{comunidadeNome}" não encontrada. Cadastre-a na aba "Comunidades e Grupos".
          </p>
        </CardContent>
      </Card>
    );
  }

  // Agregações
  const demandas = registros.flatMap((r) => r.demandas || []);

  const demandasByStatus = Object.keys(LABEL_STATUS)
    .map((k) => ({
      status: k,
      nome: LABEL_STATUS[k],
      total: demandas.filter((d) => (d.status || 'pendente') === k).length,
    }))
    .filter((d) => d.total > 0);

  const demandasByUrgencia = Object.keys(LABEL_URGENCIA)
    .map((k) => ({
      urgencia: k,
      nome: LABEL_URGENCIA[k],
      total: demandas.filter((d) => d.urgencia === k).length,
    }))
    .filter((d) => d.total > 0);

  const dadosDemografia = dadosSecundarios.filter((d) => d.category === 'demografia').slice(0, 6);
  const dadosSaude = dadosSecundarios
    .filter((d) => CATEGORIAS_SAUDE.includes(d.category))
    .slice(0, 6);

  const temperaturas = registros.map((r) => r.temperatura_territorio).filter(Boolean);
  const temperaturaCritica = temperaturas.length > 0
    ? Math.round((temperaturas.filter((t) => t === 'alto' || t === 'critico').length / temperaturas.length) * 100)
    : 0;

  const demandasCriticas = demandas
    .filter((d) => d.urgencia === 'alta' || d.urgencia === 'critica')
    .slice(0, 5);

  const referPeriodo = (dadosDemografia[0] || dadosSaude[0])?.reference_period;

  return (
    <div className="space-y-4">
      {/* Resumo superior */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-start gap-x-8 gap-y-3">
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Comunidade</p>
              <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
                <MapPin className="w-5 h-5 text-primary" /> {comunidade.nome}
              </h3>
              <p className="text-xs text-muted-foreground">
                {comunidade.municipio || '—'}{comunidade.estado ? ' - ' + comunidade.estado : ''}
              </p>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <div>
                <p className="text-[10px] text-slate-500 uppercase">Tipo</p>
                <Badge className="capitalize">{comunidade.tipo || '—'}</Badge>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase">População</p>
                <p className="font-bold flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {(comunidade.populacao_estimada || 0).toLocaleString('pt-BR')}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase">Termômetro</p>
                <Badge variant="outline" className="capitalize">{comunidade.termometro_social || '—'}</Badge>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase">Tensão territorial</p>
                <p className="font-bold text-amber-700">{temperaturaCritica}% alto/crítico</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase">Registros</p>
                <p className="font-bold flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" /> {registros.length}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase">Demandas</p>
                <p className="font-bold flex items-center gap-1">
                  <ListChecks className="w-3.5 h-3.5" /> {demandas.length}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Painel lado a lado */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* DEMOGRAFIA */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <Users className="w-4 h-4 text-blue-600" /> Demografia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dadosDemografia.length === 0 ? (
              <>
                <ChartVazio mensagem={`Sem dados demográficos coletados para ${municipio || 'esta localidade'}.`} />
                <p className="text-[11px] text-muted-foreground">
                  Colete via "Dados Secundários" → Demografia para visualizar pirâmide etária, população e indicadores IBGE.
                </p>
              </>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={dadosDemografia.length * 30 + 40}>
                  <BarChart
                    data={dadosDemografia.map((d) => ({
                      nome: truncar(d.indicator, 22),
                      valor: d.value_number || 0,
                    }))}
                    layout="vertical"
                    margin={{ left: 0, right: 16, top: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="nome" tick={{ fontSize: 10 }} width={150} />
                    <Tooltip />
                    <Bar dataKey="valor" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="space-y-1 pt-2 border-t border-border">
                  {dadosDemografia.map((d, i) => (
                    <div key={i} className="flex justify-between gap-2 text-xs">
                      <span className="text-muted-foreground truncate flex-1" title={d.indicator}>{d.indicator}</span>
                      <span className="font-semibold whitespace-nowrap">{formatValor(d)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
            {referPeriodo && (
              <p className="text-[10px] text-muted-foreground pt-1">Período: {referPeriodo}</p>
            )}
          </CardContent>
        </Card>

        {/* SAÚDE */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <HeartPulse className="w-4 h-4 text-rose-600" /> Saúde e Saneamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dadosSaude.length === 0 ? (
              <>
                <ChartVazio mensagem={`Sem indicadores de saúde/saneamento para ${municipio || 'esta localidade'}.`} />
                <p className="text-[11px] text-muted-foreground">
                  Colete via "Dados Secundários" → Saúde e Saneamento para visualizar indicadores DATASUS/ANA.
                </p>
              </>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={dadosSaude.length * 30 + 40}>
                  <BarChart
                    data={dadosSaude.map((d) => ({
                      nome: truncar(d.indicator, 22),
                      valor: d.value_number || 0,
                    }))}
                    layout="vertical"
                    margin={{ left: 0, right: 16, top: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="nome" tick={{ fontSize: 10 }} width={150} />
                    <Tooltip />
                    <Bar dataKey="valor" fill="#e11d48" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="space-y-1 pt-2 border-t border-border">
                  {dadosSaude.map((d, i) => (
                    <div key={i} className="flex justify-between gap-2 text-xs">
                      <span className="text-muted-foreground truncate flex-1" title={d.indicator}>{d.indicator}</span>
                      <span className="font-semibold whitespace-nowrap">{formatValor(d)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
            {dadosSaude[0]?.source_name && (
              <p className="text-[10px] text-muted-foreground pt-1">Fonte: {dadosSaude[0].source_name}</p>
            )}
          </CardContent>
        </Card>

        {/* DEMANDAS */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <ListChecks className="w-4 h-4 text-amber-600" /> Demandas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center pb-2 border-b border-border">
              <p className="text-[10px] text-slate-500 uppercase">Total de demandas</p>
              <p className="text-3xl font-bold text-amber-700">{demandas.length}</p>
              {demandas.length === 0 && (
                <p className="text-[11px] text-muted-foreground">Nenhuma demanda registrada para esta comunidade.</p>
              )}
            </div>

            {demandasByStatus.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Por status</p>
                <ResponsiveContainer width="100%" height={170}>
                  <BarChart data={demandasByStatus} margin={{ left: -20, right: 10, top: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="nome" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                      {demandasByStatus.map((entry) => (
                        <Cell key={entry.status} fill={COLORS_STATUS[entry.status]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {demandasByUrgencia.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Por urgência</p>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={demandasByUrgencia} dataKey="total" nameKey="nome" outerRadius={55} label>
                      {demandasByUrgencia.map((entry) => (
                        <Cell key={entry.urgencia} fill={COLORS_URGENCIA[entry.urgencia]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {demandasCriticas.length > 0 && (
              <div className="space-y-1 pt-2 border-t border-border">
                <p className="text-xs font-medium text-rose-600 flex items-center gap-1">
                  <BarChart3 className="w-3 h-3" /> Demandas críticas
                </p>
                {demandasCriticas.map((d, i) => (
                  <div key={i} className="text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-rose-700 border-rose-300 mr-1 capitalize">
                      {d.urgencia}
                    </Badge>
                    <span>"{truncar(d.descricao, 55)}"</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}