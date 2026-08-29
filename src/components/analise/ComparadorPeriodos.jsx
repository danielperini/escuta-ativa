import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plus, X, Calendar, BarChart3 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Badge } from "@/components/ui/badge";

export default function ComparadorPeriodos() {
    const [periodos, setPeriodos] = useState([
        { id: 1, nome: 'Período 1', dataInicio: '', dataFim: '', cor: '#3b82f6' }
    ]);

    const { data: atividades = [] } = useQuery({
        queryKey: ['atividades-comparador'],
        queryFn: () => base44.entities.Atividade.list('-created_date', 1000)
    });

    const { data: compromissos = [] } = useQuery({
        queryKey: ['compromissos-comparador'],
        queryFn: () => base44.entities.Compromisso.list()
    });

    const cores = ['#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#ef4444', '#06b6d4'];

    const adicionarPeriodo = () => {
        if (periodos.length >= 6) {
            alert('Máximo de 6 períodos');
            return;
        }
        setPeriodos([
            ...periodos,
            { 
                id: Date.now(), 
                nome: `Período ${periodos.length + 1}`, 
                dataInicio: '', 
                dataFim: '',
                cor: cores[periodos.length % cores.length]
            }
        ]);
    };

    const removerPeriodo = (id) => {
        setPeriodos(periodos.filter(p => p.id !== id));
    };

    const atualizarPeriodo = (id, campo, valor) => {
        setPeriodos(periodos.map(p => 
            p.id === id ? { ...p, [campo]: valor } : p
        ));
    };

    const calcularDadosPeriodo = (periodo) => {
        if (!periodo.dataInicio || !periodo.dataFim) return null;

        const inicio = new Date(periodo.dataInicio);
        const fim = new Date(periodo.dataFim);

        const atividadesPeriodo = atividades.filter(a => {
            const data = new Date(a.created_date);
            return data >= inicio && data <= fim;
        });

        const compromissosPeriodo = compromissos.filter(c => {
            const data = new Date(c.created_date);
            return data >= inicio && data <= fim;
        });

        const concluidos = compromissosPeriodo.filter(c => c.status === 'concluido').length;
        const taxaConclusao = compromissosPeriodo.length > 0 
            ? ((concluidos / compromissosPeriodo.length) * 100).toFixed(1) 
            : 0;

        return {
            nome: periodo.nome,
            atividades: atividadesPeriodo.length,
            compromissos: compromissosPeriodo.length,
            taxaConclusao: parseFloat(taxaConclusao),
            demandas: atividadesPeriodo.reduce((acc, a) => acc + (a.demandas?.length || 0), 0),
            cor: periodo.cor
        };
    };

    const dadosComparacao = periodos
        .map(p => calcularDadosPeriodo(p))
        .filter(Boolean);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Comparação de Períodos Históricos
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-3">
                        {periodos.map((periodo, idx) => (
                            <div key={periodo.id} className="flex flex-wrap items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <div
                                        className="w-4 h-4 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: periodo.cor }}
                                    />
                                    <Input
                                        placeholder="Nome do período"
                                        value={periodo.nome}
                                        onChange={(e) => atualizarPeriodo(periodo.id, 'nome', e.target.value)}
                                        className="w-full sm:w-32"
                                    />
                                </div>
                                <Input
                                    type="date"
                                    value={periodo.dataInicio}
                                    onChange={(e) => atualizarPeriodo(periodo.id, 'dataInicio', e.target.value)}
                                    className="flex-1 min-w-[130px]"
                                />
                                <span className="text-gray-500">até</span>
                                <Input
                                    type="date"
                                    value={periodo.dataFim}
                                    onChange={(e) => atualizarPeriodo(periodo.id, 'dataFim', e.target.value)}
                                    className="flex-1 min-w-[130px]"
                                />
                                {periodos.length > 1 && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removerPeriodo(periodo.id)}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>

                    <Button
                        variant="outline"
                        onClick={adicionarPeriodo}
                        disabled={periodos.length >= 6}
                        className="w-full"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Período
                    </Button>
                </CardContent>
            </Card>

            {dadosComparacao.length >= 2 && (
                <>
                    <Card>
                        <CardHeader>
                            <CardTitle>Comparação de Atividades por Período</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={dadosComparacao}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="nome" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="atividades" fill="#3b82f6" name="Atividades" />
                                    <Bar dataKey="compromissos" fill="#22c55e" name="Compromissos" />
                                    <Bar dataKey="demandas" fill="#f59e0b" name="Demandas" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Taxa de Conclusão de Compromissos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={dadosComparacao}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="nome" />
                                    <YAxis domain={[0, 100]} />
                                    <Tooltip />
                                    <Legend />
                                    <Line 
                                        type="monotone" 
                                        dataKey="taxaConclusao" 
                                        stroke="#22c55e" 
                                        strokeWidth={3}
                                        name="Taxa de Conclusão (%)"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Resumo Comparativo</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm border-collapse">
                                    <thead>
                                        <tr className="bg-gray-100">
                                            <th className="border px-3 py-2 text-left">Período</th>
                                            <th className="border px-3 py-2 text-center">Atividades</th>
                                            <th className="border px-3 py-2 text-center">Compromissos</th>
                                            <th className="border px-3 py-2 text-center">Demandas</th>
                                            <th className="border px-3 py-2 text-center">Taxa Conclusão</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dadosComparacao.map(d => (
                                            <tr key={d.nome} className="hover:bg-gray-50">
                                                <td className="border px-3 py-2">
                                                    <div className="flex items-center gap-2">
                                                        <div 
                                                            className="w-3 h-3 rounded-full" 
                                                            style={{ backgroundColor: d.cor }}
                                                        />
                                                        <span className="font-medium">{d.nome}</span>
                                                    </div>
                                                </td>
                                                <td className="border px-3 py-2 text-center">{d.atividades}</td>
                                                <td className="border px-3 py-2 text-center">{d.compromissos}</td>
                                                <td className="border px-3 py-2 text-center">{d.demandas}</td>
                                                <td className="border px-3 py-2 text-center">
                                                    <Badge className={
                                                        d.taxaConclusao >= 70 ? "bg-green-100 text-green-700" :
                                                        d.taxaConclusao >= 40 ? "bg-amber-100 text-amber-700" :
                                                        "bg-red-100 text-red-700"
                                                    }>
                                                        {d.taxaConclusao}%
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}