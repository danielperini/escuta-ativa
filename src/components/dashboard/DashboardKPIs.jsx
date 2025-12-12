import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { 
    Settings, 
    TrendingUp, 
    TrendingDown, 
    Activity, 
    Users, 
    MapPin, 
    CheckCircle, 
    AlertTriangle,
    Target,
    Lightbulb,
    X
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

const KPIsDisponiveis = [
    { id: 'total_atividades', label: 'Total de Atividades', icone: Activity, cor: '#3b82f6' },
    { id: 'atividades_mes', label: 'Atividades/Mês', icone: Activity, cor: '#22c55e' },
    { id: 'total_compromissos', label: 'Total Compromissos', icone: CheckCircle, cor: '#a855f7' },
    { id: 'compromissos_atrasados', label: 'Atrasados', icone: AlertTriangle, cor: '#ef4444' },
    { id: 'total_liderancas', label: 'Lideranças', icone: Users, cor: '#f59e0b' },
    { id: 'total_comunidades', label: 'Comunidades', icone: MapPin, cor: '#06b6d4' },
    { id: 'riscos_criticos', label: 'Riscos Críticos', icone: AlertTriangle, cor: '#dc2626' },
    { id: 'oportunidades_alta', label: 'Oportunidades Alta', icone: Lightbulb, cor: '#eab308' },
    { id: 'temas_materiais', label: 'Temas Materiais', icone: Target, cor: '#8b5cf6' },
    { id: 'taxa_conclusao', label: 'Taxa Conclusão', icone: CheckCircle, cor: '#10b981' }
];

export default function DashboardKPIs() {
    const [kpisSelecionados, setKpisSelecionados] = useState(() => {
        const saved = localStorage.getItem('dashboard_kpis');
        return saved ? JSON.parse(saved) : ['total_atividades', 'total_compromissos', 'compromissos_atrasados', 'total_liderancas'];
    });
    const [showConfig, setShowConfig] = useState(false);

    const { data: atividades = [] } = useQuery({
        queryKey: ['atividades-kpi'],
        queryFn: () => base44.entities.Atividade.list('-created_date', 500)
    });

    const { data: compromissos = [] } = useQuery({
        queryKey: ['compromissos-kpi'],
        queryFn: () => base44.entities.Compromisso.list('-created_date', 100),
        staleTime: 30 * 1000,
        refetchInterval: 60 * 1000
    });

    const { data: liderancas = [] } = useQuery({
        queryKey: ['liderancas-kpi'],
        queryFn: () => base44.entities.LiderancaComunitaria.list('-created_date', 100),
        staleTime: 5 * 60 * 1000
    });

    const { data: comunidades = [] } = useQuery({
        queryKey: ['comunidades-kpi'],
        queryFn: () => base44.entities.Comunidade.list()
    });

    const { data: riscos = [] } = useQuery({
        queryKey: ['riscos-kpi'],
        queryFn: () => base44.entities.RiscoSocial.list('-created_date', 50),
        staleTime: 30 * 1000,
        refetchInterval: 60 * 1000
    });

    const { data: oportunidades = [] } = useQuery({
        queryKey: ['oportunidades-kpi'],
        queryFn: () => base44.entities.Oportunidade.list('-created_date', 50),
        staleTime: 2 * 60 * 1000
    });

    const { data: temas = [] } = useQuery({
        queryKey: ['temas-kpi'],
        queryFn: () => base44.entities.Tema.list()
    });

    const calcularKPI = (id) => {
        const hoje = new Date();
        const mesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        const mesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);

        switch (id) {
            case 'total_atividades':
                const mesAnteriorAtiv = atividades.filter(a => new Date(a.created_date) < mesAtual && new Date(a.created_date) >= mesAnterior).length;
                const mesAtualAtiv = atividades.filter(a => new Date(a.created_date) >= mesAtual).length;
                const variacao = mesAnteriorAtiv > 0 ? ((mesAtualAtiv - mesAnteriorAtiv) / mesAnteriorAtiv * 100).toFixed(1) : 0;
                return { 
                    valor: atividades.length, 
                    variacao: `${variacao}% vs mês anterior`,
                    tendencia: variacao > 0 ? 'up' : variacao < 0 ? 'down' : 'stable'
                };
            
            case 'atividades_mes':
                const atividadesMes = atividades.filter(a => new Date(a.created_date) >= mesAtual).length;
                return { 
                    valor: atividadesMes,
                    variacao: `${atividades.filter(a => new Date(a.created_date) < mesAtual && new Date(a.created_date) >= mesAnterior).length} mês anterior`,
                    tendencia: 'stable'
                };
            
            case 'total_compromissos':
                return { 
                    valor: compromissos.length,
                    variacao: `${compromissos.filter(c => c.status === 'concluido').length} concluídos`,
                    tendencia: 'stable'
                };
            
            case 'compromissos_atrasados':
                const atrasados = compromissos.filter(c => 
                    c.prazo && new Date(c.prazo) < hoje && c.status !== 'concluido' && c.status !== 'cancelado'
                ).length;
                return { 
                    valor: atrasados,
                    variacao: atrasados > 5 ? 'Ação necessária' : 'Sob controle',
                    tendencia: atrasados > 5 ? 'down' : 'up'
                };
            
            case 'total_liderancas':
                const ativas = liderancas.filter(l => {
                    const ultimaInteracao = l.ultima_interacao ? new Date(l.ultima_interacao) : null;
                    return ultimaInteracao && (hoje - ultimaInteracao) / (1000 * 60 * 60 * 24) <= 30;
                }).length;
                return { 
                    valor: liderancas.length,
                    variacao: `${ativas} ativas (30d)`,
                    tendencia: 'stable'
                };
            
            case 'total_comunidades':
                return { 
                    valor: comunidades.length,
                    variacao: `${new Set(atividades.map(a => a.local)).size} com atividades`,
                    tendencia: 'stable'
                };
            
            case 'riscos_criticos':
                const criticos = riscos.filter(r => r.nivel === 'critico' && r.status === 'ativo').length;
                return { 
                    valor: criticos,
                    variacao: `${riscos.filter(r => r.status === 'ativo').length} ativos total`,
                    tendencia: criticos > 0 ? 'down' : 'up'
                };
            
            case 'oportunidades_alta':
                const altaRel = oportunidades.filter(o => o.relevancia === 'alta').length;
                return { 
                    valor: altaRel,
                    variacao: `${oportunidades.length} total`,
                    tendencia: 'stable'
                };
            
            case 'temas_materiais':
                const materiais = temas.filter(t => t.divergencia >= 5 || t.prioritario).length;
                return { 
                    valor: materiais,
                    variacao: `${temas.length} temas total`,
                    tendencia: 'stable'
                };
            
            case 'taxa_conclusao':
                const concluidos = compromissos.filter(c => c.status === 'concluido').length;
                const taxa = compromissos.length > 0 ? ((concluidos / compromissos.length) * 100).toFixed(0) : 0;
                return { 
                    valor: `${taxa}%`,
                    variacao: `${concluidos}/${compromissos.length}`,
                    tendencia: taxa >= 70 ? 'up' : taxa >= 40 ? 'stable' : 'down'
                };
            
            default:
                return { valor: 0, variacao: '', tendencia: 'stable' };
        }
    };

    const toggleKPI = (id) => {
        const novos = kpisSelecionados.includes(id)
            ? kpisSelecionados.filter(k => k !== id)
            : [...kpisSelecionados, id];
        
        setKpisSelecionados(novos);
        localStorage.setItem('dashboard_kpis', JSON.stringify(novos));
    };

    return (
        <>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900">Indicadores Chave</h2>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowConfig(true)}
                    className="gap-2"
                >
                    <Settings className="w-4 h-4" />
                    Personalizar
                </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {kpisSelecionados.map(kpiId => {
                    const config = KPIsDisponiveis.find(k => k.id === kpiId);
                    if (!config) return null;

                    const dados = calcularKPI(kpiId);
                    const Icone = config.icone;
                    
                    return (
                        <Card key={kpiId} className="hover:shadow-lg transition-all">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between mb-3">
                                    <div 
                                        className="w-12 h-12 rounded-lg flex items-center justify-center"
                                        style={{ backgroundColor: config.cor + '20' }}
                                    >
                                        <Icone className="w-6 h-6" style={{ color: config.cor }} />
                                    </div>
                                    {dados.tendencia === 'up' && <TrendingUp className="w-5 h-5 text-green-600" />}
                                    {dados.tendencia === 'down' && <TrendingDown className="w-5 h-5 text-red-600" />}
                                </div>
                                <p className="text-xs text-gray-500 mb-1">{config.label}</p>
                                <p className="text-3xl font-bold text-gray-900 mb-1">{dados.valor}</p>
                                <p className="text-xs text-gray-500">{dados.variacao}</p>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <Dialog open={showConfig} onOpenChange={setShowConfig}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Personalizar Indicadores do Dashboard</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-sm text-gray-600 mb-4">
                            Selecione até 8 indicadores para exibir no dashboard:
                        </p>
                        <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                            {KPIsDisponiveis.map(kpi => {
                                const Icone = kpi.icone;
                                const selecionado = kpisSelecionados.includes(kpi.id);
                                
                                return (
                                    <div
                                        key={kpi.id}
                                        className={cn(
                                            "flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all",
                                            selecionado ? "border-blue-600 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                                        )}
                                        onClick={() => kpisSelecionados.length < 8 || selecionado ? toggleKPI(kpi.id) : null}
                                    >
                                        <Checkbox 
                                            checked={selecionado}
                                            disabled={!selecionado && kpisSelecionados.length >= 8}
                                        />
                                        <div 
                                            className="w-10 h-10 rounded flex items-center justify-center flex-shrink-0"
                                            style={{ backgroundColor: kpi.cor + '20' }}
                                        >
                                            <Icone className="w-5 h-5" style={{ color: kpi.cor }} />
                                        </div>
                                        <span className="text-sm font-medium text-gray-900">{kpi.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                        {kpisSelecionados.length >= 8 && (
                            <p className="text-xs text-amber-600 mt-3">
                                ⚠️ Máximo de 8 indicadores. Desmarque algum para adicionar outro.
                            </p>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}