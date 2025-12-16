import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus, FileText, Calendar, AlertTriangle, Users, Target, TrendingUp, Heart, Shield, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { subDays, format } from 'date-fns';
import KPICard from "@/components/dashboard/KPICard";
import GraficoTendencias from "@/components/dashboard/GraficoTendencias";
import PersonalizadorWidgets from "@/components/dashboard/PersonalizadorWidgets";
import WidgetProximasAgendas from "@/components/dashboard/WidgetProximasAgendas";
import WidgetRiscosAtivos from "@/components/dashboard/WidgetRiscosAtivos";
import VozComunidade from "@/components/dashboard/VozComunidade";
import MonitorDemandasRecorrentes from "@/components/atores/MonitorDemandasRecorrentes";
import MonitorDevolutivas from "@/components/devolutiva/MonitorDevolutivas";
import BotaoPanicoAvancado from "@/components/dashboard/BotaoPanicoAvancado";
import WidgetDicasRelacionamento from "@/components/dashboard/WidgetDicasRelacionamento";
import GraficosKPIAvancados from "@/components/dashboard/GraficosKPIAvancados";

export default function Dashboard() {
    const navigate = useNavigate();
    
    const { data: user } = useQuery({
        queryKey: ['currentUser-dashboard'],
        queryFn: () => base44.auth.me()
    });

    const widgetsAtivos = user?.configuracoes?.widgets_dashboard || [
        'kpis', 'graficos', 'demandas_recorrentes', 'devolutivas', 
        'voz_comunidade', 'proximas_agendas', 'riscos_ativos', 'dicas_relacionamento'
    ];

    const [widgets, setWidgets] = useState(widgetsAtivos);

    // Dados para KPIs e Gráficos
    const { data: registros = [] } = useQuery({
        queryKey: ['registros-dashboard'],
        queryFn: () => base44.entities.Registro.list('-created_date', 1000)
    });

    const { data: agendas = [] } = useQuery({
        queryKey: ['agendas-dashboard'],
        queryFn: () => base44.entities.Agenda.list()
    });

    const { data: riscos = [] } = useQuery({
        queryKey: ['riscos-dashboard'],
        queryFn: () => base44.entities.RiscoSocial.list()
    });

    const { data: casos = [] } = useQuery({
        queryKey: ['casos-dashboard'],
        queryFn: () => base44.entities.Caso.list()
    });

    // Cálculos de KPIs
    const totalRegistros = registros.length;
    const registrosMesAnterior = registros.filter(r => {
        const data = new Date(r.created_date);
        const mesPassado = subDays(new Date(), 30);
        return data >= subDays(mesPassado, 30) && data < mesPassado;
    }).length;
    const crescimentoRegistros = registrosMesAnterior > 0 
        ? ((totalRegistros - registrosMesAnterior) / registrosMesAnterior * 100).toFixed(1)
        : 0;

    const demandasUrgentes = registros.reduce((acc, r) => 
        acc + (r.demandas?.filter(d => ['alta', 'critica'].includes(d.urgencia) && d.status === 'pendente').length || 0), 0
    );

    const riscosAtivos = riscos.filter(r => r.status === 'ativo').length;
    const riscosCriticos = riscos.filter(r => r.status === 'ativo' && ['alto', 'critico'].includes(r.nivel)).length;

    const agendasProximas = agendas.filter(a => {
        const data = new Date(a.data);
        const hoje = new Date();
        const proximosDias = new Date();
        proximosDias.setDate(hoje.getDate() + 7);
        return data >= hoje && data <= proximosDias && ['confirmada', 'prevista'].includes(a.status);
    }).length;

    // Dados para gráfico de tendências (últimos 7 dias)
    const dadosGrafico = Array.from({ length: 7 }, (_, i) => {
        const data = subDays(new Date(), 6 - i);
        const dataStr = format(data, 'dd/MM');
        
        const registrosDia = registros.filter(r => {
            const dataRegistro = new Date(r.created_date);
            return format(dataRegistro, 'dd/MM') === dataStr;
        }).length;

        const demandasDia = registros.filter(r => {
            const dataRegistro = new Date(r.created_date);
            return format(dataRegistro, 'dd/MM') === dataStr;
        }).reduce((acc, r) => acc + (r.demandas?.length || 0), 0);

        return {
            data: dataStr,
            registros: registrosDia,
            demandas: demandasDia
        };
    });

    return (
        <div className="min-h-screen p-4 md:p-6 pb-20 md:pb-6 bg-slate-50">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
                        <p className="text-slate-500 mt-1">Visão geral do sistema</p>
                    </div>
                    <div className="flex gap-3">
                        <PersonalizadorWidgets 
                            widgetsAtivos={widgets}
                            onWidgetsChange={setWidgets}
                        />
                        <Button
                            onClick={() => navigate(createPageUrl("Registros"))}
                            className="bg-[#2D6A4F] hover:bg-[#1B4332]"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Novo Registro
                        </Button>
                    </div>
                </div>

                {/* KPIs Principais */}
                {widgets.includes('kpis') && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <KPICard
                            titulo="Total de Registros"
                            valor={totalRegistros}
                            icone={FileText}
                            tendencia={crescimentoRegistros > 0 ? 'up' : crescimentoRegistros < 0 ? 'down' : 'neutral'}
                            percentual={Math.abs(crescimentoRegistros)}
                            cor="bg-blue-100"
                            onClick={() => navigate(createPageUrl("Registros"))}
                        />
                        <KPICard
                            titulo="Demandas Urgentes"
                            valor={demandasUrgentes}
                            icone={AlertTriangle}
                            cor="bg-amber-100"
                            descricao="Alta e crítica prioridade"
                        />
                        <KPICard
                            titulo="Riscos Ativos"
                            valor={riscosAtivos}
                            icone={Target}
                            cor="bg-red-100"
                            descricao={riscosCriticos > 0 ? `${riscosCriticos} críticos` : 'Nenhum crítico'}
                        />
                        <KPICard
                            titulo="Agendas Próximas"
                            valor={agendasProximas}
                            icone={Calendar}
                            cor="bg-purple-100"
                            descricao="Próximos 7 dias"
                            onClick={() => navigate(createPageUrl("Agenda"))}
                        />
                    </div>
                )}

                {/* Gráficos de Tendências */}
                {widgets.includes('graficos') && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <GraficoTendencias
                            dados={dadosGrafico}
                            titulo="Registros dos Últimos 7 Dias"
                            tipo="area"
                        />
                        <GraficoTendencias
                            dados={dadosGrafico}
                            titulo="Registros vs Demandas"
                            tipo="bar"
                        />
                        </div>
                        )}

                        {/* Gráficos KPI Avançados */}
                        {widgets.includes('graficos') && (
                        <GraficosKPIAvancados
                        registros={registros}
                        atores={[]}
                        riscos={riscos}
                        compromissos={[]}
                        />
                        )}

                {/* Widgets em Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {widgets.includes('proximas_agendas') && <WidgetProximasAgendas />}
                    {widgets.includes('riscos_ativos') && <WidgetRiscosAtivos />}
                    {widgets.includes('dicas_relacionamento') && <WidgetDicasRelacionamento />}
                    {widgets.includes('demandas_recorrentes') && (
                        <div className="lg:col-span-2">
                            <MonitorDemandasRecorrentes />
                        </div>
                    )}
                    {widgets.includes('devolutivas') && (
                        <div className="lg:col-span-2">
                            <MonitorDevolutivas />
                        </div>
                    )}
                    {widgets.includes('voz_comunidade') && (
                        <div className="lg:col-span-2">
                            <VozComunidade />
                        </div>
                    )}

                    {/* Widget Código de Conduta */}
                    {user?.configuracoes?.exibir_tutorial !== false && (
                        {user?.configuracoes?.exibir_tutorial !== false && (
                        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-purple-900">
                                    <Shield className="w-5 h-5" />
                                    Código de Conduta
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <p className="text-sm text-purple-800">
                                    Diretrizes éticas para relacionamento comunitário:
                                </p>
                                <ul className="space-y-2 text-sm text-purple-700">
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
                                        <span>Respeitar a autonomia e decisões das comunidades</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
                                        <span>Garantir transparência em todas as interações</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
                                        <span>Manter confidencialidade de informações sensíveis</span>
                                    </li>
                                </ul>
                                <Link to={createPageUrl('CodigoEtica')}>
                                    <Button variant="outline" className="w-full mt-2 border-purple-300 hover:bg-purple-100">
                                        Ver Código Completo
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                        )}
                    )}
                </div>

                {/* Botões de Ação */}
                <div className="flex flex-wrap gap-3">
                    <BotaoPanicoAvancado />
                </div>
            </div>
        </div>
    );
}