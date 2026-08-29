import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus, FileText, Calendar, AlertTriangle, Users, Target, TrendingUp, Shield, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { subDays, format } from 'date-fns';
import { Card } from "@/components/ui/card";
import KPICard from "@/components/dashboard/KPICard";
import GraficoTendencias from "@/components/dashboard/GraficoTendencias";
import PersonalizadorWidgets from "@/components/dashboard/PersonalizadorWidgets";
import WidgetProximasAgendas from "@/components/dashboard/WidgetProximasAgendas";
import WidgetRiscosAtivos from "@/components/dashboard/WidgetRiscosAtivos";
import VozComunidade from "@/components/dashboard/VozComunidade";
import WidgetTemperaturaTerritorial from "@/components/dashboard/WidgetTemperaturaTerritorial";
import WidgetRedeStakeholders from "@/components/dashboard/WidgetRedeStakeholders";
import WidgetStakeholdersRiscos from "@/components/dashboard/WidgetStakeholdersRiscos";
import ExportadorDashboard from "@/components/dashboard/ExportadorDashboard";
import MonitorDemandasRecorrentes from "@/components/atores/MonitorDemandasRecorrentes";
import MonitorDevolutivas from "@/components/devolutiva/MonitorDevolutivas";
import PainelOrientacaoTerritorial from "@/components/dashboard/PainelOrientacaoTerritorial";
import GraficosKPIAvancados from "@/components/dashboard/GraficosKPIAvancados";
import WidgetSustentabilidade from "@/components/dashboard/WidgetSustentabilidade";
import VozesTerritorio from "@/components/dashboard/VozesTerritorio";
import PainelDicasRelacionamento from "@/components/dashboard/PainelDicasRelacionamento";

export default function Dashboard() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: user } = useQuery({
        queryKey: ['currentUser-dashboard'],
        queryFn: () => base44.auth.me()
    });

    const widgetsAtivos = user?.configuracoes?.widgets_dashboard || [
        'kpis', 'graficos', 'sustentabilidade', 'demandas_recorrentes', 'devolutivas',
        'voz_comunidade', 'proximas_agendas', 'riscos_ativos', 'dicas_relacionamento',
        'comunidades_ativas', 'temas_prioritarios', 'stakeholders_engajados',
        'temperatura_territorio', 'compromissos_atrasados', 'atividade_recente',
        'temperatura_territorial', 'rede_stakeholders', 'stakeholders_riscos'
    ];
    const [widgets, setWidgets] = useState(widgetsAtivos);
    const [seedVozes, setSeedVozes] = useState(1);

    // Dados existentes (KPIs, gráficos, widgets)
    const { data: registros = [] } = useQuery({
        queryKey: ['registros-dashboard'],
        queryFn: () => base44.entities.Registro.list('-created_date', 100),
        staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false
    });
    const { data: agendas = [] } = useQuery({
        queryKey: ['agendas-dashboard'],
        queryFn: () => base44.entities.Agenda.list('-data', 50),
        staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false
    });
    const { data: riscos = [] } = useQuery({
        queryKey: ['riscos-dashboard'],
        queryFn: () => base44.entities.RiscoSocial.filter({ status: 'ativo' }),
        staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false
    });
    const { data: stakeholders = [] } = useQuery({
        queryKey: ['stakeholders-dashboard'],
        queryFn: () => base44.entities.Stakeholder.list('-created_date', 200),
        staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false
    });
    const { data: compromissos = [] } = useQuery({
        queryKey: ['compromissos-dashboard'],
        queryFn: () => base44.entities.Compromisso.list('-created_date', 100),
        staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false
    });

    // ===== Inteligência Social (vozes + dicas + dica do dia) — 1 chamada backend =====
    const { data: inteligencia, isLoading: intelLoading, isFetching: intelFetching } = useQuery({
        queryKey: ['inteligencia-social', seedVozes],
        queryFn: async () => {
            const res = await base44.functions.invoke('gerarInteligenciaSocial', { seed: String(seedVozes) });
            return res?.data ?? res;
        },
        staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false,
        retry: 0
    });

    const onTrocarVozes = useCallback(() => setSeedVozes(s => s + 1), []);

    // ===== Controle por usuário (ocultar/fixar vozes e dicas) =====
    const { data: controle } = useQuery({
        queryKey: ['controle-dashboard'],
        queryFn: async () => {
            const me = await base44.auth.me();
            if (!me?.email) return null;
            const lista = await base44.entities.ControleIdashboard.filter({ usuario_email: me.email });
            return lista[0] || null;
        },
        staleTime: 60 * 1000, refetchOnWindowFocus: false
    });

    const onControleChange = useCallback(async (patch) => {
        const me = await base44.auth.me();
        if (!me?.email) return;
        const existente = controle || (await base44.entities.ControleIdashboard.filter({ usuario_email: me.email }))[0];
        if (existente?.id) {
            await base44.entities.ControleIdashboard.update(existente.id, { ...patch });
        } else {
            await base44.entities.ControleIdashboard.create({ usuario_email: me.email, ...patch });
        }
        queryClient.invalidateQueries(['controle-dashboard']);
    }, [controle, queryClient]);

    // KPIs derivados
    const totalRegistros = registros.length;
    const registrosMesAnterior = registros.filter(r => {
        const data = new Date(r.created_date);
        const mesPassado = subDays(new Date(), 30);
        return data >= subDays(mesPassado, 30) && data < mesPassado;
    }).length;
    const crescimentoRegistros = registrosMesAnterior > 0
        ? ((totalRegistros - registrosMesAnterior) / registrosMesAnterior * 100).toFixed(1) : 0;

    const demandasUrgentes = registros.reduce((acc, r) =>
        acc + (r.demandas?.filter(d => ['alta', 'critica'].includes(d.urgencia) && d.status === 'pendente').length || 0), 0);
    const riscosAtivos = riscos.filter(r => r.status === 'ativo').length;
    const riscosCriticos = riscos.filter(r => r.status === 'ativo' && ['alto', 'critico'].includes(r.nivel)).length;
    const agendasProximas = agendas.filter(a => {
        const data = new Date(a.data);
        const hoje = new Date();
        const proximosDias = new Date();
        proximosDias.setDate(hoje.getDate() + 7);
        return data >= hoje && data <= proximosDias && ['confirmada', 'prevista'].includes(a.status);
    }).length;

    const dadosGrafico = Array.from({ length: 7 }, (_, i) => {
        const data = subDays(new Date(), 6 - i);
        const dataStr = format(data, 'dd/MM');
        const registrosDia = registros.filter(r => format(new Date(r.created_date), 'dd/MM') === dataStr).length;
        const demandasDia = registros.filter(r => format(new Date(r.created_date), 'dd/MM') === dataStr)
            .reduce((acc, r) => acc + (r.demandas?.length || 0), 0);
        return { data: dataStr, registros: registrosDia, demandas: demandasDia };
    });

    const SectionHeader = ({ title }) => (
        <div className="flex items-center gap-3 pt-2">
            <div className="h-px flex-1 bg-border" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
            <div className="h-px flex-1 bg-border" />
        </div>
    );

    return (
        <div className="min-h-screen p-4 md:p-6 pb-20 md:pb-6 bg-background">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* ===== Cabeçalho: Visão Geral / Inteligência Social e Territorial ===== */}
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Visão Geral</p>
                        <h1 className="text-3xl md:text-4xl font-bold text-foreground mt-1">Inteligência Social e Territorial</h1>
                        <p className="text-slate-500 mt-2 max-w-2xl">
                            Transformando escuta, relacionamento e evidências em inteligência para decisão.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <ExportadorDashboard dados={{ registros, compromissos, riscos, stakeholders }} />
                        <PersonalizadorWidgets widgetsAtivos={widgets} onWidgetsChange={setWidgets} />
                        <Button onClick={() => navigate(createPageUrl("Registros"))}>
                            <Plus className="w-4 h-4 mr-2" /> Novo Registro
                        </Button>
                    </div>
                </div>

                {/* ===== Vozes do Território ===== */}
                <VozesTerritorio
                    vozes={inteligencia?.vozes || []}
                    controle={controle}
                    onControleChange={onControleChange}
                    loading={intelLoading}
                    onTrocar={onTrocarVozes}
                    trocando={intelFetching && !intelLoading}
                />

                {/* ===== Dicas de Relacionamento ===== */}
                <PainelDicasRelacionamento
                    dicas={inteligencia?.dicas || []}
                    dicaDoDia={inteligencia?.dica_do_dia || ''}
                    controle={controle}
                    onControleChange={onControleChange}
                    loading={intelLoading}
                />

                {/* ===== Indicadores Principais ===== */}
                <div className="space-y-4">
                    <SectionHeader title="Indicadores Principais" />
                    {widgets.includes('kpis') && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <KPICard titulo="Total de Registros" valor={totalRegistros} icone={FileText}
                                tendencia={crescimentoRegistros > 0 ? 'up' : crescimentoRegistros < 0 ? 'down' : 'neutral'}
                                percentual={Math.abs(crescimentoRegistros)} cor="bg-blue-100"
                                onClick={() => navigate(createPageUrl("Registros"))} />
                            <KPICard titulo="Demandas Urgentes" valor={demandasUrgentes} icone={AlertTriangle}
                                cor="bg-amber-100" descricao="Alta e crítica prioridade" />
                            <KPICard titulo="Riscos Ativos" valor={riscosAtivos} icone={Target}
                                cor="bg-red-100" descricao={riscosCriticos > 0 ? `${riscosCriticos} críticos` : 'Nenhum crítico'} />
                            <KPICard titulo="Agendas Próximas" valor={agendasProximas} icone={Calendar}
                                cor="bg-purple-100" descricao="Próximos 7 dias"
                                onClick={() => navigate(createPageUrl("Agenda"))} />
                        </div>
                    )}

                    {widgets.includes('graficos') && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <GraficoTendencias dados={dadosGrafico} titulo="Registros dos Últimos 7 Dias" tipo="area" />
                            <GraficoTendencias dados={dadosGrafico} titulo="Registros vs Demandas" tipo="bar" />
                        </div>
                    )}
                    {widgets.includes('graficos') && (
                        <GraficosKPIAvancados registros={registros} atores={stakeholders} riscos={riscos} compromissos={compromissos} />
                    )}

                    {widgets.includes('voz_comunidade') && <VozComunidade />}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {widgets.includes('proximas_agendas') && <WidgetProximasAgendas />}
                        {widgets.includes('riscos_ativos') && <WidgetRiscosAtivos />}
                    </div>

                    {widgets.includes('demandas_recorrentes') && (
                        <div className="lg:col-span-2"><MonitorDemandasRecorrentes /></div>
                    )}
                    {widgets.includes('devolutivas') && (
                        <div className="lg:col-span-2"><MonitorDevolutivas /></div>
                    )}
                </div>

                {/* ===== Temperatura do Território ===== */}
                <div className="space-y-4">
                    <SectionHeader title="Temperatura do Território" />
                    {widgets.includes('temperatura_territorial') && <WidgetTemperaturaTerritorial />}
                    {widgets.includes('compromissos_atrasados') && (
                        <Card>
                            <div className="p-6">
                                <h3 className="flex items-center gap-2 text-lg font-semibold mb-3">
                                    <Calendar className="w-5 h-5 text-red-600" /> Compromissos Atrasados
                                </h3>
                                {(() => {
                                    const hoje = new Date();
                                    const atrasados = compromissos.filter(c => c.prazo && new Date(c.prazo) < hoje && c.status !== 'concluido').slice(0, 5);
                                    return atrasados.length > 0 ? (
                                        <div className="space-y-3">
                                            {atrasados.map((c, idx) => {
                                                const dias = Math.floor((hoje - new Date(c.prazo)) / (1000 * 60 * 60 * 24));
                                                return (
                                                    <div key={idx} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                                        <p className="text-sm font-medium mb-1">{c.titulo}</p>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs text-slate-600">{c.responsavel}</span>
                                                            <Badge className="bg-red-100 text-red-700">{dias} dias atraso</Badge>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="text-center py-6">
                                            <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-green-500" />
                                            <p className="text-sm text-slate-500">Nenhum compromisso atrasado</p>
                                        </div>
                                    );
                                })()}
                            </div>
                        </Card>
                    )}
                </div>

                {/* ===== Tendências ===== */}
                <div className="space-y-4">
                    <SectionHeader title="Tendências e Comunidades" />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {widgets.includes('comunidades_ativas') && (
                            <Card>
                                <div className="p-6">
                                    <h3 className="flex items-center gap-2 text-lg font-semibold mb-3">
                                        <Target className="w-5 h-5 text-blue-600" /> Comunidades Mais Ativas
                                    </h3>
                                    {(() => {
                                        const comunidadesCount = registros.reduce((acc, r) => {
                                            if (r.comunidade) acc[r.comunidade] = (acc[r.comunidade] || 0) + 1;
                                            return acc;
                                        }, {});
                                        const top5 = Object.entries(comunidadesCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
                                        return top5.length > 0 ? (
                                            <div className="space-y-3">
                                                {top5.map(([comunidade, count], idx) => (
                                                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                                        <span className="text-sm font-medium">{comunidade}</span>
                                                        <Badge className="bg-blue-100 text-blue-700">{count} registros</Badge>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : <p className="text-center text-slate-500 py-6">Nenhum dado disponível</p>;
                                    })()}
                                </div>
                            </Card>
                        )}
                        {widgets.includes('temas_prioritarios') && (
                            <Card>
                                <div className="p-6">
                                    <h3 className="flex items-center gap-2 text-lg font-semibold mb-3">
                                        <TrendingUp className="w-5 h-5 text-purple-600" /> Temas Prioritários
                                    </h3>
                                    {(() => {
                                        const temasCount = registros.reduce((acc, r) => {
                                            r.temas_identificados?.forEach(t => acc[t] = (acc[t] || 0) + 1);
                                            return acc;
                                        }, {});
                                        const top5 = Object.entries(temasCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
                                        return top5.length > 0 ? (
                                            <div className="space-y-2">
                                                {top5.map(([tema, count], idx) => (
                                                    <div key={idx} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                                                        <span className="text-sm">{tema}</span>
                                                        <Badge className="bg-purple-100 text-purple-700">{count}x</Badge>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : <p className="text-center text-slate-500 py-6">Nenhum tema identificado</p>;
                                    })()}
                                </div>
                            </Card>
                        )}
                    </div>
                </div>

                {/* ===== Sentimentos ===== */}
                <div className="space-y-4">
                    <SectionHeader title="Sentimentos e Stakeholders" />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {widgets.includes('stakeholders_engajados') && (
                            <Card>
                                <div className="p-6">
                                    <h3 className="flex items-center gap-2 text-lg font-semibold mb-3">
                                        <Users className="w-5 h-5 text-emerald-600" /> Stakeholders Mais Engajados
                                    </h3>
                                    {(() => {
                                        const top = stakeholders.filter(s => s.score_engajamento > 0).sort((a, b) => (b.score_engajamento || 0) - (a.score_engajamento || 0)).slice(0, 5);
                                        return top.length > 0 ? (
                                            <div className="space-y-3">
                                                {top.map((s, idx) => (
                                                    <Link key={idx} to={createPageUrl('PerfilStakeholder') + `?id=${s.id}`}>
                                                        <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm font-medium">
                                                                    {s.nome[0]?.toUpperCase()}
                                                                </div>
                                                                <span className="text-sm font-medium">{s.nome}</span>
                                                            </div>
                                                            <Badge className="bg-emerald-100 text-emerald-700">{s.score_engajamento || 0} pts</Badge>
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        ) : <p className="text-center text-slate-500 py-6">Nenhum stakeholder com score</p>;
                                    })()}
                                </div>
                            </Card>
                        )}
                        {widgets.includes('stakeholders_riscos') && <WidgetStakeholdersRiscos />}
                        {widgets.includes('rede_stakeholders') && <WidgetRedeStakeholders />}
                    </div>

                    {widgets.includes('temperatura_territorio') && (
                        <Card>
                            <div className="p-6">
                                <h3 className="flex items-center gap-2 text-lg font-semibold mb-3">
                                    <AlertTriangle className="w-5 h-5 text-orange-600" /> Temperatura do Território
                                </h3>
                                {(() => {
                                    const t = registros.reduce((acc, r) => {
                                        if (r.temperatura_territorio) acc[r.temperatura_territorio] = (acc[r.temperatura_territorio] || 0) + 1;
                                        return acc;
                                    }, {});
                                    const tempConfig = {
                                        critico: { label: 'Crítico', color: 'bg-red-100 text-red-700', count: t.critico || 0 },
                                        alto: { label: 'Alto', color: 'bg-orange-100 text-orange-700', count: t.alto || 0 },
                                        medio: { label: 'Médio', color: 'bg-yellow-100 text-yellow-700', count: t.medio || 0 },
                                        baixo: { label: 'Baixo', color: 'bg-green-100 text-green-700', count: t.baixo || 0 }
                                    };
                                    return (
                                        <div className="space-y-2">
                                            {Object.entries(tempConfig).map(([key, config]) => (
                                                <div key={key} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                                    <Badge className={config.color}>{config.label}</Badge>
                                                    <span className="text-lg font-bold">{config.count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })()}
                            </div>
                        </Card>
                    )}
                </div>

                {/* ===== Mapa / Territórios ===== */}
                <div className="space-y-4">
                    <SectionHeader title="Mapa e Territórios" />
                    {widgets.includes('atividade_recente') && (
                        <Card>
                            <div className="p-6">
                                <h3 className="flex items-center gap-2 text-lg font-semibold mb-3">
                                    <FileText className="w-5 h-5 text-indigo-600" /> Atividade Recente
                                </h3>
                                {(() => {
                                    const recentes = registros.slice(0, 5);
                                    return recentes.length > 0 ? (
                                        <div className="space-y-3">
                                            {recentes.map((r, idx) => (
                                                <Link key={idx} to={createPageUrl('VerRegistro') + `?id=${r.id}`}>
                                                    <div className="p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                                                        <p className="text-sm font-medium mb-1">{r.titulo}</p>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs text-slate-500">{r.comunidade}</span>
                                                            <span className="text-xs text-slate-500">{format(new Date(r.created_date), 'dd/MM HH:mm')}</span>
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    ) : <p className="text-center text-slate-500 py-6">Nenhuma atividade recente</p>;
                                })()}
                            </div>
                        </Card>
                    )}
                </div>

                {/* ===== Referenciais e Compromissos ESG ===== */}
                <div className="space-y-4">
                    <SectionHeader title="Referenciais e Compromissos ESG" />
                    {widgets.includes('sustentabilidade') && <WidgetSustentabilidade />}
                    {user?.configuracoes?.exibir_tutorial !== false && (
                        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                            <div className="p-6 space-y-3">
                                <h3 className="flex items-center gap-2 text-purple-900">
                                    <Shield className="w-5 h-5" /> Código de Conduta
                                </h3>
                                <p className="text-sm text-purple-800">Diretrizes éticas para relacionamento comunitário:</p>
                                <ul className="space-y-2 text-sm text-purple-700">
                                    <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" /> Respeitar a autonomia e decisões das comunidades</li>
                                    <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" /> Garantir transparência em todas as interações</li>
                                    <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" /> Manter confidencialidade de informações sensíveis</li>
                                </ul>
                                <Link to={createPageUrl('CodigoEtica')}>
                                    <Button variant="outline" className="w-full mt-2 border-purple-300 hover:bg-purple-100">Ver Código Completo</Button>
                                </Link>
                            </div>
                        </Card>
                    )}
                </div>

                {/* Botões de Ação */}
                <div className="flex flex-wrap gap-3">
                    <PainelOrientacaoTerritorial />
                </div>
            </div>
        </div>
    );
}